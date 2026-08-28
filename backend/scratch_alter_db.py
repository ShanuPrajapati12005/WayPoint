import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN career_goals TEXT DEFAULT '';"))
        print("Added career_goals")
    except Exception as e:
        print("career_goals might already exist:", e)

    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN detailed_context JSONB;"))
        print("Added detailed_context")
    except Exception as e:
        print("detailed_context might already exist:", e)
