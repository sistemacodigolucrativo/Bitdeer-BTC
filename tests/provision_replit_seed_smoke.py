#!/usr/bin/env python3
"""Verify Replit-style first startup seeds the workspace DB and keeps credentials private."""
import os
from pathlib import Path
import sqlite3
import subprocess
import tempfile

script=Path("bin/provision-replit.php").resolve()

with tempfile.TemporaryDirectory(prefix="bitdeer-replit-seed-") as directory:
    root=Path(directory)
    db_path=root/"private"/"bitdeer.sqlite"
    env={key:value for key,value in os.environ.items() if not key.startswith("BITDEER_")}
    env.update({
        "BITDEER_DB_PATH":str(db_path),
        "BITDEER_ALLOW_CLI_PROVISION":"1",
        "BITDEER_ADMIN_LOGIN":"replitadmin",
        "BITDEER_ADMIN_PASSWORD":"ReplitSeedPasswordForTest2026!",
        "BITDEER_SUPPORT_EMAIL":"support@example.org",
    })
    result=subprocess.run(["php",str(script)],env=env,check=True,capture_output=True,text=True)
    assert "credentials were saved" in result.stdout
    assert "password=" not in result.stdout
    credentials=db_path.parent/"default-user-credentials.txt"
    assert credentials.is_file()
    assert credentials.stat().st_mode & 0o777 == 0o600
    values=dict(line.split("=",1) for line in credentials.read_text().splitlines())
    assert values["login"]=="user"
    assert len(values["password"])>=12
    assert len(values["referral_code"])>=8
    with sqlite3.connect(db_path) as db:
        assert db.execute("SELECT COUNT(*) FROM users").fetchone()[0]==2
        assert db.execute("SELECT COUNT(*) FROM users WHERE role='admin'").fetchone()[0]==1
        assert db.execute("SELECT COUNT(*) FROM users WHERE role='member' AND login='user'").fetchone()[0]==1
        assert db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]==0
        assert db.execute("SELECT COUNT(*) FROM app_settings WHERE name='install_seed_state'").fetchone()[0]==0
    print("PASS: Replit first startup used sanitized seed and stored default credentials privately")
