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
    founder=db.execute("SELECT id,role,status FROM users WHERE login='network'").fetchone()
    assert founder and founder[1:] == ('member','active')
    assert db.execute("SELECT COUNT(*) FROM referral_codes WHERE user_id=?",(founder[0],)).fetchone()[0]==1
    assert db.execute("SELECT COUNT(*) FROM referral_events").fetchone()[0]==0
    assert db.execute("SELECT value FROM app_settings WHERE name='btc_address'").fetchone()[0]==''
    assert db.execute("SELECT value FROM app_settings WHERE name='environment_type'").fetchone()[0]=='auto'
print("PASS: baseline plan catalog and FREE session limits")
