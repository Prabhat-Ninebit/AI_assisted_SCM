import time
from data.routes import ROUTES
from simulator.traffic import get_route_geometry
from state import SHIPMENT_STATE, init_shipment

ROUTE_CACHE = {}


def get_shipments(df):
    shipments = []

    for idx, row in df.iterrows():
        shipment_id = f"SHP-{1000 + idx}"

        route = row["Routes"]

        shipments.append({
            "shipment_id": shipment_id,
            "product": row["Product type"],
            "supplier": row["Supplier name"],
            "destination": row["Location"],
            "transport_mode": row["Transportation modes"],
            "route": route,
            "eta_days": int(row["Lead time"]) + int(row["Shipping times"]),
            "status": "In-Transit"
        })

    return shipments


def _get_route_points(route_name):
    if route_name in ROUTE_CACHE:
        return ROUTE_CACHE[route_name]

    route_meta = ROUTES.get(route_name)
    if not route_meta:
        return None

    route_points = get_route_geometry(
        route_meta["origin"],
        route_meta["destination"]
    )

    ROUTE_CACHE[route_name] = route_points
    return route_points


def initialize_live_shipments(shipments):
    for shipment in shipments:
        shipment_id = shipment["shipment_id"]

        if shipment_id in SHIPMENT_STATE:
            continue

        route_points = _get_route_points(shipment["route"])
        if not route_points:
            continue

        init_shipment(shipment_id, route_points)


def update_position(shipment_id):
    state = SHIPMENT_STATE[shipment_id]

    now = time.time()
    elapsed = now - state["last_updated"]

    # Move every 3 seconds
    if elapsed >= 3:
        state["current_index"] = min(
            state["current_index"] + 1,
            len(state["route_points"]) - 1
        )
        state["last_updated"] = now

    point = state["route_points"][state["current_index"]]
    if isinstance(point, dict):
        return point
    return {"lat": point[0], "lng": point[1]}
