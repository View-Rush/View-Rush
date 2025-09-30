# app/routers/profile_embedding.py
import logging
import numpy as np
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from models.embedding_models import ChannelResponseIn, EmbeddingOut, VideoIn

# Import or define _lazy_load_models
from services.embedding_service import _lazy_load_models, clean_text, preprocess_youtube_response, extract_entities_and_link, score_topics, video_to_weighted_embedding, _models
router = APIRouter(prefix="/embed", tags=["Profile Embedding"])

# -------------------------
# Route implementation
# -------------------------
@router.post("/channel-embedding", response_model=EmbeddingOut)
def build_channel_embedding(payload: ChannelResponseIn):
    """
    Accepts the YouTube-channel-response JSON (as ChannelResponseIn),
    runs preprocessing, entity linking, topic scoring, embeddings, and returns the channel embedding.
    """
    # Lazy-load heavy models on demand (thread-safe)
    try:
        _lazy_load_models()
    except Exception as e:
        logging.exception("Failed to load models")
        raise HTTPException(status_code=500, detail=f"Model load error: {e}")

    # Convert payload -> dict
    api_response = payload.dict()

    # Step 1: Preprocess
    processed = preprocess_youtube_response(api_response)
    videos = processed.get("videos", [])
    if not videos:
        # return zero vector if no videos
        embedder = _models["embedder"]
        zero_vec = np.zeros(embedder.get_sentence_embedding_dimension(), dtype=float)
        return EmbeddingOut(
            embedding=zero_vec.tolist(),
            dim=int(zero_vec.shape[0]),
            videos_processed=0,
            channel_title=processed["channel"]["title"]
        )

    # compute global max views for normalization
    max_views = max([v.get("view_count", 0) for v in videos]) if videos else 1.0

    # Step 2 & 3: entity linking + topic scoring -> build per-video structure
    final_videos = []
    for v in videos:
        el = extract_entities_and_link(v)
        topic_info = score_topics(v) if (len(el.get("mentions", [])) <= 10) else {"topics": [], "scores": []}
        final_videos.append({
            "clean_title": v.get("clean_title"),
            "clean_description": v.get("clean_description"),
            "view_count": v.get("view_count", 0),
            "linked_entities": el.get("linked_entities", []),
            "topics": topic_info.get("topics", []),
            "scores": topic_info.get("scores", [])
        })

    # Step 4: Embedding + weighting
    video_embeddings = []
    for v in final_videos:
        emb = video_to_weighted_embedding(v, global_max_views=max_views)
        if emb is not None:
            video_embeddings.append(emb)

    if not video_embeddings:
        embedder = _models["embedder"]
        zero_vec = np.zeros(embedder.get_sentence_embedding_dimension(), dtype=float)
        return EmbeddingOut(
            embedding=zero_vec.tolist(),
            dim=int(zero_vec.shape[0]),
            videos_processed=0,
            channel_title=processed["channel"]["title"]
        )

    # Aggregate to channel level (mean of weighted video embeddings)
    channel_vector = np.mean(np.stack(video_embeddings, axis=0), axis=0)
    channel_vector = channel_vector.astype(float)

    return EmbeddingOut(
        embedding=channel_vector.tolist(),
        dim=int(channel_vector.shape[0]),
        videos_processed=len(video_embeddings),
        channel_title=processed["channel"]["title"]
    )
