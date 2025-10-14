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

        # Fetch process data from API
        result = datajud_service.fetch_process(
            process_number=process.process_number,
            tribunal_endpoint=process.datajud_endpoint
        )

        if not result:
            logger.error(f"Failed to fetch process {process.process_number}")
            return {"error": "Failed to fetch from API"}

        # Update process data
        process.raw_data = result
        process.last_sync_date = func.now()

        # Process movements
        movements = result.get("hits", {}).get("hits", [])
        if movements:
            process_data = movements[0].get("_source", {})

            # Update basic info
            if "classe" in process_data:
                process.process_class = process_data["classe"].get("nome")

            # Add new movements
            api_movements = process_data.get("movimentos", [])
            for mov in api_movements:
                # Check if movement already exists
                existing = self.db.query(ProcessMovement).filter(
                    ProcessMovement.process_id == process.id,
                    ProcessMovement.movement_code == mov.get("codigo"),
                    ProcessMovement.movement_date == mov.get("dataHora")
                ).first()

                if not existing:
                    new_movement = ProcessMovement(
                        process_id=process.id,
                        movement_code=mov.get("codigo"),
                        movement_name=mov.get("nome"),
                        movement_date=mov.get("dataHora"),
                        raw_data=mov
                    )
                    self.db.add(new_movement)

        self.db.commit()

        logger.info(f"Process {process_id} synced successfully")
        return {"success": True, "process_id": process_id}

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
