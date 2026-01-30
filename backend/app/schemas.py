from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

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
    created_at: datetime

    class Config:
        from_attributes = True

# PortfolioItem Schemas
class PortfolioItemBase(BaseModel):
    artist_name: str
    track_name: str
    image_url: Optional[str] = None
    mbid: Optional[str] = None

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemResponse(PortfolioItemBase):
    id: int
    user_id: int
    added_at: datetime

    class Config:
        from_attributes = True
