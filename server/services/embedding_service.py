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
    """
    
    with _models_lock:
        if _models["ner"] is None:
            # NER
            _models["ner"] = pipeline("ner", model="tner/twitter-roberta-base-dec2021-tweetner7-all", aggregation_strategy="simple")
            logging.info("NER pipeline loaded.")

        if _models["classifier"] is None:
            # Zero-shot classifier
            _models["classifier"] = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
            logging.info("Zero-shot classifier loaded.")

        if _models["embedder"] is None:
            # Sentence embedder
            _models["embedder"] = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
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

# -------------------------
# Entity linking & topic scoring
# -------------------------
def extract_entities_and_link(processed_video: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run NER on the combined title+description, then attempt simple Wikipedia linking.
    Returns linked_entities list and discovered entity strings.
    """
    
    text = (processed_video.get("clean_title", "") + " " + processed_video.get("clean_description", "")).strip()
    ner = _models["ner"]
    ner_results = ner(text) if text else []
    # aggregated ner pipeline returns items like {"word": "google", "entity_group": "ORG", "score": 0.99}
    mentions = []
    for ent in ner_results:
        word = ent.get("word")
        if not word:
            continue
        # clean single-token artifacts
        word = word.strip()
        if len(word) <= 1:
            continue
        mentions.append({"mention": word, "score": float(ent.get("score", 1.0))})

    # simple wikipedia linking
    linked = []
    for m in mentions:
        try:
            wp = page(m["mention"], auto_suggest=True)
            linked.append({
                "mention": m["mention"],
                "entity": wp.title,
                "score": m["score"],
                "wikipedia_id": wp.pageid
            })
        except DisambiguationError as e:
            # pick first option as fallback
            option = e.options[0] if e.options else m["mention"]
            linked.append({
                "mention": m["mention"],
                "entity": option,
                "score": m["score"],
                "wikipedia_id": None
            })
        except PageError:
            # no page found, skip
            continue
        except Exception as exc:
            # safety: don't break pipeline for minor wikipedia failures
            logging.debug(f"Wikipedia linking error for {m['mention']}: {exc}")
            continue

    return {"mentions": mentions, "linked_entities": linked}

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
    """
    For one video structure (with linked_entities, topics, view_count), create a weighted embedding vector.
    Returns None if nothing to embed.
    """
    embedder = _models["embedder"]
    texts_to_embed = []

    # Add canonical linked entity titles
    for ent in video_struct.get("linked_entities", []):
        if ent.get("entity"):
            texts_to_embed.append(ent["entity"])

    # Add topics
    texts_to_embed.extend(video_struct.get("topics", []))

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
