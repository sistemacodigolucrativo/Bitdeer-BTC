#!/usr/bin/env python3
"""Black-box browser installation with configured policy B, in isolated temp DB."""
import os
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import http.cookiejar
import sqlite3

BASE = 'http://127.0.0.1:8766/install/index.php'
secret = 'VeryLongSetupKeyOnlyForIsolatedCI'
with tempfile.TemporaryDirectory(prefix='bitdeer-install-') as folder:
    db=os.path.join(folder,'private','database.sqlite')
    keyhash=subprocess.run(['php','-r','echo password_hash($argv[1], PASSWORD_DEFAULT);',secret],
         capture_output=True,text=True,check=True).stdout
    env=os.environ.copy()
    env.update({
        'BITDEER_INSTALL_POLICY':'B','BITDEER_INSTALL_KEY_HASH':keyhash,
        'BITDEER_DB_PATH':db
    })
    server=subprocess.Popen(['php','-S','127.0.0.1:8766','-t','.'],
                            env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        jar=http.cookiejar.CookieJar()
        client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
        for _ in range(30):
            try:
                with client.open(BASE,timeout=2) as response:
                    html=response.read().decode('utf-8')
                break
            except Exception:
                time.sleep(.1)
        else:
            raise AssertionError('Installer PHP server did not start')
        token=re.search(r'name="csrf" value="([a-f0-9]{64})"',html)
        assert token, html[:150]
        def post(key):
            payload={
                'csrf':token.group(1),'setup_key':key,'admin_login':'testadmin',
                'admin_password':'IntegrationTestAdmin2026!', 'support_email':'support@example.org',
                'confirmation':'yes'
            }
            return client.open(urllib.request.Request(BASE,
                data=urllib.parse.urlencode(payload).encode('utf-8'),method='POST'),timeout=5)
        with post('WrongPrivateSetupKeyForTestCI') as response:
            assert b'inv' in response.read().lower()
        assert not os.path.exists(db), 'Wrong key must not create SQLite'
        with post(secret) as response:
            assert b'Instala' in response.read()
        assert os.path.isfile(db), 'Installer must initialize DB'
        con=sqlite3.connect(db)
        try:
            assert con.execute('SELECT COUNT(*) FROM users WHERE role="admin"').fetchone()[0] == 1
            assert con.execute('SELECT COUNT(*) FROM plans').fetchone()[0] == 5
        finally:
            con.close()
        try:
            client.open(BASE,timeout=5)
            raise AssertionError('Second install should be blocked')
        except urllib.error.HTTPError as error:
            assert error.code == 410, error.code
        print('PASS: browser installer, wrong key, clean SQLite, reinstallation lockout')
    finally:
        server.terminate()
        server.wait(timeout=10)
