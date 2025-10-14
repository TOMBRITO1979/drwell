from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ProcessStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"
    FINISHED = "finished"


class CourtType(str, enum.Enum):
    TJ = "tj"  # Tribunal de Justiça
    TRT = "trt"  # Tribunal Regional do Trabalho
    TRF = "trf"  # Tribunal Regional Federal
    TST = "tst"  # Tribunal Superior do Trabalho
    TSE = "tse"  # Tribunal Superior Eleitoral
    STJ = "stj"  # Superior Tribunal de Justiça


class Process(Base):
    __tablename__ = "processes"

    id = Column(Integer, primary_key=True, index=True)

    # Process Identification
    process_number = Column(String, unique=True, index=True, nullable=False)
    internal_code = Column(String, index=True)  # Código interno do escritório

    # Court Info
    court_type = Column(SQLEnum(CourtType))
    court_name = Column(String)
    court_state = Column(String)
    court_city = Column(String)

    # Process Details
    subject = Column(String, nullable=False)
    description = Column(Text)
    process_class = Column(String)
    status = Column(SQLEnum(ProcessStatus), default=ProcessStatus.ACTIVE)

    # Important Dates
    filing_date = Column(Date)
    deadline = Column(Date, nullable=True)
    last_sync_date = Column(DateTime(timezone=True))

    # API Integration
    datajud_endpoint = Column(String)  # Which tribunal endpoint to use
    raw_data = Column(JSON)  # Store raw API response
    auto_sync_enabled = Column(String, default=True)
    sync_interval_hours = Column(Integer, default=24)

    # Foreign Keys
    law_firm_id = Column(Integer, ForeignKey("law_firms.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    responsible_lawyer_id = Column(Integer, ForeignKey("lawyers.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    law_firm = relationship("LawFirm", back_populates="processes")
    client = relationship("Client", back_populates="processes")
    responsible_lawyer = relationship("Lawyer", back_populates="processes")
    movements = relationship("ProcessMovement", back_populates="process", cascade="all, delete-orphan")
    financial_records = relationship("FinancialRecord", back_populates="process")
