from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.v1.api import api_router
import os

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


# Health check endpoint (API)
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# API Info endpoint
@app.get("/api")
async def api_root():
    return {
        "message": "DrWell API - CRM para Advogados",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs"
    }


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Frontend routes (serve HTML files)
@app.get("/")
async def serve_index():
    """Serve the login/register page"""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not available"}


@app.get("/dashboard.html")
async def serve_dashboard():
    """Serve the dashboard page"""
    dashboard_path = os.path.join(static_dir, "dashboard.html")
    if os.path.exists(dashboard_path):
        return FileResponse(dashboard_path)
    return {"message": "Dashboard not available"}


# Startup event
@app.on_event("startup")
async def startup_event():
    print(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION} started!")
    print(f"📝 Documentation available at: /docs")
    print(f"🌍 Environment: {settings.ENVIRONMENT}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    print(f"👋 {settings.PROJECT_NAME} shutting down...")
