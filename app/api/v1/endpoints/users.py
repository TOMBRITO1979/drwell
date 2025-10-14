from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


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
