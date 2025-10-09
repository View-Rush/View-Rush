
from app.models.embedding_models import BidirectionalModelInput

import torch
import torch.nn as nn
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.models.embedding_models import EmbeddingRequest

# -----------------------------------------------------
# Define CrossAttentionBlock and BiCrossAttentionFusionModel
# -----------------------------------------------------
class CrossAttentionBlock(nn.Module):
    def __init__(self, embed_dim, num_heads=4, dropout=0.1):
        super().__init__()
        self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=True)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.ff = nn.Sequential(
            nn.Linear(embed_dim, embed_dim * 4),
            nn.ReLU(),
            nn.Linear(embed_dim * 4, embed_dim),
        )
        self.norm2 = nn.LayerNorm(embed_dim)

    def forward(self, q, kv):
        attn_out, _ = self.attn(q, kv, kv)
        x = self.norm1(q + attn_out)
        ff_out = self.ff(x)
        return self.norm2(x + ff_out)


class BiCrossAttentionFusionModel(nn.Module):
    def __init__(self, video_dim, user_dim, hidden_dim=256, num_heads=4, num_slots=168):
        super().__init__()
        self.num_slots = num_slots
        self.video_proj = nn.Linear(video_dim, hidden_dim)
        self.user_proj = nn.Linear(user_dim, hidden_dim)
        self.video_to_user = CrossAttentionBlock(hidden_dim, num_heads)
        self.user_to_video = CrossAttentionBlock(hidden_dim, num_heads)
        self.fusion = nn.Linear(hidden_dim * 2, hidden_dim)
        self.head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, num_slots)
        )

    def forward(self, video_emb, user_emb):
        v = self.video_proj(video_emb).unsqueeze(1)
        u = self.user_proj(user_emb).unsqueeze(1)

        v2u = self.video_to_user(v, u)
        u2v = self.user_to_video(u, v)

        fused = torch.cat([v2u, u2v], dim=-1)
        fused = self.fusion(fused).squeeze(1)

        out = self.head(fused)  # [B, num_slots]
        return out


# -----------------------------------------------------
# Initialize model and device
# -----------------------------------------------------
router = APIRouter(prefix="/bicross-fusion", tags=["Fusion Model"])

VIDEO_DIM = 384
USER_DIM = 768
HIDDEN_DIM = 256
NUM_HEADS = 4
NUM_SLOTS = 168

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load trained model weights
model = BiCrossAttentionFusionModel(VIDEO_DIM, USER_DIM, HIDDEN_DIM, NUM_HEADS, NUM_SLOTS)
model.load_state_dict(torch.load("bidirectional_fusion_model.pth", map_location=device))
model.to(device)
model.eval()


# -----------------------------------------------------
# FastAPI endpoint for prediction
# -----------------------------------------------------
@router.post("/predict-slot-heatmap")
def predict_slot_heatmap(payload: BidirectionalModelInput):
    """
    Accepts user + video embeddings and returns slot-wise prediction heatmap (0-1 normalized scores)
    """
    try:
        # Convert embeddings to torch tensors
        user_emb = torch.tensor([payload.user_embedding], dtype=torch.float32).to(device)
        video_emb = torch.tensor([payload.video_embedding], dtype=torch.float32).to(device)

        # Validate dimensions
        if user_emb.shape[1] != USER_DIM:
            raise HTTPException(status_code=400, detail=f"Expected user_emb dim {USER_DIM}, got {user_emb.shape[1]}")
        if video_emb.shape[1] != VIDEO_DIM:
            raise HTTPException(status_code=400, detail=f"Expected video_emb dim {VIDEO_DIM}, got {video_emb.shape[1]}")

        # Run inference
        with torch.no_grad():
            slot_scores = model(video_emb, user_emb)
            heatmap = torch.sigmoid(slot_scores).cpu().numpy()[0]

        # Return slot-wise heatmap as JSON
        slot_values = {f"slot_{i}": float(val) for i, val in enumerate(heatmap)}
        return JSONResponse(content={"heatmap": slot_values})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
