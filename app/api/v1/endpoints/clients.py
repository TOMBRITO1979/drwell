from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.post("/")
async def create_client(db: Session = Depends(get_db)):
    """
    Cadastrar novo cliente
    """
    return {"message": "Create client endpoint - To be implemented"}


@router.get("/")
async def list_clients(db: Session = Depends(get_db)):
    """
    Listar clientes
    """
    return {"clients": []}


@router.get("/{client_id}")
async def get_client(client_id: int, db: Session = Depends(get_db)):
    """
    Obter detalhes do cliente
    """
    return {"client_id": client_id, "message": "To be implemented"}


@router.put("/{client_id}")
async def update_client(client_id: int, db: Session = Depends(get_db)):
    """
    Atualizar cliente
    """
    return {"client_id": client_id, "message": "To be implemented"}


@router.delete("/{client_id}")
async def delete_client(client_id: int, db: Session = Depends(get_db)):
    """
    Deletar cliente
    """
    return {"client_id": client_id, "message": "To be implemented"}
