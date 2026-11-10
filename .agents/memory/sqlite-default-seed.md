---
name: SQLite default seed
description: Use the active workspace database as the sanitized starting data for new installations.
---

Use the active workspace SQLite database as the source for the packaged installation seed. Preserve only the administrator and the member whose login is `user`, including their retained account history; remove other accounts and dependent records. Remove sessions, password hashes, personal contact details, payment identifiers, and per-install settings from the seed. Each new installation must create fresh credentials. Keep the active workspace database private and unchanged when rebuilding the seed.

**Why:** The user explicitly wants the database currently used in this workspace to be the default starting database for installations elsewhere, while retaining only admin and `user`.

**How to apply:** Generate the seed from the current private SQLite file with the sanitizing script, package it only under a private path outside the web root, and never commit the operational database directly.
