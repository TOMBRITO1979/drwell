from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.process import Process, ProcessStatus, CourtType
from app.models.process_movement import ProcessMovement
from app.services.datajud_service import DataJudService

router = APIRouter()


class ProcessCreate(BaseModel):
    process_number: str
    client_id: int
    responsible_lawyer_id: Optional[int] = None
    internal_code: Optional[str] = None
    court_type: Optional[str] = None
    court_name: Optional[str] = None
    court_state: Optional[str] = None
    court_city: Optional[str] = None
    subject: str
    description: Optional[str] = None
    process_class: Optional[str] = None
    status: Optional[str] = "active"
    filing_date: Optional[date] = None
    deadline: Optional[date] = None


class ProcessUpdate(BaseModel):
    process_number: Optional[str] = None
    client_id: Optional[int] = None
    responsible_lawyer_id: Optional[int] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    court_type: Optional[str] = None
    court_name: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[date] = None


@router.post("/")
async def create_process(
    process_data: ProcessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cadastrar novo processo judicial
    """
    # Check if process number already exists
    existing = db.query(Process).filter(Process.process_number == process_data.process_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Número de processo já cadastrado")

    process = Process(
        process_number=process_data.process_number,
        internal_code=process_data.internal_code,
        court_type=CourtType(process_data.court_type) if process_data.court_type else None,
        court_name=process_data.court_name,
        court_state=process_data.court_state,
        court_city=process_data.court_city,
        subject=process_data.subject,
        description=process_data.description,
        process_class=process_data.process_class,
        status=ProcessStatus(process_data.status),
        filing_date=process_data.filing_date,
        deadline=process_data.deadline,
        law_firm_id=current_user.law_firm_id if current_user.law_firm_id else current_user.id,
        client_id=process_data.client_id,
        responsible_lawyer_id=process_data.responsible_lawyer_id
    )

    db.add(process)
    db.commit()
    db.refresh(process)

    return {
        "id": process.id,
        "process_number": process.process_number,
        "subject": process.subject,
        "status": process.status.value if process.status else None
    }


@router.get("/")
async def list_processes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar processos
    """
    filter_id = current_user.law_firm_id if current_user.law_firm_id else current_user.id
    processes = db.query(Process).filter(Process.law_firm_id == filter_id).all()

    return [{
        "id": p.id,
        "process_number": p.process_number,
        "subject": p.subject,
        "description": p.description,
        "court_type": p.court_type.value if p.court_type else None,
        "court_name": p.court_name,
        "status": p.status.value if p.status else None,
        "filing_date": p.filing_date.isoformat() if p.filing_date else None,
        "deadline": p.deadline.isoformat() if p.deadline else None,
        "client_id": p.client_id,
        "value": None  # Added for compatibility with frontend
    } for p in processes]


@router.get("/{process_id}")
async def get_process(
    process_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes do processo
    """
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.law_firm_id == current_user.law_firm_id
    ).first()

    if not process:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    return {
        "id": process.id,
        "process_number": process.process_number,
        "subject": process.subject,
        "description": process.description,
        "court_type": process.court_type.value if process.court_type else None,
        "court_name": process.court_name,
        "status": process.status.value if process.status else None,
        "client_id": process.client_id
    }


@router.get("/{process_id}/movements")
async def get_process_movements(
    process_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter movimentações do processo (salvas no banco)
    """
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.law_firm_id == current_user.law_firm_id
    ).first()

    if not process:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    # Get movements from database
    movements = db.query(ProcessMovement).filter(
        ProcessMovement.process_id == process_id
    ).order_by(ProcessMovement.movement_date.desc()).all()

    return {
        "process_id": process_id,
        "process_number": process.process_number,
        "total_movements": len(movements),
        "last_sync": process.last_sync_date.isoformat() if process.last_sync_date else None,
        "movements": [{
            "id": m.id,
            "movement_code": m.movement_code,
            "movement_name": m.movement_name,
            "movement_date": m.movement_date.isoformat() if m.movement_date else None,
            "description": m.description,
            "created_at": m.created_at.isoformat() if m.created_at else None
        } for m in movements]
    }


@router.post("/{process_id}/sync")
async def sync_process(
    process_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sincronizar processo com API DataJud
    """
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.law_firm_id == current_user.law_firm_id
    ).first()

    if not process:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    try:
        # Initialize DataJud service
        datajud_service = DataJudService()

        # Get movements from DataJud API
        movements = await datajud_service.get_process_movements(
            process_number=process.process_number,
            court_type=process.court_type.value if process.court_type else "tj",
            state=process.court_state or "SP"
        )

        # Save new movements to database
        new_movements_count = 0
        for mov_data in movements:
            # Check if movement already exists
            existing = db.query(ProcessMovement).filter(
                ProcessMovement.process_id == process_id,
                ProcessMovement.movement_date == mov_data["movement_date"],
                ProcessMovement.movement_name == mov_data["movement_name"]
            ).first()

            if not existing:
                new_movement = ProcessMovement(
                    process_id=process_id,
                    movement_code=mov_data.get("movement_code"),
                    movement_name=mov_data["movement_name"],
                    movement_date=mov_data["movement_date"],
                    description=mov_data.get("description", ""),
                    raw_data=mov_data.get("raw_data")
                )
                db.add(new_movement)
                new_movements_count += 1

        # Update last sync date
        process.last_sync_date = datetime.utcnow()
        db.commit()

        return {
            "message": "Sincronização concluída",
            "process_id": process_id,
            "movements_found": len(movements),
            "new_movements": new_movements_count
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao sincronizar processo: {str(e)}"
        )


@router.put("/{process_id}")
async def update_process(
    process_id: int,
    process_data: ProcessUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar processo
    """
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.law_firm_id == current_user.law_firm_id
    ).first()

    if not process:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    # Update fields if provided
    if process_data.process_number:
        process.process_number = process_data.process_number
    if process_data.subject:
        process.subject = process_data.subject
    if process_data.description:
        process.description = process_data.description
    if process_data.court_type:
        process.court_type = CourtType(process_data.court_type)
    if process_data.court_name:
        process.court_name = process_data.court_name
    if process_data.status:
        process.status = ProcessStatus(process_data.status)
    if process_data.client_id:
        process.client_id = process_data.client_id
    if process_data.responsible_lawyer_id:
        process.responsible_lawyer_id = process_data.responsible_lawyer_id
    if process_data.deadline:
        process.deadline = process_data.deadline

    db.commit()
    db.refresh(process)

    return {"message": "Processo atualizado com sucesso", "id": process.id}


@router.delete("/{process_id}")
async def delete_process(
    process_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar processo
    """
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.law_firm_id == current_user.law_firm_id
    ).first()

    if not process:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    db.delete(process)
    db.commit()

    return {"message": "Processo deletado com sucesso"}
