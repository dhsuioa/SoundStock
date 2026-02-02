from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in environment")

SQLALCHEMY_ECHO = os.environ.get("SQLALCHEMY_ECHO", "false").lower() in ("1", "true", "yes", "on")

DB_URL_WITH_ASYNC_DRIVER = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(DB_URL_WITH_ASYNC_DRIVER, echo=SQLALCHEMY_ECHO)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session
