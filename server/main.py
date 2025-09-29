from fastapi import FastAPI
from routers import user_profiling, test_youtube, heatmap,heatmap_cross_attention
from routers import profile_embedding
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

@app.get("/")
def read_root():
    return {"message": "Welcome to the YouTube Optimal Time Backend!"}  

@app.get("/healthz")
def health_check():
    return {"status": "healthy"}
