from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "drwell",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    # Sync all processes every hour
    "sync-all-processes": {
        "task": "app.workers.tasks.sync_all_processes",
        "schedule": crontab(minute=0),  # Every hour at minute 0
    },
    # Clean old logs daily
    "clean-old-logs": {
        "task": "app.workers.tasks.clean_old_logs",
        "schedule": crontab(hour=3, minute=0),  # Daily at 3 AM
    },
}
