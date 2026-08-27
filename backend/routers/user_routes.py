"""WayPoint — User Routes (profile, stats)"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from database import get_db
from models import User, Roadmap, ProgressEvent
from auth import get_current_user_id

router = APIRouter(tags=["user"])

@router.get("/api/user/profile")
def get_user_profile(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return the user profile, calculated XP, streak, and 90-day heatmap data."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"success": False, "error": {"message": "User not found"}}
    
    # 1. Calculate XP from completed nodes across all roadmaps
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == user_id).all()
    completed_nodes_count = 0
    for rm in roadmaps:
        for node_key, node_data in rm.node_map.items():
            if node_data.get("status") == "completed":
                completed_nodes_count += 1
    
    xp = completed_nodes_count * 150  # 150 XP per completed node

    # 2. Process ProgressEvents for Heatmap and Streak
    events = (
        db.query(ProgressEvent)
        .filter(ProgressEvent.user_id == user_id)
        .order_by(ProgressEvent.created_at.desc())
        .all()
    )

    # Group events by date (YYYY-MM-DD)
    activity_by_date = {}
    for event in events:
        date_str = event.created_at.strftime("%Y-%m-%d")
        activity_by_date[date_str] = activity_by_date.get(date_str, 0) + 1

    # Generate 90 days heatmap data
    heatmap_data = []
    today = datetime.now(timezone.utc)
    for i in range(89, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        intensity = activity_by_date.get(date_str, 0)
        heatmap_data.append({
            "date": date_str,
            "active": intensity > 0,
            "intensity": min(4, intensity) if intensity > 0 else 0
        })

    # Calculate current streak
    streak = 0
    current_date = today
    while True:
        date_str = current_date.strftime("%Y-%m-%d")
        if activity_by_date.get(date_str, 0) > 0:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            # Check if today is just 0 but yesterday was active
            if streak == 0 and date_str == today.strftime("%Y-%m-%d"):
                current_date -= timedelta(days=1)
            else:
                break

    return {
        "success": True,
        "profile": {
            "id": user.id,
            "name": user.name or user.email.split('@')[0],
            "email": user.email,
            "targetRole": user.target_role,
            "skillLevel": user.skill_level,
            "weeklyTimeHours": user.weekly_time_hours,
            "learningStyle": user.learning_style,
            "pastExperience": user.past_experience,
            "isOnboarded": user.is_onboarded,
            "stats": {
                "xp": xp,
                "streak": streak
            },
            "heatmapData": heatmap_data
        }
    }
