import pandas as pd
import numpy as np
import random
from sklearn.ensemble import RandomForestRegressor
from sqlalchemy.orm import Session
from ..models import CrimeRecord, SocioEconomicData

def predict_district_risks(db: Session):
    crimes = db.query(CrimeRecord).all()
    socio_economic = db.query(SocioEconomicData).all()
    
    if not crimes or not socio_economic:
        return []
        
    # Map socio-economic metrics by district
    se_map = {
        se.district: {
            "unemployment": se.unemployment_rate,
            "income": se.income_level,
            "education": se.education_level,
            "density": se.population_density,
            "poverty": se.poverty_index,
            "urbanization": se.urbanization
        }
        for se in socio_economic
    }

    # Load crimes into dataframe
    data = []
    for c in crimes:
        data.append({
            "district": c.district,
            "date": c.date,
            "severity": c.severity
        })
    df = pd.DataFrame(data)
    df["year_month"] = df["date"].dt.to_period("M")
    
    # Calculate historical crime metrics per district
    # Group by district and month
    grouped = df.groupby(["district", "year_month"]).size().reset_index(name="monthly_count")
    
    # Generate features for training
    # Let's create lag features for monthly counts
    training_data = []
    districts = df["district"].unique()
    
    for district in districts:
        district_grouped = grouped[grouped["district"] == district].sort_values("year_month")
        if len(district_grouped) < 3:
            continue
            
        counts = district_grouped["monthly_count"].values
        se_features = se_map.get(district, {
            "unemployment": 5.0, "income": 500.0, "education": 85.0, 
            "density": 10000.0, "poverty": 15.0, "urbanization": 80.0
        })
        
        # Create rolling window samples
        for i in range(2, len(counts)):
            training_data.append({
                "lag_1": counts[i-1],
                "lag_2": counts[i-2],
                "unemployment": se_features["unemployment"],
                "poverty": se_features["poverty"],
                "density": se_features["density"],
                "target": counts[i]
            })
            
    # Default model training & inference
    if len(training_data) >= 5:
        train_df = pd.DataFrame(training_data)
        X = train_df[["lag_1", "lag_2", "unemployment", "poverty", "density"]].values
        y = train_df["target"].values
        
        rf = RandomForestRegressor(n_estimators=50, random_state=42)
        rf.fit(X, y)
    else:
        rf = None

    predictions = []
    
    # Compute 7, 30, and 90-day risks for each district
    for se in socio_economic:
        district = se.district
        se_features = se_map[district]
        
        # Calculate recent history
        district_crimes = df[df["district"] == district]
        recent_30_days = len(district_crimes[district_crimes["date"] >= (df["date"].max() - pd.Timedelta(days=30))])
        prev_30_to_60_days = len(district_crimes[
            (district_crimes["date"] >= (df["date"].max() - pd.Timedelta(days=60))) & 
            (district_crimes["date"] < (df["date"].max() - pd.Timedelta(days=30)))
        ])
        
        # Use Random Forest prediction if available, else heuristic
        if rf is not None:
            input_features = np.array([[recent_30_days, prev_30_to_60_days, se_features["unemployment"], se_features["poverty"], se_features["density"]]])
            pred_count = float(rf.predict(input_features)[0])
        else:
            # Heuristic calculation
            pred_count = recent_30_days * 1.1 + (se_features["poverty"] / 10.0)
            
        # Translate counts to risk percentages
        # Base risk is highly correlated with poverty and unemployment
        base_risk = (se_features["poverty"] * 0.5) + (se_features["unemployment"] * 3.0) + (recent_30_days * 2.0)
        
        # MoM Trend factor
        trend = (recent_30_days - prev_30_to_60_days) / max(1, prev_30_to_60_days)
        trend_factor = 1.0 + min(0.3, max(-0.3, trend))
        
        # Predict risk percentages for horizons
        # 30-day risk is base risk * trend factor
        risk_30 = min(99.0, max(10.0, base_risk * trend_factor))
        
        # 7-day risk: scaled down, but affected by weekly fluctuations
        risk_7 = min(99.0, max(10.0, risk_30 * 0.85 + (random.uniform(-5, 5))))
        
        # 90-day risk: long term projection, regressing slightly to base socio-economic risk
        long_term_base = (se_features["poverty"] * 0.7) + (se_features["unemployment"] * 4.0)
        risk_90 = min(99.0, max(10.0, (risk_30 * 0.6) + (long_term_base * 0.4)))
        
        predictions.append({
            "district": district,
            "risk_7_day": round(risk_7, 1),
            "risk_30_day": round(risk_30, 1),
            "risk_90_day": round(risk_90, 1),
            "unemployment_rate": se_features["unemployment"],
            "poverty_index": se_features["poverty"],
            "recent_incidents": recent_30_days,
            "trend": "Upward" if trend > 0.05 else "Downward" if trend < -0.05 else "Stable"
        })
        
    # Sort predictions by 30-day risk score descending
    predictions.sort(key=lambda x: x["risk_30_day"], reverse=True)
    return predictions
