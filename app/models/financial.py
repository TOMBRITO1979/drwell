from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Date, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class TransactionType(str, enum.Enum):
    RECEIVABLE = "receivable"  # A receber
    RECEIVED = "received"  # Recebido
    EXPENSE = "expense"  # Despesa


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)

    # Transaction Info
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    # Payment Info
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    due_date = Column(Date)
    payment_date = Column(Date, nullable=True)
    payment_method = Column(String)

    # References
    invoice_number = Column(String, index=True)
    notes = Column(String)

    # Foreign Keys
    law_firm_id = Column(Integer, ForeignKey("law_firms.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    process_id = Column(Integer, ForeignKey("processes.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    law_firm = relationship("LawFirm")
    client = relationship("Client")
    process = relationship("Process", back_populates="financial_records")
