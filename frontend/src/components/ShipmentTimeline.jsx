export default function ShipmentTimeline({ shipmentId, shipment, predictedEta, events }) {
  if (!shipmentId) return null;

  const baseEtaValue = predictedEta?.base_eta_days ?? shipment?.eta_days;
  const baseEta = Number.isFinite(Number(baseEtaValue))
    ? `${baseEtaValue} days`
    : "N/A";
  const predicted = Number.isFinite(Number(predictedEta?.predicted_eta_days))
    ? `${predictedEta.predicted_eta_days} days`
    : "N/A";
  const delayDriver = predictedEta?.delay_reason;
  const delayReason = shipment?.delay_reason;
  const createdEvent = events.find((event) => event.type === "CREATED");
  const departedEvent = events.find((event) => event.type === "DEPARTED");
  const formatEventTime = (event) =>
    event?.timestamp
      ? new Date(event.timestamp * 1000).toLocaleString()
      : "N/A";

  return (
    <div className="section">
      <h2>Shipment Timeline</h2>
      <div className="timeline-grid">
        <div className="timeline-cell">
          <div className="timeline-type">CREATED</div>
          <div className="timeline-value">{formatEventTime(createdEvent)}</div>
        </div>
        <div className="timeline-cell">
          <div className="timeline-type">ETA</div>
          <div className="timeline-value">{baseEta}</div>
        </div>
        <div className="timeline-cell">
          <div className="timeline-type">DEPARTED</div>
          <div className="timeline-value">{formatEventTime(departedEvent)}</div>
        </div>
        <div className="timeline-cell">
          <div className="timeline-type">PREDICTED ETA</div>
          <div className="timeline-value">{predicted}</div>
          {delayDriver ? (
            <div className="timeline-meta">Delay Driver: {delayDriver}</div>
          ) : null}
          {delayReason ? (
            <div className="timeline-meta">Reason: {delayReason}</div>
          ) : null}
        </div>
      </div>
      {events.length === 0 ? (
        <div className="muted">No events yet.</div>
      ) : (
        <ul className="timeline">
          {events.map((event, idx) => {
            const timestamp = event.timestamp
              ? new Date(event.timestamp * 1000).toLocaleString()
              : "N/A";
            const typeClass = `timeline-type ${event.type?.toLowerCase() || ""}`;
            return (
              <li key={`${event.timestamp}-${idx}`} className="timeline-item">
                <div className={typeClass}>{event.type}</div>
                <div className="timeline-message">{event.message}</div>
                {event.meta?.reason ? (
                  <div className="timeline-meta">Reason: {event.meta.reason}</div>
                ) : null}
                <div className="timeline-time">{timestamp}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
