#!/usr/bin/env python3
"""Unpack the deployable ZIP and exercise a real PHP API with default private paths."""
import json
import os
import pathlib
import sqlite3
import subprocess
import tempfile
import time
import urllib.request
import urllib.error
import zipfile

with tempfile.TemporaryDirectory(prefix="bitdeer-package-") as temporary:
    with zipfile.ZipFile("release-build/bitdeer-php-sqlite.zip") as archive:
        archive.extractall(temporary)
    root=pathlib.Path(temporary)/"bitdeer"
    docroot=root/"public_html"
    private=root/"private"
    env={k:v for k,v in os.environ.items() if not k.startswith("BITDEER_")}
    php='require $argv[1]; provision("zipadmin","IntegrationZipPassword2026!","support@example.org");'
    subprocess.run(["php","-r",php,str(private/"server"/"schema.php")],
        env=env,check=True,capture_output=True,text=True)
    assert (private/"data"/"bitdeer.sqlite").is_file()
    with sqlite3.connect(private/"data"/"bitdeer.sqlite") as db:
        assert db.execute("SELECT COUNT(*) FROM users WHERE role='admin'").fetchone()[0] == 1
        assert db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0] == 0
        assert db.execute("SELECT COUNT(*) FROM app_settings WHERE name='install_seed_state'").fetchone()[0] == 0
    server=subprocess.Popen(["php","-S","127.0.0.1:8776","-t",str(docroot)],
       env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        url="http://127.0.0.1:8776/api/index.php?action="
        for _ in range(40):
            try:
                with urllib.request.urlopen(url+"plans",timeout=1) as response:
                    plans=json.load(response)["plans"]
                break
            except Exception: time.sleep(.15)
        else: raise AssertionError("Unpacked ZIP API failed to start")
        assert len(plans)==5
        with urllib.request.urlopen(url+"health",timeout=5) as response:
            assert json.load(response)["ok"]
        with urllib.request.urlopen("http://127.0.0.1:8776/",timeout=5) as response:
            assert b"<html" in response.read(600).lower()
        try:
            urllib.request.urlopen("http://127.0.0.1:8776/install/index.php",timeout=5)
            raise AssertionError("Installer reopened after provisioning")
        except urllib.error.HTTPError as error:
            assert error.code==410,error.code
        print("PASS: unpack ZIP, no manual database paths, React, PHP API, installer lock")
    finally:
        server.terminate()
        server.wait(timeout=10)
