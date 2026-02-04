def get_suppliers(df):
    suppliers = {}

    for _, row in df.iterrows():
        name = row["Supplier name"]
        suppliers.setdefault(name, {
            "supplier": name,
            "avg_lead_time": [],
            "avg_defect_rate": []
        })

        suppliers[name]["avg_lead_time"].append(row["Lead time"])
        suppliers[name]["avg_defect_rate"].append(row["Defect rates"])

    return [
        {
            "supplier": k,
            "lead_time": round(sum(v["avg_lead_time"]) / len(v["avg_lead_time"]), 1),
            "defect_rate": round(sum(v["avg_defect_rate"]) / len(v["avg_defect_rate"]), 2)
        }
        for k, v in suppliers.items()
    ]
