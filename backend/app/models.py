from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    portfolio_items = relationship("PortfolioItem", back_populates="owner")

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    artist_name = Column(String, nullable=False)
    track_name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    mbid = Column(String, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="portfolio_items")
