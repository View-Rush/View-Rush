from pydantic import BaseModel
from typing import List, Dict

from app.models.embedding_models import VideoInput

class CombinedHeatmapRequest(BaseModel):
    channel_id: str
    video: VideoInput

class CombinedHeatmapRequestAsEmb(BaseModel):
    channel_embedding: List[float]
    video: VideoInput