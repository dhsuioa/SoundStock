from pydantic import BaseModel, EmailStr, conint
from datetime import datetime
from typing import Optional
from typing import List

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    balance: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    id: int
    email: EmailStr
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    balance: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class TrackHistoryPoint(BaseModel):
    timestamp: datetime
    price: int

class MarketSnapshotItem(BaseModel):
    artist_name: str
    track_name: str
    price: int
    change24h: float
    is_positive: bool

class LeaderboardItem(BaseModel):
    rank: int
    username: str
    net_worth: int
    balance: int
    total_dividends: int
    avatar_url: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    track_name: Optional[str] = None
    artist_name: Optional[str] = None
    transaction_type: str
    amount: float
    timestamp: datetime
    date_str: str

class TransactionList(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    size: int

# PortfolioItem Schemas
class PortfolioItemBase(BaseModel):
    artist_name: str
    track_name: str
    image_url: Optional[str] = None
    mbid: Optional[str] = None

class PortfolioItemCreate(PortfolioItemBase):
    current_price: conint(ge=0)

class PortfolioItemResponse(PortfolioItemBase):
    id: int
    user_id: int
    purchase_price: Optional[int] = None
    added_at: datetime

    class Config:
        from_attributes = True
