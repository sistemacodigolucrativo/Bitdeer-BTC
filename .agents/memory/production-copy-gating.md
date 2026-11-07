---
name: Production copy before backend
description: User wants a production-like populated preview before the real backend is available.
---

Prepare production-ready wording and layouts in advance, but do not present synthetic payments, withdrawals, signups, mining results, or equipment status as verified real activity in a publicly accessible build. Keep demo/test data and real user-facing claims separated until the backend supplies verified records. The project’s mockup-copy lock stays enabled until the real backend is integrated and verified; a manually started two-hour legitimate-copy preview is allowed only in the current browser and must revert automatically.

**Why:** The user wants to see the finished, populated product before implementing the real backend; the current project includes demonstration data and tests that require some demo disclosures.

**How to apply:** Keep simulation-related notices for flows still backed by fixtures or simulation endpoints. Do not remove the mockup-copy lock before final backend integration and verification. A timed copy preview is for the current browser only; do not persist it as a global server setting or alter data/behavior. Apply the “DEPOIS” copy in `docs/CHECKLIST_TEXTO_ANTES_DEPOIS.md` only when each relevant backend source returns real, verified data. Replicate presentation changes in the workspace root and `ProjetoGIT`.
