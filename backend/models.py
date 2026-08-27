"""WayPoint — SQLAlchemy ORM Models"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, JSON, Float
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, default="")
    target_role = Column(String, default="")
    skill_level = Column(String, default="beginner")  # beginner/intermediate/advanced
    weekly_time_hours = Column(Integer, default=6)
    learning_style = Column(String, default="")
    past_experience = Column(String, default="")
    career_goals = Column(String, default="")
    detailed_context = Column(JSON, nullable=True)
    is_onboarded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    role_id = Column(String, nullable=False)       # 'ml', 'java', 'mern', 'devops', etc.
    label = Column(String, nullable=False)          # 'Machine Learning Engineer'
    status = Column(String, default="active")       # 'active' | 'completed'
    node_map = Column(JSON, nullable=False)         # full nodeMap object
    skill_data = Column(JSON, nullable=False)       # skillData array
    reasoning = Column(JSON, nullable=False)        # reasoning object per node
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    role_id = Column(String, nullable=False, index=True)
    q = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)           # ["A", "B", "C", "D"]
    correct_index = Column(Integer, nullable=False)  # 0-3
    order_index = Column(Integer, default=0)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    role_id = Column(String, nullable=False)
    answers = Column(JSON, nullable=False)           # [0, 2, 1, ...]
    readiness_score = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)


class ProgressEvent(Base):
    __tablename__ = "progress_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    roadmap_id = Column(String, nullable=False)
    node_key = Column(String, nullable=False)
    new_status = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)
