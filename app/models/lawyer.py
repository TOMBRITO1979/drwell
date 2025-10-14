from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Lawyer(Base):
    __tablename__ = "lawyers"

    id = Column(Integer, primary_key=True, index=True)

    # Personal Info
    full_name = Column(String, nullable=False)
    cpf = Column(String, unique=True, index=True)
    oab_number = Column(String, nullable=False)
    oab_state = Column(String)

    # Contact Info
    email = Column(String)
    phone = Column(String)
    address = Column(Text)

    # Employment
    is_partner = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Foreign Keys
    law_firm_id = Column(Integer, ForeignKey("law_firms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    law_firm = relationship("LawFirm", back_populates="lawyers")
    user = relationship("User")
    processes = relationship("Process", back_populates="responsible_lawyer")
