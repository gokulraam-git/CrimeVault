import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import Offender, CrimeRecord, OffenderRelationship, SocioEconomicData

def seed_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Socio-Economic Data
        districts_data = [
            {"district": "Koramangala", "unemployment_rate": 8.5, "income_level": 450.0, "education_level": 82.0, "population_density": 8500.0, "poverty_index": 18.5, "urbanization": 75.0},
            {"district": "Indiranagar", "unemployment_rate": 6.2, "income_level": 650.0, "education_level": 89.0, "population_density": 9200.0, "poverty_index": 11.2, "urbanization": 90.0},
            {"district": "Jayanagar", "unemployment_rate": 4.1, "income_level": 950.0, "education_level": 94.0, "population_density": 11000.0, "poverty_index": 5.4, "urbanization": 98.0},
            {"district": "Whitefield", "unemployment_rate": 4.5, "income_level": 880.0, "education_level": 92.0, "population_density": 7800.0, "poverty_index": 6.8, "urbanization": 95.0},
            {"district": "Malleshwaram", "unemployment_rate": 5.8, "income_level": 700.0, "education_level": 88.0, "population_density": 14000.0, "poverty_index": 9.5, "urbanization": 99.0},
            {"district": "Yelahanka", "unemployment_rate": 7.9, "income_level": 520.0, "education_level": 84.0, "population_density": 10500.0, "poverty_index": 14.8, "urbanization": 85.0},
            {"district": "Hebbal", "unemployment_rate": 9.2, "income_level": 410.0, "education_level": 79.0, "population_density": 16500.0, "poverty_index": 22.0, "urbanization": 97.0},
            {"district": "Rajajinagar", "unemployment_rate": 7.1, "income_level": 600.0, "education_level": 80.0, "population_density": 22000.0, "poverty_index": 15.0, "urbanization": 99.0},
        ]
        
        for d in districts_data:
            db_se = SocioEconomicData(**d)
            db.add(db_se)
        
        # 2. Seed 40 Offenders
        offender_names = [
            # Syndicate A (Theft & Smuggling)
            ("Karthik", "Racer Karthik", 28, 15),
            ("Suresh Kumar", "Suri", 34, 22),
            ("Selvam", "Wire Selvam", 38, 19),
            ("Rajesh", "Pattarai Rajesh", 36, 14),
            ("Dinesh", "Dina", 24, 7),
            
            # Syndicate B (Narcotics & Money Laundering)
            ("Ranganathan", "Ranga", 42, 35),
            ("Mohammed Bilal", "Bilal", 26, 12),
            ("Vijay", "Malleshwaram Viji", 33, 18),
            ("Stephen", "Steve", 27, 6),
            ("Ganesh", "Gani", 45, 40),
            
            # Syndicate C (Cyber Extortion & Scams)
            ("Venkatesh", "Venkat", 31, 8),
            ("Stephen Raj", "Raj", 29, 9),
            ("Anand", "Soda Anand", 30, 11),
            ("Prakash", "Paki", 25, 4),
            ("Arumugam", "Aru", 39, 25),
            
            # Syndicate D (Highway Robbery & Vehicles Smuggling)
            ("Senthil", "Vathiar Senthil", 41, 14),
            ("Hari", "Hari Box", 23, 5),
            ("Saravanan", "Saro", 35, 17),
            ("Vasudevan", "Vasu", 47, 29),
            ("Narendra", "Naren", 32, 10),
            
            # Syndicate E (Gold Smuggling & Underworld Finance)
            ("Madan Lal", "Madan", 51, 42),
            ("Subash", "Babu", 29, 13),
            ("Ravichandran", "Ravi", 37, 20),
            ("Charles", "Charlie", 26, 6),
            ("Vikram", "Vicky", 30, 11),
            
            # Syndicate F (Bazaar Extortions & Burglary)
            ("Baskar", "Pocket Baskar", 33, 16),
            ("Sekar", "Kathi Sekar", 28, 8),
            ("Kumar", "Kuttu Kumar", 34, 21),
            ("Deva", "Deva Bhai", 44, 33),
            ("Rathnam", "Ratna", 40, 24),

            # Syndicate G (Counterfeit currency & Forgery)
            ("Gopal", "Gopu", 29, 12),
            ("Ramachandran", "Ramu", 34, 18),
            ("Nikhil", "Nick", 26, 7),
            ("Shekhar", "Shek", 40, 22),
            ("Vicky", "Vicky Bhai", 31, 15),

            # Syndicate H (Freelance Offender Network)
            ("Prashanth", "Poochi", 28, 9),
            ("Kishore", "Kish", 35, 11),
            ("Eshwar", "Eshwar Bhai", 42, 26),
            ("Dhanush", "Dhanu", 25, 4),
            ("Gopinath", "Gopi", 38, 20)
        ]
        
        offenders = []
        for name, alias, age, history_count in offender_names:
            off = Offender(
                name=name,
                primary_alias=alias,
                age=age,
                criminal_history_count=history_count,
                status=random.choice(["Active", "Monitored", "Active", "Active"]),
                risk_score=random.uniform(35.0, 96.0)
            )
            db.add(off)
            offenders.append(off)
        db.commit()

        # Retrieve seeded offenders
        db_offenders = db.query(Offender).all()

        # 3. Seed 65 Relationships (Gangs members and relationships increased to 40 & 65)
        relationships = [
            # Syndicate A Links
            (db_offenders[0].id, db_offenders[1].id, "co-offender", 0.85),
            (db_offenders[0].id, db_offenders[2].id, "phone_link", 0.70),
            (db_offenders[1].id, db_offenders[2].id, "co-offender", 0.90),
            (db_offenders[1].id, db_offenders[3].id, "vehicle_share", 0.55),
            (db_offenders[2].id, db_offenders[3].id, "address_share", 0.65),
            (db_offenders[4].id, db_offenders[0].id, "co-offender", 0.60),
            (db_offenders[4].id, db_offenders[3].id, "phone_link", 0.50),

            # Syndicate B Links
            (db_offenders[5].id, db_offenders[6].id, "financial_link", 0.88),
            (db_offenders[5].id, db_offenders[9].id, "phone_link", 0.75),
            (db_offenders[6].id, db_offenders[7].id, "co-offender", 0.80),
            (db_offenders[7].id, db_offenders[8].id, "address_share", 0.60),
            (db_offenders[8].id, db_offenders[9].id, "co-offender", 0.82),
            (db_offenders[6].id, db_offenders[9].id, "vehicle_share", 0.55),

            # Syndicate C Links
            (db_offenders[10].id, db_offenders[11].id, "phone_link", 0.82),
            (db_offenders[10].id, db_offenders[14].id, "financial_link", 0.78),
            (db_offenders[11].id, db_offenders[12].id, "co-offender", 0.85),
            (db_offenders[12].id, db_offenders[13].id, "address_share", 0.70),
            (db_offenders[13].id, db_offenders[14].id, "phone_link", 0.60),
            (db_offenders[11].id, db_offenders[14].id, "co-offender", 0.80),

            # Syndicate D Links
            (db_offenders[15].id, db_offenders[16].id, "co-offender", 0.88),
            (db_offenders[15].id, db_offenders[19].id, "phone_link", 0.74),
            (db_offenders[16].id, db_offenders[17].id, "vehicle_share", 0.68),
            (db_offenders[17].id, db_offenders[18].id, "address_share", 0.70),
            (db_offenders[18].id, db_offenders[19].id, "co-offender", 0.85),
            (db_offenders[16].id, db_offenders[19].id, "co-offender", 0.80),

            # Syndicate E Links
            (db_offenders[20].id, db_offenders[21].id, "financial_link", 0.92),
            (db_offenders[20].id, db_offenders[24].id, "phone_link", 0.78),
            (db_offenders[21].id, db_offenders[22].id, "co-offender", 0.84),
            (db_offenders[22].id, db_offenders[23].id, "address_share", 0.65),
            (db_offenders[23].id, db_offenders[24].id, "co-offender", 0.80),
            (db_offenders[21].id, db_offenders[24].id, "vehicle_share", 0.70),

            # Syndicate F Links
            (db_offenders[25].id, db_offenders[26].id, "co-offender", 0.86),
            (db_offenders[25].id, db_offenders[29].id, "phone_link", 0.72),
            (db_offenders[26].id, db_offenders[27].id, "vehicle_share", 0.60),
            (db_offenders[27].id, db_offenders[28].id, "address_share", 0.74),
            (db_offenders[28].id, db_offenders[29].id, "co-offender", 0.88),
            (db_offenders[26].id, db_offenders[29].id, "financial_link", 0.75),

            # Syndicate G Links (Counterfeit currency clique)
            (db_offenders[30].id, db_offenders[31].id, "co-offender", 0.88),
            (db_offenders[30].id, db_offenders[34].id, "phone_link", 0.76),
            (db_offenders[31].id, db_offenders[32].id, "co-offender", 0.82),
            (db_offenders[32].id, db_offenders[33].id, "address_share", 0.70),
            (db_offenders[33].id, db_offenders[34].id, "phone_link", 0.80),
            (db_offenders[31].id, db_offenders[34].id, "financial_link", 0.74),

            # Syndicate H Links (Freelancer clique)
            (db_offenders[35].id, db_offenders[36].id, "co-offender", 0.75),
            (db_offenders[36].id, db_offenders[37].id, "phone_link", 0.65),
            (db_offenders[37].id, db_offenders[38].id, "financial_link", 0.80),
            (db_offenders[38].id, db_offenders[39].id, "co-offender", 0.70),
            (db_offenders[35].id, db_offenders[39].id, "address_share", 0.60),

            # Inter-Syndicate Bridge Links (Supplier/Buyer links)
            (db_offenders[2].id, db_offenders[5].id, "phone_link", 0.45), # A links B
            (db_offenders[7].id, db_offenders[10].id, "phone_link", 0.40), # B links C
            (db_offenders[12].id, db_offenders[15].id, "co-offender", 0.35), # C links D
            (db_offenders[17].id, db_offenders[20].id, "financial_link", 0.55), # D links E
            (db_offenders[22].id, db_offenders[25].id, "phone_link", 0.42), # E links F
            (db_offenders[27].id, db_offenders[30].id, "co-offender", 0.38), # F links G
            (db_offenders[32].id, db_offenders[35].id, "phone_link", 0.52), # G links H
            (db_offenders[37].id, db_offenders[0].id, "co-offender", 0.48), # H links A
            (db_offenders[14].id, db_offenders[22].id, "financial_link", 0.48),
            (db_offenders[19].id, db_offenders[29].id, "phone_link", 0.50),
            (db_offenders[3].id, db_offenders[26].id, "vehicle_share", 0.45),
            (db_offenders[35].id, db_offenders[5].id, "phone_link", 0.55),
            (db_offenders[37].id, db_offenders[12].id, "co-offender", 0.46),
            (db_offenders[39].id, db_offenders[22].id, "financial_link", 0.52),
            (db_offenders[8].id, db_offenders[30].id, "co-offender", 0.42),
            (db_offenders[13].id, db_offenders[31].id, "phone_link", 0.48),
            (db_offenders[18].id, db_offenders[32].id, "vehicle_share", 0.36)
        ]

        for off1, off2, rel_type, strg in relationships:
            rel = OffenderRelationship(
                offender_id_1=off1,
                offender_id_2=off2,
                relationship_type=rel_type,
                strength=strg
            )
            db.add(rel)

        # 4. Seed Crime Records ( Bengaluru Districts )
        district_coords = {
            "Koramangala": (12.9352, 77.6244),
            "Indiranagar": (12.9719, 77.6412),
            "Jayanagar": (12.9308, 77.5838),
            "Whitefield": (12.9698, 77.7500),
            "Malleshwaram": (13.0031, 77.5696),
            "Yelahanka": (13.1007, 77.5963),
            "Hebbal": (13.0358, 77.5970),
            "Rajajinagar": (12.9902, 77.5538)
        }

        categories = [
            "Street Theft", "Vehicle Theft", "Assault", "Drug Trafficking", 
            "Cybercrime", "Smuggling", "Money Laundering", "Organized Burglary"
        ]

        descriptions = {
            "Street Theft": "Snatching of gold chain/mobile phone from pedestrian by riders on motor vehicle.",
            "Vehicle Theft": "Stealing of two-wheeler parked in front of residential area.",
            "Assault": "Physical altercation between two groups leading to public disturbance and injuries.",
            "Drug Trafficking": "Possession and distribution of banned narcotics near local educational/commercial institutions.",
            "Cybercrime": "Phishing scam targeting elderly citizens, leading to unauthorized bank transfer.",
            "Smuggling": "Transportation of contraband goods through border areas/transit centers.",
            "Money Laundering": "Use of shell entities/local shops to channel illegally obtained assets.",
            "Organized Burglary": "Breaking and entering into locked commercial establishment during late hours."
        }

        # Build clean sequential chains for Crime Evolution showcase
        start_date = datetime(2024, 1, 1)
        crimes_data = []

        evolution_chains = [
            # Karthik (Offender 0)
            (0, [
                ("Snatching of handbag on street", "Street Theft", 3, start_date + timedelta(days=15), "Koramangala"),
                ("Theft of Apache motor two-wheeler", "Vehicle Theft", 5, start_date + timedelta(days=90), "Koramangala"),
                ("Transport of stolen parts in truck", "Smuggling", 7, start_date + timedelta(days=210), "Yelahanka"),
                ("Channelling stolen parts proceeds", "Money Laundering", 8, start_date + timedelta(days=360), "Malleshwaram")
            ]),
            # Suresh (Offender 1)
            (1, [
                ("Theft of Pulsar motorbike near station", "Vehicle Theft", 5, start_date + timedelta(days=30), "Yelahanka"),
                ("Dismantling motorbikes at chop shop", "Smuggling", 6, start_date + timedelta(days=120), "Yelahanka"),
                ("Interstate smuggling of motorcycle parts", "Smuggling", 8, start_date + timedelta(days=270), "Koramangala"),
                ("Laundering proceeds of chop shop through spare parts store", "Money Laundering", 8, start_date + timedelta(days=400), "Rajajinagar")
            ]),
            # Ranganathan (Offender 5)
            (5, [
                ("Phishing email scam on business accounts", "Cybercrime", 6, start_date + timedelta(days=60), "Jayanagar"),
                ("Wire transfer fraud worth 15 Lakhs", "Cybercrime", 7, start_date + timedelta(days=180), "Whitefield"),
                ("Establishment of fake consultancies for cash routing", "Money Laundering", 9, start_date + timedelta(days=300), "Malleshwaram")
            ]),
            # Bilal (Offender 6)
            (6, [
                ("Possession of synthetic drugs at local club", "Drug Trafficking", 5, start_date + timedelta(days=80), "Indiranagar"),
                ("Distribution network of drugs using street peddlers", "Drug Trafficking", 7, start_date + timedelta(days=200), "Indiranagar"),
                ("Buying luxury cars with drug trade cash", "Money Laundering", 8, start_date + timedelta(days=320), "Whitefield")
            ]),
            # Dinesh (Offender 4)
            (4, [
                ("Mobile snatching at bus stand", "Street Theft", 3, start_date + timedelta(days=45), "Hebbal"),
                ("House break-in during daytime", "Organized Burglary", 6, start_date + timedelta(days=150), "Hebbal"),
                ("Fencing stolen gold jewelry to local receivers", "Smuggling", 7, start_date + timedelta(days=280), "Rajajinagar")
            ])
        ]

        for off_idx, chain in evolution_chains:
            off_id = db_offenders[off_idx].id
            for desc, cat, sev, date, dist in chain:
                lat_base, lon_base = district_coords[dist]
                crimes_data.append({
                    "title": f"Incident: {cat} by {db_offenders[off_idx].name}",
                    "category": cat,
                    "description": desc,
                    "date": date,
                    "latitude": lat_base + random.uniform(-0.015, 0.015),
                    "longitude": lon_base + random.uniform(-0.015, 0.015),
                    "district": dist,
                    "severity": sev,
                    "status": random.choice(["Resolved", "Under Investigation", "Under Investigation"]),
                    "offender_id": off_id
                })

        # Add generic crimes to fill up the database (totaling ~180 crimes)
        districts = list(district_coords.keys())
        current_time = datetime.now()
        days_range = (current_time - start_date).days
        
        for _ in range(160):
            dist = random.choice(districts)
            lat_base, lon_base = district_coords[dist]
            cat = random.choice(categories)
            days_offset = random.randint(0, days_range)
            crime_date = start_date + timedelta(days=days_offset)
            
            # Artificial anomaly: spike in Indiranagar in Oct/Nov 2024
            if dist == "Indiranagar" and crime_date.year == 2024 and crime_date.month in [10, 11]:
                for _ in range(3):
                    crimes_data.append({
                        "title": f"Reported {cat} in {dist}",
                        "category": cat,
                        "description": descriptions[cat],
                        "date": crime_date + timedelta(hours=random.randint(0, 23)),
                        "latitude": lat_base + random.uniform(-0.01, 0.01),
                        "longitude": lon_base + random.uniform(-0.01, 0.01),
                        "district": dist,
                        "severity": random.randint(2, 8),
                        "status": random.choice(["Resolved", "Under Investigation", "Unsolved"]),
                        "offender_id": random.choice([None, None, None, random.choice(db_offenders).id])
                    })

            crimes_data.append({
                "title": f"Reported {cat} in {dist}",
                "category": cat,
                "description": descriptions[cat],
                "date": crime_date,
                "latitude": lat_base + random.uniform(-0.012, 0.012),
                "longitude": lon_base + random.uniform(-0.012, 0.012),
                "district": dist,
                "severity": random.randint(1, 9),
                "status": random.choice(["Resolved", "Under Investigation", "Unsolved"]),
                "offender_id": random.choice([None, None, None, random.choice(db_offenders).id])
            })

        for crime in crimes_data:
            db_crime = CrimeRecord(**crime)
            db.add(db_crime)

        db.commit()
        print(f"Successfully seeded database with {len(districts_data)} districts, {len(db_offenders)} offenders, and {len(crimes_data)} crime records.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
