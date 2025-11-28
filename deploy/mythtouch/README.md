# Mythtouch Docker

Docker assets for containerising the Mythtouch FastAPI application. The Docker context expects the runtime files from the FastAPI project (e.g. `app.py`, `mythtouch.py`, `model.pkl`, `scaler.pkl`, and `labels.json`) to live alongside the Dockerfile. Copy those files into this directory before building the image.

## Build & Run (Docker)

```bash
cd deploy/mythtouch
cp ../api/requirements.txt .
cp ../api/app.py .
# copy mythtouch.py, model.pkl, scaler.pkl, labels.json into this directory

docker build -t mythtouch:latest .
docker run --rm -p 8000:8000 mythtouch:latest
# open http://localhost:8000/health
```

## Using Docker Compose

```bash
cd deploy/mythtouch
# ensure all runtime assets and requirements.txt are copied locally
docker compose up --build
# open http://localhost:8000/health
```

## Endpoints

- GET `/health`
- POST `/simulate`
- POST `/features`
- POST `/predict`

Use the `example_requests.http` file from the API project for sample payloads.
