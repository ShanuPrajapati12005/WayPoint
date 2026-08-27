import sys
import os
sys.path.insert(0, os.getcwd())
from services.groq_service import generate_roadmap, adapt_roadmap, get_fallback_roadmap, client, GROQ_MODEL

print("=== Testing Direct Groq Call to print raw response ===")
try:
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "user", "content": "Say hello"},
        ],
    )
    print("Direct request response:", response.choices[0].message.content)
except Exception as e:
    print("Direct request failed:", e)

print("\n=== Testing generate_roadmap ===")
try:
    # Let's temporarily monkeypatch/intercept the raw response printing in services/groq_service.py by running it here:
    import services.groq_service
    # We will print the raw output when it is fetched
except Exception as e:
    print(e)

rm = generate_roadmap("devops")
print("generate_roadmap returned keys:", rm.get("nodeMap", {}).keys())

print("\n=== Testing adapt_roadmap ===")
java_rm = get_fallback_roadmap("java")
try:
    adapted = adapt_roadmap(java_rm, "f1", "easy")
    print("adapt_roadmap returned keys:", adapted.get("nodeMap", {}).keys())
except Exception as e:
    print("adapt_roadmap raised exception:", e)

