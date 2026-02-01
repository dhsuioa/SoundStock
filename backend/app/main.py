from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from sqlalchemy import desc
from sqlalchemy.sql import func
from typing import List
from datetime import datetime, timedelta
from . import models, schemas, auth, database, worker
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import os

app = FastAPI(title="SoundStock API")

# Настройка CORS
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создание таблиц при старте (для простоты, в продакшене лучше использовать Alembic)
@app.on_event("startup")
async def startup():
    async with database.engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS display_name VARCHAR"))
        await conn.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR"))
        await conn.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 10000000"))
        await conn.execute(text("ALTER TABLE IF EXISTS portfolio_items ADD COLUMN IF NOT EXISTS purchase_price INTEGER"))
    app.state.scheduler = AsyncIOScheduler()
    app.state.scheduler.add_job(worker.update_market_data, "interval", hours=1)
    app.state.scheduler.add_job(worker.pay_daily_dividends, "interval", minutes=10)
    app.state.scheduler.start()
    await worker.update_market_data()

# --- Auth Routes ---

@app.post("/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    # Проверка существования пользователя
    result = await db.execute(select(models.User).where(models.User.email == user.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.User).where(models.User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Portfolio Routes ---

@app.get("/portfolio", response_model=List[schemas.PortfolioItemResponse])
async def get_portfolio(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    # Получаем элементы портфолио текущего пользователя
    # relationship "portfolio_items" не подгружается асинхронно автоматически без опций (lazy='selectin' или explicit join)
    # Поэтому сделаем прямой запрос
    result = await db.execute(select(models.PortfolioItem).where(models.PortfolioItem.user_id == current_user.id))
    items = result.scalars().all()
    return items

@app.post("/portfolio", response_model=schemas.PortfolioItemResponse)
async def add_portfolio_item(
    item: schemas.PortfolioItemCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    if current_user.balance is None:
        current_user.balance = 10000000

    if current_user.balance < item.current_price:
        raise HTTPException(status_code=400, detail="Not enough funds")

    current_user.balance -= item.current_price
    new_item = models.PortfolioItem(
        **item.dict(exclude={'current_price'}),
        purchase_price=item.current_price,
        user_id=current_user.id
    )
    db.add(new_item)
    db.add(current_user) # Update user balance
    db.add(models.Transaction(
        user_id=current_user.id,
        track_name=item.track_name,
        artist_name=item.artist_name,
        transaction_type="BUY",
        amount=float(item.current_price),
    ))
    await db.commit()
    await db.refresh(new_item)
    return new_item

@app.delete("/portfolio/{track_name}")
async def delete_portfolio_item(
    track_name: str,
    current_price: int = Query(0, ge=0),
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(
        select(models.PortfolioItem).where(
            models.PortfolioItem.user_id == current_user.id,
            models.PortfolioItem.track_name == track_name
        )
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if current_user.balance is None:
        current_user.balance = 10000000

    current_user.balance += current_price
    
    await db.delete(item)
    db.add(current_user)
    db.add(models.Transaction(
        user_id=current_user.id,
        track_name=item.track_name,
        artist_name=item.artist_name,
        transaction_type="SELL",
        amount=float(current_price),
    ))
    await db.commit()
    return {"detail": "Item deleted"}

# --- Profile Routes ---

@app.get("/me", response_model=schemas.UserProfile)
async def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/me", response_model=schemas.UserProfile)
async def update_me(
    update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    if update.display_name is not None:
        current_user.display_name = update.display_name
    if update.avatar_url is not None:
        current_user.avatar_url = update.avatar_url
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@app.post("/me/password")
async def change_password(
    payload: schemas.ChangePassword,
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    if not auth.verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid current password")
    current_user.hashed_password = auth.get_password_hash(payload.new_password)
    db.add(current_user)
    await db.commit()
    return {"detail": "Password changed"}

@app.delete("/me")
async def delete_me(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.PortfolioItem).where(models.PortfolioItem.user_id == current_user.id))
    items = result.scalars().all()
    for item in items:
        await db.delete(item)
    
    # Also delete transactions
    tx_res = await db.execute(select(models.Transaction).where(models.Transaction.user_id == current_user.id))
    txs = tx_res.scalars().all()
    for t in txs:
        await db.delete(t)

    await db.delete(current_user)
    await db.commit()
    return {"detail": "Account deleted"}

@app.post("/me/reset")
async def reset_me(
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    # Delete portfolio items
    pf_res = await db.execute(select(models.PortfolioItem).where(models.PortfolioItem.user_id == current_user.id))
    for item in pf_res.scalars().all():
        await db.delete(item)
    
    # Delete transactions
    tx_res = await db.execute(select(models.Transaction).where(models.Transaction.user_id == current_user.id))
    for t in tx_res.scalars().all():
        await db.delete(t)

    # Reset balance
    current_user.balance = 10000000 # Default balance
    db.add(current_user)
    
    await db.commit()
    await db.refresh(current_user)
    
    return {"detail": "Account reset successful", "new_balance": current_user.balance}

# --- Leaderboard Routes ---

@app.get("/leaderboard", response_model=List[schemas.LeaderboardItem])
async def get_leaderboard(db: AsyncSession = Depends(database.get_db)):
    agg = func.coalesce(func.sum(models.PortfolioItem.purchase_price), 0)
    net_worth_expr = (models.User.balance + agg).label("net_worth")
    
    dividend_subq = (
        select(func.coalesce(func.sum(models.Transaction.amount), 0))
        .where(models.Transaction.user_id == models.User.id)
        .where(models.Transaction.transaction_type == "DIVIDEND")
        .correlate(models.User)
        .scalar_subquery()
    ).label("total_dividends")

    result = await db.execute(
        select(
            models.User.id,
            models.User.email,
            models.User.display_name,
            models.User.avatar_url,
            models.User.balance,
            net_worth_expr,
            dividend_subq
        )
        .outerjoin(models.PortfolioItem, models.PortfolioItem.user_id == models.User.id)
        .group_by(models.User.id)
        .order_by(desc(net_worth_expr))
        .limit(10)
    )
    rows = result.all()
    leaderboard = []
    for idx, (uid, email, display_name, avatar_url, balance, net_worth, total_dividends) in enumerate(rows, start=1):
        username = display_name or email
        leaderboard.append({
            "rank": idx,
            "username": username,
            "net_worth": int(net_worth or 0),
            "balance": int(balance or 0),
            "total_dividends": int(total_dividends or 0),
            "avatar_url": avatar_url
        })
    return leaderboard

# --- Transactions Routes ---

@app.get("/transactions", response_model=schemas.TransactionList)
async def get_transactions(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: models.User = Depends(auth.get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    offset = (page - 1) * size
    
    # Count total
    count_res = await db.execute(select(func.count(models.Transaction.id)).where(models.Transaction.user_id == current_user.id))
    total = count_res.scalar() or 0

    # Fetch items
    result = await db.execute(
        select(models.Transaction)
        .where(models.Transaction.user_id == current_user.id)
        .order_by(models.Transaction.timestamp.desc())
        .offset(offset)
        .limit(size)
    )
    rows = result.scalars().all()
    
    items: List[schemas.TransactionResponse] = []
    for r in rows:
        date_str = r.timestamp.strftime("%d.%m.%Y %H:%M")
        items.append({
            "id": r.id,
            "user_id": r.user_id,
            "track_name": r.track_name,
            "artist_name": r.artist_name,
            "transaction_type": r.transaction_type,
            "amount": float(r.amount),
            "timestamp": r.timestamp,
            "date_str": date_str,
        })
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size
    }

@app.get("/history/{artist}/{track}", response_model=List[schemas.TrackHistoryPoint])
async def get_history(artist: str, track: str, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(
        select(models.TrackHistory)
        .where(models.TrackHistory.artist_name == artist, models.TrackHistory.track_name == track)
        .order_by(models.TrackHistory.timestamp.asc())
    )
    rows = result.scalars().all()
    return [{"timestamp": r.timestamp, "price": r.playcount} for r in rows]

@app.get("/market/snapshot", response_model=List[schemas.MarketSnapshotItem])
async def market_snapshot(db: AsyncSession = Depends(database.get_db)):
    latest_ts_res = await db.execute(select(func.max(models.TrackHistory.timestamp)))
    latest_ts = latest_ts_res.scalar()
    if not latest_ts:
        return []
    current_rows_res = await db.execute(
        select(models.TrackHistory).where(models.TrackHistory.timestamp == latest_ts)
    )
    current_rows = current_rows_res.scalars().all()
    items: List[schemas.MarketSnapshotItem] = []
    for r in current_rows:
        cutoff = latest_ts - timedelta(hours=24)
        old_row_res = await db.execute(
            select(models.TrackHistory)
            .where(
                models.TrackHistory.artist_name == r.artist_name,
                models.TrackHistory.track_name == r.track_name,
                models.TrackHistory.timestamp <= cutoff
            )
            .order_by(models.TrackHistory.timestamp.desc())
        )
        old_row = old_row_res.scalars().first()
        prev_val = old_row.playcount if old_row else None
        change = 0.0
        if prev_val and prev_val > 0:
            change = ((r.playcount - prev_val) / prev_val) * 100.0
        items.append({
            "artist_name": r.artist_name,
            "track_name": r.track_name,
            "price": int(r.playcount),
            "change24h": float(f"{change:.2f}"),
            "is_positive": change >= 0
        })
    return items
