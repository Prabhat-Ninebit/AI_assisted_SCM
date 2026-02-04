export default function SuppliersTable({ suppliers }) {
  return (
    <div className="section">
      <h2>Supplier Performance</h2>

      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Avg Lead Time</th>
            <th>Avg Defect Rate</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.supplier}>
              <td>{s.supplier}</td>
              <td>{s.lead_time} days</td>
              <td>{s.defect_rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
