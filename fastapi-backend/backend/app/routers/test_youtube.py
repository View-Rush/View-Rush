from fastapi import APIRouter, HTTPException
import requests
from app.config import YOUTUBE_API_KEY

# print("Loaded API Key:", YOUTUBE_API_KEY)  # Removed to avoid logging sensitive information

router = APIRouter(prefix="/test", tags=["Test"])

BASE_URL = "https://www.googleapis.com/youtube/v3"

@router.get("/channel-info/{channel_id}")
def get_channel_info(channel_id: str):
    url = f"{BASE_URL}/channels"
    params = {
        "part": "snippet,statistics",
        "id": channel_id,
        "key": YOUTUBE_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    print(data)
    if "items" not in data or len(data["items"]) == 0:
        raise HTTPException(status_code=404, detail="Channel not found")

    channel = data["items"][0]

    return {
        "channel_name": channel["snippet"]["title"],
        "subscriber_count": channel["statistics"].get("subscriberCount", "N/A")
    }
