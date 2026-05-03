from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, timedelta

app = Flask(__name__)

MODEL_DIR = os.path.dirname(__file__)  

print("Loading models...")
revenue_model    = joblib.load(os.path.join(MODEL_DIR, "final_revenue_model_v2.pkl"))
revenue_scaler   = joblib.load(os.path.join(MODEL_DIR, "final_revenue_scaler_v2.pkl"))
revenue_features = joblib.load(os.path.join(MODEL_DIR, "final_revenue_features_v2.pkl"))

demand_model    = joblib.load(os.path.join(MODEL_DIR, "final_demand_model.pkl"))
demand_scaler   = joblib.load(os.path.join(MODEL_DIR, "final_demand_scaler.pkl"))
demand_features = joblib.load(os.path.join(MODEL_DIR, "final_demand_features.pkl"))
demand_encoder  = joblib.load(os.path.join(MODEL_DIR, "final_demand_label_encoder.pkl"))
print("Models loaded.")

def days_to_event(date, month, day, cap=60):
    this_year = datetime(year=date.year, month=month, day=day)
    delta = (this_year - datetime(date.year, date.month, date.day)).days
    if delta < 0:
        next_year = datetime(year=date.year + 1, month=month, day=day)
        delta = (next_year - datetime(date.year, date.month, date.day)).days
    return min(delta, cap)

def build_revenue_row(date, lag_values, roll_means, roll_stds, momentum):
    """Build one feature row for the revenue model."""
    return {
        "Day_of_week"      : date.weekday(),
        "Is_weekend"       : int(date.weekday() in [5, 6]),
        "Month"            : date.month,
        "Day_of_month"     : date.day,
        "Quarter"          : (date.month - 1) // 3 + 1,
        "Week_of_year"     : date.isocalendar()[1],
        "Year"             : date.year,
        "Days_to_christmas": days_to_event(date, 12, 25),
        "Days_to_newyear"  : days_to_event(date, 1, 1),
        "Is_holiday_season": int(date.month == 12 and date.day >= 15),
        "Is_black_friday"  : int(date.month == 11 and date.weekday() == 4 and date.day >= 23),
        "Is_covid_period"  : 0,   # always 0 going forward
        **lag_values,
        **roll_means,
        **roll_stds,
        "momentum"         : momentum,
        "lag_364"          : lag_values.get("lag_364", 0),
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "models_loaded": True})


