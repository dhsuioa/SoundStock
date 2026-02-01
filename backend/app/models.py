from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    balance = Column(Integer, default=10000000, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    portfolio_items = relationship("PortfolioItem", back_populates="owner")

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    artist_name = Column(String, nullable=False)
    track_name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    mbid = Column(String, nullable=True)
    purchase_price = Column(Integer, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="portfolio_items")

class TrackHistory(Base):
    __tablename__ = "track_history"

    id = Column(Integer, primary_key=True, index=True)
    artist_name = Column(String, index=True, nullable=False)
    track_name = Column(String, index=True, nullable=False)
    playcount = Column(BigInteger, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    track_name = Column(String, nullable=True)
    artist_name = Column(String, nullable=True)
    transaction_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
