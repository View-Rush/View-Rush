from fastapi import FastAPI
from app.routers import user_profiling, test_youtube, heatmap,heatmap_cross_attention,heatmap_cross_attention_at_2
from app.routers import profile_embedding,video_embedding
from app.routers import combined_channel_video_heatmap,combined_channel_emb_video
from app.routers import predictions
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="YouTube Optimal Time Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict this to ["http://localhost:3000"] for React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(test_youtube.router)
app.include_router(user_profiling.router)
app.include_router(profile_embedding.router)
app.include_router(heatmap.router)
app.include_router(heatmap_cross_attention.router)
app.include_router(heatmap_cross_attention_at_2.router)
app.include_router(video_embedding.router)
app.include_router(combined_channel_video_heatmap.router)
app.include_router(combined_channel_emb_video.router)
app.include_router(predictions.router)