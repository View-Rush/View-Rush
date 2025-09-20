import io
import torch
import torch.nn as nn
import torch.nn.functional as F
import matplotlib.pyplot as plt
import numpy as np
from app.models.embedding_models import EmbeddingRequest, HeatmapResponse

from fastapi.responses import JSONResponse
from fastapi import APIRouter, HTTPException

# -------------------------
# Model definition
# -------------------------
class EarlyFusionModel(nn.Module):
    def __init__(self, metadata_dim: int, content_dim: int, user_dim: int,
                 hidden_dim: int = 384, num_slots: int = 168):
        super(EarlyFusionModel, self).__init__()
        fusion_dim = metadata_dim + content_dim + user_dim
        self.fc1 = nn.Linear(fusion_dim, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim // 2)
        self.bn2 = nn.BatchNorm1d(hidden_dim // 2)
        self.out = nn.Linear(hidden_dim // 2, num_slots)

    def forward(self, metadata_emb, content_emb, user_emb):
        x = torch.cat([metadata_emb, content_emb, user_emb], dim=-1)
        x = F.relu(self.bn1(self.fc1(x)))
        x = F.relu(self.bn2(self.fc2(x)))
        logits = self.out(x)
        heatmap = F.softmax(logits, dim=-1)
        return heatmap

# -------------------------
# FastAPI setup
# -------------------------
# app = FastAPI(title="Fusion Model API", description="Predicts heatmap from embeddings")
router = APIRouter(prefix="/fusion-model", tags=["Fusion Model"])

# Example dims (adjust based on your real embeddings)
metadata_dim = 384
content_dim = 384
user_dim = 384
model = EarlyFusionModel(metadata_dim, content_dim, user_dim)
model.eval()

# -------------------------
# Request schema
# -------------------------

# -------------------------
# Endpoint
# -------------------------
@router.post("/predict-heatmap", response_model=HeatmapResponse)
def predict_heatmap(payload: EmbeddingRequest):
    try:
        # Convert to torch tensors
        metadata_emb = torch.tensor([payload.metadata_embedding], dtype=torch.float32)
        content_emb = torch.tensor([payload.content_embedding], dtype=torch.float32)
        user_emb = torch.tensor([payload.user_embedding], dtype=torch.float32)

        # Run model
        with torch.no_grad():
            heatmap = model(metadata_emb, content_emb, user_emb).cpu().numpy()[0]

        # Build JSON response: {slotId: value}
        slot_values = {f"slot_{i}": float(val) for i, val in enumerate(heatmap)}

        return JSONResponse(content={"heatmap": slot_values})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))