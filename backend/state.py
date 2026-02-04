import time

SHIPMENT_STATE = {}

def init_shipment(shipment_id, route_points):
    SHIPMENT_STATE[shipment_id] = {
        # Business state
        "status": "In-Transit",
        "delay_days": 0,

        # Live tracking state
        "route_points": route_points,
        "current_index": 0,
        "last_updated": time.time()
    }
