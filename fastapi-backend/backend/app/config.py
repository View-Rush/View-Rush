from dotenv import load_dotenv
import os
from pathlib import Path
#load_dotenv()

# Explicit path to project root .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
# Do not print sensitive information directly. Print presence/absence or a masked value.
if YOUTUBE_API_KEY:
    print("Loaded API Key: present")  # Debug to confirm loaded, without revealing the key
else:
    print("Loaded API Key: missing or not set")
