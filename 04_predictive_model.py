"""
Week 4: Predictive Modeling & Optimization
Target: delivery_time_min
"""
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

df = pd.read_csv("/home/claude/logistics_project/data/clean_deliveries.csv")

features_num = ["distance_km", "package_weight_kg", "traffic_index",
                 "driver_experience_years", "shipment_volume"]
features_cat = ["weather", "time_of_day", "vehicle_type"]
target = "delivery_time_min"

X = df[features_num + features_cat]
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

pre = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), features_cat),
], remainder="passthrough")

results = {}

# --- Model 1: Linear Regression (baseline, interpretable) ---
lin_pipe = Pipeline([("pre", pre), ("model", LinearRegression())])
lin_pipe.fit(X_train, y_train)
pred_lin = lin_pipe.predict(X_test)
results["linear_regression"] = {
    "RMSE": float(np.sqrt(mean_squared_error(y_test, pred_lin))),
    "MAE": float(mean_absolute_error(y_test, pred_lin)),
    "R2": float(r2_score(y_test, pred_lin)),
}

# --- Model 2: Random Forest (captures non-linearity/interactions) ---
rf_pipe = Pipeline([("pre", pre), ("model", RandomForestRegressor(random_state=42))])
param_grid = {"model__n_estimators": [100, 200], "model__max_depth": [5, 8, None]}
grid = GridSearchCV(rf_pipe, param_grid, cv=5, scoring="neg_root_mean_squared_error")
grid.fit(X_train, y_train)
best_rf = grid.best_estimator_
pred_rf = best_rf.predict(X_test)
results["random_forest"] = {
    "RMSE": float(np.sqrt(mean_squared_error(y_test, pred_rf))),
    "MAE": float(mean_absolute_error(y_test, pred_rf)),
    "R2": float(r2_score(y_test, pred_rf)),
    "best_params": grid.best_params_,
}

# 5-fold CV RMSE for the chosen (best) model, for stability check
cv_scores = cross_val_score(best_rf, X, y, cv=5, scoring="neg_root_mean_squared_error")
results["random_forest"]["cv_rmse_mean"] = float(-cv_scores.mean())
results["random_forest"]["cv_rmse_std"] = float(cv_scores.std())

with open("/home/claude/logistics_project/data/model_results.json", "w") as f:
    json.dump(results, f, indent=2)
print(json.dumps(results, indent=2))

# --- Feature importance chart (Random Forest) ---
ohe_names = best_rf.named_steps["pre"].named_transformers_["cat"].get_feature_names_out(features_cat)
all_names = list(ohe_names) + features_num
importances = best_rf.named_steps["model"].feature_importances_
imp_df = pd.DataFrame({"feature": all_names, "importance": importances}).sort_values("importance", ascending=True).tail(12)

plt.figure(figsize=(7.5, 5))
plt.barh(imp_df["feature"], imp_df["importance"], color="#2E8B57")
plt.title("Top Feature Importances — Random Forest Delivery-Time Model")
plt.xlabel("Importance")
plt.tight_layout()
plt.savefig("/home/claude/logistics_project/charts/06_feature_importance.png", dpi=150)
plt.close()

# --- Predicted vs actual chart ---
plt.figure(figsize=(6, 6))
plt.scatter(y_test, pred_rf, alpha=0.6, color="#2E5EAA")
lims = [min(y_test.min(), pred_rf.min()), max(y_test.max(), pred_rf.max())]
plt.plot(lims, lims, "r--", label="Perfect prediction")
plt.xlabel("Actual delivery time (min)")
plt.ylabel("Predicted delivery time (min)")
plt.title("Random Forest: Predicted vs Actual Delivery Time")
plt.legend()
plt.tight_layout()
plt.savefig("/home/claude/logistics_project/charts/07_pred_vs_actual.png", dpi=150)
plt.close()

print("Done.")
