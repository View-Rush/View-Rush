from dotenv import load_dotenv, dotenv_values
from pathlib import Path

load_dotenv()

env_path = Path(__file__).parent / ".env"
env_vars = dotenv_values(dotenv_path=env_path)

YOUTUBE_API_KEY = env_vars.get("YOUTUBE_API_KEY")

# Validate required environment variables
if not YOUTUBE_API_KEY:
    raise ValueError("YOUTUBE_API_KEY environment variable is required but not set")
