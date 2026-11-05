#!/usr/bin/env python3
"""Verify the installable package structure without contacting any production host."""
import pathlib
import tempfile
import zipfile
import subprocess

archive=pathlib.Path('release-build/bitdeer-php-sqlite.zip')
assert archive.is_file(), 'CI did not produce a release ZIP'
with zipfile.ZipFile(archive) as z:
    names=set(z.namelist())
    required={
      'bitdeer/public_html/index.html',
      'bitdeer/public_html/api/index.php',
      'bitdeer/public_html/install/index.php',
      'bitdeer/public_html/install/ownership.php',
      'bitdeer/private/server/api.php',
      'bitdeer/private/server/schema.php',
      'bitdeer/private/server/core.php',
      'bitdeer/public_html/.htaccess',
      'bitdeer/INSTRUCOES_DE_INSTALACAO.md'
    }
    assert required.issubset(names), sorted(required-names)
    assert not any(n.endswith('.sqlite') for n in names), 'ZIP must never contain a database'
    with tempfile.TemporaryDirectory() as tmp:
        z.extractall(tmp)
        root=pathlib.Path(tmp)/'bitdeer'
        for path in (
            root/'public_html'/'api'/'index.php',
            root/'public_html'/'install'/'index.php',
            root/'public_html'/'install'/'ownership.php',
            root/'private'/'server'/'api.php',
            root/'private'/'server'/'core.php',
            root/'private'/'server'/'schema.php'
        ):
            subprocess.run(['php','-l',str(path)],check=True,capture_output=True,text=True)
        assert (root/'private'/'data').is_dir(), 'SQLite private data directory missing'
print('PASS: ZIP layout, isolated PHP backend, DB private dir, PHP syntax')
