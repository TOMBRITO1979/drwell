from app.models.user import User
from app.models.law_firm import LawFirm
from app.models.lawyer import Lawyer
from app.models.client import Client
from app.models.process import Process
from app.models.process_movement import ProcessMovement
from app.models.financial import FinancialRecord

__all__ = [
    "User",
    "LawFirm",
    "Lawyer",
    "Client",
    "Process",
    "ProcessMovement",
    "FinancialRecord"
]
