---
name: Production copy before backend
description: User wants a production-like populated preview before the real backend is available.
---

Prepare production-ready wording and layouts in advance, but do not present synthetic payments, withdrawals, signups, mining results, or equipment status as verified real activity in a publicly accessible build. Keep demo/test data and real user-facing claims separated until the backend supplies verified records. The project’s mockup-copy lock stays enabled until the real backend is integrated and verified; an admin may start a legitimate-copy preview for 1–365 days only in the current browser, and it must revert automatically.

**Why:** The user wants to see the finished, populated product before implementing the real backend; the current project includes demonstration data and tests that require some demo disclosures.

**How to apply:** Keep simulation-related notices for flows still backed by fixtures or simulation endpoints. Do not remove the mockup-copy lock before final backend integration and verification. A timed copy preview is for the current browser only; enforce the 1–365-day limit, automatically revert to Mockup at expiry, and do not persist the preview as a global server setting or alter product data/behavior. Apply the “DEPOIS” copy in `docs/CHECKLIST_TEXTO_ANTES_DEPOIS.md` only when each relevant backend source returns real, verified data. Replicate presentation changes in the workspace root and `ProjetoGIT`.

The rotating payment-feed preview must run only while mockup mode is active. In the time-limited legitimate-copy preview, keep fixture rows static until verified payment records are available.

**Why:** the payment API currently generates fictional `SIM-` examples; animating them as arrivals in legitimate copy could make them look like confirmed transfers.

**How to apply:** Gate any timed insertion or rotation of mock payments on mockup mode. Do not replace this with a real-time claim until the backend supplies verified payment events.
