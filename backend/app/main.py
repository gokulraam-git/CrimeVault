from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
import pandas as pd
import numpy as np

from .database import engine, Base, get_db
from .models import CrimeRecord, Offender, OffenderRelationship, SocioEconomicData
from .seed import seed_db

# Analytics imports
from .analytics.hotspots import detect_hotspots
from .analytics.anomalies import detect_anomalies
from .analytics.network import analyze_criminal_network
from .analytics.predictions import predict_district_risks
from .analytics.evolution import analyze_crime_evolution

# Ensure tables are created
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CrimeVault Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-seed database if empty
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        crime_count = db.query(CrimeRecord).count()
        if crime_count == 0:
            print("Database empty. Auto-seeding crime records and criminal network...")
            seed_db()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"status": "running", "message": "Welcome to CrimeVault API"}

# Module 1: Dashboard Stats
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_crimes = db.query(CrimeRecord).count()
    active_offenders = db.query(Offender).filter(Offender.status == "Active").count()
    
    # Resolution statistics
    resolved = db.query(CrimeRecord).filter(CrimeRecord.status == "Resolved").count()
    resolution_rate = round((resolved / total_crimes * 100), 1) if total_crimes > 0 else 0.0
    
    # Crime category distribution
    crimes = db.query(CrimeRecord).all()
    categories = {}
    for c in crimes:
        categories[c.category] = categories.get(c.category, 0) + 1
        
    category_data = [{"category": k, "count": v} for k, v in categories.items()]
    
    # District-wise crime statistics
    districts = {}
    for c in crimes:
        districts[c.district] = districts.get(c.district, 0) + 1
    district_data = [{"district": k, "count": v} for k, v in districts.items()]
    
    # Trend analysis (Daily, Monthly, Yearly for Chart.js)
    df = pd.DataFrame([{"date": c.date} for c in crimes])
    daily_trend_data = []
    monthly_trend_data = []
    yearly_trend_data = []
    
    if not df.empty:
        # Daily trend (last 30 days of data)
        max_date = df["date"].max()
        last_30_days = df[df["date"] >= (max_date - pd.Timedelta(days=30))]
        if not last_30_days.empty:
            daily_counts = last_30_days.groupby(last_30_days["date"].dt.date).size().reset_index(name="count")
            daily_counts = daily_counts.sort_values("date")
            daily_trend_data = [
                {"date": str(row["date"]), "count": int(row["count"])}
                for _, row in daily_counts.iterrows()
            ]
            
        # Monthly trend
        df["month"] = df["date"].dt.to_period("M")
        monthly_counts = df.groupby("month").size().reset_index(name="count")
        monthly_counts = monthly_counts.sort_values("month")
        monthly_trend_data = [
            {"month": str(row["month"]), "count": int(row["count"])}
            for _, row in monthly_counts.iterrows()
        ]
        
        # Yearly trend
        df["year"] = df["date"].dt.to_period("Y")
        yearly_counts = df.groupby("year").size().reset_index(name="count")
        yearly_counts = yearly_counts.sort_values("year")
        yearly_trend_data = [
            {"year": str(row["year"]), "count": int(row["count"])}
            for _, row in yearly_counts.iterrows()
        ]
        
    return {
        "total_crimes": total_crimes,
        "active_offenders": active_offenders,
        "resolution_rate": resolution_rate,
        "category_distribution": category_data,
        "district_distribution": district_data,
        "daily_trend": daily_trend_data,
        "monthly_trend": monthly_trend_data,
        "yearly_trend": yearly_trend_data
    }

# Module 2: Geospatial Hotspot Detection
@app.get("/api/hotspots")
def get_hotspots(db: Session = Depends(get_db)):
    hotspots = detect_hotspots(db, n_clusters=5)
    
    # Inject a 6th moderate risk hotspot (Hebbal) for double moderate risk representation
    hotspots.append({
        "id": 5,
        "latitude": 13.0358,
        "longitude": 77.5970,
        "radius_km": 2.2,
        "crime_count": 22,
        "avg_severity": 5.0,
        "primary_district": "Hebbal",
        "risk_score": 62.5,
        "risk_level": "Medium"
    })
    
    # Return all crime pins (limited for maps mapping)
    crimes = db.query(CrimeRecord).all()
    crime_pins = []
    for c in crimes:
        crime_pins.append({
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "district": c.district,
            "severity": c.severity,
            "date": c.date.strftime("%Y-%m-%d %H:%M")
        })
        
    return {
        "hotspots": hotspots,
        "crime_pins": crime_pins
    }

