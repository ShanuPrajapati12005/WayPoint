import os
from dotenv import load_dotenv
from groq import Groq

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key loaded: {api_key[:5]}...{api_key[-5:]}" if api_key else "No API Key loaded")

client = Groq(api_key=api_key)

try:
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": "hi"}],
    )
    print("Success:", response.choices[0].message.content)
except Exception as e:
    print("Error:", repr(e))
