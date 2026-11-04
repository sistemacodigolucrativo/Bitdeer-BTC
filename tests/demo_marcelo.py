#!/usr/bin/env python3
"""Integrity and isolation checks for the fictional Marcelo founding-member seed."""
import json
import os
import sqlite3
import time

UNITS_PER_CENT = 8_640_000
EXPECTED_COUNTS = {"accrual": 84, "bonus": 165, "purchase": 4,
                   "subscription": 4, "withdrawal": 60}
with sqlite3.connect(os.environ["BITDEER_DB_PATH"]) as db:
    db.row_factory = sqlite3.Row
    user = db.execute("SELECT * FROM users WHERE login='user'").fetchone()
    assert user and user["role"] == "member" and user["display_name"] == "Marcelo"
    assert user["status"] == "active"
    assert 164 * 86400 < time.time() - user["created_at"] < 166 * 86400
    state = db.execute("SELECT * FROM mining_state WHERE user_id=?", (user["id"],)).fetchone()
    assert state["running"] == 0 and state["balance_units"] == 183742 * UNITS_PER_CENT
    assert state["last_accrual_at"] is None
    assert state["session_ends_at"] is None
    assert db.execute("SELECT COUNT(*) FROM contracts WHERE user_id=?", (user["id"],)).fetchone()[0] == 0
    for table in ("orders", "reward_ledger", "bonus_claims", "withdraw_requests"):
        assert db.execute(f"SELECT COUNT(*) FROM {table} WHERE user_id=?",
                          (user["id"],)).fetchone()[0] == 0
    marker = db.execute("SELECT value FROM app_settings WHERE name='demo_marcelo_seed'").fetchone()
    assert marker
    metadata = json.loads(marker[0])
    assert metadata["simulation"] is True and metadata["userId"] == user["id"]
    assert metadata["balanceUsdCents"] == 183742
    assert metadata["historicalQuote"] == "illustrative, not verified market history"
    records = {}
    for row in db.execute("SELECT kind,payload_json,source_id,deleted FROM member_history_edits WHERE user_id=?",
                          (user["id"],)):
        assert row["source_id"] is None and row["deleted"] == 0
        records.setdefault(row["kind"], []).append(json.loads(row["payload_json"]))
    assert {k: len(v) for k,v in records.items()} == EXPECTED_COUNTS
    assert metadata["historyCounts"] == EXPECTED_COUNTS
    plans = {r["id"]:r for r in db.execute("SELECT * FROM plans")}
    subscriptions = sorted(records["subscription"], key=lambda x:x["started_at"])
    purchases = sorted(records["purchase"], key=lambda x:x["created_at"])
    assert [s["plan_id"] for s in subscriptions] == ["VIP_01","VIP_02","VIP_03","VIP_03"]
    assert [p["plan_id"] for p in purchases] == ["VIP_01","VIP_02","VIP_03","VIP_03"]
    assert all(a["expires_at"] <= b["started_at"] for a,b in zip(subscriptions,subscriptions[1:]))
    assert subscriptions[-1]["expires_at"] < time.time()
    assert all(p["created_at"] == c["started_at"] - 3600
               for p,c in zip(purchases, subscriptions))
    assert all(p["status"] == "approved" for p in purchases)
    events=[]
    earned_units=0
    for row in records["accrual"]:
        assert 0 < row["end_ts"]-row["start_ts"] <= 2*86400
        rate = plans[row["plan_id"]]["daily_cents"]
        units = (row["end_ts"]-row["start_ts"])*rate*100
        assert row["earned_units"] == units
        earned_units += units
        events.append((row["end_ts"],units))
    bonus_units=0
    bonus_sats=0
    bonuses=sorted(records["bonus"],key=lambda x:x["claimed_at"])
    assert all(b["claimed_at"]-a["claimed_at"] == 86400 for a,b in zip(bonuses,bonuses[1:]))
    for row in bonuses:
        plan=plans[row["plan_id"]]
        assert row["bonus_usd_units"] == plan["bonus_usd_cents"]*UNITS_PER_CENT
        assert row["bonus_satoshis"] == plan["bonus_satoshis"]
        bonus_units += row["bonus_usd_units"]
        bonus_sats += row["bonus_satoshis"]
        events.append((row["claimed_at"],row["bonus_usd_units"]))
    assert state["bonus_satoshis_balance"] == bonus_sats
    withdrawn_cents=0
    withdrawals=sorted(records["withdrawal"], key=lambda x:x["created_at"])
    assert all(a["usd_cents"] < b["usd_cents"] for a,b in zip(withdrawals,withdrawals[1:]))
    assert all(a["created_at"] < b["created_at"] for a,b in zip(withdrawals,withdrawals[1:]))
    for row in withdrawals:
        matching=[s for s in subscriptions if s["plan_id"]==row["plan_id"]
                  and s["started_at"] <= row["created_at"] < s["expires_at"]]
        assert len(matching)==1, ("Mock withdrawal outside VIP window",row)
        day=(row["created_at"]-user["created_at"])//86400
        price=76000+day*73+(day%17)*117
        assert abs(row["btc_satoshis"]-round(row["usd_cents"]*1_000_000/price)) <= 1
        assert row["status"] == "approved"
        withdrawn_cents += row["usd_cents"]
        events.append((row["created_at"],-row["usd_cents"]*UNITS_PER_CENT))
    assert metadata["earnedUsdCents"] == earned_units//UNITS_PER_CENT
    assert metadata["bonusUsdCents"] == bonus_units//UNITS_PER_CENT
    assert metadata["withdrawUsdCents"] == withdrawn_cents
    opening=metadata["openingUsdCents"]*UNITS_PER_CENT
    assert opening+earned_units+bonus_units-withdrawn_cents*UNITS_PER_CENT == state["balance_units"]
    balance=opening
    for _,delta in sorted(events):
        balance += delta
        assert balance >= 0, "Negative balance during fictional timeline"
    assert balance == state["balance_units"]
    assert db.execute("SELECT COUNT(*) FROM admin_audit WHERE action='demo.member.seed' AND target_user_id=?",
                      (user["id"],)).fetchone()[0] == 1
print("PASS: Marcelo founding member, six synthetic history streams, USD/BTC consistency and isolation")
