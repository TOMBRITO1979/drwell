from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.post("/")
async def create_process(db: Session = Depends(get_db)):
    """
    Cadastrar novo processo judicial
    """
    return {"message": "Create process endpoint - To be implemented"}


@router.get("/")
async def list_processes(db: Session = Depends(get_db)):
    """
    Listar processos
    """
    return {"processes": []}


@router.get("/{process_id}")
async def get_process(process_id: int, db: Session = Depends(get_db)):
    """
    Obter detalhes do processo
    """
    return {"process_id": process_id, "message": "To be implemented"}


@router.get("/{process_id}/history")
async def get_process_history(process_id: int, db: Session = Depends(get_db)):
    """
    Obter histórico de movimentações do processo
    """
    return {"process_id": process_id, "history": []}


@router.post("/{process_id}/sync")
async def sync_process(
    process_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Sincronizar processo com API DataJud
    """
    # TODO: Add background task to sync process
    return {"message": "Process sync started", "process_id": process_id}


@router.put("/{process_id}")
async def update_process(process_id: int, db: Session = Depends(get_db)):
    """
    Atualizar processo
    """
    return {"process_id": process_id, "message": "To be implemented"}
