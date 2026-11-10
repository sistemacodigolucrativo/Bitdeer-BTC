---
name: Production copy before backend
description: User wants a production-like populated preview before the real backend is available.
---

Prepare production-ready wording and layouts in advance, but do not present synthetic payments, signups, mining results, or equipment status as verified real activity in a publicly accessible build. Keep demo/test data and real user-facing claims separated until the backend supplies verified records. The project’s mockup-copy lock stays enabled until the real backend is integrated and verified; an admin may start a legitimate-copy preview for 1–365 days only in the current browser, and it must revert automatically.

**Why:** The user wants to see the finished, populated product before implementing the real backend; the current project includes demonstration data and tests that require some demo disclosures.

**How to apply:** Keep simulation-related notices for flows still backed by fixtures or simulation endpoints. Do not remove the mockup-copy lock before final backend integration and verification. A timed copy preview is for the current browser only; enforce the 1–365-day limit, automatically revert to Mockup at expiry, and do not persist the preview as a global server setting or alter product data/behavior. Apply the “DEPOIS” copy in `docs/CHECKLIST_TEXTO_ANTES_DEPOIS.md` only when each relevant backend source returns real, verified data. Replicate presentation changes in the workspace root and `ProjetoGIT`.

## Demo member withdrawal history

The user clarified that every withdrawal row shown for demo members is demonstrative, including rows backed by sample account history and randomly generated member accounts. The simulation badge should appear in Mockup mode and be hidden in the legitimate-copy preview. Generated demo accounts may use random logins and must be recognized by their seed/audit record rather than by login alone.

**Why:** on November 10, 2026, the user showed October dates in a generated demo account and clarified that the display cutoff must advance with the calendar (November → September; December → October). This distinguishes demo history from real members’ financial records.

**How to apply:** Apply the dynamic two-calendar-month display-date cutoff to every generated demo account’s withdrawal history, preserving its other fields. Change dates only in the response used for presentation; never edit stored request timestamps or other members’ actual withdrawals.

The rotating payment-feed preview must run only while mockup mode is active. In the time-limited legitimate-copy preview, keep fixture rows static until verified payment records are available.

**Why:** the payment API currently generates fictional `SIM-` examples; animating them as arrivals in legitimate copy could make them look like confirmed transfers.

**How to apply:** Gate any timed insertion or rotation of mock payments on mockup mode. Do not replace this with a real-time claim until the backend supplies verified payment events.

## New-investor toast history

Fictional investor toasts use the same 200 profiles as Top Miners. Randomly select each complete profile once per member within a cycle, persist cycle history across logins and devices, then reshuffle all 200 for the next cycle. First names and surnames may recur in different full profiles or later cycles.

**Why:** The user requested that toast names match Top Miners and chose to reshuffle and repeat the 200-profile pool after each complete cycle.

**How to apply:** Keep cycle and profile history in durable server storage keyed by member ID. Prevent the same complete profile from appearing twice in one 200-toast cycle, but allow first names, surnames, and complete profiles to recur after reshuffling. Keep fictional investor toasts clearly labeled as simulation and unavailable in legitimate-copy mode.
