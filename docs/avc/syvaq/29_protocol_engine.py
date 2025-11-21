# 29_protocol_engine.py
# MVP engine for founder/entity transit scoring + synastry activation.
# Requires: swisseph (pyswisseph), pandas, numpy, pytz, python-dateutil
# Usage:
#   1) pip install swisseph pandas numpy pytz python-dateutil
#   2) Edit the __main__ block with exact tz-aware datetimes for founder/entity
#   3) python 29_protocol_engine.py
import swisseph as swe
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone

PLANETS = {
    'sun': swe.SUN, 'moon': swe.MOON, 'mercury': swe.MERCURY,
    'venus': swe.VENUS, 'mars': swe.MARS, 'jupiter': swe.JUPITER,
    'saturn': swe.SATURN, 'uranus': swe.URANUS, 'neptune': swe.NEPTUNE, 'pluto': swe.PLUTO
}

PLANET_WEIGHTS = {
    'sun': 1.0, 'moon':1.2, 'mercury':0.8, 'venus':1.0,
    'mars':1.1, 'jupiter':1.4, 'saturn':1.8, 'uranus':2.2, 'neptune':2.4, 'pluto':2.8
}

ASPECTS = {
    'conjunction': 0.0, 'sextile': 60.0, 'square': 90.0,
    'trine': 120.0, 'opposition': 180.0, 'quincunx':150.0
}

ORB_DEFAULT = 8.0
ORB_OUTER = 20.0

def normalize_angle(a: float) -> float:
    a = a % 360.0
    return a + 360.0 if a < 0 else a

def angular_difference(a: float, b: float) -> float:
    diff = abs(normalize_angle(a - b))
    return min(diff, 360 - diff)

def aspect_strength(delta_deg: float, orb: float) -> float:
    sigma = max(0.1, orb / 3.0)
    return float(np.exp(-0.5 * (delta_deg / sigma)**2))

def julian_day_from_datetime(dt: datetime) -> float:
    dt_utc = dt.astimezone(timezone.utc)
    year, month, day = dt_utc.year, dt_utc.month, dt_utc.day
    hour_decimal = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    return swe.julday(year, month, day, hour_decimal)

def planet_longitude(jd_ut: float, planet_key: str) -> float:
    pid = PLANETS[planet_key]
    lon = swe.calc_ut(jd_ut, pid)[0][0]
    return normalize_angle(lon)

def compute_natal_positions(birth_dt: datetime) -> dict:
    jd = julian_day_from_datetime(birth_dt)
    return {p: planet_longitude(jd, p) for p in PLANETS}

def compute_transit_score_for_chart(jd_ut: float, natal_positions: dict, planet_weights=PLANET_WEIGHTS):
    score = 0.0
    detail = []
    for tp in PLANETS.keys():
        trans_pos = planet_longitude(jd_ut, tp)
        w_tp = planet_weights.get(tp, 1.0)
        orb = ORB_OUTER if tp in ['uranus','neptune','pluto'] else ORB_DEFAULT
        for np_name, np_pos in natal_positions.items():
            diff = angular_difference(trans_pos, np_pos)
            best_strength, best_aspect = 0.0, None
            for aspect_name, aspect_ang in ASPECTS.items():
                delta_to_aspect = abs(diff - aspect_ang)
                if delta_to_aspect <= orb + 5.0:
                    s = aspect_strength(delta_to_aspect, orb)
                    if s > best_strength:
                        best_strength, best_aspect = s, aspect_name
            if best_strength > 0:
                wp = planet_weights.get(np_name, 1.0)
                contrib = wp * w_tp * best_strength
                score += contrib
                detail.append((tp, np_name, best_aspect, best_strength, contrib))
    return score, detail

