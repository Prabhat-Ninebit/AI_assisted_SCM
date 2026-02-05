export default function ShipmentsTable({
  shipments,
  selectedShipmentId,
  onSelect,
  predictedEtas
}) {
  const getRiskLevel = (shipment) => {
    const baseEta = predictedEtas?.[shipment.shipment_id]?.base_eta_days;
    const predicted = predictedEtas?.[shipment.shipment_id]?.predicted_eta_days;
    const base = Number(baseEta ?? shipment.eta_days ?? 0);
    const predictedNum = Number(predicted);
    const delayDays = Number.isFinite(predictedNum)
      ? Math.max(0, predictedNum - base)
      : Number(shipment.delay_days || 0);
    const delayHours = delayDays * 24;

    if (delayHours > 4) return "high";
    if (delayHours > 2) return "medium";
    return "low";
  };

  return (
    <div className="section">
      <h2>🚚 Active Shipments</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>ETA (days)</th>
            <th>Status</th>
            <th>Predicted ETA (days)</th>
            <th>Risk</th>
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
              <td>{s.origin || "N/A"}</td>
              <td>{s.destination}</td>
              <td>
                {Number.isFinite(Number(predictedEtas?.[s.shipment_id]?.base_eta_days))
                  ? `${predictedEtas[s.shipment_id].base_eta_days} days`
                  : Number.isFinite(Number(s.eta_days))
                    ? `${s.eta_days} days`
                    : "N/A"}
              </td>
              <td>
                <span className={`badge ${s.status === "Delayed" ? "delayed" : "transit"}`}>
                  {s.status}
                </span>
              </td>
              <td>
                {predictedEtas?.[s.shipment_id]?.predicted_eta_days ? (
                  <span
                    title={
                      predictedEtas?.[s.shipment_id]?.delay_reason
                        ? `Delay driver: ${predictedEtas[s.shipment_id].delay_reason}`
                        : undefined
                    }
                  >
                    {predictedEtas[s.shipment_id].predicted_eta_days} days
                  </span>
                ) : (
                  "N/A"
                )}
                {predictedEtas?.[s.shipment_id]?.delay_reason ? (
                  <div className="table-subtext">
                    Driver: {predictedEtas[s.shipment_id].delay_reason}
                  </div>
                ) : null}
              </td>
              <td>
                {(() => {
                  const risk = getRiskLevel(s);
                  const label = risk === "high" ? "High" : risk === "medium" ? "Medium" : "Low";
                  return (
                    <button
                      type="button"
                      className={`risk-button ${
                        risk === "high" ? "risk-high" : risk === "medium" ? "risk-medium" : "risk-low"
                      }`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className="risk-dot" />
                      {label}
                    </button>
                  );
                })()}
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
}
