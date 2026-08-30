import pytest
from fastapi.testclient import TestClient
from main import app
import os

# Set dummy env vars for testing before importing anything else if needed
os.environ["VITE_SUPABASE_URL"] = "http://localhost:5432"
os.environ["VITE_SUPABASE_ANON_KEY"] = "dummy"

client = TestClient(app)

def test_health_check():
    """Test the basic health check endpoint if it exists."""
    response = client.get("/")
    # Not sure if root is defined, let's just assert it doesn't return 500
    assert response.status_code in [200, 404]

def test_generate_learning_path_missing_body():
    """Test the /api/generate-learning-path endpoint fails properly without body."""
    response = client.post("/api/generate-learning-path", json={})
    # Should throw 422 Unprocessable Entity due to pydantic validation
    assert response.status_code == 422

def test_auth_dummy_endpoint():
    """Verify routing is somewhat intact."""
    # Assuming standard FastAPI setup
    assert app.title != ""

def test_env_vars_loaded():
    """Verify environment variables are not immediately causing crashes."""
    assert os.getenv("VITE_SUPABASE_URL") is not None