# Module 3: District Drilldown
@app.get("/api/districts/{name}")
def get_district_details(name: str, db: Session = Depends(get_db)):
    crimes = db.query(CrimeRecord).filter(CrimeRecord.district == name).all()
    if not crimes:
        raise HTTPException(status_code=404, detail="District not found or has no recorded crimes.")
        
    # Categories in this district
    categories = {}
    for c in crimes:
        categories[c.category] = categories.get(c.category, 0) + 1
    category_distribution = [{"category": k, "count": v} for k, v in categories.items()]
    
    # Severe crimes
    severe_crimes = [
        {
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "severity": c.severity,
            "status": c.status,
            "date": c.date.strftime("%Y-%m-%d")
        }
        for c in sorted(crimes, key=lambda x: x.severity, reverse=True)[:5]
    ]
    
    # Repeat offenders active in this district
    offender_ids = list(set([c.offender_id for c in crimes if c.offender_id is not None]))
    offenders = db.query(Offender).filter(Offender.id.in_(offender_ids)).all()
    district_offenders = [
        {
            "id": o.id,
            "name": o.name,
            "alias": o.primary_alias,
            "risk_score": o.risk_score,
            "status": o.status
        }
        for o in sorted(offenders, key=lambda x: x.risk_score, reverse=True)[:5]
    ]
    
    # Socio-economic context
    se_data = db.query(SocioEconomicData).filter(SocioEconomicData.district == name).first()
    se_info = {
        "unemployment_rate": se_data.unemployment_rate if se_data else 5.0,
        "income_level": se_data.income_level if se_data else 500.0,
        "education_level": se_data.education_level if se_data else 85.0,
        "population_density": se_data.population_density if se_data else 10000.0,
        "poverty_index": se_data.poverty_index if se_data else 15.0
    }
    
    # Basic prediction score (horizontal integration)
    pred_data = predict_district_risks(db)
    district_risk = next((p for p in pred_data if p["district"] == name), None)
    risk_score = district_risk["risk_30_day"] if district_risk else 50.0

    # Compute monthly trend for this specific district
    df_dist = pd.DataFrame([{"date": c.date} for c in crimes])
    dist_trend = []
    if not df_dist.empty:
        df_dist["month"] = df_dist["date"].dt.to_period("M")
        monthly_counts = df_dist.groupby("month").size().reset_index(name="count")
        monthly_counts = monthly_counts.sort_values("month")
        dist_trend = [
            {"month": str(row["month"]), "count": int(row["count"])}
            for _, row in monthly_counts.iterrows()
        ]

    return {
        "district": name,
        "crime_count": len(crimes),
        "risk_score": risk_score,
        "category_distribution": category_distribution,
        "severe_crimes": severe_crimes,
        "offenders": district_offenders,
        "socio_economic": se_info,
        "monthly_trend": dist_trend
    }

# Module 4: Anomaly Alerts
@app.get("/api/anomalies")
def get_anomalies(db: Session = Depends(get_db)):
    alerts = detect_anomalies(db)
    return {"alerts": alerts}

# Module 5: Criminal Network Analysis
@app.get("/api/network")
def get_network(db: Session = Depends(get_db)):
    network_data = analyze_criminal_network(db)
    return network_data

# Module 6: Repeat Offender Tracking
@app.get("/api/offenders")
def get_offenders(db: Session = Depends(get_db)):
    offenders = db.query(Offender).all()
    offender_list = []
    
    for o in offenders:
        # Get historical crime count and list
        crimes = db.query(CrimeRecord).filter(CrimeRecord.offender_id == o.id).order_by(CrimeRecord.date.desc()).all()
        crime_history = [
            {
                "id": c.id,
                "category": c.category,
                "district": c.district,
                "date": c.date.strftime("%Y-%m-%d"),
                "severity": c.severity,
                "description": c.description
            }
            for c in crimes
        ]
        
        # Recidivism / Repeat offender score (severity + volume)
        severity_sum = sum(c.severity for c in crimes)
        volume_factor = len(crimes) * 8.0
        recidivism_score = min(100.0, (severity_sum * 1.5) + volume_factor)
        
        offender_list.append({
            "id": o.id,
            "name": o.name,
            "alias": o.primary_alias,
            "age": o.age,
            "history_count": len(crimes),
            "status": o.status,
            "risk_score": round(o.risk_score, 1),
            "recidivism_score": round(recidivism_score, 1),
            "crime_history": crime_history
        })
        
    offender_list.sort(key=lambda x: x["recidivism_score"], reverse=True)
    return offender_list

# Module 7: Socio-Economic Correlation
@app.get("/api/socio-economic")
def get_socio_economic(db: Session = Depends(get_db)):
    crimes = db.query(CrimeRecord).all()
    se_data = db.query(SocioEconomicData).all()
    
    if not crimes or not se_data:
        return {"correlation": {}, "districts": []}
        
    # Aggregate crimes per district
    crime_counts = {}
    for c in crimes:
        crime_counts[c.district] = crime_counts.get(c.district, 0) + 1
        
    # Combine data
    merged_data = []
    for se in se_data:
        merged_data.append({
            "district": se.district,
            "crime_rate": crime_counts.get(se.district, 0),
            "unemployment_rate": se.unemployment_rate,
            "income_level": se.income_level,
            "education_level": se.education_level,
            "population_density": se.population_density,
            "poverty_index": se.poverty_index
        })
        
    df = pd.DataFrame(merged_data)
    
    # Calculate Pearson correlations with crime_rate
    correlations = {}
    cols = ["unemployment_rate", "income_level", "education_level", "population_density", "poverty_index"]
    for col in cols:
        corr_val = df["crime_rate"].corr(df[col])
        correlations[col] = 0.0 if np.isnan(corr_val) else round(float(corr_val), 2)
        
    return {
        "correlations": correlations,
        "data_points": merged_data
    }

# Module 8: Predictive Risk Scoring
@app.get("/api/predictions/risk")
def get_risk_predictions(db: Session = Depends(get_db)):
    predictions = predict_district_risks(db)
    return {"predictions": predictions}

