from sqlalchemy.orm import Session
from ..models import CrimeRecord, Offender
from collections import defaultdict

# Define known crime evolution templates
EVOLUTION_TEMPLATES = {
    "Organized Spare Parts Ring": [
        "Street Theft",
        "Vehicle Theft",
        "Smuggling",
        "Money Laundering"
    ],
    "Narcotics Supply Network": [
        "Street Theft",
        "Drug Trafficking",
        "Smuggling",
        "Money Laundering"
    ],
    "Cyber Fraud Syndicate": [
        "Cybercrime",
        "Smuggling",
        "Money Laundering"
    ],
    "Commercial Burglary Crew": [
        "Street Theft",
        "Organized Burglary",
        "Smuggling"
    ]
}

INTERVENTIONS = {
    "Street Theft": "Increase foot patrols and install street-level public safety cameras in pedestrian zones.",
    "Vehicle Theft": "Increase patrol visibility around transit parking; deploy automated license plate readers (ALPR).",
    "Organized Burglary": "Advise commercial properties on CCTV installations; deploy decoy patrol vehicles in business zones.",
    "Drug Trafficking": "Conduct surveillance on known distribution hotspots; intercept communications of identified co-offenders.",
    "Cybercrime": "Launch localized cyber awareness campaigns and issue public warnings on active phishing trends.",
    "Smuggling": "Audit border checkpoints and check local chop shops / vehicle garages; coordinate with highway patrols.",
    "Money Laundering": "Initiate forensic audits of suspected local fronts; flag financial links to central regulatory agencies."
}

def analyze_crime_evolution(db: Session):
    offenders = db.query(Offender).filter(Offender.status == "Active").all()
    
    # 1. First, calculate actual sequence transition counts across all offenders
    # to compute dataset-wide empirical confidence scores.
    transitions = defaultdict(int)
    state_counts = defaultdict(int)
    
    for offender in offenders:
        crimes = db.query(CrimeRecord).filter(CrimeRecord.offender_id == offender.id).order_by(CrimeRecord.date).all()
        if not crimes:
            continue
        
        # Deduplicate consecutive categories for transitions (e.g. A -> A -> B becomes A -> B)
        seq = []
        for c in crimes:
            if not seq or seq[-1] != c.category:
                seq.append(c.category)
                
        # Count transitions
        for i in range(len(seq) - 1):
            curr_state = seq[i]
            next_state = seq[i+1]
            transitions[(curr_state, next_state)] += 1
            state_counts[curr_state] += 1

    # Calculate empirical transition probabilities
    transition_probs = {}
    for (curr, nxt), count in transitions.items():
        base = state_counts[curr]
        transition_probs[(curr, nxt)] = (count / base) if base > 0 else 0.5

    # 2. Match each offender to our templates and identify escalating chains
    active_chains = []
    
    for offender in offenders:
        crimes = db.query(CrimeRecord).filter(CrimeRecord.offender_id == offender.id).order_by(CrimeRecord.date).all()
        if len(crimes) < 2:
            continue
            
        # Get offender's unique category sequence in order
        offender_seq = []
        for c in crimes:
            if not offender_seq or offender_seq[-1] != c.category:
                offender_seq.append(c.category)
                
        # Find the best matching template
        best_template_name = None
        best_match_indices = []
        best_completion_ratio = 0.0
        
        for name, template in EVOLUTION_TEMPLATES.items():
            # Check how much of the template is matched by the offender's sequence (in order)
            matched_indices = []
            temp_idx = 0
            
            for cat in offender_seq:
                # Find if this category is in the template at or after current search index
                if cat in template[temp_idx:]:
                    idx_in_template = template.index(cat, temp_idx)
                    matched_indices.append(idx_in_template)
                    temp_idx = idx_in_template + 1
                    
            if matched_indices:
                ratio = len(matched_indices) / len(template)
                if ratio > best_completion_ratio:
                    best_completion_ratio = ratio
                    best_template_name = name
                    best_match_indices = matched_indices
                    
        # If we have a reasonable match (at least matches the first stage of the chain)
        if best_template_name and best_completion_ratio >= 0.25:
            template = EVOLUTION_TEMPLATES[best_template_name]
            last_matched_idx = best_match_indices[-1]
            
            current_stage = template[last_matched_idx]
            
            # If they completed the entire template, they are at the terminal stage
            if last_matched_idx == len(template) - 1:
                next_stage = None
                confidence = 100.0
                intervention = "Offender is at terminal stage. Prepare arrest warrant, freeze assets, and execute full network search."
            else:
                next_stage = template[last_matched_idx + 1]
                
                # Empirical confidence based on dataset transition probabilities
                emp_prob = transition_probs.get((current_stage, next_stage), 0.0)
                
                # Composite confidence: mix of template progress, empirical probability, and offender risk
                base_conf = (len(best_match_indices) / len(template)) * 40.0 # up to 40%
                trans_conf = emp_prob * 40.0 # up to 40%
                risk_conf = (offender.risk_score / 100.0) * 20.0 # up to 20%
                
                confidence = min(95.0, max(50.0, base_conf + trans_conf + risk_conf))
                # Add default or custom intervention
                intervention = INTERVENTIONS.get(next_stage, "Monitor suspect and deploy surveillance resources.")
                
            active_chains.append({
                "offender_id": offender.id,
                "offender_name": offender.name,
                "offender_alias": offender.primary_alias,
                "offender_risk": round(offender.risk_score, 1),
                "template_name": best_template_name,
                "current_sequence": offender_seq,
                "template_sequence": template,
                "current_stage": current_stage,
                "next_predicted_stage": next_stage,
                "confidence_score": round(confidence, 1),
                "intervention_action": intervention
            })

    # Sort chains by confidence / risk descending to highlight highest dangers
    active_chains.sort(key=lambda x: (x["confidence_score"], x["offender_risk"]), reverse=True)
    return active_chains
