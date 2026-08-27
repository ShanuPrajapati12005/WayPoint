"""WayPoint — Auth Routes (signup + login)"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(req: AuthRequest, db: Session = Depends(get_db)):
    if len(req.password) < 6:
        raise HTTPException(400, detail="Password must be at least 6 characters")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": {
                    "code": "duplicate_email",
                    "message": "An account with this email already exists",
                },
            },
        )

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.email)

    return {
        "success": True,
        "user": {"id": user.id, "email": user.email},
        "token": token,
    }


@router.post("/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": {
                    "code": "invalid_credentials",
                    "message": "Invalid email or password",
                },
            },
        )

    token = create_token(user.id, user.email)

    return {
        "success": True,
        "user": {"id": user.id, "email": user.email},
        "token": token,
    }