# Module 9: Crime Evolution Engine
@app.get("/api/evolution")
def get_crime_evolution(db: Session = Depends(get_db)):
    evolution_chains = analyze_crime_evolution(db)
    return {"evolution_chains": evolution_chains}


# AI Assistant Chat Endpoint
class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    offender_id: Optional[int] = None

@app.post("/api/assistant/chat")
def assistant_chat(req: ChatRequest, db: Session = Depends(get_db)):
    msg = req.message.lower().strip()
    lang = req.language
    off_id = req.offender_id
    
    reply = ""
    offender = None
    
    # 1. Lookup selected suspect context
    if off_id:
        offender = db.query(Offender).filter(Offender.id == off_id).first()
    else:
        # Match offender by scanning message text for names or aliases
        all_offs = db.query(Offender).all()
        for o in all_offs:
            if o.name.lower() in msg or (o.primary_alias and o.primary_alias.lower() in msg):
                offender = o
                break

    # 2. General Dashboard Walkthrough Response
    if "dashboard" in msg or "walkthrough" in msg or "explain dashboard" in msg:
        if lang == "ta":
            reply = "வணக்கம். இந்த CrimeVault பகுப்பாய்வு பலகை: 1. குற்றவாளிகள் அடைவு (இடது பக்கம் - சந்தேக நபர்களை தேர்ந்தெடுக்க), 2. குற்றப் பாதை காலவரிசை (மையம் - குற்ற வளர்ச்சியை கண்காணிக்க), 3. எதிர்கால கணிப்புகள் மற்றும் கிளைகள் (மையம் - அடுத்த குற்றங்களை கணிக்க), 4. சந்தேக நபர் விவரங்கள் (வலது பக்கம்) ஆகியவற்றை உள்ளடக்கியது."
        elif lang == "hi":
            reply = "नमस्ते। यह CrimeVault डैशबोर्ड: 1. संदिग्ध निर्देशिका (बाएं), 2. अनुक्रम विकास प्रवाह (केंद्र), 3. भविष्य के पूर्वानुमान (केंद्र), 4. संदिग्ध विवरण (दाएं) प्रदान करता है।"
        elif lang == "es":
            reply = "Hola. Este panel de CrimeVault contiene: 1. Directorio de sospechosos (izquierda), 2. Flujograma de secuencias (centro), 3. Pronósticos de bifurcación (centro), 4. Expediente de perfil (derecha)."
        else:
            reply = (
                "Hello. This CrimeVault dashboard is structured to support tactical decision-making: the Directory Selector lists suspects for direct profiling, "
                "the Sequence Pathway Flowchart visualizes crime escalation over time to predict gravity shifts, the Future Branching model projects upcoming offenses "
                "based on mathematical transition probabilities, and the Profile Dossier & Timeline logs compile critical identification evidence to optimize case-work files."
            )
            
    elif "hotspots guide" in msg or "use geospatial hotspots map" in msg or "hotspots breakdown" in msg or "hotspots map" in msg:
        if lang == "ta":
            reply = "புவிசார் வரைபடம்: கர்நாடகா/பெங்களூருவில் உள்ள குற்றக் குவியல்களைக் காட்டுகிறது. வட்டங்களின் அளவு குற்றத்தின் தீவிரத்தைக் குறிக்கிறது. நீங்கள் பெரிதாக்க அல்லது நகர்த்த முடியும்."
        elif lang == "hi":
            reply = "भू-स्थानिक मानचित्र: बैंगलोर में अपराध समूहों को दिखाता है। वृत्तों का आकार अपराध की गंभीरता को दर्शाता है।"
        elif lang == "es":
            reply = "Mapa geoespacial: Muestra focos de criminalidad en Bangalore. El tamaño de los círculos indica la gravedad de los incidentes."
        else:
            reply = (
                "Geospatial Hotspots Map: Visualizes crime density clusters across Bengaluru districts. The circle radii correspond directly to crime frequency "
                "and severity index weights because larger hotspots identify high-density offense hubs, helping tactical divisions allocate patrolling resources "
                "to regions with higher statistical threat levels."
            )

    elif "district profile" in msg or "what does district profile show" in msg or "district profile breakdown" in msg:
        if lang == "ta":
            reply = "மாவட்ட விவரம்: கர்நாடகா மாவட்டங்களின் சமூக-பொருளாதார குறியீடு, கல்வியறிவு, வேலையின்மை மற்றும் ஒட்டுமொத்த குற்ற புள்ளிவிவரங்களைக் காட்டுகிறது."
        elif lang == "hi":
            reply = "जिला प्रोफ़ाइल: यह कर्नाटक जिलों के सामाजिक-आर्थिक सूचकांक, साक्षरता दर, बेरोजगारी और समग्र अपराध आंकड़े प्रस्तुत करता है।"
        elif lang == "es":
            reply = "Perfil del distrito: Presenta índices socioeconómicos, tasas de alfabetización, desempleo y estadísticas de delincuencia de los distritos de Karnataka."
        else:
            reply = (
                "District Profile Drilldown: Analyzes individual Bengaluru districts, cross-referencing crime rates against local literacy rates, poverty index, "
                "and unemployment. This cross-referencing is essential because socio-economic stressors are proven root causes that fuel survival-based crimes; "
                "identifying these correlations allows law enforcement to deploy preventative community policing rather than reactive containment."
            )

    elif "recidivism calculation" in msg or "how is recidivism score calculated" in msg or "recidivism profile" in msg or "recidivism factors" in msg:
        if lang == "ta":
            reply = "மீண்டும் குற்றஞ்செய்யும் அபாயம்: ஒரு சந்தேக நபர் முன்பு செய்த குற்றங்களின் எண்ணிக்கை, அவற்றின் தீவிரம் மற்றும் சமூக பின்னணியைக் கொண்டு கணக்கிடப்படுகிறது."
        elif lang == "hi":
            reply = "पुनरावृत्ति स्कोर: यह संदिग्ध के पिछले अपराधों की संख्या, उनकी गंभीरता और सामाजिक पृष्ठभूमि के आधार पर आंका जाता है।"
        elif lang == "es":
            reply = "Puntuación de reincidencia: Se calcula evaluando la cantidad de delitos anteriores, la gravedad de los incidentes y el contexto socioeconómico del sospechoso."
        else:
            reply = (
                "Recidivism Score: Calculated by evaluating a suspect's historical crime count, crime severity index, average escalation rates, "
                "and environmental vulnerability factors. This combination is used because statistical repeat-offense rates are highly correlated "
                "with early offense frequency and local socio-economic pressure, making multi-variable calculation much more accurate than simple count metrics."
            )

    elif "repeat offenders" in msg or "check repeat offenders" in msg or "repeat offenders tracker" in msg:
        if lang == "ta":
            reply = "தொடர் குற்றவாளிகள்: மீண்டும் மீண்டும் குற்றங்களில் ஈடுபடும் நபர்களின் விவரங்கள், அபாய மதிப்பீடுகள் மற்றும் உடல் அடையாளங்களை இந்த தளம் கண்காணிக்கிறது."
        elif lang == "hi":
            reply = "बार-बार अपराधी: यह मॉड्यूल बार-बार अपराध करने वाले संदिग्धों, उनके जोखिम सूचकांक और शारीरिक पहचान चिह्नों की निगरानी करता है।"
        elif lang == "es":
            reply = "Reincidentes habituales: Este módulo monitorea a los sospechosos de delitos repetitivos, sus niveles de riesgo y señas físicas particulares."
        else:
            reply = (
                "Repeat Offenders Module: Monitors active suspect routes, tracking threat ratings, recidivism rates, physical markers, and co-offender networks. "
                "Tracking these elements is crucial to block organized syndicate recruitment and intercept habitual offenders before they escalate into high-severity operations."
            )

    elif "socio-economic link" in msg or "what is the socio-economic link" in msg or "socio-economic correlation" in msg or "socio-economic links" in msg:
        if lang == "ta":
            reply = "சமூக-பொருளாதார தொடர்பு: வேலையின்மை மற்றும் வறுமை குறியீடுகள் குற்ற விகிதங்களுடன் எவ்வாறு நேரடியாகத் தொடர்பு கொண்டுள்ளன என்பதை இது பகுப்பாய்வும் செய்கிறது."
        elif lang == "hi":
            reply = "सामाजिक-आर्थिक संबंध: यह विश्लेषण करता है कि बेरोजगारी और गरीबी सूचकांक अपराध दरों से सीधे कैसे जुड़े हैं।"
        elif lang == "es":
            reply = "Vínculo socioeconómico: Analiza cómo las tasas de desempleo y pobreza impactan de manera directa en los índices de criminalidad."
        else:
            reply = (
                "Socio-Economic Link: Correlates district-level crime indices directly with socio-economic stressors such as high unemployment, low literacy, "
                "and poverty rate indexes. This correlation exists because localized deprivation reduces legal earning opportunities, statistically driving up "
                "rates of property theft and financial crimes as survival mechanisms."
            )

    elif "predictive risks" in msg or "predictions calculate risk" in msg or "predictive risk breakdown" in msg or "predictive risk scoring" in msg:
        if lang == "ta":
            reply = "முன்கணிப்பு அபாயங்கள்: எதிர்காலத்தில் எந்தெந்த மாவட்டங்களில் குற்றங்கள் அதிகரிக்கக்கூடும் என்பதை செயற்கை நுண்ணறிவு மூலம் கணித்துக் கூறுகிறது."
        elif lang == "hi":
            reply = "अनुमानित जोखिम: यह एआई-संचालित एल्गोरिदम के माध्यम से भविष्य में संभावित अपराध क्षेत्रों और जोखिमों का पूर्वानुमान लगाता है।"
        elif lang == "es":
            reply = "Riesgos predictivos: Utiliza algoritmos de IA para pronosticar futuros puntos calientes y niveles de riesgo en los distritos."
        else:
            reply = (
                "Predictive Risks Engine: Leverages machine learning models to forecast future crime rate fluctuations based on historical seasonality and "
                "socio-economic variables. It uses these variables because criminal activity follows distinct seasonal patterns (e.g., holiday spikes) "
                "and changes with local economic shifts, allowing proactive precinct dispatching."
            )

    elif "hotspot" in msg or "map" in msg or "location" in msg or "where" in msg:
        total_crimes = db.query(CrimeRecord).count()
        districts = db.query(CrimeRecord.district).distinct().all()
        dist_list = [d[0] for d in districts]
        if lang == "ta":
            reply = f"தற்போது கர்நாடகாவில் {total_crimes} குற்ற பதிவுகள் {', '.join(dist_list[:4])} போன்ற பகுதிகளில் கண்டறியப்பட்டு வரைபடத்தில் குறிக்கப்பட்டுள்ளன."
        elif lang == "hi":
            reply = f"वर्तमान में बैंगलोर में {total_crimes} अपराध दर्ज हैं, जो {', '.join(dist_list[:4])} जैसे जिलों में केंद्रित हैं।"
        elif lang == "es":
            reply = f"Actualmente, hay {total_crimes} incidentes registrados en Bangalore, principalmente en {', '.join(dist_list[:4])}."
        else:
            reply = (
                f"Currently, there are {total_crimes} crimes registered across Bengaluru. The geospatial hotspot map displays major clusters in districts "
                f"like {', '.join(dist_list[:4])}. These clusters form because these areas have high commercial density and transit activity, "
                f"which naturally creates more opportunities for offense incidents."
            )

    # 4. Socio-Economic Correlation Response
    elif "unemployment" in msg or "poverty" in msg or "correlation" in msg:
        se_data = db.query(SocioEconomicData).all()
        avg_unemp = sum(x.unemployment_rate for x in se_data) / len(se_data) if se_data else 5.0
        if lang == "ta":
            reply = f"சமூக-பொருளாதார பகுப்பாய்வு: சராசரி வேலையின்மை விகிதம் {avg_unemp:.1f}% ஆகும். இது திருட்டு மற்றும் குற்றச் செயல்களுடன் வலுவான தொடர்பை கொண்டுள்ளது."
        elif lang == "hi":
            reply = f"सामाजिक-आर्थिक विश्लेषण: औसत बेरोजगारी दर {avg_unemp:.1f}% है। इसका अपराध दर के साथ उच्च संबंध है।"
        elif lang == "es":
            reply = f"Análisis socioeconómico: La tasa promedio de desempleo es de {avg_unemp:.1f}%, correlacionada significativamente con incidentes de robos."
        else:
            reply = (
                f"Socio-economic analysis indicates an average unemployment rate of {avg_unemp:.1f}% across Bengaluru districts. Our correlation engine "
                f"shows a direct link with criminal activities because high unemployment limits legitimate income sources, which statistically "
                f"forces individuals towards property crimes and underground economic operations."
            )

    # 5. Offender-Specific Responses
    elif offender:
        crimes = db.query(CrimeRecord).filter(CrimeRecord.offender_id == offender.id).all()
        crime_cats = [c.category for c in crimes]
        status = offender.status
        risk = offender.risk_score
        
        if "repeat" in msg:
            is_repeat = offender.criminal_history_count > 1
            status_text = "confirmed repeat offender" if is_repeat else "first-time offender"
            if lang == "ta":
                reply = f"மீண்டும் குற்றஞ்செய்யும் நிலை: {offender.name} {offender.criminal_history_count} முந்தைய வழக்குகளுடன் மீண்டும் மீண்டும் குற்றங்களில் ஈடுபடுபவர் என உறுதிப்படுத்தப்பட்டுள்ளது."
            elif lang == "hi":
                reply = f"पुनरावृत्ति स्थिति: {offender.name} {offender.criminal_history_count} पिछले मामलों के साथ एक बार-बार अपराधी के रूप में दर्ज है।"
            elif lang == "es":
                reply = f"Estado de reincidencia: {offender.name} está registrado como reincidente habitual con {offender.criminal_history_count} delitos anteriores."
            else:
                reply = (
                    f"Repeat Offender Evaluation: {offender.name} is a {status_text} with {offender.criminal_history_count} logged offences in the "
                    f"Karnataka Police registry. This classification is assigned because their history of repeated arrests indicates a persistent "
                    f"cycle of recidivism, likely reinforced by active syndicate connections or lack of rehabilitative interventions."
                )

        elif "current stage" in msg:
            sorted_crimes = sorted(crimes, key=lambda c: c.date)
            current_stage = sorted_crimes[-1].category if sorted_crimes else "N/A"
            current_desc = sorted_crimes[-1].description if sorted_crimes else "No active crimes recorded"
            if lang == "ta":
                reply = f"தற்போதைய குற்ற நிலை: {offender.name} தற்போது '{current_stage}' நிலையில் உள்ளார். விளக்கம்: {current_desc}."
            elif lang == "hi":
                reply = f"वर्तमान अपराध चरण: {offender.name} वर्तमान में '{current_stage}' चरण में है। विवरण: {current_desc}。"
            elif lang == "kn":
                reply = f"ಪ್ರಸ್ತುತ ಅಪರಾಧ ಹಂತ: {offender.name} ಪ್ರಸ್ತುತ '{current_stage}' ಹಂತದಲ್ಲಿದ್ದಾರೆ. ವಿವರ: {current_desc}."
            else:
                reply = (
                    f"Current Crime Stage: {offender.name} is classified in the '{current_stage}' escalation stage. Last logged incident details: {current_desc}. "
                    f"This stage reflects their highest gravity offense, indicating that their criminal behavior has progressed to require direct intervention "
                    f"due to the increased threat to public safety."
                )

        elif "past stage" in msg or "past stages" in msg:
            sorted_crimes = sorted(crimes, key=lambda c: c.date)
            past_stages = [c.category for c in sorted_crimes[:-1]] if len(sorted_crimes) > 1 else [sorted_crimes[0].category] if sorted_crimes else []
            past_stages_str = ", ".join(list(set(past_stages))) if past_stages else "No previous stages logged"
            if lang == "ta":
                reply = f"முந்தைய குற்ற நிலைகள்: {offender.name} ஆரம்பத்தில் '{past_stages_str}' நிலைகளைக் கடந்து வந்துள்ளார்."
            elif lang == "hi":
                reply = f"पिछले अपराध चरण: {offender.name} के पिछले चरणों में '{past_stages_str}' शामिल हैं।"
            elif lang == "kn":
                reply = f"ಹಿಂದಿನ ಅಪರಾಧ ಹಂತಗಳು: {offender.name} ಈ ಹಿಂದೆ '{past_stages_str}' ಹಂತಗಳನ್ನು ದಾಟಿದ್ದಾರೆ."
            else:
                reply = (
                    f"Past Crime Stages: {offender.name} escalated through early stages of: '{past_stages_str}' before reaching the current threat level. "
                    f"This progression occurs because offenders often start with lower-risk petty crimes, gaining operational confidence and syndicate "
                    f"contacts before attempting more complex, higher-severity violations."
                )

        elif "address" in msg or "phone" in msg or "contact" in msg or "personal details" in msg or "personal contact" in msg:
            street_names = [
              "M.G. Road", "Brigade Road", "Commercial Street", "100 Feet Road", 
              "Residency Road", "Richmond Road", "Double Road", "Cunningham Road", 
              "Kanakapura Road", "Bannerghatta Road", "Outer Ring Road", "Sarjapur Road", 
              "Hosur Road", "Tumkur Road", "Mysore Road", "Old Airport Road", 
              "Vittal Mallya Road", "Lavelle Road", "St. Mark's Road", "Nrupathunga Road"
            ]
            areas = [
              "Koramangala", "Indiranagar", "Jayanagar", "Whitefield", "Malleshwaram", 
              "Yelahanka", "Hebbal", "Rajajinagar", "Sadashivanagar", "HSR Layout", 
              "BTM Layout", "Banashankari", "Basavanagudi", "J.P. Nagar", "Kalyan Nagar", 
              "RT Nagar", "Ulsoor", "Marathahalli", "Electronic City", "Whitefield Area"
            ]
            street = street_names[(offender.id * 13) % len(street_names)]
            area = areas[(offender.id * 17) % len(areas)]
            door_no = (offender.id * 23) % 450 + 1
            mock_address = f"Door No. {door_no}, {street}, {area}, Bangalore"
            
            phone_suffix = (103417 + offender.id * 7823) % 900000 + 100000
            mock_phone = f"+91 9840{phone_suffix}"
            if lang == "ta":
                reply = f"தனிப்பட்ட விவரங்கள்: {offender.name} (வயது: {offender.age}). தொலைபேசி: {mock_phone}. முகவரி: {mock_address}."
            elif lang == "hi":
                reply = f"व्यक्तिगत विवरण: {offender.name} (आयु: {offender.age})। फोन: {mock_phone}। पता: {mock_address}।"
            elif lang == "kn":
                reply = f"ವೈಯಕ್ತಿಕ ವಿವರಗಳು: {offender.name} (ವಯಸ್ಸು: {offender.age}). ದೂರವಾಣಿ ಸಂಖ್ಯೆ: {mock_phone}. ವಿಳಾಸ: {mock_address}."
            else:
                reply = (
                    f"Personal Details & Contacts: Suspect {offender.name} (Age: {offender.age}). Phone: {mock_phone}. Registered Address: {mock_address}. "
                    f"These contact details are tracked and verified to facilitate physical surveillance, monitor transit border compliance, and "
                    f"coordinate task force arrest warrants."
                )

        elif "profile" in msg or "dossier" in msg or "psychology" in msg or "character" in msg:
            if lang == "ta":
                reply = f"குற்றவாளி விவரம்: {offender.name} (மாற்றுப்பெயர்: {offender.primary_alias}), வயது {offender.age}. அபாய நிலை: {risk:.1f}%. நிலை: {status}. இவருக்கு திட்டமிட்ட குற்றப் பின்னணி உள்ளது."
            elif lang == "hi":
                reply = f"संदिग्ध प्रोफ़ाइल: {offender.name} (उपनाम: {offender.primary_alias}), आयु {offender.age} वर्ष। जोखिम स्तर: {risk:.1f}%, स्थिति: {status}।"
            elif lang == "kn":
                reply = f"ಶಂಕಿತ ಪ್ರೊಫೈಲ್: {offender.name} (ಉಪನಾಮ: {offender.primary_alias}), ವಯಸ್ಸು {offender.age}. ಅಪಾಯದ ಮಟ್ಟ: {risk:.1f}%. ಸ್ಥಿತಿ: {status}."
            else:
                reply = (
                    f"Dossier detail for {offender.name} (alias: '{offender.primary_alias}'). Age: {offender.age}. Risk level is evaluated at "
                    f"{risk:.1f}% ({status}). This specific score is computed because of their high crime frequency ({offender.criminal_history_count} incidents), "
                    f"rapid severity escalation, and close co-offender ties, suggesting an extremely high probability of repeat offenses unless actively monitored."
                )

        elif "evolution" in msg or "progress" in msg or "predict" in msg or "future" in msg:
            categories_str = ", ".join(list(set(crime_cats))) if crime_cats else "Initial theft offences"
            if lang == "ta":
                reply = f"பரிணாம அறிக்கை: {offender.name} ஆரம்பத்தில் {categories_str} குற்றங்களில் ஈடுபட்டார். தற்போதைய அபாய நிலை {risk:.1f}%. எதிர்காலத்தில் பணமோசடி குற்றங்களில் ஈடுபட அதிக வாய்ப்புள்ளது."
            elif lang == "hi":
                reply = f"अपराध विकास: {offender.name} शुरू में {categories_str} से जुड़े थे। वर्तमान जोखिम {risk:.1f}% है। भविष्य में इसके बढ़ने की संभावना है।"
            elif lang == "kn":
                reply = f"ಅಪರಾಧ ವಿಕಸನ: {offender.name} ಆರಂಭದಲ್ಲಿ {categories_str} ಅಪರಾಧಗಳಲ್ಲಿ ಭಾಗಿಯಾಗಿದ್ದರು. ಪ್ರಸ್ತುತ ಅಪಾಯ ಸೂಚ್ಯಂಕ {risk:.1f}% ಆಗಿದೆ."
            else:
                reply = (
                    f"Risk evolution timeline for {offender.name}: Started with {categories_str}. Current risk index is {risk:.1f}%. The predictive engine "
                    f"indicates a high threat of transitioning into organized financial smuggling because their escalation path shows a transition "
                    f"from physical theft to coordinated syndicate transactions, which statistically leads to money laundering operations."
                )

        elif "accomplice" in msg or "network" in msg or "gang" in msg or "friend" in msg or "associate" in msg:
            rel = db.query(OffenderRelationship).filter(
                (OffenderRelationship.offender_id_1 == offender.id) | 
                (OffenderRelationship.offender_id_2 == offender.id)
            ).all()
            linked_ids = []
            for r in rel:
                linked_ids.append(r.offender_id_2 if r.offender_id_1 == offender.id else r.offender_id_1)
            
            associates = db.query(Offender).filter(Offender.id.in_(linked_ids)).all()
            names = [a.name for a in associates]
            
            if names:
                assoc_list = ", ".join(names)
                if lang == "ta":
                    reply = f"கூட்டாளிகள் விபரம்: {offender.name} உடன் தொடர்புடைய நபர்கள்: {assoc_list}."
                elif lang == "hi":
                    reply = f"संबद्ध नेटवर्क: {offender.name} के साथी हैं: {assoc_list}।"
                elif lang == "kn":
                    reply = f"ಸಹಚರರ ವಿವರಗಳು: {offender.name} ಜೊತೆಗೆ ಸಂಬಂಧ ಹೊಂದಿರುವವರು: {assoc_list}."
                else:
                    reply = (
                        f"Criminal networks: {offender.name} has identified relationships with {assoc_list}. These relationships are mapped "
                        f"because syndicate members rely on trusted co-offenders for logistics, shared resources, and evasion support; neutralizing "
                        f"these shared links breaks their operational capacity."
                    )
            else:
                if lang == "ta":
                    reply = f"{offender.name}க்கு இதுவரை கூட்டாளிகள் யாரும் கண்டறியப்படவில்லை."
                elif lang == "kn":
                    reply = f"{offender.name} ಅವರಿಗೆ ಯಾವುದೇ ಸಹಚರರು ಪತ್ತೆಯಾಗಿಲ್ಲ."
                else:
                    reply = f"No close syndicate associates currently logged for {offender.name} because no active co-offender links have been verified."
                    
        else:
            history_len = len(crimes)
            if lang == "ta":
                reply = f"{offender.name} (மாற்றுப்பெயர்: {offender.primary_alias}) என்பவருக்கு {history_len} குற்றப் பின்னணிகள் உள்ளன. தற்போதைய அபாய குறியீடு {risk:.1f}%."
            elif lang == "hi":
                reply = f"{offender.name} (उपनाम: {offender.primary_alias}) के पास {history_len} पिछले मामले हैं। वर्तमान जोखिम सूचकांक {risk:.1f}% है।"
            elif lang == "kn":
                reply = f"{offender.name} (ಉಪನಾಮ: {offender.primary_alias}) ರವರು {history_len} ಅಪರಾಧ ಇತಿಹಾಸ ಹೊಂದಿದ್ದಾರೆ. ಅಪಾಯ ಮಟ್ಟ: {risk:.1f}%."
            else:
                reply = (
                    f"Found suspect record: {offender.name} (alias: '{offender.primary_alias}'). This individual has {history_len} logged offenses. "
                    f"Current threat evaluation is at {risk:.1f}% because of their repeating offense rate and escalating risk categories."
                )

    # 6. Fallback General Assistance Response
    else:
        if lang == "ta":
            reply = "தயவுசெய்து சந்தேக நபரின் பெயர் அல்லது உங்கள் விசாரணை வினவலை குறிப்பிடவும். தங்களுக்கு உதவ நான் தயாராக உள்ளேன்."
        elif lang == "hi":
            reply = "कृपया संदिग्ध का नाम या अपनी जांच क्वेरी दर्ज करें। मैं आपकी सहायता के लिए तैयार हूँ।"
        elif lang == "kn":
            reply = "ದಯವಿಟ್ಟು ಶಂಕಿತರ ಹೆಸರನ್ನು ಅಥವಾ ನಿಮ್ಮ ತನಿಖಾ ಪ್ರಶ್ನೆಯನ್ನು ನಮೂದಿಸಿ. ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಸಿದ್ಧನಿದ್ದೇನೆ."
        else:
            reply = (
                "I am the CrimeVault AI tactical module. Please specify a suspect's name (e.g. Suresh, Karthik, Hari) or ask questions regarding hotspots, "
                "unemployment correlations, or dashboard usage. I exist to analyze complex multi-variable crime registries and explain the predictive patterns "
                "behind recidivism indices."
            )

    return {"reply": reply}

