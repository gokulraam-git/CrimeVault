import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from ..models import CrimeRecord

def detect_anomalies(db: Session):
    crimes = db.query(CrimeRecord).all()
    if not crimes:
        return []

    # Load crimes into pandas DataFrame
    data = []
    for c in crimes:
        data.append({
            "id": c.id,
            "district": c.district,
            "date": c.date,
            "category": c.category,
            "severity": c.severity
        })
    df = pd.DataFrame(data)
    
    # Extract Year-Month
    df["year_month"] = df["date"].dt.to_period("M")
    
    # Group by District and Month to get monthly crime volume and avg severity
    monthly_grouped = df.groupby(["district", "year_month"]).agg(
        crime_count=("id", "count"),
        avg_severity=("severity", "mean")
    ).reset_index()
    
    # Calculate month-over-month change per district
    monthly_grouped = monthly_grouped.sort_values(by=["district", "year_month"])
    monthly_grouped["prev_count"] = monthly_grouped.groupby("district")["crime_count"].shift(1).fillna(0)
    
    # MoM Growth rate (avoiding division by zero)
    monthly_grouped["growth_rate"] = np.where(
        monthly_grouped["prev_count"] > 0,
        (monthly_grouped["crime_count"] - monthly_grouped["prev_count"]) / monthly_grouped["prev_count"] * 100.0,
        0.0
    )
    
    if len(monthly_grouped) < 5:
        # Too little data to run Isolation Forest reliably, return a simple threshold-based heuristic
        alerts = []
        for idx, row in monthly_grouped.iterrows():
            if row["crime_count"] > 8:
                alerts.append({
                    "district": row["district"],
                    "period": str(row["year_month"]),
                    "crime_count": int(row["crime_count"]),
                    "avg_severity": round(float(row["avg_severity"]), 1),
                    "growth_rate": round(float(row["growth_rate"]), 1),
                    "anomaly_score": 0.8,
                    "description": f"Spike in crime volume ({row['crime_count']} incidents) in {row['district']}."
                })
        return alerts

    # Features for Isolation Forest
    features = monthly_grouped[["crime_count", "growth_rate", "avg_severity"]].values
    
    # Fit Isolation Forest (contamination is the proportion of anomalies we expect, e.g. 10%)
    # Let's set it dynamically or to 0.10
    iso = IsolationForest(contamination=0.10, random_state=42)
    monthly_grouped["anomaly"] = iso.fit_predict(features)
    # The anomaly score is lower for anomalies (negative)
    monthly_grouped["score"] = iso.decision_function(features)
    
    # Filter anomalies (predicted as -1)
    anomalies_df = monthly_grouped[monthly_grouped["anomaly"] == -1].copy()
    
    # Convert period back to string
    anomalies_df["year_month_str"] = anomalies_df["year_month"].astype(str)
    
    alerts = []
    for idx, row in anomalies_df.iterrows():
        # Only alert for spikes, not unusual drops
        mean_district_count = monthly_grouped[monthly_grouped["district"] == row["district"]]["crime_count"].mean()
        if row["crime_count"] > mean_district_count:
            # Scale anomaly score for display: higher score means more anomalous
            norm_anomaly_score = float(abs(row["score"]))
            # Map typical anomaly decision function range [ -0.3, 0 ] to [ 60, 100 ]
            display_score = min(100.0, max(50.0, 60.0 + (norm_anomaly_score * 150.0)))
            
            alerts.append({
                "district": row["district"],
                "period": row["year_month_str"],
                "crime_count": int(row["crime_count"]),
                "avg_severity": round(float(row["avg_severity"]), 1),
                "growth_rate": round(float(row["growth_rate"]), 1),
                "anomaly_score": round(display_score, 1),
                "description": f"Abnormal spike detected in {row['district']}: {int(row['crime_count'])} crimes representing a {round(float(row['growth_rate']), 1)}% growth rate."
            })
            
    # Sort alerts by anomaly score descending
    alerts.sort(key=lambda x: x["anomaly_score"], reverse=True)
    return alerts
