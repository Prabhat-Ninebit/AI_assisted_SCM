import time

SHIPMENT_STATE = {}

def add_event(shipment_id, event_type, message, meta=None):
    if shipment_id not in SHIPMENT_STATE:
        return
    SHIPMENT_STATE[shipment_id]["events"].append({
        "type": event_type,
        "message": message,
        "meta": meta or {},
        "timestamp": time.time()
    })

def init_shipment(shipment_id, route_points):
    SHIPMENT_STATE[shipment_id] = {
        # Business state
        "status": "In-Transit",
        "delay_days": 0,
        "delay_reason": None,
        "arrived": False,

        # Live tracking state
        "route_points": route_points,
        "current_index": 0,
        "last_updated": time.time(),

        # Event timeline
        "events": []
    }

    add_event(shipment_id, "CREATED", "Shipment created")
    add_event(shipment_id, "DEPARTED", "Shipment departed")
