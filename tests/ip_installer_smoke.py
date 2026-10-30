#!/usr/bin/env python3
"""End-to-end HTTP smoke for IP ownership proof through an isolated local server.
Loopback transport models the UI only; it does NOT certify remote HTTP security.
"""
import http.cookiejar
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

with tempfile.TemporaryDirectory(prefix="bitdeer-ip-install-") as directory:
    root=Path(directory)
    public=root/"www"
    (public/".well-known").mkdir(parents=True)
    target=Path("install/index.php").resolve()
    router=root/"router.php"
    router.write_text("<?php require "+repr(str(target)).replace('"','\\"').replace("'","'")+";")
    db=root/"private"/"bitdeer.sqlite"
    env={k:v for k,v in os.environ.items() if not k.startswith("BITDEER_")}
    env["BITDEER_DB_PATH"]=str(db)
    server=subprocess.Popen(["php","-S","127.0.0.1:8781","-t",str(public),str(router)],
        env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        addr="http://127.0.0.1:8781/install/"
        def request(payload=None):
            data=urllib.parse.urlencode(payload).encode() if payload else None
            return client.open(urllib.request.Request(addr,data=data,
              headers={"Host":"203.0.113.5"},method="POST" if payload else "GET"),timeout=10)
        for _ in range(35):
            try:
                with request() as response: page=response.read().decode("utf8")
                break
            except Exception:
                time.sleep(.15)
        else: raise AssertionError("IP installer did not start")
        assert "name=\"setup_key\"" not in page
        assert "bitdeer-install-" in page
        nonce=re.search(r"bitdeer-install-([a-f0-9]{64})\.txt",page)
        csrf=re.search(r'name="csrf" value="([a-f0-9]{64})"',page)
        assert nonce and csrf
        payload={"csrf":csrf.group(1),"admin_login":"ipadmin",
            "admin_password":"PasswordForIsolatedIpTest2026!",
            "support_email":"support@example.org","site_url":"http://203.0.113.5",
            "environment_type":"vps","confirmation":"yes"}
        with request(payload) as response:
            assert "Prova de controle" in response.read().decode("utf8")
        assert not db.exists()
        proof=public/".well-known"/("bitdeer-install-"+nonce.group(1)+".txt")
        proof.write_text("bitdeer-install="+nonce.group(1))
        with request(payload) as response:
            result=response.read().decode("utf8")
            assert "Instalação concluída" in result
            assert "network" in result
        with sqlite3.connect(db) as con:
            assert con.execute("SELECT value FROM app_settings WHERE name='site_url'").fetchone()[0]=="http://203.0.113.5"
            assert con.execute("SELECT value FROM app_settings WHERE name='environment_type'").fetchone()[0]=="vps"
            assert con.execute("SELECT COUNT(*) FROM users WHERE role='member'").fetchone()[0]==1
        try:
            request()
            raise AssertionError("Reinstallation permitted")
        except urllib.error.HTTPError as error:
            assert error.code==410
        print("PASS: IP proof required, clean SQLite, base URL and VPS setting, one-use installer")
    finally:
        server.terminate()
        server.wait(timeout=10)
