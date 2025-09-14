import requests
from app.config import YOUTUBE_API_KEY

BASE_URL = "https://www.googleapis.com/youtube/v3"


def get_channel_details(channel_id: str):
    """Fetch basic channel details using YouTube Data API"""
    url = f"{BASE_URL}/channels"
    params = {
        "part": "snippet,statistics,contentDetails",
        "id": channel_id,
        "key": YOUTUBE_API_KEY
    }
    response = requests.get(url, params=params)
    return response.json()

def get_channel_videos(channel_id: str, max_results: int = 10):
    """Fetch recent video IDs from channel uploads playlist"""
    # Step 1: Get uploads playlist
    channel_data = get_channel_details(channel_id)
    uploads_playlist = channel_data["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    # Step 2: Get videos from playlist
    url = f"{BASE_URL}/playlistItems"
    params = {
        "part": "snippet,contentDetails",
        "playlistId": uploads_playlist,
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY
    }
    playlist_res = requests.get(url, params=params).json()
    video_ids = [item["contentDetails"]["videoId"] for item in playlist_res["items"]]

    # Step 3: Get video details with viewCount
    videos_url = f"{BASE_URL}/videos"
    videos_params = {
        "part": "snippet,statistics",
        "id": ",".join(video_ids),
        "key": YOUTUBE_API_KEY
    }
    videos_res = requests.get(videos_url, params=videos_params).json()
    return {
        "videos": [
            {
                "title": v["snippet"]["title"],
                "description": v["snippet"].get("description", ""),
                "thumbnail_url": v["snippet"]["thumbnails"]["default"]["url"],
                "viewCount": v["statistics"].get("viewCount", 0)
            }
            for v in videos_res["items"]
        ]
    }
    

