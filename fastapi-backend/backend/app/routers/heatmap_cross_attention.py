
# import torch
# import torch.nn as nn
# import torch.nn.functional as F
# from fastapi import APIRouter, HTTPException
# from fastapi.responses import JSONResponse
# from app.models.embedding_models import EmbeddingRequest

# # ---------------------------
# # Cross-Attention Block
# # ---------------------------
# class CrossAttentionBlock(nn.Module):
#     def __init__(self, embed_dim, num_heads=4, dropout=0.1):
#         super(CrossAttentionBlock, self).__init__()
#         self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=True)
#         self.norm = nn.LayerNorm(embed_dim)
#         self.ff = nn.Sequential(
#             nn.Linear(embed_dim, embed_dim),
#             nn.ReLU(),
#             nn.Dropout(dropout),
#             nn.Linear(embed_dim, embed_dim)
#         )
#         self.ff_norm = nn.LayerNorm(embed_dim)

#     def forward(self, query, key_value):
#         attn_output, _ = self.attn(query, key_value, key_value)
#         out = self.norm(query + attn_output)
#         out_ff = self.ff_norm(out + self.ff(out))
#         return out_ff

# # ---------------------------
# # Adaptive Modality Selector
# # ---------------------------
# class AdaptiveSelector(nn.Module):
#     def __init__(self, embed_dim, num_modalities=3):
#         super(AdaptiveSelector, self).__init__()
#         self.fc = nn.Linear(embed_dim * num_modalities, num_modalities)

#     def forward(self, embeddings):
#         combined = torch.cat(embeddings, dim=-1)
#         weights = F.softmax(self.fc(combined), dim=-1)
#         return weights

# # ---------------------------
# # Fusion Model
# # ---------------------------
# class FusionModel(nn.Module):
#     def __init__(self, embed_dim, num_heads=4, num_slots=24):
#         super(FusionModel, self).__init__()
#         self.user_content_attn = CrossAttentionBlock(embed_dim, num_heads)
#         self.user_context_attn = CrossAttentionBlock(embed_dim, num_heads)
#         self.content_context_attn = CrossAttentionBlock(embed_dim, num_heads)
#         self.selector = AdaptiveSelector(embed_dim, num_modalities=3)
#         self.fc_out = nn.Sequential(
#             nn.Linear(embed_dim, embed_dim),
#             nn.ReLU(),
#             nn.Linear(embed_dim, num_slots)
#         )

#     def forward(self, user_emb, content_emb, context_emb):
#         user = user_emb.unsqueeze(1)
#         content = content_emb.unsqueeze(1)
#         context = context_emb.unsqueeze(1)

#         user_refined = self.user_content_attn(user, content) + self.user_context_attn(user, context)
#         content_refined = self.user_content_attn(content, user) + self.content_context_attn(content, context)
#         context_refined = self.user_context_attn(context, user) + self.content_context_attn(context, content)

#         user_refined = user_refined.squeeze(1)
#         content_refined = content_refined.squeeze(1)
#         context_refined = context_refined.squeeze(1)

#         weights = self.selector([user_refined, content_refined, context_refined])
#         fused_emb = (
#             weights[:, 0:1] * user_refined +
#             weights[:, 1:2] * content_refined +
#             weights[:, 2:3] * context_refined
#         )

#         slot_scores = self.fc_out(fused_emb)
#         heatmap = torch.sigmoid(slot_scores)
#         return heatmap

# # ---------------------------
# # FastAPI router
# # ---------------------------
# router = APIRouter(prefix="/cross-attention-fusion-model", tags=["Fusion Model"])

# # # Example embedding dimension
# # embed_dim = 384
# # num_slots = 168  # 7 days * 24 hours
# # model = FusionModel(embed_dim, num_heads=4, num_slots=num_slots)
# # model.eval()


# # Initialize model
# EMBED_DIM = 384
# NUM_HEADS = 4
# NUM_SLOTS = 168
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# model = FusionModel(embed_dim=EMBED_DIM, num_heads=NUM_HEADS, num_slots=NUM_SLOTS)
# model.load_state_dict(torch.load("fusion_model.pth", map_location=device))
# model.to(device)
# model.eval()



# @router.post("/predict-heatmap")
# def predict_heatmap(payload: EmbeddingRequest):
#     try:
#         # Convert embeddings to tensors
#         user_emb = torch.tensor([payload.user_embedding], dtype=torch.float32)
#         content_emb = torch.tensor([payload.content_embedding], dtype=torch.float32)
#         context_emb = torch.tensor([payload.metadata_embedding], dtype=torch.float32)  # using metadata as context

#         with torch.no_grad():
#             heatmap = model(user_emb, content_emb, context_emb).cpu().numpy()[0]

#         # Return JSON with slot-wise values
#         slot_values = {f"slot_{i}": float(val) for i, val in enumerate(heatmap)}
#         return JSONResponse(content={"heatmap": slot_values})

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