def compute_synastry_profile(natal_founder: dict, natal_entity: dict) -> dict:
    profile = {}
    for f in natal_founder:
        for e in natal_entity:
            diff = angular_difference(natal_founder[f], natal_entity[e])
            best_s = 0.0
            for aspect_ang in ASPECTS.values():
                d = abs(diff - aspect_ang)
                if d <= ORB_DEFAULT + 5.0:
                    s = aspect_strength(d, ORB_DEFAULT)
                    best_s = max(best_s, s)
            baseline = 1.0
            if (f == 'sun' and e == 'moon') or (f == 'moon' and e == 'sun'):
                baseline = 1.6
            if (f == 'venus' and e == 'mars') or (f == 'mars' and e == 'venus'):
                baseline = 1.5
            if (f == 'saturn' or e == 'saturn') and (f == 'sun' or e == 'sun'):
                baseline = 1.4
            profile[(f,e)] = best_s * baseline
    return profile

def compute_synastry_activation(jd_ut: float, natal_founder: dict, natal_entity: dict, syn_profile: dict) -> float:
    trans_strength_to_founder = {p:0.0 for p in natal_founder}
    trans_strength_to_entity = {p:0.0 for p in natal_entity}
    for tp in PLANETS.keys():
        trans_pos = planet_longitude(jd_ut, tp)
        orb = ORB_OUTER if tp in ['uranus','neptune','pluto'] else ORB_DEFAULT
        for nf in natal_founder:
            best_s = 0.0
            diff = None
            diff = angular_difference(trans_pos, natal_founder[nf])
            for aspect_ang in ASPECTS.values():
                d = abs(diff - aspect_ang)
                if d <= orb + 5:
                    best_s = max(best_s, aspect_strength(d, orb))
            trans_strength_to_founder[nf] += best_s
        for ne in natal_entity:
            best_s = 0.0
            diff = angular_difference(trans_pos, natal_entity[ne])
            for aspect_ang in ASPECTS.values():
                d = abs(diff - aspect_ang)
                if d <= orb + 5:
                    best_s = max(best_s, aspect_strength(d, orb))
            trans_strength_to_entity[ne] += best_s
    activation = 0.0
    for (f,e), weight in syn_profile.items():
        a_f = trans_strength_to_founder.get(f,0.0)
        a_e = trans_strength_to_entity.get(e,0.0)
        activation += weight * (a_f + a_e) / 2.0
    return activation

def compute_daily_series(founder_birth_dt: datetime, entity_birth_dt: datetime, start_date, end_date):
    natal_founder = compute_natal_positions(founder_birth_dt)
    natal_entity = compute_natal_positions(entity_birth_dt)
    syn_profile = compute_synastry_profile(natal_founder, natal_entity)

    rows = []
    day = start_date
    while day <= end_date:
        dt_mid = datetime(day.year, day.month, day.day, 0, 0, 0, tzinfo=timezone.utc)
        jd = julian_day_from_datetime(dt_mid)
        f_score, _ = compute_transit_score_for_chart(jd, natal_founder)
        e_score, _ = compute_transit_score_for_chart(jd, natal_entity)
        s_activation = compute_synastry_activation(jd, natal_founder, natal_entity, syn_profile)
        composite = 0.4 * f_score + 0.3 * e_score + 0.3 * s_activation
        tag = 'green'
        if composite > 1.2: tag = 'red'
        elif composite > 0.7: tag = 'amber'
        rows.append({
            'date': day.isoformat(),
            'founder_score': float(f_score),
            'entity_score': float(e_score),
            'synastry_activation': float(s_activation),
            'composite_score': float(composite),
            'tag': tag,
            'notes': ''
        })
        day = day + timedelta(days=1)
    return pd.DataFrame(rows)

if __name__ == "__main__":
    import pytz
    # === REPLACE THESE WITH EXACT, TIMEZONE-AWARE VALUES ===
    # Example placeholders:
    founder_birth_dt = pytz.timezone('America/New_York').localize(datetime(1999, 11, 21, 15, 9))
    entity_birth_dt  = pytz.timezone('America/New_York').localize(datetime(2026, 7, 4, 12, 0))
    # Date range
    start_date = datetime(2025, 7, 1).date()
    end_date   = datetime(2027, 1, 31).date()
    df = compute_daily_series(founder_birth_dt, entity_birth_dt, start_date, end_date)
    out = "lilly_syvaq_astro_series_20250701_20270131.csv"
    df.to_csv(out, index=False)
    print("Wrote:", out)
