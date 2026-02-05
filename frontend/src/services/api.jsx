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

export const fetchPredictedEtas = async () => {
  const res = await fetch(`${API_BASE}/shipments/eta`);
  return res.json();
};

export const fetchShipmentTimeline = async (id) => {
  const res = await fetch(`${API_BASE}/shipments/${id}/timeline`);
  return res.json();
};

export const fetchRouteTraffic = async (id, { sampleSize = 30, threshold = 1.3 } = {}) => {
  const params = new URLSearchParams({
    sample_size: String(sampleSize),
    threshold: String(threshold)
  });
  const res = await fetch(`${API_BASE}/shipments/${id}/traffic?${params}`);
  return res.json();
};
