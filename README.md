# Logistics Data Analyst Intern — Weekly Project (YuvaIntern)

Simulated last-mile delivery analytics project for an e-commerce logistics company.
Predicts `delivery_time_min` from distance, traffic, weather, vehicle type, and more.

## Structure
- `code/01_simulate_raw_data.py` — generates the raw (intentionally messy) dataset
- `code/02_clean_data.py` — cleaning & preprocessing pipeline
- `code/03_eda_visualize.py` — EDA and chart generation
- `code/04_predictive_model.py` — Linear Regression & Random Forest models, evaluation, feature importance
- `data/` — raw and cleaned CSVs, cleaning + model result JSON reports
- `charts/` — all generated PNG visualizations

## Run order
python code/01_simulate_raw_data.py
python code/02_clean_data.py
python code/03_eda_visualize.py
python code/04_predictive_model.py

## Key result
Linear Regression: RMSE 5.02 min, MAE 3.44 min, R² 0.845 on held-out test data.
Top drivers of delivery time: distance_km, traffic_index, weather, vehicle_type.
