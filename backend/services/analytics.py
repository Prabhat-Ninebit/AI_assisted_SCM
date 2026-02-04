def get_kpis(df):
    return {
        "avg_shipping_cost": round(df["Shipping costs"].mean(), 2),
        "avg_lead_time": round(df["Lead time"].mean(), 1),
        "high_defect_products": int((df["Defect rates"] > 0.05).sum()),
        "low_stock_items": int((df["Stock levels"] < df["Order quantities"]).sum())
    }
