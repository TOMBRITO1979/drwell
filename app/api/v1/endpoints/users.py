from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user information
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active
    }


@router.get("/")
async def list_users(db: Session = Depends(get_db)):
    """
    List all users
    """
    return {"users": []}


@router.get("/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get user by ID
    """
    return {"user_id": user_id, "message": "To be implemented"}


@router.put("/{user_id}")
async def update_user(user_id: int, db: Session = Depends(get_db)):
    """
    Update user
    """
    return {"user_id": user_id, "message": "To be implemented"}
