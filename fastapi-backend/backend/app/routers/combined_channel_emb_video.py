
# from typing import List
# import numpy as np
# import torch
# from fastapi import APIRouter, HTTPException
# from fastapi.responses import JSONResponse

# from app.models.video_embeddings import CombinedHeatmapRequestAsEmb
# from app.models.user import UserProfileRequest
# from app.models.embedding_models import VideoIn, BidirectionalModelInput
# from app.services.youtube_service import get_channel_details, get_channel_videos
# from app.services.embedding_service import (
#     _lazy_load_models,
#     preprocess_youtube_response,
#     extract_entities_and_link,
#     score_topics,
#     video_to_weighted_embedding,
#     _models,
# )
# from app.routers.heatmap_cross_attention_at_2 import model as bicross_model, device as fusion_device, USER_DIM, VIDEO_DIM, NUM_SLOTS
# from gradio_client import Client
# import json, re
# router = APIRouter(prefix="/channel-emb-and-video-data", tags=["Fusion Model"])

# @router.post("/prediction-heatmap")
# def channel_video_heatmap(payload: CombinedHeatmapRequestAsEmb):
#     """
#     End-to-end pipeline:
#     1️⃣ Fetch channel info + recent videos
#     2️⃣ Build user (channel) embedding
#     3️⃣ Get video embedding via VidTower
#     4️⃣ Compute BiCrossAttention heatmap
#     5️⃣ Return slot-wise heatmap JSON
#     """
#     try:
#         user_embedding = payload.channel_embedding
        
#         # -------------------------
#         # 3️⃣ Get video embedding via VidTower
#         # -------------------------
        

#         client = Client("MeshMax/VidTower")
#         result = client.predict(
#             title=payload.video.title,
#             description=payload.video.description,
#             tags=payload.video.tags,
#             thumbnail_url=payload.video.thumbnail_url,
#             api_name="/predict",
#         )

#         # Normalize to list[float]
#         if isinstance(result, (list, tuple)):
#             video_embedding = [float(x) for x in result]
#         elif hasattr(result, "tolist"):
#             video_embedding = [float(x) for x in result.tolist()]
#         elif isinstance(result, str):
#             try:
#                 parsed = json.loads(result)
#                 if isinstance(parsed, (list, tuple)):
#                     video_embedding = [float(x) for x in parsed]
#                 else:
#                     nums = re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", result)
#                     video_embedding = [float(x) for x in nums]
#             except Exception:
#                 nums = re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", result)
#                 video_embedding = [float(x) for x in nums]
#         else:
#             raise HTTPException(status_code=502, detail="VidTower returned unknown response type")

#         # -------------------------
#         # 4️⃣ Compute BiCrossAttention heatmap
#         # -------------------------
#         bicross_model.eval()
#         with torch.no_grad():
#             user_emb_tensor = torch.tensor([user_embedding], dtype=torch.float32).to(fusion_device)
#             video_emb_tensor = torch.tensor([video_embedding], dtype=torch.float32).to(fusion_device)

#             # Validate dimensions
#             if user_emb_tensor.shape[1] != VIDEO_DIM:   #the user and video embeddings are interchanged 
#                 raise HTTPException(status_code=400, detail=f"Expected user_emb dim {VIDEO_DIM}, got {user_emb_tensor.shape[1]}")
#             if video_emb_tensor.shape[1] != USER_DIM:
#                 raise HTTPException(status_code=400, detail=f"Expected video_emb dim {USER_DIM}, got {video_emb_tensor.shape[1]}")

#             slot_scores = bicross_model(user_emb_tensor,video_emb_tensor )
#             heatmap = torch.sigmoid(slot_scores).cpu().numpy()[0]

#         # -------------------------
#         # 5️⃣ Return slot-wise heatmap
#         # -------------------------
#         slot_values = {f"slot_{i}": float(val) for i, val in enumerate(heatmap)}
#         return JSONResponse(content={"heatmap": slot_values})

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
