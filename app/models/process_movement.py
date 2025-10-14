from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ProcessMovement(Base):
    __tablename__ = "process_movements"

    id = Column(Integer, primary_key=True, index=True)

    # Movement Info
    movement_code = Column(Integer)
    movement_name = Column(String, nullable=False)
    movement_date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text)

    # Raw data from API
    raw_data = Column(JSON)

    # Foreign Keys
    process_id = Column(Integer, ForeignKey("processes.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    process = relationship("Process", back_populates="movements")
