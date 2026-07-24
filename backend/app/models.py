from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, create_engine
from sqlalchemy.orm import relationship
from .database import Base

class Offender(Base):
    __tablename__ = "offenders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    primary_alias = Column(String, nullable=True)
    criminal_history_count = Column(Integer, default=0)
    status = Column(String, default="Active")  # Active, Incarcerated, Deceased, Monitored
    risk_score = Column(Float, default=0.0)  # 0.0 to 100.0

    crimes = relationship("CrimeRecord", back_populates="offender")

class CrimeRecord(Base):
    __tablename__ = "crime_records"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    category = Column(String, index=True)  # Theft, Assault, Drug Trafficking, Cybercrime, Smuggling, Money Laundering
    description = Column(String)
    date = Column(DateTime)
    latitude = Column(Float)
    longitude = Column(Float)
    district = Column(String, index=True)  # Tambaram, Velachery, Anna Nagar, etc.
    severity = Column(Integer)  # 1 to 10 (10 being most severe)
    status = Column(String, default="Under Investigation")  # Resolved, Under Investigation, Unsolved
    offender_id = Column(Integer, ForeignKey("offenders.id"), nullable=True)

    offender = relationship("Offender", back_populates="crimes")

class OffenderRelationship(Base):
    __tablename__ = "offender_relationships"

    id = Column(Integer, primary_key=True, index=True)
    offender_id_1 = Column(Integer, ForeignKey("offenders.id"))
    offender_id_2 = Column(Integer, ForeignKey("offenders.id"))
    relationship_type = Column(String)  # co-offender, phone_link, vehicle_share, address_share, financial_link
    strength = Column(Float)  # 0.0 to 1.0

class SocioEconomicData(Base):
    __tablename__ = "socio_economic_data"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String, unique=True, index=True)
    unemployment_rate = Column(Float)  # Percentage
    income_level = Column(Float)  # Average annual income in thousands
    education_level = Column(Float)  # Literacy rate percentage
    population_density = Column(Float)  # People per sq km
    poverty_index = Column(Float)  # 0.0 to 100.0
    urbanization = Column(Float)  # Degree of urbanization percentage
