import requests

OSRM_URL = "http://router.project-osrm.org/route/v1/driving"
OSRM_TIMEOUT_SECONDS = 4


def get_route_geometry(origin, destination):
    coords = f"{origin['lng']},{origin['lat']};{destination['lng']},{destination['lat']}"
    url = f"{OSRM_URL}/{coords}?overview=full&geometries=geojson"

    try:
        res = requests.get(url, timeout=OSRM_TIMEOUT_SECONDS)
        res.raise_for_status()
        data = res.json()
        routes = data.get("routes")
        if not routes:
            raise ValueError("No routes in OSRM response")

        geometry = routes[0]["geometry"]["coordinates"]
        if not geometry:
            raise ValueError("Empty geometry")

        # Convert to frontend-friendly format
        return [
            {"lat": coord[1], "lng": coord[0]}
            for coord in geometry
        ]
    except Exception:
        # Fallback to a straight line if OSRM is unavailable.
        return [
            {"lat": origin["lat"], "lng": origin["lng"]},
            {"lat": destination["lat"], "lng": destination["lng"]},
        ]
