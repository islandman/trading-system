import asyncio
import json
import logging
import signal
import sys
from typing import Optional

import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, init_db
from app.channels import ChannelManager
from app.orchestrator import NotificationOrchestrator
from app.config import settings
from app.metrics import metrics, record_notification_delivered, record_delivery_latency

logger = logging.getLogger(__name__)

class NotificationWorker:
    """Worker for processing notification channel jobs"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.channel_manager = ChannelManager()
        self.orchestrator = NotificationOrchestrator(self.channel_manager)
        self.running = False
        self.tasks = []
    
    async def start(self):
        """Start the worker"""
        try:
            # Initialize database
            await init_db()
            
            # Initialize Redis
            self.redis_client = redis.from_url(settings.REDIS_URL)
            await self.redis_client.ping()
            
            self.running = True
            logger.info("Notification worker started")
            
            # Start processing tasks for each channel
            channels = self.channel_manager.get_available_channels()
            for channel in channels:
                task = asyncio.create_task(self._process_channel_queue(channel))
                self.tasks.append(task)
            
            # Wait for all tasks
            await asyncio.gather(*self.tasks)
            
        except Exception as e:
            logger.error(f"Error starting worker: {e}")
            raise
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop the worker"""
        self.running = False
        logger.info("Stopping notification worker...")
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
        
        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()
        
        logger.info("Notification worker stopped")
    
    async def _process_channel_queue(self, channel: str):
        """Process jobs for a specific channel"""
        queue_name = f"channel_queue:{channel}"
        
        logger.info(f"Starting to process queue: {queue_name}")
        
        while self.running:
            try:
                # Get job from queue
                job_data = await self.redis_client.brpop(queue_name, timeout=1)
                
                if job_data:
                    _, job_json = job_data
                    job = json.loads(job_json)
                    
                    # Process the job
                    await self._process_job(job, channel)
                
            except asyncio.CancelledError:
                logger.info(f"Channel queue processing cancelled for {channel}")
                break
            except Exception as e:
                logger.error(f"Error processing channel queue {channel}: {e}")
                await asyncio.sleep(1)  # Brief pause before retrying
    
    async def _process_job(self, job_data: dict, channel: str):
        """Process a single channel job"""
        job_id = job_data.get("job_id")
        notification_id = job_data.get("notification_id")
        
        logger.info(f"Processing job {job_id} for channel {channel}")
        
        try:
            # Record metrics
            start_time = asyncio.get_event_loop().time()
            
            # Process the job
            await self.orchestrator.process_channel_job(job_data)
            
            # Record success metrics
            duration = asyncio.get_event_loop().time() - start_time
            record_notification_delivered(channel, True)
            record_delivery_latency(channel, duration)
            
            logger.info(f"Job {job_id} processed successfully")
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {e}")
            
            # Record failure metrics
            record_notification_delivered(channel, False)
            
            # Move to dead letter queue
            await self._move_to_dlq(job_data, str(e))
    
    async def _move_to_dlq(self, job_data: dict, error: str):
        """Move failed job to dead letter queue"""
        try:
            dlq_data = {
                "job_data": job_data,
                "error": error,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            await self.redis_client.lpush("dead_letter_queue", json.dumps(dlq_data))
            logger.info(f"Job moved to DLQ: {job_data.get('job_id')}")
            
        except Exception as e:
            logger.error(f"Error moving job to DLQ: {e}")
    
    async def _update_job_status(self, job_id: str, status: str, error: str = None):
        """Update job status in database"""
        try:
            async with get_db() as db:
                # TODO: Implement database update
                # For now, just log the status
                logger.info(f"Job {job_id} status: {status}")
                if error:
                    logger.error(f"Job {job_id} error: {error}")
                    
        except Exception as e:
            logger.error(f"Error updating job status: {e}")

# Signal handlers for graceful shutdown
def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}, shutting down...")
    sys.exit(0)

async def main():
    """Main entry point for the worker"""
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start worker
    worker = NotificationWorker()
    
    try:
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Worker error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the worker
    asyncio.run(main())
