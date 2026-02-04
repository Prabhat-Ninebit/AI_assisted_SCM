import os
import time
import requests
from dotenv import load_dotenv 
from state import SHIPMENT_STATE
from data.routes import ROUTES

load_dotenv()
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")
TOMTOM_FLOW_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OSRM_URL = "http://router.project-osrm.org/route/v1/driving"
OSRM_TIMEOUT_SECONDS = 4

CACHE_TTL_SECONDS = 300
_TRAFFIC_CACHE = {}
_WEATHER_CACHE = {}
_OSRM_CACHE = {}


def _cache_get(cache, key):
    cached = cache.get(key)
    if not cached:
        return None
    ts, value = cached
    if time.time() - ts > CACHE_TTL_SECONDS:
        cache.pop(key, None)
        return None
    return value


def _cache_set(cache, key, value):
    cache[key] = (time.time(), value)


def _normalize_point(point):
    if isinstance(point, dict):
        return point.get("lat"), point.get("lng")
    return point[0], point[1]


def _round_key(lat, lng):
    return round(lat, 2), round(lng, 2)


def get_osrm_base_eta_days(route_name):
    route_key = str(route_name).strip()
    cached = _cache_get(_OSRM_CACHE, route_key)
    if cached is not None:
        return cached

    route_meta = ROUTES.get(route_key)
    if not route_meta:
        return None

    origin = route_meta["origin"]
    destination = route_meta["destination"]
    coords = f"{origin['lng']},{origin['lat']};{destination['lng']},{destination['lat']}"
    url = f"{OSRM_URL}/{coords}"

    try:
        res = requests.get(url, params={"overview": "false"}, timeout=OSRM_TIMEOUT_SECONDS)
        res.raise_for_status()
        data = res.json()
        routes = data.get("routes")
        if not routes:
            return None

        duration_seconds = routes[0].get("duration")
        if not duration_seconds:
            return None

        base_eta_days = round(duration_seconds / 3600 / 24, 2)
        _cache_set(_OSRM_CACHE, route_key, base_eta_days)
        return base_eta_days
    except Exception:
        return None


def get_traffic_factor(lat, lng):
    if not TOMTOM_API_KEY:
        return 1.0, {"source": "tomtom", "status": "missing_key"}

    key = _round_key(lat, lng)
    cached = _cache_get(_TRAFFIC_CACHE, key)
    if cached:
        return cached["factor"], cached

    try:
        res = requests.get(
            TOMTOM_FLOW_URL,
            params={
                "key": TOMTOM_API_KEY,
                "point": f"{lat},{lng}"
            },
            timeout=4
        )
        res.raise_for_status()
        data = res.json().get("flowSegmentData", {})
        current_speed = float(data.get("currentSpeed", 0) or 0)
        free_flow = float(data.get("freeFlowSpeed", 0) or 0)
        if current_speed <= 0 or free_flow <= 0:
            factor = 1.0
        else:
            ratio = free_flow / current_speed
            factor = max(1.0, min(ratio, 2.5))

        payload = {
            "factor": round(factor, 3),
            "current_speed": current_speed,
            "free_flow_speed": free_flow,
            "source": "tomtom",
            "status": "ok"
        }
        _cache_set(_TRAFFIC_CACHE, key, payload)
        return payload["factor"], payload
    except Exception:
        return 1.0, {"source": "tomtom", "status": "error"}


def get_weather_delay(lat, lng):
    key = _round_key(lat, lng)
    cached = _cache_get(_WEATHER_CACHE, key)
    if cached:
        return cached["delay_hours"], cached

    try:
        res = requests.get(
            OPEN_METEO_URL,
            params={
                "latitude": lat,
                "longitude": lng,
                "current": "precipitation,weather_code,wind_speed_10m"
            },
            timeout=4
        )
        res.raise_for_status()
        current = res.json().get("current", {})
        precipitation = float(current.get("precipitation", 0) or 0)
        wind_speed = float(current.get("wind_speed_10m", 0) or 0)
        weather_code = current.get("weather_code")

        delay_hours = 0.0
        if precipitation >= 10:
            delay_hours += 2.0
        elif precipitation >= 2:
            delay_hours += 1.0

        if wind_speed >= 15:
            delay_hours += 1.5
        elif wind_speed >= 8:
            delay_hours += 0.5

        payload = {
            "delay_hours": round(delay_hours, 2),
            "precipitation": precipitation,
            "wind_speed": wind_speed,
            "weather_code": weather_code,
            "source": "open-meteo",
            "status": "ok"
        }
        _cache_set(_WEATHER_CACHE, key, payload)
        return payload["delay_hours"], payload
    except Exception:
        return 0.0, {"source": "open-meteo", "status": "error"}


