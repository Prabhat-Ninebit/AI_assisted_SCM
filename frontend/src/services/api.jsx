export const API_BASE = "http://localhost:8000";

export const fetchInventory = async () => {
  const res = await fetch(`${API_BASE}/inventory`);
  return res.json();
};

export const fetchShipments = async () => {
  const res = await fetch(`${API_BASE}/shipments`);
  return res.json();
};

export const fetchSuppliers = async () => {
  const res = await fetch(`${API_BASE}/suppliers`);
  return res.json();
};

export const fetchAnalytics = async () => {
  const res = await fetch(`${API_BASE}/analytics`);
  return res.json();
};

export const delayShipment = async (id) => {
  await fetch(`${API_BASE}/shipments/${id}/delay`, {
    method: "POST"
  });
};
