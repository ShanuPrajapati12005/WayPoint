"""WayPoint — Auth Routes (signup + login)"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User
from core.auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(req: AuthRequest, db: Session = Depends(get_db)):
    print("Signup started")
    if len(req.password) < 6:
        raise HTTPException(400, detail="Password must be at least 6 characters")

    print("Checking existing user")
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        print("User exists")
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

    print("Hashing password")
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
    )
    print("Adding user to db")
    db.add(user)
    print("Committing db")
    db.commit()
    print("Refreshing db")
    db.refresh(user)
    print("Signup db done")

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


class GoogleAuthRequest(BaseModel):
    email: str
    name: str = ""

@router.post("/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register a user via Google OAuth and return our Custom JWT"""
    user = db.query(User).filter(User.email == req.email).first()

    if not user:
        # Create a new user if they don't exist
        user = User(
            email=req.email,
            password_hash="GOOGLE_SSO_USER",  # Dummy hash, cannot be logged into via standard login
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_token(user.id, user.email)

    return {
        "success": True,
        "user": {"id": user.id, "email": user.email, "name": req.name},
        "token": token,
    }
