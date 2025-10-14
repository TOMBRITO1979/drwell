from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ClientType(str, enum.Enum):
    INDIVIDUAL = "individual"
    COMPANY = "company"


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)

    # Basic Info
    client_type = Column(SQLEnum(ClientType), default=ClientType.INDIVIDUAL)
    name = Column(String, nullable=False)
    cpf_cnpj = Column(String, unique=True, index=True)
    rg = Column(String, nullable=True)

    # Contact Info
    email = Column(String)
    phone = Column(String)
    mobile_phone = Column(String)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)

    # Additional Info
    occupation = Column(String)
    notes = Column(Text)

    # Foreign Keys
    law_firm_id = Column(Integer, ForeignKey("law_firms.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    law_firm = relationship("LawFirm", back_populates="clients")
    processes = relationship("Process", back_populates="client")
