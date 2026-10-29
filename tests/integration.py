#!/usr/bin/env python3
"""Integration test for the isolated SQLite-backed PHP API."""
import json
import time
import urllib.error
import urllib.request
import http.cookiejar
import sqlite3
import os

BASE = "http://127.0.0.1:8765/api/index.php?action="

class Client:
    def __init__(self):
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.csrf = ""

    def call(self, action, body=None, expected=200):
        method = "POST" if body is not None else "GET"
        payload = json.dumps(body).encode("utf-8") if body is not None else None
        headers = {"Content-Type":"application/json","X-CSRF-Token":self.csrf} if payload is not None else {}
        req = urllib.request.Request(BASE+action,data=payload,headers=headers,method=method)
        try:
            with self.opener.open(req,timeout=10) as r:
                status = r.status
                data = json.load(r)
        except urllib.error.HTTPError as e:
            status = e.code
            data = json.load(e)
        assert status == expected, (action,status,expected,data)
        if "csrfToken" in data: self.csrf=data["csrfToken"]
        return data

for _ in range(30):
    try:
        with urllib.request.urlopen(BASE+"health",timeout=1): break
    except Exception: time.sleep(.2)
else: raise RuntimeError("PHP server unavailable")

guest = Client()
assert guest.call("health")["ok"]
assert len(guest.call("plans")["plans"]) == 5
assert guest.call("register",{"login":"alice","password":"longpassword123","displayName":"Alice"},201)["role"]=="member"
guest.call("register",{"login":"alice","password":"longpassword123"},409)
guest.call("login",{"login":"alice","password":"incorrect"},401)
bob_signup=guest.call("register",{"login":"bob","password":"anotherpassword123","role":"admin"},201)
assert bob_signup["role"]=="member", "public registration must ignore requested role"
bob_id=bob_signup["id"]

alice=Client()
alice_user=alice.call("login",{"login":"alice","password":"longpassword123"})["user"]
assert alice_user["role"]=="member"
assert alice.call("profile")["plan"]["id"]=="FREE"
ticket=alice.call("support.ticket.create",{"subject":"Problema no saldo",
  "message":"Preciso de ajuda com meu saldo interno."},201)["ticket"]
assert ticket["status"]=="open"
assert ticket["notification_status"]=="pending"
assert alice.call("support.tickets.mine")["tickets"][0]["id"]==ticket["id"]
assert len(alice.call("support.tickets.mine")["tickets"])==1
assert alice.call("profile")["plan"]["sessionSeconds"]==7200
assert guest.call("admin.plans",expected=401)["error"]
bonus=alice.call("rewards.claim",{})
assert bonus["mining"]["bonusSatoshisBalance"]==10000
alice.call("rewards.claim",{},409)
assert len(alice.call("ledger")["bonuses"])==1
alice.call("admin.members",expected=403)
alice.call("orders.create",{"planId":"VIP_01"},409)
paymentAdmin=Client()
paymentAdmin.call("login",{"login":"adminci","password":"StrongCIpassword123!"})
paymentSettings=paymentAdmin.call("admin.payment.settings")
assert not paymentSettings["confirmed"]
assert paymentSettings["btcAddress"]=="", "install must not preconfigure receiving wallet"
walletFixture="bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z"
paymentAdmin.call("admin.payment.settings",{
    "btcAddress":walletFixture,"adminPassword":"wrongpassword","confirmedOwner":True},403)
assert paymentAdmin.call("admin.payment.settings",{
    "btcAddress":walletFixture,"adminPassword":"StrongCIpassword123!",
    "confirmedOwner":True})["confirmed"]
order=alice.call("orders.create",{"planId":"VIP_01"},201)
assert order["btcAmount"]=="0.00025000"
assert order["quoteSource"]=="CI fixture"
assert order["btcAddress"].startswith("bc1")
assert alice.call("profile")["plan"]["id"]=="FREE"

