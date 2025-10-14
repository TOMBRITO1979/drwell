from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, law_firms, lawyers, clients, processes, financial

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
api_router.include_router(users.router, prefix="/users", tags=["Usuários"])
api_router.include_router(law_firms.router, prefix="/law-firms", tags=["Escritórios"])
api_router.include_router(lawyers.router, prefix="/lawyers", tags=["Advogados"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clientes"])
api_router.include_router(processes.router, prefix="/processes", tags=["Processos"])
api_router.include_router(financial.router, prefix="/financial", tags=["Financeiro"])
