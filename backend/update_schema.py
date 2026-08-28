from sqlalchemy import create_engine, text
from core.config import DATABASE_URL
DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://")

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS target_role VARCHAR DEFAULT '';"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_level VARCHAR DEFAULT 'beginner';"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_time_hours INTEGER DEFAULT 6;"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_style VARCHAR DEFAULT '';"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS past_experience VARCHAR DEFAULT '';"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS career_goals VARCHAR DEFAULT '';"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS detailed_context JSON;"))
    conn.commit()
print("Database schema updated!")
