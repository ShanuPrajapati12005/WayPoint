import requests

base_url = "http://localhost:8000/api"

print("1. Testing Assessment Quiz Generation...")
resp = requests.get(f"{base_url}/assessment/quiz?target_role=devops&skill_level=beginner&quiz_type=initial")
if resp.status_code == 200:
    data = resp.json()
    print("✅ Quiz generated successfully. Questions count:", len(data.get("questions", [])))
else:
    print("❌ Quiz generation failed:", resp.text)

print("\n2. Testing Roadmap Generation...")
# Need to pass an email or headers? The route might require current_user.
# Let's check if the route is protected.
# We'll just test the groq_service directly to avoid auth issues if any.
