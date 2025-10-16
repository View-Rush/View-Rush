from dotenv import load_dotenv
import os
from pathlib import Path

# Explicit path to project root .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# Validate required environment variables
if not YOUTUBE_API_KEY:
    raise ValueError("YOUTUBE_API_KEY environment variable is required but not set")
