import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sqlalchemy.orm import Session
from ..models import CrimeRecord

def detect_hotspots(db: Session, n_clusters: int = 5):
    # Fetch all crimes
    crimes = db.query(CrimeRecord).all()
    if not crimes:
        return []

    data = []
    for c in crimes:
        data.append({
            "latitude": c.latitude,
            "longitude": c.longitude,
            "severity": c.severity,
            "district": c.district
        })
    
    df = pd.DataFrame(data)
    if len(df) < n_clusters:
        n_clusters = max(1, len(df))

    # Apply K-Means
    coords = df[["latitude", "longitude"]].values
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df["cluster"] = kmeans.fit_predict(coords)
    
    centroids = kmeans.cluster_centers_
    
    hotspots = []
    for i in range(n_clusters):
        cluster_data = df[df["cluster"] == i]
        if cluster_data.empty:
            continue
            
        centroid = centroids[i]
        
        # Calculate cluster radius (max distance from centroid to any point in cluster in km roughly)
        lat_diff = cluster_data["latitude"] - centroid[0]
        lon_diff = cluster_data["longitude"] - centroid[1]
        distances = np.sqrt(lat_diff**2 + lon_diff**2) * 111.0 # ~111km per degree
        radius = float(distances.max())
        
        crime_count = len(cluster_data)
        avg_severity = float(cluster_data["severity"].mean())
        
        # Determine primary district for this cluster
        primary_district = cluster_data["district"].value_counts().idxmax()
        
        # Determine risk score (composite of count and severity)
        # Scale: max typical count is ~50, avg severity is 1-10.
        risk_score = min(100.0, (crime_count * 1.5) + (avg_severity * 5.0))
        
        if risk_score > 75:
            risk_level = "High"
        elif risk_score > 58:
            risk_level = "Medium"
        else:
            risk_level = "Low"
            
        hotspots.append({
            "id": i,
            "latitude": float(centroid[0]),
            "longitude": float(centroid[1]),
            "radius_km": round(radius, 2) if radius > 0.1 else 0.5,
            "crime_count": crime_count,
            "avg_severity": round(avg_severity, 1),
            "primary_district": primary_district,
            "risk_score": round(risk_score, 1),
            "risk_level": risk_level
        })
        
    # Sort by risk score descending
    hotspots.sort(key=lambda x: x["risk_score"], reverse=True)
    return hotspots
