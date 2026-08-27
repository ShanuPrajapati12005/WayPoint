import sys
import os
import time
import json
sys.path.insert(0, os.getcwd())
from services.groq_service import client, GROQ_MODEL, get_fallback_roadmap

java_rm = get_fallback_roadmap("java")
uncompleted_nodes = ["f2", "f3", "d1", "d2", "m1", "m2", "m3"]

# 1. Full JSON generation prompt
full_prompt = f"""You are an expert technical career coach.
The user is currently on their learning track: "Java Backend".
They gave feedback that the current module "Java Syntax & OOP" was "easy".
Your task is to rewrite the remaining uncompleted roadmap.
Compress the basics, introduce advanced concepts sooner, shorten duration, and append "(Accelerated)" to the titles.
Return the entire roadmap JSON structure:
{json.dumps(java_rm, indent=2)}
Return ONLY the raw JSON.
"""

# 2. Only uncompleted nodes JSON generation prompt
partial_prompt = f"""You are an expert technical career coach.
The user is currently on their learning track: "Java Backend".
They gave feedback that the current module "Java Syntax & OOP" was "easy".
Your task is to adapt the remaining uncompleted modules: {uncompleted_nodes}.
Compress the basics, introduce advanced concepts sooner, shorten duration, and append "(Accelerated)" to the titles.
Return ONLY a JSON object with the updated fields for these uncompleted modules.
Format:
{{
  "nodeMap": {{
    "node_id": {{
      "title": "New Title (Accelerated)",
      "duration": "New Duration",
      "syllabus": ["Topic 1", "Topic 2"]
    }}
  }},
  "reasoning": {{
    "node_id": {{
      "reason": "New reason",
      "prereq": "New prereq",
      "time": "New time explanation"
    }}
  }}
}}
Return ONLY this JSON. No extra text, no markdown.
"""

print("=== Timing Full JSON Generation ===")
t0 = time.time()
try:
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": full_prompt},
            {"role": "user", "content": "Generate the full adapted roadmap."}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=4096,
    )
    t1 = time.time()
    print(f"Full generation took: {t1 - t0:.2f} seconds")
    print(f"Response length: {len(response.choices[0].message.content)} chars")
except Exception as e:
    print("Full generation failed:", e)

print("\n=== Timing Partial JSON Generation ===")
t0 = time.time()
try:
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": partial_prompt},
            {"role": "user", "content": "Generate the partial adapted roadmap changes."}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=1024,
    )
    t1 = time.time()
    print(f"Partial generation took: {t1 - t0:.2f} seconds")
    print(f"Response length: {len(response.choices[0].message.content)} chars")
    print("Partial response preview:\n", response.choices[0].message.content[:300])
except Exception as e:
    print("Partial generation failed:", e)
