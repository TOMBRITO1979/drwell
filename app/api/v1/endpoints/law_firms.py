from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.law_firm import LawFirm

router = APIRouter()


class LawFirmCreate(BaseModel):
    name: str
    cnpj: Optional[str] = None
    oab_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class LawFirmUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    oab_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


@router.post("/")
async def create_law_firm(
    firm_data: LawFirmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cadastrar novo escritório de advocacia (usuário Master)
    """
    # Check if CNPJ already exists
    if firm_data.cnpj:
        existing = db.query(LawFirm).filter(LawFirm.cnpj == firm_data.cnpj).first()
        if existing:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

    firm = LawFirm(
        name=firm_data.name,
        cnpj=firm_data.cnpj,
        oab_number=firm_data.oab_number,
        email=firm_data.email,
        phone=firm_data.phone,
        address=firm_data.address,
        city=firm_data.city,
        state=firm_data.state,
        zip_code=firm_data.zip_code
    )

    db.add(firm)
    db.commit()
    db.refresh(firm)

    # Associate current user with this law firm if they don't have one
    if not current_user.law_firm_id:
        current_user.law_firm_id = firm.id
        db.commit()

    return {
        "id": firm.id,
        "name": firm.name,
        "cnpj": firm.cnpj,
        "email": firm.email
    }


@router.get("/")
async def list_law_firms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar escritórios
    """
    # If user has a law_firm_id, only show their firm
    # Otherwise show all firms (for master users creating their first firm)
    if current_user.law_firm_id:
        firms = db.query(LawFirm).filter(LawFirm.id == current_user.law_firm_id).all()
    else:
        firms = db.query(LawFirm).all()

    return [{
        "id": f.id,
        "name": f.name,
        "cnpj": f.cnpj,
        "oab_number": f.oab_number,
        "email": f.email,
        "phone": f.phone,
        "address": f.address,
        "city": f.city,
        "state": f.state,
        "zip_code": f.zip_code
    } for f in firms]


@router.get("/{firm_id}")
async def get_law_firm(
    firm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes do escritório
    """
    firm = db.query(LawFirm).filter(LawFirm.id == firm_id).first()

    if not firm:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")

    # Check if user has access to this firm
    if current_user.law_firm_id and current_user.law_firm_id != firm_id:
        raise HTTPException(status_code=403, detail="Sem permissão para acessar este escritório")

    return {
        "id": firm.id,
        "name": firm.name,
        "cnpj": firm.cnpj,
        "oab_number": firm.oab_number,
        "email": firm.email,
        "phone": firm.phone,
        "address": firm.address,
        "city": firm.city,
        "state": firm.state,
        "zip_code": firm.zip_code
    }


@router.put("/{firm_id}")
async def update_law_firm(
    firm_id: int,
    firm_data: LawFirmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar escritório
    """
    firm = db.query(LawFirm).filter(LawFirm.id == firm_id).first()

    if not firm:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")

    # Check if user has access to this firm
    if current_user.law_firm_id and current_user.law_firm_id != firm_id:
        raise HTTPException(status_code=403, detail="Sem permissão para atualizar este escritório")

    # Update fields if provided
    if firm_data.name:
        firm.name = firm_data.name
    if firm_data.cnpj:
        firm.cnpj = firm_data.cnpj
    if firm_data.oab_number:
        firm.oab_number = firm_data.oab_number
    if firm_data.email:
        firm.email = firm_data.email
    if firm_data.phone:
        firm.phone = firm_data.phone
    if firm_data.address:
        firm.address = firm_data.address
    if firm_data.city:
        firm.city = firm_data.city
    if firm_data.state:
        firm.state = firm_data.state
    if firm_data.zip_code:
        firm.zip_code = firm_data.zip_code

    db.commit()
    db.refresh(firm)

    return {"message": "Escritório atualizado com sucesso", "id": firm.id}


@router.delete("/{firm_id}")
async def delete_law_firm(
    firm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar escritório
    """
    firm = db.query(LawFirm).filter(LawFirm.id == firm_id).first()

    if not firm:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")

    # Check if user has access to this firm
    if current_user.law_firm_id and current_user.law_firm_id != firm_id:
        raise HTTPException(status_code=403, detail="Sem permissão para deletar este escritório")

    db.delete(firm)
    db.commit()

    return {"message": "Escritório deletado com sucesso"}
