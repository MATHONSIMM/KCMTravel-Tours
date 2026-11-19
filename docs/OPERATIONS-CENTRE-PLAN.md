# KCM Operations Centre & security upgrade: implementation plan

_Prepared after inspecting the repository on 19 Nov 2026, before implementation._

## What exists today (inspected in code)

| Area | Where | Reuse? |
|---|---|---|
| Public site, catalogue, 5-step booking form with live pricing | `KcmTravel/` (ASP.NET Core 8 MVC), `Data/Catalog.cs`, `Data/PricingService.cs`, `wwwroot/js/booking.js` | Reuse. The pricing rules are ported to the backend so prices are recalculated on the server. |
| Static preview | GitHub Pages via `scripts/export_static.py` | Keep as a preview only |
| Backend / database | Google Apps Script web app + Google Sheet (`backend/apps-script/Code.gs`), tabs as tables | Reuse and extend. Keep the API contract portable (JSON `{action, token, ...}`), so it can later move to a hosted API + relational DB |
| Auth | Email + password (iterated SHA-256 + pepper), email codes, optional Google sign-in, session tokens hashed in `Sessions` | Upgrade: Argon2id with transparent rehash, MFA (TOTP) for privileged roles, 7 server-side roles |
| Admin dashboard | `wwwroot/js/admin.js`, `Views/Portal/Admin.cshtml` | Extend: the Operations Centre becomes a section of the same dashboard (`ops.js`) |
| Partner registration & portal | `auth.js`, `account.js`, `Partners/Photos/Jobs/Ratings` tabs | Keep; tighten document access |
| Kaycee | `wwwroot/js/chat.js`, a **scripted, rule-based assistant (not an LLM)**. It asks style → region → date → party size → nights → budget, then suggests tours and collects name, cell, optional email | Reuse its fields to create a ticket automatically; no customer re-entry |
| Website bookings | `submitBooking` → `Bookings` tab + email/WhatsApp alert | Keep the tab (no data loss). Every new request also creates a Customer + Ticket |
| WhatsApp | `wa.me` link-outs + CallMeBot alerts (currently unavailable: bot full) | Not a WhatsApp Business integration. Manual "Register enquiry" form with source = WhatsApp; webhook-ready design |

## New components

- **Security.gs**: roles and permissions matrix, Argon2id, TOTP MFA with recovery codes, AES-256-GCM for secrets (versioned keys in Script Properties), login throttling.
- **Pricing.gs**: catalogue prices generated from the site + authoritative quote calculation.
- **Ops.gs**: Customers, Tickets (`KCM-YYYY-NNNNNN`), lifecycle with guards, separate operational / payment / customer-response statuses, Tasks, Checklist templates and items, Notes timeline (append-only), Handover, Quotations with versions and approval, Payments with verification and two-person refunds, Suppliers and supplier quotes, Attachments (private Drive), internal Notifications + hourly sweep, Overview metrics, Search.
- **ops.js / ops.css**: Operations Centre navigation (12 sections + My Workspace), ticket register, ticket workspace, intake form, workload, notification bell.
- **Tests**: Node API regression suite against the local Apps Script emulator (`backend/dev/mock-server.js`) covering the 7 acceptance scenarios and the security cases, plus a browser end-to-end run.

## Constraints accepted for the pilot (documented, not hidden)

Apps Script cannot set HttpOnly cookies, read client IPs, set CORS or security headers. Session tokens stay in browser storage (mitigated by CSP, short privileged sessions and server-side revocation). Sheets have no SQL transactions or foreign keys; integrity relies on a script-wide lock, optimistic versioning and server-side validation. Production hosting will need a proper API + relational database; see `docs/SECURITY-AUDIT.md`.
