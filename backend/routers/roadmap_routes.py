"""WayPoint — Roadmap Routes (list, generate, update node status)"""

from fastapi import APIRouter, Depends, Path
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import Roadmap, User, ProgressEvent, QuizAttempt
from auth import get_current_user_id
from services.groq_service import generate_roadmap, ROLE_LABELS, chat_with_node, adapt_roadmap

router = APIRouter(tags=["roadmap"])


class GenerateRequest(BaseModel):
    target_role: str
    profile: Optional[dict] = None


class UpdateNodeRequest(BaseModel):
    status: str  # "completed" | "in_progress" | "not_started"


class ChatRequest(BaseModel):
    query: str


class AdaptRequest(BaseModel):
    feedback: str


# ─── GET /api/roadmaps/list ───
# The most important endpoint — the entire app renders from this payload.
@router.get("/api/roadmaps/list")
def list_roadmaps(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return all tracks for the user, keyed by role_id."""
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == user_id).all()

    data = {}
    for rm in roadmaps:
        data[rm.role_id] = {
            "id": rm.role_id,
            "label": rm.label,
            "status": rm.status,
            "nodeMap": rm.node_map,
            "skillData": rm.skill_data,
            "reasoning": rm.reasoning or {},
        }

    return {"success": True, "data": data}


# ─── POST /api/roadmap/generate ───
# THE AI CORE — generates a personalized roadmap with Groq LLM.
@router.post("/api/roadmap/generate")
def generate_roadmap_endpoint(
    req: GenerateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Generate a new roadmap for a target role using Groq LLM.
    If an active roadmap exists for this role, return it instead."""
    role_id = req.target_role

    # Check if an active roadmap already exists for this role
    existing = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == role_id, Roadmap.status == "active")
        .first()
    )
    if existing:
        track = {
            "id": existing.role_id,
            "label": existing.label,
            "status": existing.status,
            "nodeMap": existing.node_map,
            "skillData": existing.skill_data,
            "reasoning": existing.reasoning or {},
        }
        return {"success": True, "roadmap": track}

    # Get user profile for personalization
    user = db.query(User).filter(User.id == user_id).first()
    profile = req.profile or {}
    if user:
        profile.update({
            "skillLevel": user.skill_level or "beginner",
            "weeklyTimeHours": user.weekly_time_hours or 6,
            "learningStyle": user.learning_style or "balanced",
            "pastExperience": user.past_experience or "",
        })

    # Get latest quiz score for this role
    quiz_score = None
    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id, QuizAttempt.role_id == role_id)
        .order_by(QuizAttempt.created_at.desc())
        .first()
    )
    if attempt:
        quiz_score = attempt.readiness_score

    # Generate with Groq
    track = generate_roadmap(role_id, user_profile=profile, quiz_score=quiz_score)

    # Save to DB
    roadmap = Roadmap(
        user_id=user_id,
        role_id=role_id,
        label=track.get("label", ROLE_LABELS.get(role_id, role_id)),
        status="active",
        node_map=track.get("nodeMap", {}),
        skill_data=track.get("skillData", []),
        reasoning=track.get("reasoning", {}),
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    return {"success": True, "roadmap": track}


# ─── PATCH /api/roadmap/{trackId}/nodes/{nodeId} ───
@router.patch("/api/roadmap/{track_id}/nodes/{node_id}")
def update_node_status(
    track_id: str = Path(...),
    node_id: str = Path(...),
    req: UpdateNodeRequest = ...,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update a node's status and log the progress event."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        return {"success": False, "error": {"message": "Roadmap not found"}}

    # Update node status in the JSONB
    node_map = dict(roadmap.node_map)
    skill_data = list(roadmap.skill_data) if roadmap.skill_data else []

    if node_id in node_map:
        old_status = node_map[node_id].get("status")
        node_map[node_id] = {**node_map[node_id], "status": req.status}
        roadmap.node_map = node_map

        # If transitioning to completed, simulate skill progress
        if req.status == "completed" and old_status != "completed":
            import copy
            
            # Count remaining uncompleted nodes to distribute the gap evenly
            remaining = sum(1 for n in node_map.values() if n.get("status") != "completed")
            
            new_skill_data = copy.deepcopy(skill_data)
            for skill in new_skill_data:
                current = skill.get("current", 0)
                target = skill.get("target", 100)
                if current < target:
                    if remaining == 0:
                        # Last node completed -> force skills to target to eliminate gaps
                        skill["current"] = target
                    else:
                        gap = target - current
                        # Distribute remaining gap evenly across this node + remaining nodes
                        increment = max(2, int(gap / (remaining + 1)))
                        skill["current"] = min(target, current + increment)
            
            # Reassigning to a fresh reference triggers SQLAlchemy's JSON mutation tracking
            roadmap.skill_data = new_skill_data
            
            # Import flag_modified locally and apply it to be safe
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(roadmap, "skill_data")

        # Check if all nodes are completed → mark track as completed
        all_completed = all(n.get("status") == "completed" for n in node_map.values())
        if all_completed:
            roadmap.status = "completed"

        # Flag node_map as modified so SQLAlchemy saves the JSON update
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(roadmap, "node_map")

        db.commit()

    # Log progress event (for heatmap)
    event = ProgressEvent(
        user_id=user_id,
        roadmap_id=roadmap.id,
        node_key=node_id,
        new_status=req.status,
    )
    db.add(event)
    db.commit()

    return {"success": True, "skillData": roadmap.skill_data}


# ─── POST /api/roadmap/{track_id}/nodes/{node_id}/chat ───
@router.post("/api/roadmap/{track_id}/nodes/{node_id}/chat")
def chat_with_node_endpoint(
    track_id: str = Path(...),
    node_id: str = Path(...),
    req: ChatRequest = ...,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Answer user questions contextualized to the specific roadmap node."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        return {"success": False, "error": {"message": "Roadmap not found"}}

    node_map = roadmap.node_map or {}
    reasoning_map = roadmap.reasoning or {}

    node = node_map.get(node_id)
    if not node:
        return {"success": False, "error": {"message": "Node not found"}}

    reasoning = reasoning_map.get(node_id, {})
    
    answer = chat_with_node(req.query, node, reasoning, roadmap.label)
    
    return {"success": True, "answer": answer}


# ─── POST /api/roadmap/{track_id}/nodes/{node_id}/adapt ───
@router.post("/api/roadmap/{track_id}/nodes/{node_id}/adapt")
def adapt_roadmap_endpoint(
    track_id: str = Path(...),
    node_id: str = Path(...),
    req: AdaptRequest = ...,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Adapt the roadmap based on user feedback."""
    import time
    start_time = time.time()
    print(f"[API] [ADAPT] Request received for track: {track_id}, node: {node_id}, feedback: {req.feedback} at {start_time}")

    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        print(f"[API] [ADAPT] Roadmap not found for track: {track_id}, user: {user_id}")
        return {"success": False, "error": {"message": "Roadmap not found"}}

    # Build the full track dict
    track_dict = {
        "id": roadmap.role_id,
        "label": roadmap.label,
        "status": roadmap.status,
        "nodeMap": roadmap.node_map,
        "skillData": roadmap.skill_data,
        "reasoning": roadmap.reasoning or {},
    }

    adapted_track = adapt_roadmap(track_dict, node_id, req.feedback)

    # Save adapted roadmap to DB
    roadmap.node_map = adapted_track.get("nodeMap", roadmap.node_map)
    roadmap.skill_data = adapted_track.get("skillData", roadmap.skill_data)
    roadmap.reasoning = adapted_track.get("reasoning", roadmap.reasoning)
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(roadmap, "node_map")
    flag_modified(roadmap, "skill_data")
    flag_modified(roadmap, "reasoning")
    
    db.commit()

    # Return a fully validated, complete track dictionary
    updated_track = {
        "id": roadmap.role_id,
        "label": roadmap.label,
        "status": roadmap.status,
        "nodeMap": roadmap.node_map,
        "skillData": roadmap.skill_data,
        "reasoning": roadmap.reasoning,
    }

    duration = time.time() - start_time
    print(f"[API] [ADAPT] Request completed for track: {track_id}, node: {node_id} in {duration:.2f}s")
    return {"success": True, "roadmap": updated_track}

# ─── DELETE /api/roadmap/{track_id} ───
@router.delete("/api/roadmap/{track_id}")
def delete_roadmap_endpoint(
    track_id: str = Path(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete a roadmap and its associated progress."""
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id, Roadmap.role_id == track_id)
        .first()
    )

    if not roadmap:
        return {"success": False, "error": {"message": "Roadmap not found"}}

    db.delete(roadmap)
    db.commit()

    return {"success": True, "message": "Roadmap deleted successfully"}
