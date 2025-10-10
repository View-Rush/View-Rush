import re
import numpy as np
import logging
from threading import Lock
import transformers
import torch
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from typing import Optional, Dict, Any
# Lazy-loaded global model holders

_models = {
    "ner": None,
    "classifier": None,
    "embedder": None
}
_models_lock = Lock()

# Candidate labels (you can reuse your big list or a smaller curated list)
CANDIDATE_LABELS = [
    'animation', 'cartoon', '3D', 'short film', 'stop motion',
    'car', 'motorcycle', 'automobile', 'driving', 'vehicles',
    'song', 'instrument', 'concert', 'album', 'lyrics',
    'dog', 'cat', 'wildlife', 'pet care', 'animals',
    'soccer', 'basketball', 'tennis', 'athlete', 'game',
    'short film', 'drama', 'cinema', 'indie', 'story',
    'travel', 'vacation', 'tour', 'event', 'adventure',
    'video game', 'gameplay', 'stream', 'gamer', 'console',
    'vlog', 'daily life', 'personal', 'experience', 'journey', 'life',
    'story', 'opinion', 'diary', 'blog', 'funny', 'skit', 'humor', 'jokes', 'prank',
    'movie', 'show', 'celebrity', 'tv', 'music video',
    'news', 'politics', 'report', 'journalism', 'current events',
    'tutorial', 'DIY', 'fashion', 'style', 'guide',
    'learning', 'lecture', 'tutorial', 'lesson', 'study',
    'science', 'tech', 'innovation', 'research', 'gadgets',
    'charity', 'cause', 'awareness', 'volunteer', 'campaign',
    'film', 'cinema', 'actor', 'director', 'screenplay',
    'anime', 'manga', 'animation', 'cartoon', 'series',
    'action', 'adventure', 'hero', 'battle', 'quest',
    'classic', 'vintage', 'old movie', 'legendary', 'historic',
    'documentary', 'real life', 'storytelling', 'facts', 'exploration',
    'drama', 'emotional', 'story', 'conflict', 'characters',
    'family', 'kids', 'parenting', 'home', 'children',
    'foreign', 'international', 'language', 'culture',
    'film', 'horror', 'scary', 'thriller', 'monster', 'fear',
    'science fiction', 'fantasy', 'space', 'magic', 'future',
    'thriller', 'suspense', 'mystery', 'crime', 'detective',
    'short', 'clip', 'quick', 'mini', 'snippet', 'show', 'episode',
    'series', 'tv', 'performance', 'trailer', 'preview', 'teaser',
    'clip', 'announcement']

# -------------------------
# Helper utilities
# -------------------------

def _lazy_load_models():
    """
    Load heavy models once (thread-safe).
    Uses GPU if available, otherwise CPU.
    """
    device = 0 if torch.cuda.is_available() else -1  # HF pipeline expects int
    embedder_device = "cuda" if torch.cuda.is_available() else "cpu"

    with _models_lock:
        if _models["ner"] is None:
            _models["ner"] = pipeline(
                "ner",
                model="tner/twitter-roberta-base-dec2021-tweetner7-all",
                aggregation_strategy="simple",
                device=device
            )
            logging.info(f"NER pipeline loaded on {'GPU' if device == 0 else 'CPU'}.")

        if _models["classifier"] is None:
            _models["classifier"] = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=device
            )
            logging.info(f"Zero-shot classifier loaded on {'GPU' if device == 0 else 'CPU'}.")

        if _models["embedder"] is None:
            _models["embedder"] = SentenceTransformer(
                "paraphrase-multilingual-MiniLM-L12-v2",
                device=embedder_device
            )
            logging.info(f"SentenceTransformer embedder loaded on {embedder_device.upper()}.")

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
def extract_entities_and_link(processed_video: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run NER on the combined title + description.
    Returns a list of extracted entity mentions (without Wikipedia linking).
    """
    text = (processed_video.get("clean_title", "") + " " + processed_video.get("clean_description", "")).strip()
    ner = _models["ner"]

    ner_results = ner(text) if text else []
    mentions = []

    for ent in ner_results:
        word = ent.get("word")
        if not word:
            continue
        word = word.strip()
        if len(word) <= 1:
            continue

        mentions.append({
            "mention": word,
            "score": float(ent.get("score", 1.0))
        })

    # Return only extracted mentions
    return {"mentions": mentions, "linked_entities": mentions}

def score_topics(processed_video: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run zero-shot classification on the video text (title+desc) to get top topics and scores.
    """
    text = (processed_video.get("clean_title", "") + " " + processed_video.get("clean_description", "")).strip()
    if not text:
        return {"topics": [], "scores": []}
    classifier = _models["classifier"]
    res = classifier(text, CANDIDATE_LABELS, multi_label=True)
    # res contains 'labels' and 'scores'
    top_k = min(5, len(res.get("labels", [])))
    labels = res.get("labels", [])[:top_k]
    scores = [float(s) for s in res.get("scores", [])[:top_k]]
    return {"topics": labels, "scores": scores}


def video_to_weighted_embedding(video_struct: Dict[str, Any], global_max_views: float) -> Optional[np.ndarray]:

    embedder = _models["embedder"]
    title = video_struct.get("clean_title", "")
    desc = video_struct.get("clean_description", "")
    entities = [e["entity"] for e in video_struct.get("linked_entities", []) if e.get("entity")]
    topics = video_struct.get("topics", [])

    texts = []
    weights = []

    if title or desc:
        texts.append(f"{title} {desc}")
        weights.append(0.6)
    if entities:
        texts.append(" ".join(entities))
        weights.append(0.25)
    if topics:
        texts.append(" ".join(topics))
        weights.append(0.15)

    if not texts:
        return None

    embs = embedder.encode(texts, convert_to_numpy=True)
    embs = np.average(embs, axis=0, weights=weights)

    view_count = float(video_struct.get("view_count", 0) or 0)
    weight = view_count / max(1.0, global_max_views)
    return embs * weight

