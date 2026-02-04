import { useEffect, useState } from "react";
import {
  fetchInventory,
  fetchShipments,
  fetchAnalytics,
  fetchSuppliers,
  fetchPredictedEtas,
  fetchShipmentTimeline
} from "./services/api";

import LiveMap from "./components/LiveMap";
import KpiCards from "./components/KpiCards";
import ShipmentsTable from "./components/ShipmentsTable";
import InventoryTable from "./components/InventoryTable";
import SuppliersTable from "./components/SuppliersTable";
import ShipmentTimeline from "./components/ShipmentTimeline";

import "./styles/dashboard.css";

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);
  const [predictedEtas, setPredictedEtas] = useState({});
  const [timelineEvents, setTimelineEvents] = useState([]);
  const selectedShipment = shipments.find((s) => s.shipment_id === selectedShipmentId);

  useEffect(() => {
    fetchInventory().then(setInventory);
    fetchShipments().then((data) => {
      setShipments(data);
      setSelectedShipmentId((prev) => {
        if (prev && data.some((s) => s.shipment_id === prev)) return prev;
        return data[0]?.shipment_id ?? null;
      });
    });
    fetchAnalytics().then(setAnalytics);
    fetchSuppliers().then(setSuppliers);
    fetchPredictedEtas().then((data) => setPredictedEtas(data.etas || {}));
  }, []);

  useEffect(() => {
    if (!selectedShipmentId) {
      setTimelineEvents([]);
      return;
    }

    let cancelled = false;

    const loadTimeline = () => {
      fetchShipmentTimeline(selectedShipmentId).then((data) => {
        if (!cancelled) {
          setTimelineEvents(data.events || []);
        }
      });
    };

    loadTimeline();
    const interval = setInterval(loadTimeline, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedShipmentId]);

  return (
    <div className="dashboard">
      <h1>Supply Chain Control Tower</h1>

      <div className="section">
        <KpiCards data={analytics} />
      </div>

      <div className="section">
        <h2>🗺️ Live Shipment Tracking</h2>
        <LiveMap
          activeShipmentId={selectedShipmentId}
          delayDriver={predictedEtas?.[selectedShipmentId]?.delay_reason}
        />
      </div>

      <ShipmentTimeline
        shipmentId={selectedShipmentId}
        shipment={selectedShipment}
        predictedEta={predictedEtas?.[selectedShipmentId]}
        events={timelineEvents}
      />

      <ShipmentsTable
        shipments={shipments}
        selectedShipmentId={selectedShipmentId}
        onSelect={setSelectedShipmentId}
        predictedEtas={predictedEtas}
      />
      <SuppliersTable suppliers={suppliers} />
      <InventoryTable inventory={inventory} />
    </div>
  );
}