admin=Client()
assert admin.call("login",{"login":"adminci","password":"StrongCIpassword123!"})["user"]["role"]=="admin"
assert admin.call("admin.members")["total"]==3
assert admin.call("admin.overview")["members"]==3
# Only actual invited registrations count. The old hardcoded legacy list is not imported.
assert guest.call("referrals.mine",expected=401)["error"]
code=alice.call("referrals.mine")["code"]
assert len(code)==10
balance_before=float(alice.call("profile")["mining"]["balanceUsd"])
guest.call("register",{"login":"charlie","password":"CharlieStrongPassword2026",
  "displayName":"Charlie","inviteCode":code},201)
assert alice.call("referrals.mine")["count"]==1
assert alice.call("referrals.mine")["totalUsd"]=="1.00000000"
assert len(alice.call("referrals.mine")["history"])==1
assert float(alice.call("profile")["mining"]["balanceUsd"])==balance_before+1
guest.call("register",{"login":"badinvite","password":"InvalidReferralPassword2026",
  "displayName":"Test","inviteCode":"FFFFFFFFFF"},422)
guest.call("register",{"login":"charlie","password":"CharlieStrongPassword2026",
  "displayName":"Charlie","inviteCode":code},409)
assert alice.call("referrals.mine")["count"]==1

# FREE members may record internal payout requests, but approval requires an active VIP tier.
charlie=Client()
charlie.call("login",{"login":"charlie","password":"CharlieStrongPassword2026"})
charlie.call("profile.update",{"displayName":"Charlie","email":"","phone":"",
  "walletAddress":walletFixture})
charlie_uid=charlie.call("profile")["user"]["id"]
db=sqlite3.connect(os.environ["BITDEER_DB_PATH"])
try:
    # Test fixture only: make an internal balance available in this isolated CI database.
    db.execute("UPDATE mining_state SET balance_units=864000000*10 WHERE user_id=?",(charlie_uid,))
    db.commit()
finally:
    db.close()
free_balance=charlie.call("profile")["mining"]["balanceUsd"]
assert float(free_balance)==10.0
free_quote=charlie.call("withdraw.quote")
assert free_quote["btcUsd"]=="80000.00" and free_quote["source"]=="CI fixture"
assert 0<=free_quote["validForSeconds"]<=60
free_request=charlie.call("withdraw.request",{"mode":"USD","amount":"2.00"},201)
assert free_request["status"]=="awaiting_vip"
assert "VIP" in free_request["message"]
assert charlie.call("withdraw.mine")["requests"][0]["status"]=="awaiting_vip"
assert any(x["id"]==free_request["id"] and x["status"]=="awaiting_vip"
           for x in admin.call("admin.withdrawals")["requests"])
admin.call("admin.withdraw.process",{"requestId":free_request["id"],
  "status":"approved","reference":"test-no-vip","manualReviewConfirmed":True},409)
# The original internal balance is reserved, not deleted and not paid out.
assert abs(float(charlie.call("profile")["mining"]["balanceUsd"])-8.0)<1e-6
vip_checkout=charlie.call("orders.create",{"planId":"VIP_01"},201)
admin.call("admin.order.approve",{"orderId":vip_checkout["orderId"],
  "paymentConfirmed":True,"paymentReference":"b"*64})
assert charlie.call("withdraw.mine")["requests"][0]["status"]=="pending"
admin.call("admin.withdraw.process",{"requestId":free_request["id"],
  "status":"approved","reference":"test-vip-active","manualReviewConfirmed":True})
assert charlie.call("withdraw.mine")["requests"][0]["status"]=="approved"
# Requests cannot be approved after VIP contract expiry, even if previously unlocked.
new_vip_request=charlie.call("withdraw.request",{"mode":"BTC","amount":"0.00002000"},201)
db=sqlite3.connect(os.environ["BITDEER_DB_PATH"])
try:
    db.execute("UPDATE contracts SET expires_at=? WHERE user_id=?",(int(time.time())-1,charlie_uid))
    db.commit()
finally: db.close()
assert charlie.call("withdraw.mine")["requests"][0]["status"]=="awaiting_vip"
admin.call("admin.withdraw.process",{"requestId":new_vip_request["id"],
  "status":"approved","reference":"test-vip-expired","manualReviewConfirmed":True},409)
admin.call("admin.withdraw.process",{"requestId":new_vip_request["id"],
  "status":"rejected","reference":"no active vip"})
