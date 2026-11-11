#!/usr/bin/env python3
"""Verify Replit-style first startup creates a fresh private SQLite database."""
import os
from pathlib import Path
import sqlite3
import subprocess
import tempfile

script=Path("bin/provision-replit.php").resolve()

with tempfile.TemporaryDirectory(prefix="bitdeer-replit-db-") as directory:
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
    assert "credentials were not logged" in result.stdout
    assert "password=" not in result.stdout
    credentials=db_path.parent/"default-user-credentials.txt"
    assert not credentials.exists()
    with sqlite3.connect(db_path) as db:
        assert db.execute("SELECT COUNT(*) FROM users WHERE role='admin'").fetchone()[0]==1
        assert db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]==0
        assert db.execute("PRAGMA integrity_check").fetchone()[0]=="ok"
    print("PASS: Replit first startup creates a fresh private SQLite database without a bundled seed")
