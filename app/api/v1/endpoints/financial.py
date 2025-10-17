from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.financial import FinancialRecord, TransactionType, PaymentStatus
from app.models.client import Client
from app.models.process import Process

router = APIRouter()


class FinancialRecordCreate(BaseModel):
    transaction_type: str  # receivable, received, expense
    description: str
    amount: float
    payment_status: Optional[str] = "pending"
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    invoice_number: Optional[str] = None
    notes: Optional[str] = None
    client_id: Optional[int] = None
    process_id: Optional[int] = None
    category: Optional[str] = None


class FinancialRecordUpdate(BaseModel):
    transaction_type: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    invoice_number: Optional[str] = None
    notes: Optional[str] = None
    client_id: Optional[int] = None
    process_id: Optional[int] = None
    category: Optional[str] = None


@router.post("/")
async def create_financial_record(
    record_data: FinancialRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cadastrar registro financeiro
    """
    law_firm_id = current_user.law_firm_id if current_user.law_firm_id else current_user.id

    record = FinancialRecord(
        transaction_type=TransactionType(record_data.transaction_type),
        description=record_data.description,
        amount=Decimal(str(record_data.amount)),
        payment_status=PaymentStatus(record_data.payment_status),
        due_date=record_data.due_date,
        payment_date=record_data.payment_date,
        payment_method=record_data.payment_method,
        invoice_number=record_data.invoice_number,
        notes=record_data.notes,
        client_id=record_data.client_id,
        process_id=record_data.process_id,
        law_firm_id=law_firm_id
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "transaction_type": record.transaction_type.value,
        "description": record.description,
        "amount": float(record.amount),
        "payment_status": record.payment_status.value,
        "due_date": record.due_date.isoformat() if record.due_date else None,
        "payment_date": record.payment_date.isoformat() if record.payment_date else None,
        "created_at": record.created_at.isoformat() if record.created_at else None
    }


@router.get("/")
async def list_financial_records(
    transaction_type: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),
    process_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar registros financeiros com filtros
    """
    law_firm_id = current_user.law_firm_id if current_user.law_firm_id else current_user.id

    query = db.query(FinancialRecord).filter(FinancialRecord.law_firm_id == law_firm_id)

    # Apply filters
    if transaction_type:
        query = query.filter(FinancialRecord.transaction_type == transaction_type)
    if payment_status:
        query = query.filter(FinancialRecord.payment_status == payment_status)
    if client_id:
        query = query.filter(FinancialRecord.client_id == client_id)
    if process_id:
        query = query.filter(FinancialRecord.process_id == process_id)
    if start_date:
        query = query.filter(FinancialRecord.due_date >= start_date)
    if end_date:
        query = query.filter(FinancialRecord.due_date <= end_date)

    records = query.order_by(FinancialRecord.due_date.desc()).all()

    result = []
    for r in records:
        client_name = None
        if r.client_id:
            client = db.query(Client).filter(Client.id == r.client_id).first()
            if client:
                client_name = client.name

        process_number = None
        if r.process_id:
            process = db.query(Process).filter(Process.id == r.process_id).first()
            if process:
                process_number = process.process_number

        result.append({
            "id": r.id,
            "transaction_type": r.transaction_type.value,
            "description": r.description,
            "amount": float(r.amount),
            "payment_status": r.payment_status.value,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "payment_date": r.payment_date.isoformat() if r.payment_date else None,
            "payment_method": r.payment_method,
            "invoice_number": r.invoice_number,
            "notes": r.notes,
            "client_id": r.client_id,
            "client_name": client_name,
            "process_id": r.process_id,
            "process_number": process_number,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return result


@router.get("/summary")
async def get_financial_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter resumo financeiro
    """
    law_firm_id = current_user.law_firm_id if current_user.law_firm_id else current_user.id

    # Total a receber (pendente)
    total_receivable = db.query(func.sum(FinancialRecord.amount)).filter(
        FinancialRecord.law_firm_id == law_firm_id,
        FinancialRecord.transaction_type == TransactionType.RECEIVABLE,
        FinancialRecord.payment_status == PaymentStatus.PENDING
    ).scalar() or 0

    # Total recebido
    total_received = db.query(func.sum(FinancialRecord.amount)).filter(
        FinancialRecord.law_firm_id == law_firm_id,
        or_(
            FinancialRecord.transaction_type == TransactionType.RECEIVED,
            and_(
                FinancialRecord.transaction_type == TransactionType.RECEIVABLE,
                FinancialRecord.payment_status == PaymentStatus.PAID
            )
        )
    ).scalar() or 0

    # Total despesas
    total_expenses = db.query(func.sum(FinancialRecord.amount)).filter(
        FinancialRecord.law_firm_id == law_firm_id,
        FinancialRecord.transaction_type == TransactionType.EXPENSE,
        FinancialRecord.payment_status == PaymentStatus.PAID
    ).scalar() or 0

    # Total atrasado
    total_overdue = db.query(func.sum(FinancialRecord.amount)).filter(
        FinancialRecord.law_firm_id == law_firm_id,
        FinancialRecord.payment_status == PaymentStatus.OVERDUE
    ).scalar() or 0

    # Despesas pendentes
    total_expenses_pending = db.query(func.sum(FinancialRecord.amount)).filter(
        FinancialRecord.law_firm_id == law_firm_id,
        FinancialRecord.transaction_type == TransactionType.EXPENSE,
        FinancialRecord.payment_status == PaymentStatus.PENDING
    ).scalar() or 0

    return {
        "total_receivable": float(total_receivable),
        "total_received": float(total_received),
        "total_expenses": float(total_expenses),
        "total_overdue": float(total_overdue),
        "total_expenses_pending": float(total_expenses_pending),
        "balance": float(total_received) - float(total_expenses)
    }


@router.get("/{record_id}")
async def get_financial_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes do registro financeiro
    """
    law_firm_id = current_user.law_firm_id if current_user.law_firm_id else current_user.id

    record = db.query(FinancialRecord).filter(
        FinancialRecord.id == record_id,
        FinancialRecord.law_firm_id == law_firm_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")

    client_name = None
    if record.client_id:
        client = db.query(Client).filter(Client.id == record.client_id).first()
        if client:
            client_name = client.name

    process_number = None
    if record.process_id:
        process = db.query(Process).filter(Process.id == record.process_id).first()
        if process:
            process_number = process.process_number

    return {
        "id": record.id,
        "transaction_type": record.transaction_type.value,
        "description": record.description,
        "amount": float(record.amount),
        "payment_status": record.payment_status.value,
        "due_date": record.due_date.isoformat() if record.due_date else None,
        "payment_date": record.payment_date.isoformat() if record.payment_date else None,
        "payment_method": record.payment_method,
        "invoice_number": record.invoice_number,
        "notes": record.notes,
        "client_id": record.client_id,
        "client_name": client_name,
        "process_id": record.process_id,
        "process_number": process_number,
        "created_at": record.created_at.isoformat() if record.created_at else None
    }


@router.put("/{record_id}")
async def update_financial_record(
    record_id: int,
    record_data: FinancialRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar registro financeiro
    """
    law_firm_id = current_user.law_firm_id if current_user.law_firm_id else current_user.id

    record = db.query(FinancialRecord).filter(
        FinancialRecord.id == record_id,
        FinancialRecord.law_firm_id == law_firm_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")

    # Update fields if provided
    if record_data.transaction_type:
        record.transaction_type = TransactionType(record_data.transaction_type)
    if record_data.description:
        record.description = record_data.description
    if record_data.amount is not None:
        record.amount = Decimal(str(record_data.amount))
    if record_data.payment_status:
        record.payment_status = PaymentStatus(record_data.payment_status)
    if record_data.due_date is not None:
        record.due_date = record_data.due_date
    if record_data.payment_date is not None:
        record.payment_date = record_data.payment_date
    if record_data.payment_method:
        record.payment_method = record_data.payment_method
    if record_data.invoice_number:
        record.invoice_number = record_data.invoice_number
    if record_data.notes:
        record.notes = record_data.notes
    if record_data.client_id is not None:
        record.client_id = record_data.client_id
    if record_data.process_id is not None:
        record.process_id = record_data.process_id

    db.commit()
    db.refresh(record)

    return {"message": "Registro financeiro atualizado com sucesso", "id": record.id}


@router.delete("/{record_id}")
async def delete_financial_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar registro financeiro
    """
    law_firm_id = current_user.law_firm_id if current_user.law_firm_id else current_user.id

    record = db.query(FinancialRecord).filter(
        FinancialRecord.id == record_id,
        FinancialRecord.law_firm_id == law_firm_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")

    db.delete(record)
    db.commit()

    return {"message": "Registro financeiro deletado com sucesso"}
