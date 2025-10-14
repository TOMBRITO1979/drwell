from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.post("/")
async def create_law_firm(db: Session = Depends(get_db)):
    """
    Cadastrar novo escritório de advocacia (usuário Master)
    """
    return {"message": "Create law firm endpoint - To be implemented"}


@router.get("/")
async def list_law_firms(db: Session = Depends(get_db)):
    """
    Listar escritórios
    """
    return {"law_firms": []}


@router.get("/{firm_id}")
async def get_law_firm(firm_id: int, db: Session = Depends(get_db)):
    """
    Obter detalhes do escritório
    """
    return {"firm_id": firm_id, "message": "To be implemented"}


@router.put("/{firm_id}")
async def update_law_firm(firm_id: int, db: Session = Depends(get_db)):
    """
    Atualizar escritório
    """
    return {"firm_id": firm_id, "message": "To be implemented"}
