import networkx as nx
from networkx.algorithms import community
from sqlalchemy.orm import Session
from ..models import Offender, OffenderRelationship, CrimeRecord

def analyze_criminal_network(db: Session):
    offenders = db.query(Offender).all()
    relationships = db.query(OffenderRelationship).all()
    
    if not offenders:
        return {"nodes": [], "links": [], "gangs": []}
        
    G = nx.Graph()
    
    # Add nodes
    offender_map = {}
    for o in offenders:
        offender_map[o.id] = {
            "id": o.id,
            "name": o.name,
            "alias": o.primary_alias,
            "age": o.age,
            "risk_score": o.risk_score,
            "status": o.status,
            "history_count": o.criminal_history_count,
            "degree": 0,
            "pagerank": 0.0,
            "gang_id": 0,
            "role": "Member" # Will update based on centrality
        }
        G.add_node(o.id)
        
    # Add edges
    for r in relationships:
        if r.offender_id_1 in offender_map and r.offender_id_2 in offender_map:
            # Check if edge already exists, if so take higher strength
            if G.has_edge(r.offender_id_1, r.offender_id_2):
                existing_weight = G[r.offender_id_1][r.offender_id_2].get("weight", 0.0)
                if r.strength > existing_weight:
                    G[r.offender_id_1][r.offender_id_2]["weight"] = r.strength
                    G[r.offender_id_1][r.offender_id_2]["type"] = r.relationship_type
            else:
                G.add_edge(r.offender_id_1, r.offender_id_2, weight=r.strength, type=r.relationship_type)

    if len(G.nodes) > 0:
        # Calculate PageRank
        try:
            pr = nx.pagerank(G, weight="weight")
            for oid, score in pr.items():
                offender_map[oid]["pagerank"] = round(float(score) * 100, 2)
        except Exception:
            # Fallback if PageRank fails
            for oid in G.nodes:
                offender_map[oid]["pagerank"] = 1.0
                
        # Calculate Degrees
        degrees = dict(G.degree())
        for oid, deg in degrees.items():
            offender_map[oid]["degree"] = deg
            
        # Detect communities (Gangs) using Modularity
        try:
            # Convert generators/sets into lists of sets
            gang_communities = list(community.greedy_modularity_communities(G, weight="weight"))
            for gang_id, node_set in enumerate(gang_communities, start=1):
                for oid in node_set:
                    offender_map[oid]["gang_id"] = gang_id
        except Exception:
            # Fallback: place everyone in gang 1
            for oid in G.nodes:
                offender_map[oid]["gang_id"] = 1

    # Classify Roles based on Centrality
    # Top node in each gang is the "Leader", next is "Key Associate", others are "Members"
    gangs_members = {}
    for oid, o_data in offender_map.items():
        gid = o_data["gang_id"]
        if gid not in gangs_members:
            gangs_members[gid] = []
        gangs_members[gid].append(o_data)
        
    for gid, members in gangs_members.items():
        # Sort by PageRank descending
        members.sort(key=lambda x: x["pagerank"], reverse=True)
        if len(members) >= 1:
            offender_map[members[0]["id"]]["role"] = "Leader"
        if len(members) >= 2:
            offender_map[members[1]["id"]]["role"] = "Key Associate"
            
    # Structure Gang metrics
    gang_summaries = []
    for gid, members in gangs_members.items():
        avg_risk = sum(m["risk_score"] for m in members) / len(members)
        leader_name = next((m["name"] for m in members if m["role"] == "Leader"), "Unknown")
        gang_summaries.append({
            "gang_id": gid,
            "gang_name": f"Syndicate {chr(64 + gid)}" if gid <= 26 else f"Syndicate {gid}",
            "member_count": len(members),
            "avg_risk": round(avg_risk, 1),
            "leader": leader_name,
            "primary_activities": "Theft / Smuggling" if gid == 1 else "Narcotics / Financial Fraud" if gid == 2 else "Organized Crimes"
        })

    # Prepare links list
    links = []
    for u, v, data in G.edges(data=True):
        links.append({
            "source": u,
            "target": v,
            "type": data.get("type", "co-offender"),
            "weight": round(float(data.get("weight", 0.5)), 2)
        })

    return {
        "nodes": list(offender_map.values()),
        "links": links,
        "gangs": gang_summaries
    }
