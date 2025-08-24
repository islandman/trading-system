# Market Simulator (Starter Repo)

Services:
- **broker/** – FastAPI OMS/RMS + REST/WebSocket
- **exchange/** – Go matching-engine stub with HTTP order intake and async fill simulation
- **sip/** – Python NBBO/SIP stub with random-walk (switch to NATS later)
- **ui/** – React (Vite) front-end: order ticket + blotter + NBBO
- **config/** – shared YAML config

## Quick Start (Docker Compose)
```bash
docker compose up --build
```

- UI: http://localhost:5173
- Broker API: http://localhost:8000/docs
- SIP API: http://localhost:8002/docs
- Exchange: http://localhost:8081/health

> This is a **teaching** starter. Matching and SIP are simplified. Swap in a real book + NATS flows later.

## Services Overview

### Broker (FastAPI)
- Endpoints: `POST /orders`, `GET /orders`, `GET /orders/{id}`, `POST /exec` (exchange callback)
- WebSocket: `/ws` broadcasts `order_update` events
- Simple pre-trade checks (notional, collars) using `config/sim.yaml`
- Routes orders to `EXCHANGE_URL`

### Exchange (Go)
- Endpoint: `POST /orders` accepts orders from broker
- Simulates partial fills / rejections and posts exec reports back to `BROKER_CALLBACK_URL`
- Endpoint: `GET /health` for liveness

### SIP (FastAPI)
- Random-walk NBBO generator per symbol
- REST: `GET /nbbo?symbol=XYZ`
- WebSocket: `/ws/nbbo?symbol=XYZ` stream

### UI (React + Vite)
- Simple order ticket (BUY/SELL, qty, price type)
- Blotter updates live via broker WebSocket
- NBBO tile subscribes to SIP WS

## Environment
- Docker creates a bridge network; services are reachable by name:
  - `broker:8000`, `exchange:8081`, `sip:8002`

## Next Steps
- Replace SIP generator with real consolidation from venue feeds (via NATS).
- Replace exchange stub with in-memory book & price-time matching.
- Add persistence (Postgres) for orders/executions/positions.