assert charlie.call("withdraw.mine")["requests"][0]["status"]=="rejected"

assert admin.call("admin.support.tickets")["tickets"][0]["id"]==ticket["id"]
admin.call("admin.support.status",{"ticketId":ticket["id"],"status":"resolved"})
assert admin.call("admin.support.tickets")["tickets"][0]["status"]=="resolved"
assert len(admin.call("admin.plans")["plans"])==5
assert isinstance(admin.call("admin.audit")["actions"],list)
assert admin.call("admin.member.details",expected=422)["error"]
assert admin.call("admin.member.details&id="+str(alice_user["id"]))["member"]["login"]=="alice"
admin.call("admin.order.approve",{"orderId":order["orderId"],"paymentConfirmed":False,"paymentReference":"a"*64},422)
admin.call("admin.order.approve",{"orderId":order["orderId"],"paymentConfirmed":True,"paymentReference":"a"*64})
mycontracts=alice.call("contracts.mine")["contracts"]
assert len(mycontracts)==1
assert mycontracts[0]["plan_id"]=="VIP_01"
assert alice.call("profile")["plan"]["dailyUsd"]=="3.00"
assert alice.call("profile")["plan"]["sessionSeconds"]==0
admin.call("admin.plan.save",{"id":"VIP_01","name":"VIP 01","priceCents":3000,
  "dailyCents":400,"bonusUsdCents":100,"bonusSatoshis":20000,
  "durationDays":30,"sessionSeconds":0,"restartCooldownSeconds":0,
  "withdrawMinCents":200,"withdrawAfterDays":15,
  "hashrate":"+ 275 Gh/s","serverModel":"Antminer S19 Pro",
  "available":True})
assert alice.call("profile")["plan"]["dailyUsd"]=="3.00", "VIP contract terms cannot change"
assert alice.call("profile")["plan"]["withdrawMinUsd"]=="0.00", "existing contract rules are snapshotted"
assert admin.call("admin.plans")["plans"][1]["withdrawAfterDays"]==15
assert alice.call("language.preference")["language"] is None
assert alice.call("language.preference",{"language":"en"})["language"]=="en"
assert alice.call("language.preference")["language"]=="en"
alice.call("language.preference",{"language":"xx"},422)
quote=alice.call("withdraw.quote")
assert float(quote["btcUsd"])==80000
alice.call("withdraw.request",{"mode":"USD","amount":"0.50"},409)
alice.call("profile.update",{"displayName":"Alice","email":"alice@example.org",
  "phone":"+5531999999999","walletAddress":"bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z"})
balance_before_withdraw=float(alice.call("profile")["mining"]["balanceUsd"])
request=alice.call("withdraw.request",{"mode":"USD","amount":"0.50"},201)
assert request["status"]=="pending" and request["simulation"]
assert alice.call("withdraw.mine")["requests"][0]["id"]==request["id"]
assert abs(float(alice.call("profile")["mining"]["balanceUsd"])-(balance_before_withdraw-0.5))<0.000001
assert any(x["id"]==request["id"] for x in admin.call("admin.withdrawals")["requests"])
admin.call("admin.withdraw.process",{"requestId":request["id"],
    "status":"approved","reference":"audit-ref-123"},422)
admin.call("admin.withdraw.process",{"requestId":request["id"],
    "status":"rejected","reference":"pedido recusado"})
assert abs(float(alice.call("profile")["mining"]["balanceUsd"])-balance_before_withdraw)<0.000001
admin.call("admin.withdraw.process",{"requestId":request["id"],
    "status":"rejected","reference":"pedido recusado"},409)
simulated_btc_request=alice.call("withdraw.request",{"mode":"BTC","amount":"0.00000500"},201)
assert simulated_btc_request["status"]=="pending"
assert simulated_btc_request["btcAmount"]=="0.00000500"
admin.call("admin.withdraw.process",{"requestId":simulated_btc_request["id"],
    "status":"approved","reference":"conferência interna CI","manualReviewConfirmed":True})
assert alice.call("withdraw.mine")["requests"][0]["status"]=="approved"
alice.call("withdraw.request",{"mode":"USD","amount":"999.00"},409)

