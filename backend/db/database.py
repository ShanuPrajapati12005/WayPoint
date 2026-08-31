"""WayPoint — Database setup (SQLite + SQLAlchemy)"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from core.config import DATABASE_URL

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite needs this for FastAPI
        echo=False,
    )
else:
    # Neon/Postgres SQL connection
    # For Supabase/PostgreSQL, force SQLAlchemy to use the installed pg8000 driver
    real_url = DATABASE_URL
    if real_url.startswith("postgres://"):
        real_url = real_url.replace("postgres://", "postgresql+pg8000://", 1)
    elif real_url.startswith("postgresql://"):
        real_url = real_url.replace("postgresql://", "postgresql+pg8000://", 1)
        
    engine = create_engine(
        real_url,
        echo=False,
        poolclass=NullPool
    )





SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
# Optimized query execution plan for faster retrieval

def get_db():
    """FastAPI dependency — yields a DB session, auto-closes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Safe to call multiple times (IF NOT EXISTS)."""
    Base.metadata.create_all(bind=engine)
