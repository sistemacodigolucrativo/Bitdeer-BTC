#!/usr/bin/env python3
"""Check initial plan definitions against the audited legacy frontend baseline."""
import os,sqlite3

expected={
 "FREE":(0,100,50,10000,0,7200,0),
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
founder=db.execute("SELECT id,role,status,display_name FROM users WHERE login='marcelo'").fetchone()
assert founder and founder[1:] == ('member','active','Marcelo')
assert db.execute("SELECT COUNT(*) FROM referral_codes WHERE user_id=?",(founder[0],)).fetchone()[0]==1
assert db.execute("SELECT COUNT(*) FROM referral_events").fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM member_history_edits WHERE user_id=? AND kind='accrual'",(founder[0],)).fetchone()[0]>=80
assert db.execute("SELECT COUNT(*) FROM member_history_edits WHERE user_id=? AND kind='bonus'",(founder[0],)).fetchone()[0]==165
assert db.execute("SELECT COUNT(*) FROM member_history_edits WHERE user_id=? AND kind='withdrawal'",(founder[0],)).fetchone()[0]==60
assert db.execute("SELECT COUNT(*) FROM member_history_edits WHERE user_id=? AND kind='subscription'",(founder[0],)).fetchone()[0]==4
assert db.execute("SELECT COUNT(*) FROM member_history_edits WHERE user_id=? AND kind='purchase'",(founder[0],)).fetchone()[0]==4
assert db.execute("SELECT balance_units FROM mining_state WHERE user_id=?",(founder[0],)).fetchone()[0]==183742*8640000
assert db.execute("SELECT COUNT(*) FROM contracts WHERE user_id=?",(founder[0],)).fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM orders WHERE user_id=?",(founder[0],)).fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM withdraw_requests WHERE user_id=?",(founder[0],)).fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM member_history_edits WHERE user_id!=?",(founder[0],)).fetchone()[0]==0

assert db.execute("SELECT value FROM app_settings WHERE name='btc_address'").fetchone()[0]==''
assert db.execute("SELECT value FROM app_settings WHERE name='environment_type'").fetchone()[0]=='auto'
print("PASS: baseline plans and FREE unlimited immediate restarts")
