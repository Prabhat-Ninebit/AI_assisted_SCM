def get_inventory(df):
    inventory = []

    for _, row in df.iterrows():
        status = "LOW" if row["Stock levels"] < row["Order quantities"] else "OK"

        inventory.append({
            "sku": row["Product type"],
            "warehouse": row["Location"],
            "stock_level": int(row["Stock levels"]),
            "demand": int(row["Order quantities"]),
            "availability": row["Availability"],
            "status": status
        })

    return inventory
