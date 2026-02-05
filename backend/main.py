import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dataloader import load_data
from services.inventory import get_inventory
from services.shipments import get_shipments,update_position,initialize_live_shipments
from services.suppliers import get_suppliers
from services.analytics import get_kpis
from services.eta import get_predicted_etas, get_route_traffic_hotspots
from state import SHIPMENT_STATE, add_event

app = FastAPI(title="SCM Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/inventory")
def inventory():
    df = load_data()
    return get_inventory(df)

@app.get("/shipments")
def shipments():
    df = load_data()
    shipments = get_shipments(df)
    initialize_live_shipments(shipments)
    return shipments

@app.get("/shipments/eta")
def shipments_eta():
    df = load_data()
    shipments = get_shipments(df)
    initialize_live_shipments(shipments)
    return get_predicted_etas(shipments)

@app.get("/suppliers")
def suppliers():
    df = load_data()
    return get_suppliers(df)


@app.get("/analytics")
def analytics():
    df = load_data()
    return get_kpis(df)

@app.post("/shipments/{shipment_id}/delay")
def delay_shipment(shipment_id: str, days: int = 2, reason: str = "Operational delay"):
    if shipment_id in SHIPMENT_STATE:
        state = SHIPMENT_STATE[shipment_id]
        state["status"] = "Delayed"
        state["delay_days"] += days
        lat = None
        lng = None
        if state.get("route_points"):
            point = state["route_points"][state["current_index"]]
            if isinstance(point, dict):
                lat = point.get("lat")
                lng = point.get("lng")
            else:
                lat, lng = point

        state["delay_reason"] = reason

        add_event(
            shipment_id,
            "DELAYED",
            f"Delay added: {reason} (+{days} days)",
            {"reason": reason, "days": days, "lat": lat, "lng": lng}
        )

        return {"message": "Shipment delayed", "shipment_id": shipment_id, "reason": reason}
    return {"error": "Shipment not found"}

@app.get("/shipments/{shipment_id}/timeline")
def shipment_timeline(shipment_id: str):
    state = SHIPMENT_STATE.get(shipment_id)
    if not state:
        return {"error": "Shipment not initialized"}

    events = sorted(state.get("events", []), key=lambda e: e.get("timestamp", 0))
    return {"shipment_id": shipment_id, "events": events}

@app.get("/shipments/{shipment_id}/position")
def get_live_position(shipment_id: str):
    if shipment_id not in SHIPMENT_STATE:
        return {"error": "Shipment not initialized"}

    point = update_position(shipment_id)
    if not point or "lat" not in point or "lng" not in point:
        return {"error": "Invalid route point"}

    state = SHIPMENT_STATE[shipment_id]

    return {
        "shipment_id": shipment_id,
        "position": {
            "lat": point["lat"],
            "lng": point["lng"]
        },
        "status": state["status"],
        "timestamp": state["last_updated"]
    }
    
@app.get("/shipments/{shipment_id}/route")
def get_route(shipment_id: str):
    if shipment_id not in SHIPMENT_STATE:
        return {"error": "Shipment not initialized"}

    route_points = SHIPMENT_STATE[shipment_id]["route_points"]
    route = []
    for point in route_points:
        if isinstance(point, dict):
            route.append({"lat": point.get("lat"), "lng": point.get("lng")})
        else:
            lat, lng = point
            route.append({"lat": lat, "lng": lng})

    return {
        "shipment_id": shipment_id,
        "route": route
    }


@app.get("/shipments/{shipment_id}/traffic")
def get_route_traffic(shipment_id: str, sample_size: int = 30, threshold: float = 1.3):
    if shipment_id not in SHIPMENT_STATE:
        return {"error": "Shipment not initialized"}

    route_points = SHIPMENT_STATE[shipment_id]["route_points"]
    payload = get_route_traffic_hotspots(
        route_points,
        sample_size=sample_size,
        threshold=threshold
    )
    payload["shipment_id"] = shipment_id
    payload["generated_at"] = time.time()
    return payload
