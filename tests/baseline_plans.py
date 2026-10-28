#!/usr/bin/env python3
"""Check initial plan definitions against the audited legacy frontend baseline."""
import os,sqlite3

expected={
 "FREE":(0,100,50,10000,0,7200,7200),
 "VIP_01":(2000,300,100,20000,30,0,0),
 "VIP_02":(4000,600,150,20000,30,0,0),
 "VIP_03":(6000,1200,200,20000,30,0,0),
 "VIP_04":(8000,2800,250,20000,30,0,0),
}
with sqlite3.connect(os.environ["BITDEER_DB_PATH"]) as db:
    actual={r[0]:tuple(r[1:]) for r in db.execute(
        "SELECT id,price_cents,daily_cents,bonus_usd_cents,bonus_satoshis,"
        "duration_days,session_seconds,restart_cooldown_seconds FROM plans")}
assert actual==expected,(actual,expected)
print("PASS: baseline plan catalog and FREE session limits")
