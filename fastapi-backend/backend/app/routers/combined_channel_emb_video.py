# from typing import List
# import numpy as np
# import torch
# from fastapi import APIRouter, HTTPException
# from fastapi.responses import JSONResponse

# from app.models.video_embeddings import CombinedHeatmapRequest
# from app.models.user import UserProfileRequest
# from app.models.embedding_models import VideoIn, ChannelResponseIn, BidirectionalModelInput
# from app.routers.user_profiling import get_user_profile
# from app.routers.profile_embedding import build_channel_embedding
# from app.routers.video_embedding import get_video_embedding
# from app.routers.heatmap_cross_attention_at_2 import predict_slot_heatmap

# router = APIRouter(prefix="/combined", tags=["Fusion Model"])

# @router.post("/channel-video-heatmap")
# async def channel_video_heatmap(payload: CombinedHeatmapRequest):
#     """
#     End-to-end pipeline:
#     - Input: channel_id + video data (VideoInput)
#     - Build channel (user) embedding from channel_id
#     - Get video embedding via VidTower
#     - Compute heatmap using BiCrossAttention model
#     - Output: { heatmap: { slot_0: float, ..., slot_167: float } }
#     """
#     try:
#         # 1️⃣ Get user profile (channel info + recent videos)
#         user_profile_resp = get_user_profile(UserProfileRequest(channel_id=payload.channel_id))

#         # 2️⃣ Convert UserProfileResponse -> ChannelResponseIn for embedding
#         channel_in = ChannelResponseIn(
#             channel_title=user_profile_resp.channel_title,
#             subscriber_count=user_profile_resp.subscriber_count,
#             total_videos=user_profile_resp.total_videos,
#             recent_videos=[
#                 VideoIn(
#                     title=v.title,
#                     description=v.description,
#                     thumbnail_url=v.thumbnail_url,
#                     view_count=v.view_count
#                 ) for v in user_profile_resp.recent_videos
#             ]
#         )

#         # 3️⃣ Compute user (channel) embedding
#         user_emb_out = build_channel_embedding(channel_in)

#         # 4️⃣ Compute video embedding
#         video_emb_out = await get_video_embedding(payload.video)

#         # 5️⃣ Compute heatmap using BiCrossAttention model
#         heatmap_resp = predict_slot_heatmap(BidirectionalModelInput(
#             user_embedding=user_emb_out.embedding,
#             video_embedding=video_emb_out.embedding
#         ))

#         # 6️⃣ Return heatmap JSON
#         return JSONResponse(content=heatmap_resp)

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

from typing import List
import numpy as np
import torch
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.models.video_embeddings import CombinedHeatmapRequestAsEmb
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
router = APIRouter(prefix="/channel-emb-and-video-data", tags=["Fusion Model"])

@router.post("/prediction-heatmap")
def channel_video_heatmap(payload: CombinedHeatmapRequestAsEmb):
    """
    End-to-end pipeline:
    1️⃣ Fetch channel info + recent videos
    2️⃣ Build user (channel) embedding
    3️⃣ Get video embedding via VidTower
    4️⃣ Compute BiCrossAttention heatmap
    5️⃣ Return slot-wise heatmap JSON
    """
    try:
        user_embedding = payload.channel_embedding
        
        # -------------------------
        # 3️⃣ Get video embedding via VidTower
        # -------------------------
        

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

        # -------------------------
        # 4️⃣ Compute BiCrossAttention heatmap
        # -------------------------
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

        # -------------------------
        # 5️⃣ Return slot-wise heatmap
        # -------------------------
        slot_values = {f"slot_{i}": float(val) for i, val in enumerate(heatmap)}
        return JSONResponse(content={"heatmap": slot_values})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
