from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dataloader import load_data
from services.inventory import get_inventory
from services.shipments import get_shipments,update_position,initialize_live_shipments
from services.suppliers import get_suppliers
from services.analytics import get_kpis
from state import SHIPMENT_STATE

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

@app.get("/suppliers")
def suppliers():
    df = load_data()
    return get_suppliers(df)


@app.get("/analytics")
def analytics():
    df = load_data()
    return get_kpis(df)

@app.post("/shipments/{shipment_id}/delay")
def delay_shipment(shipment_id: str, days: int = 2):
    if shipment_id in SHIPMENT_STATE:
        SHIPMENT_STATE[shipment_id]["status"] = "Delayed"
        SHIPMENT_STATE[shipment_id]["delay_days"] += days
        return {"message": "Shipment delayed", "shipment_id": shipment_id}
    return {"error": "Shipment not found"}

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
