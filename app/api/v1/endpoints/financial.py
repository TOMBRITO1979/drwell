from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.post("/")
async def create_financial_record(db: Session = Depends(get_db)):
    """
    Cadastrar registro financeiro
    """
    return {"message": "Create financial record endpoint - To be implemented"}


@router.get("/")
async def list_financial_records(db: Session = Depends(get_db)):
    """
    Listar registros financeiros
    """
    return {"records": []}


@router.get("/summary")
async def get_financial_summary(db: Session = Depends(get_db)):
    """
    Obter resumo financeiro
    """
    return {
        "total_receivable": 0,
        "total_received": 0,
        "total_pending": 0
    }


@router.get("/{record_id}")
async def get_financial_record(record_id: int, db: Session = Depends(get_db)):
    """
    Obter detalhes do registro financeiro
    """
    return {"record_id": record_id, "message": "To be implemented"}


@router.put("/{record_id}")
async def update_financial_record(record_id: int, db: Session = Depends(get_db)):
    """
    Atualizar registro financeiro
    """
    return {"record_id": record_id, "message": "To be implemented"}
