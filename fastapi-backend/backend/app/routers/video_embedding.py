import json
import re
from typing import List

from gradio_client import Client
from fastapi import APIRouter, HTTPException
from app.models.embedding_models import VideoInput

router = APIRouter(prefix="/video-tower", tags=["Fusion Model"])

client = Client("MeshMax/VidTower")

@router.post("/get-video-embedding/")
async def get_video_embedding(video: VideoInput):
    """Return the video embedding as a list[float] regardless of upstream format."""
    try:
        result = client.predict(
            title=video.title,
            description=video.description,
            tags=video.tags,
            thumbnail_url=video.thumbnail_url,
            api_name="/predict",
        )

        embedding: List[float]

        # Normalize various possible response shapes into a list
        if isinstance(result, (list, tuple)):
            embedding = [float(x) for x in result]
        elif hasattr(result, "tolist"):
            embedding = [float(x) for x in result.tolist()]
        elif isinstance(result, str):
            parsed = None
            try:
                parsed = json.loads(result)
            except Exception:
                parsed = None
            if isinstance(parsed, (list, tuple)):
                embedding = [float(x) for x in parsed]
            else:
                nums = re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", result)
                if not nums:
                    raise HTTPException(status_code=502, detail="VidTower returned a string without numeric values")
                embedding = [float(x) for x in nums]
        else:
            raise HTTPException(status_code=502, detail=f"Unexpected VidTower response type: {type(result).__name__}")

        return {"embedding": embedding}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
