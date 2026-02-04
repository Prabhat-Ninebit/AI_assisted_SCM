import pandas as pd
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent / "data" / "supply_chain_data.csv"

def load_data():
    df = pd.read_csv(CSV_PATH)
    df = df[df["Transportation modes"].str.strip().str.lower() == "road"]
    return df
