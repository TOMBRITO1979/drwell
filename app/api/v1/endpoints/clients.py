from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.client import Client, ClientType

router = APIRouter()


class ClientCreate(BaseModel):
    client_type: Optional[str] = "individual"
    name: str
    cpf_cnpj: Optional[str] = None
    rg: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    occupation: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    rg: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    occupation: Optional[str] = None
    notes: Optional[str] = None


@router.post("/")
async def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cadastrar novo cliente
    """
    # Check if CPF/CNPJ already exists
    if client_data.cpf_cnpj:
        existing = db.query(Client).filter(Client.cpf_cnpj == client_data.cpf_cnpj).first()
        if existing:
            raise HTTPException(status_code=400, detail="CPF/CNPJ já cadastrado")

    client = Client(
        client_type=ClientType(client_data.client_type),
        name=client_data.name,
        cpf_cnpj=client_data.cpf_cnpj,
        rg=client_data.rg,
        email=client_data.email,
        phone=client_data.phone,
        mobile_phone=client_data.mobile_phone,
        address=client_data.address,
        city=client_data.city,
        state=client_data.state,
        zip_code=client_data.zip_code,
        occupation=client_data.occupation,
        notes=client_data.notes,
        law_firm_id=current_user.law_firm_id if current_user.law_firm_id else current_user.id
    )

    db.add(client)
    db.commit()
    db.refresh(client)

    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "cpf_cnpj": client.cpf_cnpj,
        "full_name": client.name
    }


@router.get("/")
async def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar clientes
    """
    # Use law_firm_id if exists, otherwise use user_id as fallback
    filter_id = current_user.law_firm_id if current_user.law_firm_id else current_user.id
    clients = db.query(Client).filter(Client.law_firm_id == filter_id).all()

    return [{
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "mobile_phone": c.mobile_phone,
        "cpf_cnpj": c.cpf_cnpj,
        "rg": c.rg,
        "address": c.address,
        "city": c.city,
        "state": c.state,
        "occupation": c.occupation,
        "full_name": c.name
    } for c in clients]


@router.get("/{client_id}")
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes do cliente
    """
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.law_firm_id == current_user.law_firm_id
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "mobile_phone": client.mobile_phone,
        "cpf_cnpj": client.cpf_cnpj,
        "rg": client.rg,
        "address": client.address,
        "city": client.city,
        "state": client.state,
        "zip_code": client.zip_code,
        "occupation": client.occupation,
        "notes": client.notes
    }


@router.put("/{client_id}")
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar cliente
    """
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.law_firm_id == current_user.law_firm_id
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # Update fields if provided
    if client_data.name:
        client.name = client_data.name
    if client_data.email:
        client.email = client_data.email
    if client_data.phone:
        client.phone = client_data.phone
    if client_data.mobile_phone:
        client.mobile_phone = client_data.mobile_phone
    if client_data.cpf_cnpj:
        client.cpf_cnpj = client_data.cpf_cnpj
    if client_data.rg:
        client.rg = client_data.rg
    if client_data.address:
        client.address = client_data.address
    if client_data.city:
        client.city = client_data.city
    if client_data.state:
        client.state = client_data.state
    if client_data.zip_code:
        client.zip_code = client_data.zip_code
    if client_data.occupation:
        client.occupation = client_data.occupation
    if client_data.notes:
        client.notes = client_data.notes

    db.commit()
    db.refresh(client)

    return {"message": "Cliente atualizado com sucesso", "id": client.id}


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar cliente
    """
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.law_firm_id == current_user.law_firm_id
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db.delete(client)
    db.commit()

    return {"message": "Cliente deletado com sucesso"}
