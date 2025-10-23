from typing import List
import numpy as np
import torch
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.models.video_embeddings import CombinedHeatmapRequest
from app.models.user import UserProfileRequest
from app.models.embedding_models import VideoIn, BidirectionalModelInput
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
router = APIRouter(prefix="/channel-id-and-video-data", tags=["Fusion Model"])

@router.post("/prediction-heatmap")
def channel_video_heatmap(payload: CombinedHeatmapRequest):
    try:
        channel_data = get_channel_details(payload.channel_id)
        videos_data = get_channel_videos(payload.channel_id, max_results=11)

        channel_info = channel_data["items"][0]

        recent_videos = []
        for v in videos_data["videos"]:
            recent_videos.append({
                "title": v.get("title", ""),
                "description": v.get("description", ""),
                "thumbnail_url": v.get("thumbnail_url", ""),
                "view_count": int(v.get("viewCount", 0))
            })

        _lazy_load_models()

        processed = preprocess_youtube_response({
            "channel": {"title": channel_info["snippet"]["title"]},
            "videos": recent_videos
        })
        videos = processed.get("videos", [])
        max_views = max([v.get("view_count", 0) for v in videos]) if videos else 1.0

        # Entity linking + topic scoring
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

        # Video embeddings weighted by view counts
        video_embeddings = []
        for v in final_videos:
            emb = video_to_weighted_embedding(v, global_max_views=max_views)
            if emb is not None:
                video_embeddings.append(emb)

        # Channel embedding = mean of video embeddings
        if not video_embeddings:
            embedder = _models["embedder"]
            user_embedding = np.zeros(embedder.get_sentence_embedding_dimension(), dtype=float)
        else:
            user_embedding = np.mean(np.stack(video_embeddings, axis=0), axis=0).astype(float)

        client = Client("MeshMax/VidTower")
        result = client.predict(
            title=payload.video.title,
            description=payload.video.description,
            tags=payload.video.tags,
            thumbnail_url=payload.video.thumbnail_url,
            api_name="/predict",
        )

        # Normalize to list[float]
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

        bicross_model.eval()
        with torch.no_grad():
            user_emb_tensor = torch.tensor([user_embedding], dtype=torch.float32).to(fusion_device)
            video_emb_tensor = torch.tensor([video_embedding], dtype=torch.float32).to(fusion_device)

            # Validate dimensions
            if user_emb_tensor.shape[1] != VIDEO_DIM:   #the user and video embeddings are interchanged 
                raise HTTPException(status_code=400, detail=f"Expected user_emb dim {VIDEO_DIM}, got {user_emb_tensor.shape[1]}")
            if video_emb_tensor.shape[1] != USER_DIM:
                raise HTTPException(status_code=400, detail=f"Expected video_emb dim {USER_DIM}, got {video_emb_tensor.shape[1]}")

            slot_scores = bicross_model(user_emb_tensor,video_emb_tensor )
            heatmap = torch.sigmoid(slot_scores).cpu().numpy()[0]

        slot_values = {f"slot_{i}": float(val) for i, val in enumerate(heatmap)}
        return JSONResponse(content={"heatmap": slot_values})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