# Reusing a TXID with different letter case must not activate a second VIP.
bob_order_client=Client()
bob_order_client.call("login",{"login":"bob","password":"anotherpassword123"})
second_order=bob_order_client.call("orders.create",{"planId":"VIP_01"},201)
admin.call("admin.order.approve",{"orderId":second_order["orderId"],
  "paymentConfirmed":True,"paymentReference":"A"*64},409)
admin.call("admin.order.reject",{"orderId":second_order["orderId"],
  "reason":"Pagamento não localizado"})
assert any(o["id"]==second_order["orderId"] and o["status"]=="rejected"
  for o in admin.call("admin.orders")["orders"])
assert bob_order_client.call("profile")["plan"]["id"]=="FREE"

admin.call("admin.member.edit",{"userId":alice_user["id"],"login":"alice",
  "displayName":"Alice Testada","email":"alice@example.org"})
assert alice.call("profile")["profile"]["displayName"]=="Alice Testada"
charlie_id=next(x["id"] for x in admin.call("admin.members")["members"] if x["login"]=="charlie")
admin.call("admin.member.edit",{"userId":charlie_id,"login":"alice",
  "displayName":"Charlie","email":""},409)
admin.call("admin.member.edit",{"userId":charlie_id,"login":"charlie_new",
  "displayName":"Charlie","email":""})
guest.call("login",{"login":"charlie","password":"CharlieStrongPassword2026"},401)
guest.call("login",{"login":"charlie_new","password":"CharlieStrongPassword2026"})
assert alice.call("referrals.mine")["count"]==1

# Option A: the existing VIP contract deadline is not extended by suspension.
dbcheck=sqlite3.connect(os.environ["BITDEER_DB_PATH"])
try:
    contract_end_before=dbcheck.execute("SELECT expires_at FROM contracts WHERE user_id=?",
       (alice_user["id"],)).fetchone()[0]
finally:
    dbcheck.close()
admin.call("admin.status",{"userId":alice_user["id"],"status":"suspended"})
dbcheck=sqlite3.connect(os.environ["BITDEER_DB_PATH"])
try:
    assert dbcheck.execute("SELECT expires_at FROM contracts WHERE user_id=?",
       (alice_user["id"],)).fetchone()[0]==contract_end_before
finally:
    dbcheck.close()
alice.call("profile",expected=401)
admin.call("admin.status",{"userId":alice_user["id"],"status":"active"})
alice.call("profile",expected=401)  # revoked, not restored
alice2=Client()
alice2.call("login",{"login":"alice","password":"longpassword123"})
before_accrual=float(alice2.call("profile")["mining"]["balanceUsd"])
assert alice2.call("mining.start",{})["mining"]["running"]
time.sleep(2)
assert float(alice2.call("profile")["mining"]["balanceUsd"])>before_accrual
ranks=alice2.call("leaderboard")
assert ranks["unit"]=="internal_usd"
assert ranks["source"]=="reward_ledger"
assert all("btc" not in str(m).lower() for m in ranks["miners"])
assert all("login" not in m and "user_id" not in m for m in ranks["miners"])
admin.call("admin.status",{"userId":alice_user["id"],"status":"suspended"})
alice2.call("profile",expected=401)
admin.call("admin.status",{"userId":alice_user["id"],"status":"active"})
alice3=Client()
alice3.call("login",{"login":"alice","password":"longpassword123"})
balance=alice3.call("profile")["mining"]["balanceUsd"]
time.sleep(1)
assert alice3.call("profile")["mining"]["balanceUsd"]==balance, "no retroactive reward"
admin.call("admin.status",{"userId":alice_user["id"],"status":"archived"})
alice3.call("profile",expected=401)
admin.call("admin.status",{"userId":alice_user["id"],"status":"active"})
admin.call("admin.password.reset",{"userId":alice_user["id"],"verificationId":1,"newPassword":"CIExampleValueOnly123"},403)
bob_order_client.call("admin.identity.verify",{"userId":alice_user["id"],
  "verificationMethod":"approved","verificationReference":"ref-000123"},403)
admin.call("admin.identity.verify",{"userId":alice_user["id"],
  "verificationMethod":"approved","verificationReference":"bad"},422)
