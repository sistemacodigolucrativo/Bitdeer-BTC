---
name: ProjetoGIT scope
description: Rules for applying future visual changes to the workspace root and the repository clone.
---

Use the workspace root as the preview project. For each visual frontend request, make the same change in the root and in `ProjetoGIT/`, then report the modified files from each project.

In `ProjetoGIT/`, change only presentation: layout, templates, styles, on-screen text, images/icons, colors, fonts, spacing, and responsive behavior. Do not change business logic, backend code, routes/APIs, database/schema/models, configuration, package/dependency files, or other non-presentation files. If a file's scope is unclear, ask before editing it.

**Why:** the user supplied this as the standing workflow and scope restriction for the cloned repository.

**How to apply:** follow these constraints on each later visual request; keep the root and clone changes identical where the request applies.
