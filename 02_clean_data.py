"""
Week 2: Data cleaning & preprocessing pipeline.
Input : data/raw_deliveries.csv
Output: data/clean_deliveries.csv
"""
import numpy as np
import pandas as pd

df = pd.read_csv("/home/claude/logistics_project/data/raw_deliveries.csv")
report = {}
report["rows_before"] = len(df)

# 1. Drop exact duplicate rows
dupes = df.duplicated().sum()
df = df.drop_duplicates()
report["duplicates_removed"] = int(dupes)

# 2. Normalize inconsistent categorical text
df["weather"] = df["weather"].str.strip().str.title()

# 3. Fix invalid / impossible values
neg_distance = (df["distance_km"] < 0).sum()
df.loc[df["distance_km"] < 0, "distance_km"] = np.nan  # treat as missing, impute below

weight_glitch = (df["package_weight_kg"] > 50).sum()   # no parcel realistically > 50kg on bike/van
df.loc[df["package_weight_kg"] > 50, "package_weight_kg"] = np.nan
report["invalid_distance_fixed"] = int(neg_distance)
report["weight_sensor_glitches_fixed"] = int(weight_glitch)

# 4. Handle missing values
#    - numeric: median imputation (robust to skew), grouped by vehicle_type where sensible
num_cols = ["package_weight_kg", "driver_experience_years", "distance_km", "cost_inr"]
missing_before = df[num_cols].isna().sum().to_dict()
for col in num_cols:
    df[col] = df[col].fillna(df.groupby("vehicle_type")[col].transform("median"))
#    - categorical: mode imputation
df["weather"] = df["weather"].fillna(df["weather"].mode()[0])
report["missing_values_before"] = {k: int(v) for k, v in missing_before.items()}

# 5. Outlier treatment on delivery_time_min via IQR capping (not deletion —
#    preserves sample size while limiting leverage of extreme delays)
q1, q3 = df["delivery_time_min"].quantile([0.25, 0.75])
iqr = q3 - q1
upper = q3 + 1.5 * iqr
outliers_capped = (df["delivery_time_min"] > upper).sum()
df["delivery_time_min"] = df["delivery_time_min"].clip(upper=upper)
report["delivery_time_outliers_capped"] = int(outliers_capped)

# 6. Normalization (min-max) of numeric features for modeling-readiness
scale_cols = ["distance_km", "package_weight_kg", "traffic_index",
              "driver_experience_years", "shipment_volume"]
for col in scale_cols:
    df[f"{col}_norm"] = (df[col] - df[col].min()) / (df[col].max() - df[col].min())

report["rows_after"] = len(df)
report["nulls_after"] = int(df.isna().sum().sum())

df.to_csv("/home/claude/logistics_project/data/clean_deliveries.csv", index=False)

import json
with open("/home/claude/logistics_project/data/cleaning_report.json", "w") as f:
    json.dump(report, f, indent=2)
print(json.dumps(report, indent=2))
