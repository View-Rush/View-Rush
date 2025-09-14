# import torch
# import torch.nn as nn
# from sentence_transformers import SentenceTransformer
# import numpy as np

# # -------------------------
# # 1️⃣ Initialize models
# # -------------------------
# text_model = SentenceTransformer('all-mpnet-base-v2')  # or any multilingual embedding model

# device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# # Example: small feed-forward NN for numeric features
# class NumericTower(nn.Module):
#     def __init__(self, input_dim, hidden_dim, output_dim):
#         super().__init__()
#         self.net = nn.Sequential(
#             nn.Linear(input_dim, hidden_dim),
#             nn.ReLU(),
#             nn.Linear(hidden_dim, output_dim)
#         )
#     def forward(self, x):
#         return self.net(x)

# numeric_tower = NumericTower(input_dim=2, hidden_dim=16, output_dim=16).to(device)  # subscriber_count + total_videos

# # Example: Attention over historical videos
# class VideoAttentionTower(nn.Module):
#     def __init__(self, embed_dim, hidden_dim):
#         super().__init__()
#         self.attn = nn.MultiheadAttention(embed_dim, num_heads=2, batch_first=True)
#         self.fc = nn.Linear(embed_dim, hidden_dim)
#     def forward(self, video_embeds):
#         # video_embeds: [batch, seq_len, embed_dim]
#         attn_output, attn_weights = self.attn(video_embeds, video_embeds, video_embeds)
#         pooled = attn_output.mean(dim=1)  # simple mean pooling
#         return self.fc(pooled), attn_weights

# video_attention_tower = VideoAttentionTower(embed_dim=768, hidden_dim=16).to(device)  # embed_dim of sentence-transformers

# # -------------------------
# # 2️⃣ Process API response
# # -------------------------
# def process_channel_api_response(api_response):
#     # Numeric features
#     subscriber_count = api_response.get("subscriber_count", 0)
#     total_videos = api_response.get("total_videos", 0)
#     numeric_features = torch.tensor([subscriber_count, total_videos], dtype=torch.float32).unsqueeze(0).to(device)
    
#     # Pass through numeric tower
#     numeric_embedding = numeric_tower(numeric_features)  # shape [1,16]
    
#     # Historical video embeddings (titles + descriptions)
#     recent_videos = api_response.get("recent_videos", [])[:10]  # max 10
#     video_texts = [v['title'] + " " + v['description'] for v in recent_videos]
    
#     if len(video_texts) == 0:
#         # If no recent videos, use zeros
#         video_embeddings = torch.zeros((1,1,768)).to(device)
#     else:
#         # Compute text embeddings
#         embeds = text_model.encode(video_texts, convert_to_tensor=True).to(device)  # [seq_len, embed_dim]
#         video_embeddings = embeds.unsqueeze(0)  # add batch dim: [1, seq_len, embed_dim]
    
#     # Pass through attention tower
#     video_history_embedding, attn_weights = video_attention_tower(video_embeddings)  # [1, hidden_dim]
    
#     # -------------------------
#     # 3️⃣ Fuse numeric + video history embeddings
#     # -------------------------
#     user_profile_vector = torch.cat([numeric_embedding, video_history_embedding], dim=1)  # [1, 32]
    
#     return user_profile_vector, attn_weights