verification=admin.call("admin.identity.verify",{"userId":alice_user["id"],
  "verificationMethod":"approved","verificationReference":"ref-000123"})
assert admin.call("admin.password.reset",{"userId":alice_user["id"],
  "verificationId":verification["verificationId"],"newPassword":"NewStrongPassword456!"})["ok"]
admin.call("admin.password.reset",{"userId":alice_user["id"],
  "verificationId":verification["verificationId"],"newPassword":"NewStrongPassword456!"},403)
newsession=Client()
newsession.call("login",{"login":"alice","password":"longpassword123"},401)
assert newsession.call("login",{"login":"alice","password":"NewStrongPassword456!"})["user"]["id"]==alice_user["id"]
# Existing databases always lock the installer, including localhost setup.
try:
    urllib.request.urlopen("http://127.0.0.1:8765/install/index.php",timeout=2)
    raise AssertionError("Installer must never overwrite an existing database")
except urllib.error.HTTPError as e:
    assert e.code == 410, ("installer",e.code)

# FREE sessions remain server-limited to two hours but restart immediately.
# Existing SQLite users may still have old cooldown timestamps: they must not block.
bob=Client()
bob.call("login",{"login":"bob","password":"anotherpassword123"})
original_csrf=bob.csrf
bob.csrf=""
bob.call("mining.start",{},403)
bob.csrf=original_csrf
free=bob.call("mining.start",{})
assert free["plan"]["sessionSeconds"]==7200
assert free["plan"]["restartCooldownSeconds"]==0
assert 7150 <= free["mining"]["sessionEndsAt"]-int(time.time()) <= 7200
stopped=bob.call("mining.stop",{})
assert stopped["mining"]["running"] is False
assert stopped["mining"]["cooldownUntil"] is None
immediate=bob.call("mining.start",{})
assert immediate["mining"]["running"] is True
assert immediate["mining"]["cooldownUntil"] is None
# Simulate a database that predates the no-cooldown change.
db=sqlite3.connect(os.environ["BITDEER_DB_PATH"])
try:
    db.execute("UPDATE mining_state SET running=0,cooldown_until=? WHERE user_id=?",
               (int(time.time())+7200,bob_id))
    db.commit()
finally: db.close()
legacy=bob.call("mining.start",{})
assert legacy["mining"]["cooldownUntil"] is None and legacy["mining"]["running"]
# A naturally expired session must settle once and allow restart immediately.
db=sqlite3.connect(os.environ["BITDEER_DB_PATH"])
try:
    t=int(time.time())
    db.execute("UPDATE mining_state SET running=1,last_accrual_at=?,session_ends_at=?,cooldown_until=? WHERE user_id=?",
               (t-7200,t-1,t+7200,bob_id))
    db.commit()
finally: db.close()
completed=bob.call("profile")
assert not completed["mining"]["running"]
assert completed["mining"]["cooldownUntil"] is None
assert float(completed["mining"]["balanceUsd"])>0
again=bob.call("mining.start",{})
assert again["mining"]["running"]
assert again["mining"]["sessionEndsAt"]>int(time.time())
bob2=Client()
bob2.call("login",{"login":"bob","password":"anotherpassword123"})
admin.call("admin.status",{"userId":bob_id,"status":"suspended"})
bob.call("profile",expected=401)
bob2.call("profile",expected=401)
admin.call("admin.status",{"userId":bob_id,"status":"active"})
bob.call("profile",expected=401)

# Simulate a VIP expiry around the server clock; accrual must stop at the contract boundary.
db=sqlite3.connect(os.environ["BITDEER_DB_PATH"])
try:
    moment=int(time.time())
    db.execute("UPDATE contracts SET expires_at=? WHERE user_id=?", (moment-1,alice_user["id"]))
    db.execute("UPDATE mining_state SET running=1,last_accrual_at=?,session_ends_at=NULL WHERE user_id=?",
               (moment-2,alice_user["id"]))
    db.commit()
finally:
    db.close()
