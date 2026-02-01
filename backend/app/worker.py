import os
import logging
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql import func
from . import database, models

logger = logging.getLogger("market_worker")

LASTFM_URL = "http://ws.audioscrobbler.com/2.0/"

async def update_market_data():
    api_key = os.getenv("LASTFM_API_KEY")
    if not api_key:
        logger.warning("LASTFM_API_KEY is not set; skipping market data update")
        return

    params = {
        "method": "chart.gettoptracks",
        "limit": "50",
        "api_key": api_key,
        "format": "json",
    }

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(LASTFM_URL, params=params)
        r.raise_for_status()
        data = r.json()

    tracks = (data.get("tracks", {}) or {}).get("track", []) or []
    if not isinstance(tracks, list):
        logger.warning("Unexpected Last.fm response format")
        return

    async with database.SessionLocal() as session:  # type: AsyncSession
        for t in tracks:
            artist = (t.get("artist") or {}).get("name") or ""
            name = t.get("name") or ""
            playcount_str = t.get("playcount") or "0"
            try:
                playcount = int(playcount_str)
            except Exception:
                playcount = 0
            if not artist or not name:
                continue
            session.add(models.TrackHistory(
                artist_name=artist,
                track_name=name,
                playcount=playcount
            ))
        await session.commit()

    logger.info(f"Market data updated: {len(tracks)} tracks saved")

async def pay_daily_dividends():
    async with database.SessionLocal() as session:  # type: AsyncSession
        result = await session.execute(
            select(
                models.User,
                func.coalesce(func.sum(models.PortfolioItem.purchase_price), 0).label("portfolio_sum"),
            )
            .outerjoin(models.PortfolioItem, models.PortfolioItem.user_id == models.User.id)
            .group_by(models.User.id)
        )
        rows = result.all()
        count = 0
        for user, portfolio_sum in rows:
            total_value = int(portfolio_sum or 0)
            dividend = int(total_value * 0.01)
            if user.balance is None:
                user.balance = 10000000
            user.balance += dividend
            session.add(user)
            session.add(models.Transaction(
                user_id=user.id,
                track_name="Daily Yield",
                artist_name=None,
                transaction_type="DIVIDEND",
                amount=float(dividend),
            ))
            count += 1
        await session.commit()
    logger.info(f"Dividends paid to {count} users")
