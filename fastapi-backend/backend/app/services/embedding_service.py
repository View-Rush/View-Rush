import os
import re
import numpy as np
import logging
from threading import Lock
import transformers
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from typing import Optional, Dict, Any


# Lazy-loaded global model holders
_models = {
    "embedder": None
}
_models_lock = Lock()

# -------------------------
# Helper utilities
# -------------------------

def _lazy_load_models():
    """
    Load heavy models once (thread-safe).
    """
    with _models_lock:
        if _models["embedder"] is None:
            _models["embedder"] = SentenceTransformer(
                "paraphrase-multilingual-MiniLM-L12-v2",
                
            )
            logging.info("SentenceTransformer embedder loaded.")
            
def clean_text(text: Optional[str]) -> str:
    if not text:
        return ""
    t = text.lower()
    t = re.sub(r"http\S+", "", t)
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def preprocess_youtube_response(api_response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Preprocess the API response to structured cleaned format.
    """
    channel_title = api_response.get("channel_title", "").strip()
    subscriber_count = api_response.get("subscriber_count", 0)
    total_videos = api_response.get("total_videos", 0)

    videos_in = api_response.get("recent_videos", [])
    processed_videos = []
    all_view_counts = []

    for v in videos_in:
        title = clean_text(v.get("title", ""))
        desc = clean_text(v.get("description", ""))
        view_count = int(v.get("view_count", 0) or 0)

        processed_videos.append({
            "clean_title": title,
            "clean_description": desc,
            "view_count": view_count
        })
        all_view_counts.append(view_count)

    avg_views_recent = float(np.mean(all_view_counts)) if all_view_counts else 0.0

    return {
        "channel": {
            "title": channel_title,
            "subscriber_count": subscriber_count,
            "total_videos": total_videos,
            "avg_views_recent": avg_views_recent
        },
        "videos": processed_videos
    }
    
def video_to_weighted_embedding(video_struct: Dict[str, Any], global_max_views: float) -> Optional[np.ndarray]:
    """
    For one video structure (with linked_entities, topics, view_count), create a weighted embedding vector.
    Returns None if nothing to embed.
    """
    embedder = _models["embedder"]
    texts_to_embed = []

    # Add topics
    text_first = video_struct.get("clean_title")+" "+video_struct.get("clean_description", "")
    texts_to_embed.extend(text_first)

    if not texts_to_embed:
        return None

    # get embeddings (sentence_transformers returns np array)
    entity_embeddings = embedder.encode(texts_to_embed, convert_to_numpy=True)

    # mean pooling over entities/topics
    if entity_embeddings.ndim == 1:
        mean_emb = entity_embeddings
    else:
        mean_emb = np.mean(entity_embeddings, axis=0)

    # compute normalized weight from view count (0..1). avoid divide-by-zero
    view_count = float(video_struct.get("view_count", 0) or 0)
    weight = view_count / max(1.0, global_max_views)
    weighted_emb = mean_emb * weight

    return weighted_emb