just_expired=newsession.call("profile")
assert just_expired["plan"]["id"]=="FREE"
assert not just_expired["mining"]["running"], "VIP mining must stop at expiry"
# New support lifecycle: only admins reply, member sees the answer; soft-delete hides.
replyTicket=newsession.call("support.ticket.create",{"subject":"Resposta no painel",
  "message":"Solicito uma resposta de teste do suporte."},201)["ticket"]
newsession.call("admin.support.reply",{"ticketId":replyTicket["id"],"message":"Hello"},403)
assert admin.call("admin.support.reply",{"ticketId":replyTicket["id"],
  "message":"Sua solicitação foi analisada."})["ticketState"]=="replied"
member_ticket=next(t for t in newsession.call("support.tickets.mine")["tickets"]
                   if t["id"]==replyTicket["id"])
assert member_ticket["ticket_state"]=="replied"
assert member_ticket["admin_reply"]=="Sua solicitação foi analisada."
admin.call("admin.support.manage",{"ticketId":replyTicket["id"],"operation":"close"})
admin.call("admin.support.reply",{"ticketId":replyTicket["id"],"message":"Cannot reply"},409)
assert next(t for t in newsession.call("support.tickets.mine")["tickets"]
    if t["id"]==replyTicket["id"])["ticket_state"]=="closed"
admin.call("admin.support.manage",{"ticketId":replyTicket["id"],"operation":"reopen"})
admin.call("admin.support.manage",{"ticketId":replyTicket["id"],"operation":"delete"})
assert all(t["id"]!=replyTicket["id"] for t in newsession.call("support.tickets.mine")["tickets"])
assert all(t["id"]!=replyTicket["id"] for t in admin.call("admin.support.tickets")["tickets"])

# The same member never gets a duplicate mock row or batch; exactly 200 samples.
all_fake=[]
for batch in range(20):
    page=newsession.call("mock.payments.next",{})
    assert page["simulation"] is True
    assert page["total"]==200 and len(page["records"])==10
    assert page["remaining"]==200-10*(batch+1)
    all_fake.extend(x["hash"] for x in page["records"])
    assert all(x.startswith("SIM-") and float(x["btc"])>0
      and float(x["valueUsd"])>0 for x in page["records"])
assert len(all_fake)==len(set(all_fake))==200
assert newsession.call("mock.payments.next",{})["records"]==[]
assert newsession.call("mock.payments.next",{})["exhausted"] is True

# Approval without TXID is permitted solely in the clearly marked simulation mode.
guest.call("register",{"login":"mockvip","password":"MockVipPassword2026"},201)
mockvip=Client()
mockvip_user=mockvip.call("login",{"login":"mockvip","password":"MockVipPassword2026"})["user"]
mockOrder=mockvip.call("orders.create",{"planId":"VIP_01"},201)
admin.call("admin.order.approve",{"orderId":mockOrder["orderId"],
  "paymentConfirmed":False,"simulationConfirmed":True},422)
admin.call("admin.order.approve",{"orderId":mockOrder["orderId"],
  "paymentConfirmed":True,"simulationConfirmed":True})
assert mockvip.call("profile")["plan"]["id"]=="VIP_01"
details=admin.call("admin.member.details&id="+str(mockvip_user["id"]))
assert details["orders"][0]["payment_ref"] is None
assert any(a["action"]=="order.approve.simulation" for a in admin.call("admin.audit")["actions"])
db=sqlite3.connect(os.environ["BITDEER_DB_PATH"])
try:
    db.execute('UPDATE app_settings SET value="real" WHERE name="payment_mode"')
    db.commit()
finally:db.close()
guest.call("register",{"login":"realvip","password":"RealVipPassword2026"},201)
realvip=Client()
realvip.call("login",{"login":"realvip","password":"RealVipPassword2026"})
realOrder=realvip.call("orders.create",{"planId":"VIP_01"},201)
admin.call("admin.order.approve",{"orderId":realOrder["orderId"],
  "paymentConfirmed":True,"simulationConfirmed":True},403)
assert realvip.call("profile")["plan"]["id"]=="FREE"

print("PASS: registration, RBAC, checkout quote, admin reset, session revocation, FREE immediate restart and VIP expiry, ticket replies, synthetic wallet feed and mock approval")
