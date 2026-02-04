import { useEffect, useState } from "react";
import {
  fetchInventory,
  fetchShipments,
  fetchAnalytics,
  fetchSuppliers
} from "./services/api";

import LiveMap from "./components/LiveMap";
import KpiCards from "./components/KpiCards";
import ShipmentsTable from "./components/ShipmentsTable";
import InventoryTable from "./components/InventoryTable";
import SuppliersTable from "./components/SuppliersTable";

import "./styles/dashboard.css";

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);

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
  }, []);

  const refresh = () => {
    fetchShipments().then((data) => {
      setShipments(data);
      setSelectedShipmentId((prev) => {
        if (prev && data.some((s) => s.shipment_id === prev)) return prev;
        return data[0]?.shipment_id ?? null;
      });
    });
  };

  return (
    <div className="dashboard">
      <h1>Supply Chain Control Tower</h1>

      <div className="section">
        <KpiCards data={analytics} />
      </div>

      <div className="section">
        <h2>🗺️ Live Shipment Tracking</h2>
        <LiveMap activeShipmentId={selectedShipmentId} />
      </div>

      <ShipmentsTable
        shipments={shipments}
        onRefresh={refresh}
        selectedShipmentId={selectedShipmentId}
        onSelect={setSelectedShipmentId}
      />
      <SuppliersTable suppliers={suppliers} />
      <InventoryTable inventory={inventory} />
    </div>
  );
}
