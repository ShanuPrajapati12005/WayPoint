import sys
import os
import time
sys.path.insert(0, os.getcwd())
from services.groq_service import client, get_fallback_roadmap

java_rm = get_fallback_roadmap("java")

prompt = f"""You are an expert technical career coach.
The user is currently on their learning track: "Java Backend".
They gave feedback that the current module "Java Syntax & OOP" was "easy".
Your task is to adapt the remaining uncompleted modules.
Compress the basics, introduce advanced concepts sooner, shorten duration, and append "(Accelerated)" to the titles.
Return a JSON object conforming to TrackSchema.
Return ONLY raw JSON.
"""

print("=== Timing groq/compound-mini ===")
t0 = time.time()
try:
    response = client.chat.completions.create(
        model="groq/compound-mini",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": "Adapt the roadmap."}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=4096,
    )
    t1 = time.time()
    print(f"groq/compound-mini took: {t1 - t0:.2f} seconds")
    print(f"Response length: {len(response.choices[0].message.content)} chars")
    print("Response preview:\n", response.choices[0].message.content[:300])
except Exception as e:
    print("groq/compound-mini failed:", e)