# # # -------------------------
# # # 4️⃣ Example usage
# # # -------------------------
# api_response = {
#   "channel_title": "Google for Developers",
#   "subscriber_count": 2540000,
#   "total_videos": 6758,
#   "recent_videos": [
#     {
#       "title": "Learn to Build with Gemini Nano-Banana (Gemini 2.5 Flash Image)",
#       "description": "Learn how to build with Nano Banana in this complete developer tutorial. This video provides a comprehensive walkthrough for developers looking to integrate Nano Banana aka Gemini 2.5 Flash Image into their applications.\n\nResources:\nBlog post →https://goo.gle/4pozDUu \nUse Nano Banana in AI Studio → https://goo.gle/4gdLiRK \nJavaScript examples →https://goo.gle/4p5yhhj \nNano Banana Hackathon → https://goo.gle/45XWbCk \n\nTimeline:\n00:00 - Introduction\n00:32 - AI Studio\n01:25 - Project Setup\n03:16 - Image creation\n05:47 - Image editing\n06:58 - Multiple input images\n07:35 - Photo restoration\n08:12 - Conversational image editing\n09:32 - Best practices and effective prompting\n\nSubscribe to Google for Developers → https://goo.gle/developers \n\nSpeaker: Patrick Lober\nProducts Mentioned: Google AI, Gemma, Gemini",
#       "thumbnail_url": "https://i.ytimg.com/vi/UTdfxFyOQTI/default.jpg"
#     },
#     {
#       "title": "Just in from the news desk 📰: Gemma 3 270M",
#       "description": "After the release of Gemma 3 and Gemma 3n, we released Gemma 3 270M - a compact model that’s built for efficiency. See how this compact model is designed for both task-specific fine-tuning and strong instruction-following when building intelligent applications. \n\nResources:\nIntroducing Gemma 3 270M: The compact model for hyper-efficient AI → https://goo.gle/3V1tC1V \n\nWatch more Google Developer News → https://goo.gle/4e8Rysd   \nSubscribe to Google for Developers → https://goo.gle/developers \n\n#GoogleDeveloperNews\n\n\nSpeaker: Christina Warren\nProducts Mentioned:  Gemma",
#       "thumbnail_url": "https://i.ytimg.com/vi/BZYPZlSIAk4/default.jpg"
#     },
#     {
#       "title": "The \"Last Mile\" of Context Window Management in AI Code assistance",
#       "description": "Having the best model, tool, and indexed knowledge of your codebase will only get the \"package\" of AI assisted code within city limits. The task of delivering exactly the right context for the current task is in your hands. With the tips in this video, you'll have concrete examples and practices to manage the context window of your tools effectively to get the most out of your code assistance.\n\nSubscribe to Google for Developers → https://goo.gle/developers \n\nProducts Mentioned: Google AI",
#       "thumbnail_url": "https://i.ytimg.com/vi/3UcZSaCXEKc/default.jpg"
#     },
#     {
#       "title": "Introducing EmbeddingGemma: The Best-in-Class Open Model for On-Device Embeddings",
#       "description": "Discover EmbeddingGemma, a state-of-the-art 308 million parameter text embedding model designed to power generative AI experiences directly on your hardware. Ideal for mobile-first Al, EmbeddingGemma brings powerful capabilities to your applications, enabling features like semantic search, information retrieval, and custom classification – all while running efficiently on-device.\n\nIn this video, Alice Lisak and Lucas Gonzalez from the Gemma team introduce EmbeddingGemma and explain how it works. Learn how you can run this model on less than 200MB of RAM with quantization, customize its output dimensions with Matryoshka Representation Learning (MRL), and \nbuild powerful offline Al features.\n\nResources: \nLearn about EmbeddingGemma → https://developers.googleblog.com/en/introducing-embeddinggemma \nEmbeddingGemma documentation → https://ai.google.dev/gemma/docs/embeddinggemma\nGemma Cookbook → https://github.com/google-gemini/gemma-cookbook\nQuickstart RAG notebook → https://github.com/google-gemini/gemma-cookbook/blob/main/Gemma/%5BGemma_3%5DRAG_with_EmbeddingGemma.ipynb \nDiscover Gemma models → https://deepmind.google/models/gemma\n\n\nChapters\n0:00 - Intro\n0:26 - Model overview\n1:18 - Model features\n2:29 - RAG\n2:54 - Website embedding demo\n3:23 - Tools and platforms\n3:41 - Conclusion\n\n\nSubscribe to Google for Developers → https://goo.gle/developers\n\nSpeaker:Alice Lisak Lucas Gonzalez \nProducts Mentioned: Google AI, Gemma,Generative AI",
#       "thumbnail_url": "https://i.ytimg.com/vi/Xu1X-J-r5Xk/default.jpg"
#     },
#     {
#       "title": "#GoogleIOConnect China  was a success!",
#       "description": "Huge thanks to the incredible dev community in Shanghai for making #GoogleIOConnect China a success! Your ideas and feedback are helping us build the next generation of tools for developers.\n\nSubscribe to Google for Developers → https://goo.gle/developers",
#       "thumbnail_url": "https://i.ytimg.com/vi/XebqcEaM5XY/default.jpg"
#     },
#     {
#       "title": "SMURF? Get the most out of your tests.",
#       "description": "As test suites grow, balancing speed, maintainability, utilization, reliability, and fidelity becomes a challenge. Watch this video to learn the SMURF framework and navigate these tradeoffs to keep tests efficient and reliable. \n\nSubscribe to Google for Developers → https://goo.gle/developers \n\nSpeaker: Juan Vasquez",
#       "thumbnail_url": "https://i.ytimg.com/vi/MayitpBSogg/default.jpg"
#     },
#     {
#       "title": "How to prototype apps faster",
#       "description": "Getting a good, working prototype with a decent UI can be tedious. How can you speed up this process without compromising the product? See how Google Stitch can help you. \n\nSubscribe to Google for Developers → https://goo.gle/developers \n\nSpeaker: Itzak Hinojosa\nProducts Mentioned: Google Stitch",
#       "thumbnail_url": "https://i.ytimg.com/vi/V7KlKIk9Uxw/default.jpg"
#     },
#     {
#       "title": "See what’s possible with Gemini and Gemma.",
#       "description": "From AI shopping assistants to multi-language job training and animated webcomics, these 8 Indian startups are showing what’s possible with Gemini and Gemma. 🎯\n\nSubscribe to Google for Developers → https://goo.gle/developers \n\nProducts Mentioned: Gemma, Gemini;",
#       "thumbnail_url": "https://i.ytimg.com/vi/on53GnHbGw8/default.jpg"
#     },
#     {
#       "title": "Teamwork decoded ✅🚩",
#       "description": "Only knows one language? Messy desk? Loves refactoring? Share your take. \n\nSubscribe to Google for Developers → https://goo.gle/developers",
#       "thumbnail_url": "https://i.ytimg.com/vi/JLmswjJSA3w/default.jpg"
#     },
#     {
#       "title": "Power up your LLMs: Gemini CLI and Model Context Protocol (MCP)",
#       "description": "Level up your LLM game with Model Context Protocol (MCP)! Learn how MCP allows your Large Language Models to interact with traditional computer programs, expanding their functionality. This tutorial shows you how to build an MCP server, connect it to Gemini CLI, and use it to retrieve additional information, take actions on your behalf, or even generate videos.\n\nChapters:\n0:00 - What is Model Context Protocol (MCP)?\n0:55 - Building an MCP Server\n2:18 - Connecting Gemini CLI to your MCP Server\n3:21 - Connecting Gemini CLI to Linear using OAuth\n6:55 - Veo 3 MCP Server\n\nSubscribe to Google for Developers → https://goo.gle/developers\n\nGitHub repository for video creation: https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia\n\nSpeaker: Luke Schlangen \nProducts Mentioned: Google AI, Gemini,  Generative AI",
#       "thumbnail_url": "https://i.ytimg.com/vi/IYpt25GHB1U/default.jpg"
#     }
#   ]
# }
# # Assuming all the code from previous cell is already defined
# user_vector, attn_weights = process_channel_api_response(api_response)

# print("User profile vector shape:", user_vector.shape)
# print("Attention weights shape:", attn_weights.shape)


