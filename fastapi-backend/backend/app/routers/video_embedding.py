from fastapi import FastAPI
from pydantic import BaseModel
from gradio_client import Client
from fastapi import APIRouter, HTTPException
from app.models.embedding_models import VideoInput

router = APIRouter(prefix="/video-tower", tags=["Fusion Model"])

# Initialize the Hugging Face Gradio client once
client = Client("MeshMax/VidTower")

# Request body model

@router.post("/get-video-embedding/")
async def get_video_embedding(video: VideoInput):
    # Call the Gradio model
    try:
        result = client.predict(
            title=video.title,
            description=video.description,
            tags=video.tags,
            thumbnail_url=video.thumbnail_url,
            api_name="/predict"
        )
        return {"embedding": result}
    except Exception as e:
        return {"error": str(e)}
