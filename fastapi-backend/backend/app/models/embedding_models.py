# app/models/embedding_models.py
from pydantic import BaseModel
from typing import List, Dict, Any

class HeatmapResponse(BaseModel):
    slot_probabilities: dict[int, float]  # slot_id -> probability


class EmbeddingRequest(BaseModel):
    metadata_embedding: list[float]
    content_embedding: list[float]
    user_embedding: list[float]

class VideoIn(BaseModel):
    title: str
    description: str
    thumbnail_url: str = None
    view_count: int = 0

class ChannelResponseIn(BaseModel):
    channel_title: str
    subscriber_count: int
    total_videos: int
    recent_videos: List[VideoIn]

class EmbeddingOut(BaseModel):
    embedding: List[float]
    dim: int
    videos_processed: int
    channel_title: str
