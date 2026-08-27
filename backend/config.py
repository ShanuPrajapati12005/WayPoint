"""WayPoint — Configuration (loads from .env)"""

import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
JWT_SECRET = os.getenv("JWT_SECRET", "waypoint-dev-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 168  # 7 days
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./waypoint.db")

