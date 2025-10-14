from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.lawyer import Lawyer

router = APIRouter()


class LawyerCreate(BaseModel):
    full_name: str
    cpf: Optional[str] = None
    oab_number: str
    oab_state: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_partner: Optional[bool] = False
    is_active: Optional[bool] = True


class LawyerUpdate(BaseModel):
    full_name: Optional[str] = None
    cpf: Optional[str] = None
    oab_number: Optional[str] = None
    oab_state: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_partner: Optional[bool] = None
    is_active: Optional[bool] = None


@router.post("/")
async def create_lawyer(
    lawyer_data: LawyerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cadastrar advogado funcionário
    """
    if not current_user.law_firm_id:
        raise HTTPException(status_code=400, detail="Usuário não está associado a um escritório")

    # Check if CPF already exists
    if lawyer_data.cpf:
        existing = db.query(Lawyer).filter(Lawyer.cpf == lawyer_data.cpf).first()
        if existing:
            raise HTTPException(status_code=400, detail="CPF já cadastrado")

    lawyer = Lawyer(
        full_name=lawyer_data.full_name,
        cpf=lawyer_data.cpf,
        oab_number=lawyer_data.oab_number,
        oab_state=lawyer_data.oab_state,
        email=lawyer_data.email,
        phone=lawyer_data.phone,
        address=lawyer_data.address,
        is_partner=lawyer_data.is_partner,
        is_active=lawyer_data.is_active,
        law_firm_id=current_user.law_firm_id
    )

    db.add(lawyer)
    db.commit()
    db.refresh(lawyer)

    return {
        "id": lawyer.id,
        "full_name": lawyer.full_name,
        "oab_number": lawyer.oab_number,
        "email": lawyer.email
    }


@router.get("/")
async def list_lawyers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar advogados
    """
    if not current_user.law_firm_id:
        return []

    lawyers = db.query(Lawyer).filter(Lawyer.law_firm_id == current_user.law_firm_id).all()

    return [{
        "id": l.id,
        "full_name": l.full_name,
        "cpf": l.cpf,
        "oab_number": l.oab_number,
        "oab_state": l.oab_state,
        "email": l.email,
        "phone": l.phone,
        "address": l.address,
        "is_partner": l.is_partner,
        "is_active": l.is_active
    } for l in lawyers]


@router.get("/{lawyer_id}")
async def get_lawyer(
    lawyer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes do advogado
    """
    lawyer = db.query(Lawyer).filter(
        Lawyer.id == lawyer_id,
        Lawyer.law_firm_id == current_user.law_firm_id
    ).first()

    if not lawyer:
        raise HTTPException(status_code=404, detail="Advogado não encontrado")

    return {
        "id": lawyer.id,
        "full_name": lawyer.full_name,
        "cpf": lawyer.cpf,
        "oab_number": lawyer.oab_number,
        "oab_state": lawyer.oab_state,
        "email": lawyer.email,
        "phone": lawyer.phone,
        "address": lawyer.address,
        "is_partner": lawyer.is_partner,
        "is_active": lawyer.is_active
    }


@router.put("/{lawyer_id}")
async def update_lawyer(
    lawyer_id: int,
    lawyer_data: LawyerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar advogado
    """
    lawyer = db.query(Lawyer).filter(
        Lawyer.id == lawyer_id,
        Lawyer.law_firm_id == current_user.law_firm_id
    ).first()

    if not lawyer:
        raise HTTPException(status_code=404, detail="Advogado não encontrado")

    # Update fields if provided
    if lawyer_data.full_name:
        lawyer.full_name = lawyer_data.full_name
    if lawyer_data.cpf:
        lawyer.cpf = lawyer_data.cpf
    if lawyer_data.oab_number:
        lawyer.oab_number = lawyer_data.oab_number
    if lawyer_data.oab_state:
        lawyer.oab_state = lawyer_data.oab_state
    if lawyer_data.email:
        lawyer.email = lawyer_data.email
    if lawyer_data.phone:
        lawyer.phone = lawyer_data.phone
    if lawyer_data.address:
        lawyer.address = lawyer_data.address
    if lawyer_data.is_partner is not None:
        lawyer.is_partner = lawyer_data.is_partner
    if lawyer_data.is_active is not None:
        lawyer.is_active = lawyer_data.is_active

    db.commit()
    db.refresh(lawyer)

    return {"message": "Advogado atualizado com sucesso", "id": lawyer.id}


@router.delete("/{lawyer_id}")
async def delete_lawyer(
    lawyer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar advogado
    """
    lawyer = db.query(Lawyer).filter(
        Lawyer.id == lawyer_id,
        Lawyer.law_firm_id == current_user.law_firm_id
    ).first()

    if not lawyer:
        raise HTTPException(status_code=404, detail="Advogado não encontrado")

    db.delete(lawyer)
    db.commit()

    return {"message": "Advogado deletado com sucesso"}
