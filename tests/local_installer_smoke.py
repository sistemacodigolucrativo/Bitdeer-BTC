#!/usr/bin/env python3
"""Local first-install wizard: no extra key, CSRF enforced, no reinstall."""
import os, re, sqlite3, subprocess, tempfile, time
import urllib.error, urllib.parse, urllib.request, http.cookiejar

with tempfile.TemporaryDirectory(prefix="bitdeer-local-installer-") as temp:
    path=temp+"/private/bitdeer.sqlite"
    env=os.environ.copy()
    env["BITDEER_DB_PATH"]=path
    env.pop("BITDEER_INSTALL_POLICY",None)
    env.pop("BITDEER_INSTALL_KEY_HASH",None)
    env["BITDEER_INSTALL_ALLOW_LOCAL"]="1"
    server=subprocess.Popen(["php","-S","127.0.0.1:8773","-t","."],
        env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        jar=http.cookiejar.CookieJar()
        opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
        address="http://127.0.0.1:8773/install/index.php"
        for _ in range(40):
            try:
                with opener.open(address,timeout=1) as r:
                    page=r.read().decode("utf-8")
                break
            except Exception:
                time.sleep(.1)
        else: raise AssertionError("Installer did not start")
        assert "name=\"setup_key\"" not in page, "Local setup should need no extra key"
        csrf=re.search(r'name="csrf" value="([a-f0-9]{64})"',page)
        assert csrf, "Missing installer CSRF token"
        fields={"csrf":csrf.group(1),"admin_login":"localadmin",
            "admin_password":"SomeStrongPasswordForCI",
            "support_email":"support@example.org","confirmation":"yes"}
        def submit(values):
            return opener.open(urllib.request.Request(address,
                data=urllib.parse.urlencode(values).encode(),method="POST"),timeout=10)
        invalid=dict(fields,csrf="0"*64)
        try:
            submit(invalid)
            raise AssertionError("Tampered CSRF accepted")
        except urllib.error.HTTPError as e:
            assert e.code==403, e.code
        assert not os.path.exists(path), "CSRF failure created SQLite"
        with submit(fields) as response:
            assert response.status==200
            assert "Instalação concluída" in response.read().decode("utf-8")
        with sqlite3.connect(path) as db:
            assert db.execute("SELECT COUNT(*) FROM users WHERE role='admin'").fetchone()[0]==1
            assert db.execute("SELECT COUNT(*) FROM users WHERE role='member'").fetchone()[0]==1
            assert db.execute("SELECT value FROM app_settings WHERE name='site_url'").fetchone()[0]=='http://127.0.0.1:8773'
            assert db.execute("SELECT COUNT(*) FROM referral_events").fetchone()[0]==0
        try:
            opener.open(address,timeout=5)
            raise AssertionError("Installed instance still allowed setup")
        except urllib.error.HTTPError as e:
            assert e.code==410,e.code
        print("PASS: local first-run setup without extra key, CSRF, SQLite and reinstall lock")
    finally:
        server.terminate()
        server.wait(timeout=5)
