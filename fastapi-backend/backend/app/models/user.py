from pydantic import BaseModel
from typing import List, Dict

class UserProfileRequest(BaseModel):
    channel_id: str

class VideoInfo(BaseModel):
    title: str
    description: str
    thumbnail_url: str
    view_count: int


class UserProfileResponse(BaseModel):
    channel_title: str
    subscriber_count: int
    total_videos: int
    recent_videos: List[VideoInfo]  # richer info for each video
