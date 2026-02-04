export default function InventoryTable({ inventory }) {
  return (
    <div className="section">
      <h2>📦 Inventory Status</h2>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Warehouse</th>
            <th>Stock</th>
            <th>Demand</th>
            <th>Availability</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item, idx) => (
            <tr key={idx}>
              <td>{item.sku}</td>
              <td>{item.warehouse}</td>
              <td>{item.stock_level}</td>
              <td>{item.demand}</td>
              <td>{item.availability}</td>
              <td>
                <span className={`badge ${item.status === "LOW" ? "low" : "ok"}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
