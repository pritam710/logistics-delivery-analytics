"""
Week 3: Exploratory Data Analysis & Visualization
"""
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="whitegrid")
df = pd.read_csv("/home/claude/logistics_project/data/clean_deliveries.csv")
CH = "/home/claude/logistics_project/charts"

print(df[["distance_km", "delivery_time_min", "traffic_index", "cost_inr"]].describe())

# 1. Distribution of delivery time
plt.figure(figsize=(7, 4.5))
sns.histplot(df["delivery_time_min"], bins=30, kde=True, color="#2E5EAA")
plt.title("Distribution of Delivery Time (minutes)")
plt.xlabel("Delivery time (min)")
plt.tight_layout()
plt.savefig(f"{CH}/01_delivery_time_dist.png", dpi=150)
plt.close()

# 2. Delivery time vs distance, colored by weather
plt.figure(figsize=(7, 4.5))
sns.scatterplot(data=df, x="distance_km", y="delivery_time_min", hue="weather", alpha=0.7)
plt.title("Delivery Time vs Distance by Weather")
plt.xlabel("Distance (km)")
plt.ylabel("Delivery time (min)")
plt.tight_layout()
plt.savefig(f"{CH}/02_time_vs_distance.png", dpi=150)
plt.close()

# 3. Correlation heatmap
plt.figure(figsize=(6.5, 5.5))
num_cols = ["distance_km", "package_weight_kg", "traffic_index",
            "driver_experience_years", "shipment_volume", "delivery_time_min", "cost_inr"]
corr = df[num_cols].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", center=0)
plt.title("Correlation Matrix of Key Logistics Variables")
plt.tight_layout()
plt.savefig(f"{CH}/03_correlation_heatmap.png", dpi=150)
plt.close()

# 4. Average delivery time by vehicle type and time of day
plt.figure(figsize=(7.5, 4.5))
pivot = df.pivot_table(values="delivery_time_min", index="time_of_day",
                        columns="vehicle_type", aggfunc="mean")
pivot = pivot.reindex(["Morning", "Afternoon", "Evening", "Night"])
pivot.plot(kind="bar", ax=plt.gca())
plt.title("Average Delivery Time by Vehicle Type & Time of Day")
plt.ylabel("Avg delivery time (min)")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig(f"{CH}/04_time_by_vehicle_tod.png", dpi=150)
plt.close()

# 5. Traffic index vs delivery time boxplot
plt.figure(figsize=(7.5, 4.5))
sns.boxplot(data=df, x="traffic_index", y="delivery_time_min", color="#71A9F7")
plt.title("Delivery Time Spread Across Traffic Index Levels")
plt.xlabel("Traffic index (1=light, 10=heavy)")
plt.ylabel("Delivery time (min)")
plt.tight_layout()
plt.savefig(f"{CH}/05_traffic_boxplot.png", dpi=150)
plt.close()

print("Charts saved.")
print("Corr with delivery_time_min:\n", corr["delivery_time_min"].sort_values(ascending=False))
