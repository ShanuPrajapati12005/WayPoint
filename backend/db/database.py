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
    # For Neon, we ensure query performance and SSL mode are handled
    real_url = DATABASE_URL
    # We will use psycopg2 instead of pg8000
    
    engine = create_engine(
        real_url,
        echo=False,
        poolclass=NullPool
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


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
