from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
import torch
from app.services.youtube_service import get_channel_details, get_channel_videos
from app.services.embedding_service import (
    _lazy_load_models,
    preprocess_youtube_response,
    extract_entities_and_link,
    score_topics,
    video_to_weighted_embedding,
    _models,
)
from app.routers.heatmap_cross_attention_at_2 import model as bicross_model, device as fusion_device, USER_DIM, VIDEO_DIM, NUM_SLOTS
from gradio_client import Client
import json, re

router = APIRouter(prefix="/api", tags=["predictions"])

class PredictionRequest(BaseModel):
    title: str = ""
    description: str = ""
    tags: str = ""
    thumbnail: str = ""
    channel: str = ""
    videoId: str = ""
    thumbnailFile: str = ""

class TopThreeItem(BaseModel):
    dayIdx: int
    hourIdx: int
    score: float

class PredictionResponse(BaseModel):
    heatmap: List[List[float]]
    topThree: List[TopThreeItem]

@router.post("/predictions", response_model=PredictionResponse)
def get_predictions(payload: PredictionRequest):
    try:
        # 1️⃣ Fetch channel info + recent videos
        # Extract channel_id from channel URL if possible
        channel_id = None
        if payload.channel:
            match = re.search(r"channel/([\w-]+)", payload.channel)
            if match:
                channel_id = match.group(1)
        if not channel_id:
            raise HTTPException(status_code=400, detail="Channel ID not found in channel URL")

        channel_data = get_channel_details(channel_id)
        videos_data = get_channel_videos(channel_id, max_results=11)
        channel_info = channel_data["items"][0]

        # Prepare recent video info
        recent_videos = []
        for v in videos_data["videos"]:
            recent_videos.append({
                "title": v.get("title", ""),
                "description": v.get("description", ""),
                "thumbnail_url": v.get("thumbnail_url", ""),
                "view_count": int(v.get("viewCount", 0))
            })

        # 2️⃣ Build user (channel) embedding
        _lazy_load_models()
        processed = preprocess_youtube_response({
            "channel": {"title": channel_info["snippet"]["title"]},
            "videos": recent_videos
        })
        videos = processed.get("videos", [])
        max_views = max([v.get("view_count", 0) for v in videos]) if videos else 1.0

        final_videos = []
        for v in videos:
            el = extract_entities_and_link(v)
            topic_info = score_topics(v) if len(el.get("mentions", [])) <= 10 else {"topics": [], "scores": []}
            final_videos.append({
                "clean_title": v.get("clean_title"),
                "clean_description": v.get("clean_description"),
                "view_count": v.get("view_count", 0),
                "linked_entities": el.get("linked_entities", []),
                "topics": topic_info.get("topics", []),
                "scores": topic_info.get("scores", [])
            })

        video_embeddings = []
        for v in final_videos:
            emb = video_to_weighted_embedding(v, global_max_views=max_views)
            if emb is not None:
                video_embeddings.append(emb)

        if not video_embeddings:
            embedder = _models["embedder"]
            user_embedding = np.zeros(embedder.get_sentence_embedding_dimension(), dtype=float)
        else:
            user_embedding = np.mean(np.stack(video_embeddings, axis=0), axis=0).astype(float)

        # 3️⃣ Get video embedding via VidTower
        client = Client("MeshMax/VidTower")
        result = client.predict(
            title=payload.title,
            description=payload.description,
            tags=payload.tags,
            thumbnail_url=payload.thumbnail,
            api_name="/predict",
        )

        if isinstance(result, (list, tuple)):
            video_embedding = [float(x) for x in result]
        elif hasattr(result, "tolist"):
            video_embedding = [float(x) for x in result.tolist()]
        elif isinstance(result, str):
            try:
                parsed = json.loads(result)
                if isinstance(parsed, (list, tuple)):
                    video_embedding = [float(x) for x in parsed]
                else:
                    nums = re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", result)
                    video_embedding = [float(x) for x in nums]
            except Exception:
                nums = re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", result)
                video_embedding = [float(x) for x in nums]
        else:
            raise HTTPException(status_code=502, detail="VidTower returned unknown response type")

        # 4️⃣ Compute BiCrossAttention heatmap
        bicross_model.eval()
        with torch.no_grad():
            user_emb_tensor = torch.tensor([user_embedding], dtype=torch.float32).to(fusion_device)
            video_emb_tensor = torch.tensor([video_embedding], dtype=torch.float32).to(fusion_device)

            # Validate dimensions
            if user_emb_tensor.shape[1] != VIDEO_DIM:
                raise HTTPException(status_code=400, detail=f"Expected user_emb dim {VIDEO_DIM}, got {user_emb_tensor.shape[1]}")
            if video_emb_tensor.shape[1] != USER_DIM:
                raise HTTPException(status_code=400, detail=f"Expected video_emb dim {USER_DIM}, got {video_emb_tensor.shape[1]}")

            slot_scores = bicross_model(user_emb_tensor, video_emb_tensor)
            heatmap_flat = torch.sigmoid(slot_scores).cpu().numpy()[0]

        # 5️⃣ Convert flat heatmap to weekly heatmap (7x24)
        if len(heatmap_flat) != 168:
            raise HTTPException(status_code=500, detail="Heatmap output is not 168 slots (7x24)")
        heatmap = [list(heatmap_flat[i*24:(i+1)*24]) for i in range(7)]

        # 6️⃣ Find top three slots
        flat = [
            {"dayIdx": d, "hourIdx": h, "score": heatmap[d][h]}
            for d in range(7) for h in range(24)
        ]
        top_three = sorted(flat, key=lambda x: x["score"], reverse=True)[:3]

        return PredictionResponse(
            heatmap=heatmap,
            topThree=[TopThreeItem(**item) for item in top_three]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
