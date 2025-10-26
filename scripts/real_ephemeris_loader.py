#!/usr/bin/env python3
"""
real_ephemeris_loader.py
Fetch geocentric ecliptic longitudes for planets using Skyfield and write CSV.
Also detects sign ingresses (planet enters new zodiac sign).
"""

import os

import pandas as pd
from skyfield.api import load

OUTDIR = "outputs"
os.makedirs(OUTDIR, exist_ok=True)

# choose ephemeris (de440s recommended); Skyfield will download if needed
EPHEMERIS = "de440s.bsp"   # or 'de421.bsp' for a smaller file

PLANET_KEYS = {
    'Sun': 'sun',
    'Moon': 'moon',
    'Mercury': 'mercury',
    'Venus': 'venus',
    'Mars': 'mars',
    'Jupiter': 'jupiter barycenter',
    'Saturn': 'saturn barycenter',
    'Uranus': 'uranus barycenter',
    'Neptune': 'neptune barycenter',
    'Pluto': 'pluto barycenter'
}

def load_ephemeris():
    print(f"Loading ephemeris {EPHEMERIS} (first run will download file)...")
    eph = load(EPHEMERIS)
    ts = load.timescale()
    return eph, ts

def compute_geocentric_longitudes(eph, ts, start_date, end_date, step_days=1):
    """
    Compute geocentric ecliptic longitudes for planets at dates between start_date and end_date
    at UTC midnight. Returns DataFrame indexed by date with columns for each planet.
    """
    earth = eph['earth']
    dates = pd.date_range(start_date, end_date, freq=f'{step_days}D')
    rows = []
    for d in dates:
        # midnight UTC
        t = ts.utc(d.year, d.month, d.day, 0, 0, 0)
        row = {'date': d}
        for label, key in PLANET_KEYS.items():
            # observe planet from Earth (geocentric)
            target = eph[key]
            astrom = earth.at(t).observe(target)
            # ecliptic lat/lon
            eclip = astrom.ecliptic_latlon()
            # ecliptic_latlon returns (latitude, longitude, distance) or an object with .lon .lat .distance
            # depending on Skyfield version; use .lon.degrees for longitude
            lon = getattr(eclip, 'lon', None)
            if lon is None:
                # older style: tuple (lat, lon, distance)
                lat_obj, lon_obj, dist_obj = eclip
                lon_deg = lon_obj.degrees
            else:
                lon_deg = eclip.lon.degrees
            # normalize 0..360
            lon_deg = lon_deg % 360.0
            row[label] = lon_deg
        rows.append(row)
    df = pd.DataFrame(rows).set_index('date')
    return df

def detect_ingresses(df):
    """
    Detect sign ingresses: when longitude crosses a multiple of 30 degrees (0..360),
    meaning planet has entered a new zodiac sign. Return events DataFrame with
    date, planet, from_sign, to_sign, longitude.
    """
    def sign_of(lon):
        return int(lon // 30)  # 0..11

    records = []
    planets = [c for c in df.columns]
    prev = None
    for date, row in df.iterrows():
        if prev is None:
            prev = row
            continue
        for p in planets:
            prev_sign = sign_of(prev[p])
            new_sign = sign_of(row[p])
            if new_sign != prev_sign:
                records.append({
                    'date': date,
                    'planet': p,
                    'from_sign': prev_sign,
                    'to_sign': new_sign,
                    'longitude': row[p]
                })
        prev = row
    return pd.DataFrame(records)

if __name__ == '__main__':
    # example date range; adjust as needed
    start = "2019-01-01"
    end = "2025-12-31"

    eph, ts = load_ephemeris()
    print("Computing geocentric ecliptic longitudes...")
    df = compute_geocentric_longitudes(eph, ts, start, end)
    outpath = os.path.join(OUTDIR, "ephemeris_real.csv")
    df.to_csv(outpath, float_format="%.6f")
    print("Wrote ephemeris to", outpath)

    print("Detecting ingresses...")
    ing = detect_ingresses(df)
    ing_path = os.path.join(OUTDIR, "ingresses.csv")
    ing.to_csv(ing_path, index=False)
    print("Wrote ingresses to", ing_path)

    print("Done. You can now feed ephemeris_real.csv into your PMCI pipeline.")
