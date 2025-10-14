from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

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


# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "DrWell API - CRM para Advogados",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


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
