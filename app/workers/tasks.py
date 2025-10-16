from celery import Task
from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.models import Process, ProcessMovement
from app.services.datajud_service import DataJudService
import logging

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    """Base task with database session"""

    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, name="app.workers.tasks.sync_process")
def sync_process(self, process_id: int):
    """
    Sync a single process with DataJud API
    """
    import asyncio
    from datetime import datetime

    try:
        logger.info(f"Starting sync for process ID: {process_id}")

        process = self.db.query(Process).filter(Process.id == process_id).first()

        if not process:
            logger.error(f"Process {process_id} not found")
            return {"error": "Process not found"}

        if not process.auto_sync_enabled:
            logger.info(f"Auto sync disabled for process {process_id}")
            return {"message": "Auto sync disabled"}

        # Initialize DataJud service
        datajud_service = DataJudService()

        # Get movements using async method
        async def get_movements():
            return await datajud_service.get_process_movements(
                process_number=process.process_number,
                court_type=process.court_type.value if process.court_type else "tj",
                state=process.court_state or "SP"
            )

        # Run async function
        movements = asyncio.run(get_movements())

        if not movements:
            logger.warning(f"No movements found for process {process.process_number}")
            process.last_sync_date = datetime.utcnow()
            self.db.commit()
            return {"message": "No movements found", "process_id": process_id}

        # Save new movements to database
        new_movements_count = 0
        for mov_data in movements:
            # Check if movement already exists
            existing = self.db.query(ProcessMovement).filter(
                ProcessMovement.process_id == process_id,
                ProcessMovement.movement_date == mov_data["movement_date"],
                ProcessMovement.movement_name == mov_data["movement_name"]
            ).first()

            if not existing:
                new_movement = ProcessMovement(
                    process_id=process_id,
                    movement_code=mov_data.get("movement_code"),
                    movement_name=mov_data["movement_name"],
                    movement_date=mov_data["movement_date"],
                    description=mov_data.get("description", ""),
                    raw_data=mov_data.get("raw_data")
                )
                self.db.add(new_movement)
                new_movements_count += 1

        # Update last sync date
        process.last_sync_date = datetime.utcnow()
        self.db.commit()

        logger.info(f"Process {process_id} synced successfully - {new_movements_count} new movements")
        return {
            "success": True,
            "process_id": process_id,
            "movements_found": len(movements),
            "new_movements": new_movements_count
        }

    except Exception as e:
        logger.error(f"Error syncing process {process_id}: {str(e)}")
        self.db.rollback()
        return {"error": str(e)}


@celery_app.task(base=DatabaseTask, bind=True, name="app.workers.tasks.sync_all_processes")
def sync_all_processes(self):
    """
    Sync all processes that have auto_sync enabled
    """
    try:
        logger.info("Starting sync for all processes")

        processes = self.db.query(Process).filter(
            Process.auto_sync_enabled == True,
            Process.status == "active"
        ).all()

        total = len(processes)
        logger.info(f"Found {total} processes to sync")

        synced = 0
        failed = 0

        for process in processes:
            try:
                sync_process.delay(process.id)
                synced += 1
            except Exception as e:
                logger.error(f"Failed to queue sync for process {process.id}: {str(e)}")
                failed += 1

        logger.info(f"Sync completed: {synced} queued, {failed} failed")
        return {
            "total": total,
            "queued": synced,
            "failed": failed
        }

    except Exception as e:
        logger.error(f"Error in sync_all_processes: {str(e)}")
        return {"error": str(e)}


@celery_app.task(name="app.workers.tasks.clean_old_logs")
def clean_old_logs():
    """
    Clean old log entries
    """
    logger.info("Cleaning old logs")
    # TODO: Implement log cleanup
    return {"message": "Logs cleaned"}


@celery_app.task(name="app.workers.tasks.send_deadline_notifications")
def send_deadline_notifications():
    """
    Send notifications for upcoming process deadlines
    """
    logger.info("Checking for upcoming deadlines")
    # TODO: Implement deadline notifications
    return {"message": "Notifications sent"}
