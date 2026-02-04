import { delayShipment } from "../services/api";

export default function ShipmentsTable({
  shipments,
  onRefresh,
  selectedShipmentId,
  onSelect
}) {
  const handleDelay = async (id) => {
    await delayShipment(id);
    onRefresh();
  };

  return (
    <div className="section">
      <h2>🚚 Active Shipments</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Destination</th>
            <th>ETA</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => {
            const isSelected = s.shipment_id === selectedShipmentId;
            return (
              <tr
                key={s.shipment_id}
                className={`row-clickable ${isSelected ? "row-selected" : ""}`}
                onClick={() => onSelect?.(s.shipment_id)}
              >
              <td>{s.shipment_id}</td>
              <td>{s.product}</td>
              <td>{s.destination}</td>
              <td>{s.eta_days} days</td>
              <td>
                <span className={`badge ${s.status === "Delayed" ? "delayed" : "transit"}`}>
                  {s.status}
                </span>
              </td>
              <td>
                <button onClick={() => handleDelay(s.shipment_id)}>
                  Simulate Delay
                </button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
