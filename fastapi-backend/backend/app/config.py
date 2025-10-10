from dotenv import load_dotenv
import os
from pathlib import Path
#load_dotenv()

# Explicit path to project root .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
print("Loaded API Key:", YOUTUBE_API_KEY)  # Debug to confirm
