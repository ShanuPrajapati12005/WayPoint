import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

sender_email = os.environ.get("SMTP_EMAIL")
sender_password = os.environ.get("SMTP_PASSWORD")

if not sender_email or not sender_password:
    print("Error: Credentials missing in .env")
    exit(1)

try:
    print(f"Connecting to SMTP as {sender_email}...")
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, sender_password)
    print("SUCCESS: SMTP Authentication successful! The email feature is working perfectly.")
    server.quit()
except Exception as e:
    print(f"FAILED: SMTP Authentication failed: {e}")
