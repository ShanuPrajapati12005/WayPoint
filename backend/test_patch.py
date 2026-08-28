import sys
import os
sys.path.insert(0, os.getcwd())
from fastapi.testclient import TestClient
from main import app
from db.database import get_db, SessionLocal
from db.models import User
from core.auth import get_current_user_id

db = SessionLocal()
user = db.query(User).filter(User.email == 'admin@nexora.com').first()
db.close()

client = TestClient(app)
app.dependency_overrides[get_current_user_id] = lambda: user.id

# Send PATCH request
payload = {"status": "completed"}
response = client.patch('/api/roadmap/java/nodes/f1', json=payload)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
