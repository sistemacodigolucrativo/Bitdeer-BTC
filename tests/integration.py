#!/usr/bin/env python3
"""Integration test for the isolated SQLite-backed PHP API."""
import json
import time
import urllib.error
import urllib.request
import http.cookiejar

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
assert alice.call("profile")["plan"]["sessionSeconds"]==7200
bonus=alice.call("rewards.claim",{})
assert bonus["mining"]["bonusSatoshisBalance"]==10000
alice.call("rewards.claim",{},409)
assert len(alice.call("ledger")["bonuses"])==1
alice.call("admin.members",expected=403)
order=alice.call("orders.create",{"planId":"VIP_01"},201)
assert alice.call("profile")["plan"]["id"]=="FREE"

admin=Client()
assert admin.call("login",{"login":"adminci","password":"StrongCIpassword123!"})["user"]["role"]=="admin"
admin.call("admin.order.approve",{"orderId":order["orderId"],"paymentConfirmed":False},422)
admin.call("admin.order.approve",{"orderId":order["orderId"],"paymentConfirmed":True})
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
admin.call("admin.password.reset",{},409)
print("PASS: registration, login, RBAC, immutable VIP, manual approval, mining accrual, suspension, archive, sessions")