def infer_delay_reason(lat, lng):
    traffic_factor, traffic_meta = get_traffic_factor(lat, lng)
    weather_delay_hours, weather_meta = get_weather_delay(lat, lng)

    if weather_delay_hours >= 1.0:
        return "Weather disruption", {
            "traffic": traffic_meta,
            "weather": weather_meta
        }

    if traffic_factor >= 1.3:
        return "Traffic congestion", {
            "traffic": traffic_meta,
            "weather": weather_meta
        }

    return "Operational delay", {
        "traffic": traffic_meta,
        "weather": weather_meta
    }


def build_predicted_eta(shipment_id, base_eta_days):
    state = SHIPMENT_STATE.get(shipment_id)
    if not state or not state.get("route_points"):
        return {
            "shipment_id": shipment_id,
            "base_eta_days": base_eta_days,
            "predicted_eta_days": base_eta_days,
            "traffic_factor": 1.0,
            "weather_delay_hours": 0.0,
            "sources": {}
        }

    point = state["route_points"][state["current_index"]]
    lat, lng = _normalize_point(point)
    if lat is None or lng is None:
        return {
            "shipment_id": shipment_id,
            "base_eta_days": base_eta_days,
            "predicted_eta_days": base_eta_days,
            "traffic_factor": 1.0,
            "weather_delay_hours": 0.0,
            "sources": {}
        }

    traffic_factor, traffic_meta = get_traffic_factor(lat, lng)
    weather_delay_hours, weather_meta = get_weather_delay(lat, lng)

    traffic_delay_days = max(0.0, base_eta_days * (traffic_factor - 1))
    weather_delay_days = max(0.0, weather_delay_hours / 24)
    predicted_eta_days = base_eta_days + traffic_delay_days + weather_delay_days
    predicted_eta_days = round(predicted_eta_days, 2)

    total_delay_days = traffic_delay_days + weather_delay_days
    if total_delay_days <= 0.05:
        delay_reason = "On time"
    elif traffic_delay_days > 0 and weather_delay_days > 0:
        if traffic_delay_days >= weather_delay_days * 1.25:
            delay_reason = "Traffic"
        elif weather_delay_days >= traffic_delay_days * 1.25:
            delay_reason = "Weather"
        else:
            delay_reason = "Traffic + Weather"
    elif traffic_delay_days > 0:
        delay_reason = "Traffic"
    else:
        delay_reason = "Weather"

    return {
        "shipment_id": shipment_id,
        "base_eta_days": base_eta_days,
        "predicted_eta_days": predicted_eta_days,
        "delay_reason": delay_reason,
        "delay_breakdown_days": {
            "traffic": round(traffic_delay_days, 2),
            "weather": round(weather_delay_days, 2)
        },
        "traffic_factor": traffic_factor,
        "weather_delay_hours": weather_delay_hours,
        "sources": {
            "traffic": traffic_meta,
            "weather": weather_meta
        }
    }


def get_predicted_etas(shipments):
    etas = {}
    for shipment in shipments:
        shipment_id = shipment["shipment_id"]
        route_name = shipment.get("route")
        base_eta_days = get_osrm_base_eta_days(route_name)
        if base_eta_days is None:
            base_eta_days = shipment.get("eta_days", 0)

        etas[shipment_id] = build_predicted_eta(shipment_id, base_eta_days)
    return {"etas": etas, "generated_at": time.time()}
