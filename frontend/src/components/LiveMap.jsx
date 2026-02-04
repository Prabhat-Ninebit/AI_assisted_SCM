import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { API_BASE } from "../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const redMarkerIcon = new L.Icon.Default({ className: "marker-red" });

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 3;

function LiveMap({ activeShipmentId }) {
  const [route, setRoute] = useState([]);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    setRoute([]);
    setPosition(null);

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

  const center = position || (route.length ? [route[0].lat, route[0].lng] : DEFAULT_CENTER);
  const zoom = route.length ? 6 : DEFAULT_ZOOM;

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
      {position && <Marker position={position} icon={redMarkerIcon} />}
    </MapContainer>
  );
}

export default LiveMap;
