# KCM Travel & Tours documentation

| Document | For | What it covers |
|---|---|---|
| **[KCM-User-Guide.pdf](KCM-User-Guide.pdf)** | The whole team | 41-page illustrated guide: signing in and the authenticator app, the menu, how enquiries arrive, a consultant's daily work, tickets, quotations, payments, management, all 20 ticket statuses, giving and removing access, partners, demo data, going-live checklist, troubleshooting. Screenshots use demo data. |
| **[marketing/KCM-Travel-and-Tours-Brochure.pdf](marketing/KCM-Travel-and-Tours-Brochure.pdf)** | Customers, social media | 7-page launch brochure: who KCM is, what you can do with KCM, all trips (no prices, so it stays current), how booking works, the explainer video script, "Launching soon". |
| [../backend/SETUP.md](../backend/SETUP.md) | Owner / admin | Connecting the Google Sheet, deploying the Apps Script backend, two-step sign-in, access levels, what each tab holds, demo data, updating to a new version. |
| [SECURITY-AUDIT.md](SECURITY-AUDIT.md) | Owner / technical | Security problems found and fixed, controls in place, test results, known limits of the pilot platform, production requirements, POPIA notes. |
| [OPERATIONS-CENTRE-PLAN.md](OPERATIONS-CENTRE-PLAN.md) | Technical | How the Operations Centre was designed on top of the existing site and backend. |
| [AUDIT-REPORT.md](AUDIT-REPORT.md) | Technical | Earlier independent website audit (SEO, performance, accessibility). |

## Quick start

1. Paste `backend/apps-script/dist/KCM-Backend.gs` into the Sheet's Apps Script `Code.gs`, run `setup`, then **Deploy → Manage deployments → Edit → New version** (keep **Who has access: Anyone**).
2. To test with realistic examples: in the Google Sheet, **KCM Admin → Load demo data (testing only)**. Demo staff password: `Demo-Lowveld-2026`.
3. Before going live: **KCM Admin → Remove demo data** and **KCM Admin → Remove test admin**.

## Rebuilding the user guide

The PDF is generated from `guide-src/build_guide.py` and the screenshots in `guide-src/img/`.

```bash
# 1. fresh emulator with demo data, and the site pointing at it
node backend/dev/mock-server.js &                 # http://127.0.0.1:8787
curl -s http://127.0.0.1:8787/__demo              # load demo data (emulator only)
cd KcmTravel && Site__ApiUrl=http://127.0.0.1:8787 dotnet run --urls http://127.0.0.1:5217 &
# 2. screenshots + 18 workflow checks (needs Playwright + Chrome), then convert PNG -> JPG into docs/guide-src/img
node backend/dev/guide-shots.js
# 3. build the HTML, then print it to A4 PDF with Chrome
python3 docs/guide-src/build_guide.py             # writes docs/guide-src/guide.html
```