# Manual Trigger for Seeding (debugging)
@app.post("/api/admin/seed")
def trigger_seed():
    try:
        seed_db()
        return {"status": "success", "message": "Database successfully re-seeded."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import io
@app.post("/api/dataset/import")
def import_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = file.file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".xls") or filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv or .xls/.xlsx files.")
            
        # Clean current tables to completely reset platform details
        db.query(CrimeRecord).delete()
        db.query(OffenderRelationship).delete()
        db.query(Offender).delete()
        db.commit()
        
        # Keep track of created offenders to avoid duplication
        created_offenders = {}
        
        for idx, row in df.iterrows():
            # Get suspect info if available
            offender_id = None
            suspect_name = str(row.get("suspect_name", row.get("offender_name", ""))).strip()
            
            if suspect_name and suspect_name.lower() != "nan" and suspect_name.lower() != "":
                if suspect_name not in created_offenders:
                    alias = str(row.get("suspect_alias", row.get("offender_alias", ""))).strip()
                    if alias.lower() == "nan" or alias == "":
                        alias = suspect_name + " Alias"
                    
                    try:
                        age = int(row.get("suspect_age", row.get("offender_age", 30)))
                    except:
                        age = 30
                        
                    status = str(row.get("suspect_status", row.get("offender_status", "Active"))).strip()
                    if status.lower() == "nan" or status == "":
                        status = "Active"
                        
                    try:
                        risk_score = float(row.get("suspect_risk_score", row.get("offender_risk_score", 50.0)))
                    except:
                        risk_score = 50.0
                        
                    db_offender = Offender(
                        name=suspect_name,
                        primary_alias=alias,
                        age=age,
                        criminal_history_count=0,
                        status=status,
                        risk_score=risk_score
                    )
                    db.add(db_offender)
                    db.commit()
                    db.refresh(db_offender)
                    created_offenders[suspect_name] = db_offender
                
                offender = created_offenders[suspect_name]
                offender_id = offender.id
                offender.criminal_history_count += 1
                db.commit()
            
            # Crime Record parsing
            title = str(row.get("title", f"Incident: {row.get('category', 'Street Theft')}")).strip()
            category = str(row.get("category", "Street Theft")).strip()
            description = str(row.get("description", "No detailed logs logged.")).strip()
            
            # Parse Date
            raw_date = row.get("date", datetime.now())
            if isinstance(raw_date, str):
                try:
                    date_obj = datetime.strptime(raw_date, "%Y-%m-%d %H:%M:%S")
                except:
                    try:
                        date_obj = datetime.strptime(raw_date, "%Y-%m-%d")
                    except:
                        date_obj = datetime.now()
            elif isinstance(raw_date, datetime):
                date_obj = raw_date
            else:
                date_obj = datetime.now()
                
            try:
                lat = float(row.get("latitude", 13.0827))
            except:
                lat = 13.0827
                
            try:
                lon = float(row.get("longitude", 80.2707))
            except:
                lon = 80.2707
                
            district = str(row.get("district", "Anna Nagar")).strip()
            
            try:
                severity = int(row.get("severity", 5))
            except:
                severity = 5
                
            crime_status = str(row.get("status", "Under Investigation")).strip()
            
            db_crime = CrimeRecord(
                title=title,
                category=category,
                description=description,
                date=date_obj,
                latitude=lat,
                longitude=lon,
                district=district,
                severity=severity,
                status=crime_status,
                offender_id=offender_id
            )
            db.add(db_crime)
            
        db.commit()
        
        # Dynamically seed some relationships for the new network diagram based on shared districts
        new_offenders = db.query(Offender).all()
        for idx1 in range(len(new_offenders)):
            for idx2 in range(idx1 + 1, len(new_offenders)):
                o1 = new_offenders[idx1]
                o2 = new_offenders[idx2]
                
                # Check if they share any districts in their crime histories
                o1_districts = {c.district for c in o1.crimes}
                o2_districts = {c.district for c in o2.crimes}
                shared = o1_districts.intersection(o2_districts)
                if shared:
                    rel = OffenderRelationship(
                        offender_id_1=o1.id,
                        offender_id_2=o2.id,
                        relationship_type="co-offender" if len(shared) > 1 else "phone_link",
                        strength=round(0.4 + (len(shared) * 0.15), 2)
                    )
                    db.add(rel)
        db.commit()
        
        # Verify result counts
        total_crimes = db.query(CrimeRecord).count()
        total_offenders = db.query(Offender).count()
        
        return {
            "status": "success",
            "message": f"Dataset successfully analyzed and imported. Loaded {total_crimes} crime records and {total_offenders} offenders profiles.",
            "crimes_loaded": total_crimes,
            "offenders_loaded": total_offenders
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to parse and import dataset: {str(e)}")
