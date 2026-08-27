"""
Week 1-2: Simulate a raw, messy last-mile delivery dataset for an
e-commerce logistics company operating in a mid-sized Indian city.

Target variable: delivery_time_min
"""
import numpy as np
import pandas as pd

np.random.seed(42)
N = 600

vehicle_types = ["Bike", "Van", "Truck"]
weather_opts = ["Clear", "Rain", "Fog"]
time_opts = ["Morning", "Afternoon", "Evening", "Night"]

df = pd.DataFrame({
    "order_id": [f"ORD{1000+i}" for i in range(N)],
    "distance_km": np.round(np.random.gamma(shape=2.2, scale=2.5, size=N), 2),
    "package_weight_kg": np.round(np.random.exponential(scale=3.5, size=N), 2),
    "traffic_index": np.random.randint(1, 11, size=N),          # 1=light, 10=heavy
    "weather": np.random.choice(weather_opts, size=N, p=[0.65, 0.25, 0.10]),
    "time_of_day": np.random.choice(time_opts, size=N),
    "driver_experience_years": np.round(np.random.uniform(0.2, 12, size=N), 1),
    "vehicle_type": np.random.choice(vehicle_types, size=N, p=[0.5, 0.35, 0.15]),
    "shipment_volume": np.random.poisson(lam=1.4, size=N) + 1,   # parcels in same run
})

# --- base delivery time model (ground truth signal) ---
base = (
    5
    + df["distance_km"] * 3.1
    + df["traffic_index"] * 1.8
    + df["package_weight_kg"] * 0.4
    + df["shipment_volume"] * 2.0
    - df["driver_experience_years"] * 0.35
)
weather_penalty = df["weather"].map({"Clear": 0, "Rain": 9, "Fog": 6})
vehicle_penalty = df["vehicle_type"].map({"Bike": -3, "Van": 0, "Truck": 5})
noise = np.random.normal(0, 4, size=N)

df["delivery_time_min"] = np.round(
    (base + weather_penalty + vehicle_penalty + noise).clip(lower=5), 1
)

# --- estimated delivery cost (₹) — used for the cost-per-shipment KPI ---
cost_base = {"Bike": 18, "Van": 35, "Truck": 60}
df["cost_inr"] = np.round(
    df["vehicle_type"].map(cost_base)
    + df["distance_km"] * 4.2
    + df["package_weight_kg"] * 1.5
    + np.random.normal(0, 5, size=N),
    2,
)

# --- inject realistic data-quality problems for the Week 2 cleaning task ---
# 1. Missing values
for col, frac in [("package_weight_kg", 0.04), ("driver_experience_years", 0.03),
                   ("weather", 0.02), ("cost_inr", 0.02)]:
    idx = df.sample(frac=frac, random_state=1).index
    df.loc[idx, col] = np.nan

# 2. Outliers / bad entries
outlier_idx = df.sample(n=8, random_state=2).index
df.loc[outlier_idx, "delivery_time_min"] *= 4          # extreme delays
df.loc[df.sample(n=5, random_state=3).index, "distance_km"] = -1.0  # invalid negative distance
df.loc[df.sample(n=4, random_state=4).index, "package_weight_kg"] = 500  # sensor glitch

# 3. Duplicate rows
dupes = df.sample(n=6, random_state=5)
df = pd.concat([df, dupes], ignore_index=True)

# 4. Inconsistent categorical casing
df.loc[df.sample(n=10, random_state=6).index, "weather"] = df.loc[
    df.sample(n=10, random_state=6).index, "weather"
].str.lower()

df.to_csv("/home/claude/logistics_project/data/raw_deliveries.csv", index=False)
print("Raw rows:", len(df))
print(df.isna().sum())
