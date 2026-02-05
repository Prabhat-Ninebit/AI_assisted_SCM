import { MapContainer, TileLayer, Marker, Polyline, Tooltip, CircleMarker } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { API_BASE, fetchRouteTraffic } from "../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const redMarkerIcon = new L.Icon.Default({ className: "marker-red" });

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 3;

function LiveMap({ activeShipmentId, delayDriver }) {
  const [route, setRoute] = useState([]);
  const [position, setPosition] = useState(null);
  const [trafficHotspots, setTrafficHotspots] = useState([]);

  useEffect(() => {
    setRoute([]);
    setPosition(null);
    setTrafficHotspots([]);

    if (!activeShipmentId) return;

    fetch(`${API_BASE}/shipments/${activeShipmentId}/route`)
      .then((res) => res.json())
      .then((data) => {
        if (data.route) {
          setRoute(data.route);
        }
      });
  }, [activeShipmentId]);

  useEffect(() => {
    if (!activeShipmentId) return;

    const interval = setInterval(() => {
      fetch(`${API_BASE}/shipments/${activeShipmentId}/position`)
        .then((res) => res.json())
        .then((data) => {
          if (data.position) {
            setPosition([data.position.lat, data.position.lng]);
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeShipmentId]);

  useEffect(() => {
    if (!activeShipmentId) return;

    let cancelled = false;

    const loadTraffic = () => {
      fetchRouteTraffic(activeShipmentId, { sampleSize: 32, threshold: 1.3 })
        .then((data) => {
          if (!cancelled) {
            setTrafficHotspots(data.hotspots || []);
          }
        })
        .catch(() => {
          if (!cancelled) setTrafficHotspots([]);
        });
    };

    loadTraffic();
    const interval = setInterval(loadTraffic, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeShipmentId]);

  const center = position || (route.length ? [route[0].lat, route[0].lng] : DEFAULT_CENTER);
  const zoom = route.length ? 6 : DEFAULT_ZOOM;
  const trafficLabel = delayDriver?.includes("Traffic")
    ? delayDriver === "Traffic + Weather"
      ? "Delay: Traffic + Weather"
      : "Delay: Heavy traffic"
    : null;

  const getTrafficColor = (severity) => (severity === "high" ? "#dc2626" : "#f97316");

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="(c) OpenStreetMap contributors"
      />

      {route.length > 0 && <Polyline positions={route.map((p) => [p.lat, p.lng])} />}
      {trafficHotspots.map((spot, idx) => {
        const color = getTrafficColor(spot.severity);
        return (
          <CircleMarker
            key={`${spot.lat}-${spot.lng}-${idx}`}
            center={[spot.lat, spot.lng]}
            radius={10}
            color={color}
            weight={2}
            fillColor={color}
            fillOpacity={0.55}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              Heavy traffic ({spot.factor}x)
            </Tooltip>
          </CircleMarker>
        );
      })}
      {position && (
        <Marker position={position} icon={redMarkerIcon}>
          {trafficLabel ? (
            <Tooltip direction="top" offset={[0, -10]} permanent>
              {trafficLabel}
            </Tooltip>
          ) : null}
        </Marker>
      )}
    </MapContainer>
  );
}

export default LiveMap;
