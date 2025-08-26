import logging
import time
from typing import Dict, Any
from collections import defaultdict, Counter
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class Metrics:
    """Metrics collection for the notification system"""
    
    def __init__(self):
        self.counters = defaultdict(int)
        self.gauges = defaultdict(float)
        self.histograms = defaultdict(list)
        self.timers = defaultdict(list)
        self.labels = defaultdict(dict)
    
    def increment_counter(self, name: str, labels: Dict[str, str] = None):
        """Increment a counter metric"""
        key = self._make_key(name, labels)
        self.counters[key] += 1
        logger.debug(f"Incremented counter {key}: {self.counters[key]}")
    
    def set_gauge(self, name: str, value: float, labels: Dict[str, str] = None):
        """Set a gauge metric"""
        key = self._make_key(name, labels)
        self.gauges[key] = value
        logger.debug(f"Set gauge {key}: {value}")
    
    def record_histogram(self, name: str, value: float, labels: Dict[str, str] = None):
        """Record a histogram metric"""
        key = self._make_key(name, labels)
        self.histograms[key].append(value)
        logger.debug(f"Recorded histogram {key}: {value}")
    
    def start_timer(self, name: str, labels: Dict[str, str] = None) -> str:
        """Start a timer and return timer ID"""
        timer_id = f"{name}_{int(time.time() * 1000000)}"
        key = self._make_key(name, labels)
        self.timers[key][timer_id] = time.time()
        logger.debug(f"Started timer {timer_id}")
        return timer_id
    
    def stop_timer(self, timer_id: str, name: str, labels: Dict[str, str] = None):
        """Stop a timer and record duration"""
        key = self._make_key(name, labels)
        if timer_id in self.timers[key]:
            start_time = self.timers[key][timer_id]
            duration = time.time() - start_time
            self.record_histogram(f"{name}_duration", duration, labels)
            del self.timers[key][timer_id]
            logger.debug(f"Stopped timer {timer_id}: {duration:.3f}s")
    
    def _make_key(self, name: str, labels: Dict[str, str] = None) -> str:
        """Create a key for metrics with labels"""
        if not labels:
            return name
        
        label_str = "_".join([f"{k}={v}" for k, v in sorted(labels.items())])
        return f"{name}_{label_str}"
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all metrics in Prometheus format"""
        metrics = {
            "counters": {},
            "gauges": {},
            "histograms": {},
            "summary": self._get_summary()
        }
        
        # Convert counters
        for key, value in self.counters.items():
            metrics["counters"][key] = value
        
        # Convert gauges
        for key, value in self.gauges.items():
            metrics["gauges"][key] = value
        
        # Convert histograms
        for key, values in self.histograms.items():
            if values:
                metrics["histograms"][key] = {
                    "count": len(values),
                    "sum": sum(values),
                    "min": min(values),
                    "max": max(values),
                    "avg": sum(values) / len(values),
                    "p50": self._percentile(values, 50),
                    "p95": self._percentile(values, 95),
                    "p99": self._percentile(values, 99)
                }
        
        return metrics
    
    def _get_summary(self) -> Dict[str, Any]:
        """Get summary statistics"""
        total_events = sum(self.counters.values())
        total_notifications = sum(
            value for key, value in self.counters.items() 
            if "notifications" in key
        )
        
        return {
            "total_events": total_events,
            "total_notifications": total_notifications,
            "uptime_seconds": time.time() - self._get_start_time(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def _percentile(self, values: list, percentile: int) -> float:
        """Calculate percentile of values"""
        if not values:
            return 0.0
        
        sorted_values = sorted(values)
        index = int(len(sorted_values) * percentile / 100)
        return sorted_values[index]
    
    def _get_start_time(self) -> float:
        """Get application start time"""
        # In a real implementation, this would be set at startup
        return time.time() - 3600  # Mock 1 hour uptime
    
    def reset(self):
        """Reset all metrics"""
        self.counters.clear()
        self.gauges.clear()
        self.histograms.clear()
        self.timers.clear()
        self.labels.clear()
        logger.info("Metrics reset")

# Global metrics instance
metrics = Metrics()

# Convenience functions for common metrics
def record_event_received(event_type: str, producer: str):
    """Record an event being received"""
    metrics.increment_counter("events_received_total", {
        "event_type": event_type,
        "producer": producer
    })

def record_notification_created(notification_type: str, channel: str):
    """Record a notification being created"""
    metrics.increment_counter("notifications_created_total", {
        "type": notification_type,
        "channel": channel
    })

def record_notification_delivered(channel: str, success: bool):
    """Record a notification delivery attempt"""
    status = "success" if success else "failed"
    metrics.increment_counter("notifications_delivered_total", {
        "channel": channel,
        "status": status
    })

def record_delivery_latency(channel: str, latency_seconds: float):
    """Record delivery latency"""
    metrics.record_histogram("delivery_latency_seconds", latency_seconds, {
        "channel": channel
    })

def record_queue_depth(channel: str, depth: int):
    """Record queue depth"""
    metrics.set_gauge("queue_depth", depth, {
        "channel": channel
    })

def record_error(error_type: str, channel: str = None):
    """Record an error"""
    labels = {"error_type": error_type}
    if channel:
        labels["channel"] = channel
    metrics.increment_counter("errors_total", labels)

# Context manager for timing operations
class Timer:
    """Context manager for timing operations"""
    
    def __init__(self, name: str, labels: Dict[str, str] = None):
        self.name = name
        self.labels = labels
        self.timer_id = None
    
    def __enter__(self):
        self.timer_id = metrics.start_timer(self.name, self.labels)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.timer_id:
            metrics.stop_timer(self.timer_id, self.name, self.labels)
