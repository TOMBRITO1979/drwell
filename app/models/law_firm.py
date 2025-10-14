from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class LawFirm(Base):
    __tablename__ = "law_firms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cnpj = Column(String, unique=True, index=True)
    oab_number = Column(String)

    # Contact Info
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)

    # Settings
    logo_url = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="law_firm")
    lawyers = relationship("Lawyer", back_populates="law_firm")
    clients = relationship("Client", back_populates="law_firm")
    processes = relationship("Process", back_populates="law_firm")
