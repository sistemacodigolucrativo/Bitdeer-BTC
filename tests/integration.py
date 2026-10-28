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
assert guest.call("register",{"login":"bob","password":"anotherpassword123","role":"admin"},201)["role"]=="member", "public registration must ignore requested role"

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
order=alice.call("orders.create",{"planId":"VIP_01"},201)
assert order["btcAmount"]=="0.00025000"
assert order["quoteSource"]=="CI fixture"
assert order["btcAddress"].startswith("bc1")
assert alice.call("profile")["plan"]["id"]=="FREE"

admin=Client()
assert admin.call("login",{"login":"adminci","password":"StrongCIpassword123!"})["user"]["role"]=="admin"
assert admin.call("admin.members")["total"]==2
assert admin.call("admin.overview")["members"]==2
assert admin.call("admin.support.tickets")["tickets"][0]["id"]==ticket["id"]
admin.call("admin.support.status",{"ticketId":ticket["id"],"status":"resolved"})
assert admin.call("admin.support.tickets")["tickets"][0]["status"]=="resolved"
assert len(admin.call("admin.plans")["plans"])==5
assert isinstance(admin.call("admin.audit")["actions"],list)
assert admin.call("admin.member.details",expected=422)["error"]
assert admin.call("admin.member.details&id="+str(alice_user["id"]))["member"]["login"]=="alice"
admin.call("admin.order.approve",{"orderId":order["orderId"],"paymentConfirmed":False,"paymentReference":"a"*64},422)
admin.call("admin.order.approve",{"orderId":order["orderId"],"paymentConfirmed":True,"paymentReference":"a"*64})
assert alice.call("profile")["plan"]["dailyUsd"]=="3.00"
assert alice.call("profile")["plan"]["sessionSeconds"]==0
admin.call("admin.plan.save",{"id":"VIP_01","name":"VIP 01","priceCents":3000,
  "dailyCents":400,"bonusUsdCents":100,"bonusSatoshis":20000,
  "durationDays":30,"sessionSeconds":0,"restartCooldownSeconds":0,"hashrate":"+ 275 Gh/s","serverModel":"Antminer S19 Pro",
  "available":True})
assert alice.call("profile")["plan"]["dailyUsd"]=="3.00", "VIP contract terms cannot change"
admin.call("admin.member.edit",{"userId":alice_user["id"],"displayName":"Alice Testada","email":"alice@example.org"})
assert alice.call("profile")["profile"]["displayName"]=="Alice Testada"
admin.call("admin.status",{"userId":alice_user["id"],"status":"suspended"})
alice.call("profile",expected=401)
admin.call("admin.status",{"userId":alice_user["id"],"status":"active"})
alice.call("profile",expected=401)  # revoked, not restored
alice2=Client()
alice2.call("login",{"login":"alice","password":"longpassword123"})
before_accrual=float(alice2.call("profile")["mining"]["balanceUsd"])
assert alice2.call("mining.start",{})["mining"]["running"]
time.sleep(2)
assert float(alice2.call("profile")["mining"]["balanceUsd"])>before_accrual
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
admin.call("admin.identity.verify",{"userId":alice_user["id"],"verificationMethod":"known_contact",
  "verificationReference":"ref-000123","adminPassword":"wrongpassword","identityConfirmed":True},403)
verification=admin.call("admin.identity.verify",{"userId":alice_user["id"],
  "verificationMethod":"known_contact","verificationReference":"ref-000123",
  "adminPassword":"StrongCIpassword123!","identityConfirmed":True})
assert admin.call("admin.password.reset",{"userId":alice_user["id"],
  "verificationId":verification["verificationId"],"newPassword":"NewStrongPassword456!"})["ok"]
admin.call("admin.password.reset",{"userId":alice_user["id"],
  "verificationId":verification["verificationId"],"newPassword":"NewStrongPassword456!"},403)
newsession=Client()
newsession.call("login",{"login":"alice","password":"longpassword123"},401)
assert newsession.call("login",{"login":"alice","password":"NewStrongPassword456!"})["user"]["id"]==alice_user["id"]
# Explicitly exercise the intentionally disabled public installer.
try:
    urllib.request.urlopen("http://127.0.0.1:8765/install/index.php",timeout=2)
    raise AssertionError("Public installer must stay inaccessible while decision 13 is unresolved")
except urllib.error.HTTPError as e:
    assert e.code == 423, ("installer",e.code)

# Free plan has a bounded server-side session and cooldown; no client timing can bypass it.
bob=Client()
bob.call("login",{"login":"bob","password":"anotherpassword123"})
original_csrf=bob.csrf
bob.csrf=""
bob.call("mining.start",{},403)
bob.csrf=original_csrf
free=bob.call("mining.start",{})
assert free["plan"]["sessionSeconds"]==7200
assert 7150 <= free["mining"]["sessionEndsAt"]-int(time.time()) <= 7200
bob.call("mining.stop",{})
bob.call("mining.start",{},409)
bob2=Client()
bob2.call("login",{"login":"bob","password":"anotherpassword123"})
admin.call("admin.status",{"userId":3,"status":"suspended"})
bob.call("profile",expected=401)
bob2.call("profile",expected=401)
admin.call("admin.status",{"userId":3,"status":"active"})
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
print("PASS: registration, RBAC, checkout quote, admin reset, session revocation, free cooldown, VIP expiry")
