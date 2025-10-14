from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.post("/")
async def create_lawyer(db: Session = Depends(get_db)):
    """
    Cadastrar advogado funcionário
    """
    return {"message": "Create lawyer endpoint - To be implemented"}


@router.get("/")
async def list_lawyers(db: Session = Depends(get_db)):
    """
    Listar advogados
    """
    return {"lawyers": []}


@router.get("/{lawyer_id}")
async def get_lawyer(lawyer_id: int, db: Session = Depends(get_db)):
    """
    Obter detalhes do advogado
    """
    return {"lawyer_id": lawyer_id, "message": "To be implemented"}


@router.put("/{lawyer_id}")
async def update_lawyer(lawyer_id: int, db: Session = Depends(get_db)):
    """
    Atualizar advogado
    """
    return {"lawyer_id": lawyer_id, "message": "To be implemented"}


@router.delete("/{lawyer_id}")
async def delete_lawyer(lawyer_id: int, db: Session = Depends(get_db)):
    """
    Deletar advogado
    """
    return {"lawyer_id": lawyer_id, "message": "To be implemented"}
