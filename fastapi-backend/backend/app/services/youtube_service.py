import requests
from app.config import YOUTUBE_API_KEY

BASE_URL = "https://www.googleapis.com/youtube/v3"


def get_channel_details(channel_id: str):
    """Fetch basic channel details using YouTube Data API.
    Returns a dict; never raises for common API issues to keep callers resilient.
    """
    try:
        url = f"{BASE_URL}/channels"
        params = {
            "part": "snippet,statistics,contentDetails",
            "id": channel_id,
            "key": YOUTUBE_API_KEY,
        }
        response = requests.get(url, params=params, timeout=15)
        data = response.json() if response is not None else {}
        return data if isinstance(data, dict) else {}
    except Exception:
        # Network or parsing error; return empty so callers can decide fallback
        return {}

def get_channel_videos(channel_id: str, max_results: int = 10):
    """Fetch recent videos for a channel with basic metadata and viewCount.
    Returns a dict {"videos": [...]} and avoids raising on missing keys or API errors.
    """
    try:
        # Step 1: Get uploads playlist id
        channel_data = get_channel_details(channel_id) or {}
        items = channel_data.get("items") or []
        if not items:
            return {"videos": []}
        uploads_playlist = (
            items[0]
            .get("contentDetails", {})
            .get("relatedPlaylists", {})
            .get("uploads")
        )
        if not uploads_playlist:
            return {"videos": []}

        # Step 2: Get playlist items
        url = f"{BASE_URL}/playlistItems"
        params = {
            "part": "snippet,contentDetails",
            "playlistId": uploads_playlist,
            "maxResults": max(1, min(int(max_results or 10), 50)),
            "key": YOUTUBE_API_KEY,
        }
        playlist_resp = requests.get(url, params=params, timeout=20)
        playlist_json = playlist_resp.json() if playlist_resp is not None else {}
        p_items = playlist_json.get("items") or []
        video_ids = [i.get("contentDetails", {}).get("videoId") for i in p_items]
        video_ids = [vid for vid in video_ids if vid]
        if not video_ids:
            return {"videos": []}

        # Step 3: Get video details with viewCount
        videos_url = f"{BASE_URL}/videos"
        videos_params = {
            "part": "snippet,statistics",
            "id": ",".join(video_ids),
            "key": YOUTUBE_API_KEY,
        }
        videos_resp = requests.get(videos_url, params=videos_params, timeout=20)
        videos_json = videos_resp.json() if videos_resp is not None else {}
        v_items = videos_json.get("items") or []
        videos = []
        for v in v_items:
            snip = v.get("snippet", {})
            thumbs = snip.get("thumbnails", {})
            thumb_url = None
            # choose available thumbnail key
            for k in ("default", "medium", "high", "standard", "maxres"):
                if k in thumbs and isinstance(thumbs[k], dict):
                    thumb_url = thumbs[k].get("url")
                    if thumb_url:
                        break
            stats = v.get("statistics", {})
            videos.append(
                {
                    "title": snip.get("title", ""),
                    "description": snip.get("description", ""),
                    "thumbnail_url": thumb_url or "",
                    "viewCount": stats.get("viewCount", 0),
                }
            )
        return {"videos": videos}
    except Exception:
        # Gracefully degrade to empty result
        return {"videos": []}
    

