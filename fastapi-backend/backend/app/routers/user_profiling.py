from fastapi import APIRouter
from app.models.user import UserProfileRequest, UserProfileResponse, VideoInfo
from app.services.youtube_service import get_channel_details, get_channel_videos

router = APIRouter(prefix="/user-profiling", tags=["User Profiling Tower"])

@router.post("/", response_model=UserProfileResponse)
def get_user_profile(request: UserProfileRequest):
    # Fetch channel details and recent videos
    channel_data = get_channel_details(request.channel_id)
    videos_data = get_channel_videos(request.channel_id, max_results=10)

    channel_info = channel_data["items"][0]

    # Prepare recent video info
    recent_videos = []
    for v in videos_data["videos"]:   # <-- now using "videos" instead of "items"
        video_info = VideoInfo(
            title=v.get("title", ""),
            description=v.get("description", ""),
            thumbnail_url=v.get("thumbnail_url", ""),
            view_count=int(v.get("viewCount", 0))   # <-- include viewCount
        )
        recent_videos.append(video_info)

    # Build response
    response = UserProfileResponse(
        channel_title=channel_info["snippet"]["title"],
        subscriber_count=int(channel_info["statistics"].get("subscriberCount", 0)),
        total_videos=int(channel_info["statistics"].get("videoCount", 0)),
        recent_videos=recent_videos
    )

    return response