@app.route("/predict/revenue", methods=["POST"])
def predict_revenue():
    try:
        body    = request.get_json()
        history = body.get("historical_revenue", [])

        if len(history) < 30:
            return jsonify({"error": "Need at least 30 days of historical revenue"}), 400

        history = [float(x) for x in history]
        forecasts = []
        today = datetime.today()

        for i in range(7):
            fdate = today + timedelta(days=i + 1)
            tail  = history[:]

            def safe_lag(n):
                return tail[-n] if len(tail) >= n else 0.0

            def safe_roll_mean(n):
                return float(np.mean(tail[-n:])) if len(tail) >= n else float(np.mean(tail))

            def safe_roll_std(n):
                return float(np.std(tail[-n:])) if len(tail) >= n else 0.0

            lag_values = {
                f"lag_{n}": safe_lag(n)
                for n in [7, 14, 30, 90, 365]
            }
            roll_means = {
                f"rolling_mean_{n}": safe_roll_mean(n)
                for n in [7, 14, 30, 90]
            }
            roll_stds = {
                f"rolling_std_{n}": safe_roll_std(n)
                for n in [7, 14, 30, 90]
            }
            momentum = float(np.clip(
                safe_roll_mean(7) / (safe_roll_mean(30) + 1e-9), 0.3, 3.0
            ))
            lag_values["lag_364"] = safe_lag(364)

            row = build_revenue_row(fdate, lag_values, roll_means, roll_stds, momentum)
            X   = pd.DataFrame([row])[revenue_features]
            X_s = revenue_scaler.transform(X)
            pred = max(0.0, float(revenue_model.predict(X_s)[0]))

            forecasts.append({
                "date"            : fdate.strftime("%Y-%m-%d"),
                "revenu_predit"   : round(pred, 2),
            })

            # Append prediction to history so next day's lags are correct
            history.append(pred)

        return jsonify({"forecasts": forecasts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/restock", methods=["POST"])
def predict_restock():
    try:
        body     = request.get_json()
        products = body.get("products", [])

        if not products:
            return jsonify({"error": "No products provided"}), 400

        DEMAND_MULTIPLIER = 1.2
        alerts = []

        for product in products:
            nom       = product.get("nom_produit", "unknown")
            history   = [float(x) for x in product.get("historical_units", [])]
            avg_price = float(product.get("avg_price", 0))
            qte_dispo = float(product.get("qte_dispo", 0))

            if len(history) < 7:
                alerts.append({
                    "nom_produit"        : nom,
                    "unite_7j"           : None,
                    "alerte_restock"     : False,
                    "jours_stock_restant": None,
                    "message"            : "Données insuffisantes (< 7 jours)",
                })
                continue

            # Encode product name — use hash if unseen by encoder
            try:
                prod_enc = int(demand_encoder.transform([nom])[0])
            except Exception:
                prod_enc = abs(hash(nom)) % 1000

            log_price = float(np.log1p(avg_price))
            today     = datetime.today()
            total_forecast = 0.0

            for i in range(7):
                fdate = today + timedelta(days=i + 1)
                tail  = history[:]

                def safe_lag(n):
                    return float(tail[-n]) if len(tail) >= n else 0.0

                def safe_roll_mean(n):
                    return float(np.mean(tail[-n:])) if len(tail) >= n else float(np.mean(tail))

                def safe_roll_std(n):
                    return float(np.std(tail[-n:])) if len(tail) >= n else 0.0

                row = {
                    "Product_encoded"  : prod_enc,
                    "Log_price"        : log_price,
                    "Day_of_week"      : fdate.weekday(),
                    "Is_weekend"       : int(fdate.weekday() in [5, 6]),
                    "Month"            : fdate.month,
                    "Day_of_month"     : fdate.day,
                    "Week_of_year"     : fdate.isocalendar()[1],
                    "Quarter"          : (fdate.month - 1) // 3 + 1,
                    "Days_to_christmas": days_to_event(fdate, 12, 25),
                    "Days_to_newyear"  : days_to_event(fdate, 1, 1),
                    "Is_holiday_season": int(fdate.month == 12 and fdate.day >= 15),
                    "lag_1"            : safe_lag(1),
                    "lag_2"            : safe_lag(2),
                    "lag_3"            : safe_lag(3),
                    "lag_7"            : safe_lag(7),
                    "lag_14"           : safe_lag(14),
                    "lag_30"           : safe_lag(30),
                    "rolling_mean_7"   : safe_roll_mean(7),
                    "rolling_mean_14"  : safe_roll_mean(14),
                    "rolling_mean_30"  : safe_roll_mean(30),
                    "rolling_std_7"    : safe_roll_std(7),
                    "rolling_std_14"   : safe_roll_std(14),
                    "rolling_std_30"   : safe_roll_std(30),
                    "momentum"         : float(np.clip(
                        safe_roll_mean(7) / (safe_roll_mean(30) + 1e-9), 0.3, 3.0
                    )),
                }

                X   = pd.DataFrame([row])[demand_features]
                X_s = demand_scaler.transform(X)
                pred = max(0.0, float(demand_model.predict(X_s)[0]))
                total_forecast += pred
                history.append(pred)

            # Avg weekly units from history for relative threshold
            avg_weekly    = float(np.mean(history[-30:])) * 7 if len(history) >= 30 else total_forecast
            seuil_normal  = round(avg_weekly * DEMAND_MULTIPLIER, 1)
            daily_demand  = total_forecast / 7 if total_forecast > 0 else 0.001
            jours_restant = round(qte_dispo / daily_demand, 1) if daily_demand > 0 else 999

            alerte = (total_forecast > seuil_normal) or (jours_restant < 7)

            alerts.append({
                "nom_produit"        : nom,
                "unite_7j"           : round(total_forecast, 1),
                "seuil_normal"       : seuil_normal,
                "alerte_restock"     : alerte,
                "jours_stock_restant": jours_restant,
                "qte_dispo"          : qte_dispo,
            })

        # Sort: alerts first
        alerts.sort(key=lambda x: (not x["alerte_restock"],
                                    x.get("jours_stock_restant") or 999))
        return jsonify({"alerts": alerts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=False)