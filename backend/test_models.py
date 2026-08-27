import sys
import os
sys.path.insert(0, os.getcwd())
from services.groq_service import client

try:
    models = client.models.list()
    print("Available Groq models:")
    for m in models.data:
        print(f"- {m.id}")
except Exception as e:
    print("Failed to list models:", e)
