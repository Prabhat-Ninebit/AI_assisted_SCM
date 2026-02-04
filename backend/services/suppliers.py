from services.eta import get_osrm_base_eta_days


def get_suppliers(df):
    suppliers = {}

    for _, row in df.iterrows():
        name = row["Supplier name"]
        suppliers.setdefault(name, {
            "supplier": name,
            "avg_lead_time": [],
            "avg_defect_rate": []
        })

        route_name = row.get("Routes")
        osrm_eta_days = get_osrm_base_eta_days(route_name)
        lead_time_days = osrm_eta_days if osrm_eta_days is not None else row["Lead time"]

        suppliers[name]["avg_lead_time"].append(lead_time_days)
        suppliers[name]["avg_defect_rate"].append(row["Defect rates"])

    return [
        {
            "supplier": k,
            "lead_time": round(sum(v["avg_lead_time"]) / len(v["avg_lead_time"]), 1),
            "defect_rate": round(sum(v["avg_defect_rate"]) / len(v["avg_defect_rate"]), 2)
        }
        for k, v in suppliers.items()
    ]
