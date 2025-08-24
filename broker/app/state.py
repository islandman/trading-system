import yaml, os
from typing import Dict
from .models import OrderOut
from threading import RLock

class Store:
    def __init__(self):
        self.orders: Dict[str, OrderOut] = {}
        self.lock = RLock()
        self.cfg = {}

    def load_cfg(self, path: str):
        with open(path, "r") as f:
            self.cfg = yaml.safe_load(f)

store = Store()
