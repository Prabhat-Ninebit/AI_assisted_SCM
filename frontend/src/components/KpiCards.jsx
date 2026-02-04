export default function KpiCards({ data }) {
  if (!data) return null;

  return (
    <div className="kpi-grid">
      <Kpi title="Avg Lead Time" value={`${data.avg_lead_time} days`} />
      <Kpi title="Avg Shipping Cost" value={`$${data.avg_shipping_cost}`} />
      <Kpi title="Low Stock Items" value={data.low_stock_items} />
      <Kpi title="High Defect Products" value={data.high_defect_products} />
    </div>
  );
}

function Kpi({ title, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
