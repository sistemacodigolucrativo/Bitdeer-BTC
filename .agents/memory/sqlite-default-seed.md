---
name: SQLite default seed
description: Use the active workspace database as the sanitized starting data for new installations.
---

The SQLite database used by the preview at `.local/private/bitdeer.sqlite` is the project's single source of truth. Keep that database, track it in Git, and push its updates to the remote repository. Remove other local database copies rather than maintaining a separate seed.

**Why:** The user explicitly said the preview database is authoritative and confirmed publishing the complete database to the remote repository.

**How to apply:** Preserve the active preview file as-is when syncing it to Git. Do not create sanitized or duplicate database snapshots in the workspace. Keep generated release packages independent: they must not include the live database.
