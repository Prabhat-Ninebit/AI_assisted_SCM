# Supply Chain Control Tower (SCM Demo)

A full-stack demo that visualizes inventory, shipments, suppliers, and ETA risk.

## Features
- Inventory status with low-stock flags.
- Live shipment map with route polylines and traffic hotspots.
- ETA prediction using traffic (TomTom) and weather (Open-Meteo).
- Shipment timeline with delay events.
- Supplier performance and KPI summaries.

## Requirements
- Python 3.12+
- Node.js (LTS recommended) and npm
- Internet access for OSRM routing and Open-Meteo (TomTom optional)
- Optional: TomTom API key in `.env`

## Setup

### Backend (FastAPI)
1. Create and activate a virtual environment.
2. Install dependencies:
   `pip install fastapi uvicorn pandas requests python-dotenv`
3. Set environment variables:
   - `TOMTOM_API_KEY=...` (optional; enables traffic-based delays)
4. Run the API:
   `uvicorn backend.main:app --reload --port 8000`

### Frontend (React + Vite)
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Open the app at `http://localhost:5173`. The API runs at `http://localhost:8000`.

## API Endpoints
- `GET /inventory`
- `GET /shipments`
- `GET /shipments/eta`
- `GET /shipments/{shipment_id}/position`
- `GET /shipments/{shipment_id}/route`
- `GET /shipments/{shipment_id}/traffic?sample_size=30&threshold=1.3`
- `GET /shipments/{shipment_id}/timeline`
- `POST /shipments/{shipment_id}/delay?days=2&reason=Operational%20delay`
- `GET /suppliers`
- `GET /analytics`

## Data
- Uses `backend/data/supply_chain_data.csv`.
- The backend filters for `Transportation modes == "Road"` before processing.

## Notes / Updates
- If `TOMTOM_API_KEY` is missing, traffic factor defaults to 1.0.
- Route geometry is fetched from OSRM and falls back to a straight line when unavailable.
- ETA predictions combine traffic and weather into a single delay driver.
