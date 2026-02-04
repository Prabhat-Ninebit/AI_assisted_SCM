from services.eta import get_osrm_base_eta_days


def get_kpis(df):
    lead_times = []
    for _, row in df.iterrows():
        route_name = row.get("Routes")
        osrm_eta_days = get_osrm_base_eta_days(route_name)
        lead_times.append(osrm_eta_days if osrm_eta_days is not None else row["Lead time"])

    avg_lead_time = round(sum(lead_times) / len(lead_times), 1) if lead_times else 0

    return {
        "avg_shipping_cost": round(df["Shipping costs"].mean(), 2),
        "avg_lead_time": avg_lead_time,
        "high_defect_products": int((df["Defect rates"] > 0.05).sum()),
        "low_stock_items": int((df["Stock levels"] < df["Order quantities"]).sum())
    }
