# Pilot backend setup (Google Sheet + Apps Script)

While KCM is in its pilot stage, a **Google Sheet is the database**. A small Google Apps Script attached to the Sheet does the backend work:

- sign-in (Google account or a 6-digit email code)
- partner registration, with photos saved privately in Google Drive
- admin review, with emails to partners
- user access levels
- bookings and contact messages from the website
- the **KCM Operations Centre**: tickets, tasks, checklists, quotations, payments, suppliers and notifications for the team

The Sheet **"KCM Travel & Tours – Pilot Database"** has already been created in your Google Drive, with all the tabs and column headers.

## 1. Add the backend script (about 5 minutes)

1. Open the Sheet in Google Drive.
2. Go to **Extensions → Apps Script**.
3. In the editor, delete everything in `Code.gs` and paste the contents of [`backend/apps-script/dist/KCM-Backend.gs`](apps-script/dist/KCM-Backend.gs). It's one big file (about 220 KB) that already contains `Vendor.gs`, `Security.gs`, `Pricing.gs`, `Code.gs` and `Ops.gs`, so you only paste once. If an older project has extra files (`Ops.gs`, `Security.gs`…), delete them first to avoid "already declared" errors.
4. Click **Project Settings** (the gear icon) and tick **Show "appsscript.json" manifest file in editor**. Go back to the editor, open `appsscript.json` and replace it with [`backend/apps-script/appsscript.json`](apps-script/appsscript.json).
5. Click **Save**.
6. In the function dropdown, choose **`setup`** and click **Run**. Google asks for permission:
   - **Review permissions** → choose your account.
   - Google says *"Google hasn't verified this app"*. This is normal for your own script. Click **Advanced → Go to (project name) (unsafe)**, then **Allow**.
   - Setup creates the private photo folder, hides the technical tabs and makes **you the owner** (Super Admin).
   - It also creates the Operations Centre tabs, a private folder for ticket files, the data-encryption key (kept in **Project Settings → Script Properties**, never in the code) and an **hourly trigger** (`opsSweep`) that flags overdue tasks and deadlines. Google asks for one extra permission for the trigger.

## 2. Publish it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear next to *Select type* and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Click **Deploy** and copy the **Web app URL**. It ends with `/exec`.
5. Send that URL to your developer, or put it in `KcmTravel/appsettings.json`:

```json
"Site": {
  "ApiUrl": "https://script.google.com/macros/s/XXXXXXXX/exec",
  ...
}
```

Push to `main` and GitHub Pages redeploys with sign-in and registration switched on.

> **After changing Code.gs later:** go to **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. The URL stays the same.

## 3. Switch on WhatsApp alerts (about 3 minutes)

Every new partner application, booking (website form and Kaycee chat) and contact message sends a WhatsApp message to the KCM team, with a link straight to the right page in the admin dashboard. The pilot uses **CallMeBot**, a free service for alerts to your own number.

For **each phone** that should get alerts:

1. Save **+34 644 71 81 99** in that phone's contacts (name it "CallMeBot").
2. Send it this WhatsApp message: `I allow callmebot to send me messages`
3. You'll get a reply with your **API key** (a number).
4. In the Google Sheet, open **KCM → WhatsApp alerts…** and enter `number, apikey`, for example `0764360010, 1234567`. A test message is sent straight away.

> **Status (Nov 2026):** CallMeBot replied "This bot is full", so these alerts aren't active. New tickets still appear in the dashboard bell and by email. Telegram or Meta's WhatsApp Business API are the alternatives.

Repeat for other admins' phones. Type `clear` in the same box to remove all numbers. Emails still go out as well, so nothing is missed if WhatsApp is down.

> Later, for messages to partners and guests on WhatsApp (not only the KCM team), move to the official WhatsApp Business Cloud API from Meta. Only the `whatsapp_` function in `Code.gs` needs to change.

## Passwords and sign-in

- **Partners** choose their password on the registration form. They can only sign in **after you approve** them (or if you asked them for more info). Before that, sign-in shows "your application is still being reviewed".
- **You and other staff**: the first time, click **Sign in → Forgot or set password**, enter your email, then the 6-digit code from your inbox and your new password (at least 10 characters; very common passwords are refused).
- Passwords are never stored: only an **Argon2id** hash with a secret "pepper" kept in Script Properties (the `PasswordHash` and `PasswordSalt` columns in **Users**). Older hashes are upgraded automatically the next time that person signs in. Don't edit those columns.
- Forgotten passwords: anyone can reset theirs with **Forgot or set password**. A reset signs that person out everywhere.
- Repeated wrong passwords or codes are slowed down and then blocked for a while, per email address and site-wide.

### Two-step sign-in (authenticator app)

**Super Admin, Admin, Management and Finance** must use an authenticator app (Google Authenticator, Microsoft Authenticator, Authy…). Operations staff, partners and customers don't need one.

1. Sign in with your password as usual.
2. The first time, a QR code appears. Scan it with the app and type the 6-digit code.
3. You get **8 recovery codes**, shown once. Save them somewhere safe (a password manager or printed). Each works once if you lose your phone.
4. From then on, every sign-in asks for the 6-digit code from the app.

Lost phone and no recovery codes? A Super Admin (or Admin, for non-admins) opens **Users & access** and clicks **Reset two-step** for that person. They set it up again on their next sign-in.

### Test admin

`setup` also creates a test account **admin@kcm.test** (role Admin) so you can try the dashboard. Because it's an Admin, it must also set up an authenticator on first sign-in. **Before going live, remove it:** Sheet menu **KCM → Remove test admin**.

## Ownership documents

Applicants upload proof that the vehicle or property is theirs (for example the vehicle registration certificate and ID, or a title deed, rates bill or lease and ID). Documents are saved privately in the same Drive folder as the photos (file names start with `DOC`) and appear in the **Photos** tab with `Kind` = `document`. In the dashboard they're under **Ownership documents** in each application, with an **Open** button. Check that the names match before approving.

## 4. (Optional) "Continue with Google" button

The email-code sign-in works without this step. To add the Google button:

1. Go to <https://console.cloud.google.com/apis/credentials> (same Google account) and create a project, e.g. *KCM Website*.
2. Set up the **OAuth consent screen**: External, app name *KCM Travel & Tours*, your email. Add yourself as a test user, or publish the app.
3. Go to **Create credentials → OAuth client ID → Web application**.
4. Under **Authorised JavaScript origins**, add:
   - `https://mathonsimm.github.io`
   - `https://localhost:7268` and `http://localhost:5217` (the ports Visual Studio uses for this project)
   - your own domain later, e.g. `https://www.kcmtravel.co.za`
5. Copy the **Client ID** (ends with `.apps.googleusercontent.com`) and put it in two places:
   - the Sheet: **KCM Admin → Set Google Sign-In client ID**. Reload the Sheet first if the menu isn't there.
   - `KcmTravel/appsettings.json` → `"GoogleClientId": "…"`

## Access levels

Every check happens on the server (in Apps Script). Hiding a button in the browser is only for tidiness, never for security.

| Role | Can do |
|---|---|
| **Super Admin** | Everything, including managing Admins. Set automatically for the account that ran `setup`. Can't be given to anyone through the website. |
| **Admin** | Everything except managing Super Admins and other Admins: users, partners, all tickets, approvals, payment verification, refunds, POPIA erasure. |
| **Management** | All tickets, assignment, workload, quotation approval, confirming bookings, checklist templates and statuses, partner review. Cannot verify payments. |
| **Finance** | Sees all tickets and payments; **verifies** payments, approves refunds, manages partner payouts. |
| **Operations** | Registers enquiries (incl. WhatsApp/phone), works the tickets assigned to them or that they support, prepares quotations, records payments as *unverified*. Cannot confirm bookings or verify payments. |
| **Partner** | Sees and updates only their own applications, jobs and statements. |
| **Customer** | No dashboard access. |

Old roles are mapped automatically: owner → Super Admin, admin → Admin, viewer → Operations, partner → Partner.

Nobody can change their own role. Changing someone's role, disabling them or resetting their password signs them out immediately.

To give someone access, sign in to the website and open **Admin → Users & access → Give someone access**. They then sign in with **Forgot or set password**.

## What's where

| Tab | Contents |
|---|---|
| Users | Everyone with an account, their role and status (`pending` = registered partner waiting for approval). Password columns hold hashes only. |
| Partners | Partner applications. Type-specific answers are in `Summary` (readable) and `Details` (JSON). `Tier` is the premium standard set on approval (Premium, Premium Plus, Signature). |
| Photos | One row per photo or document (`Kind` = photo or document). Files are in Drive → *KCM Partner Uploads (private)* |
| Bookings | Booking requests from the website form (`Source` = website) and Kaycee chat (`Source` = chat) |
| Messages | Contact form messages |
| Jobs | Trips done by partners: trip value, KCM commission %, partner payout and payout status (Pending, Approved, Paid, On hold). Partners see only their own rows in their portal and can download a statement. |
| Ratings | Guest ratings (1–5 stars) sent through the `/rate` link. Admins can hide a rating; hidden ones aren't shown or counted. |
| Activity | Audit log (append-only: who did what, when, old → new value) |
| Sessions, Codes | Hidden technical tabs. Don't edit. |
| **Operations Centre tabs** | |
| Customers | One row per customer (`CUS-000001`), with POPIA consent date and source |
| Tickets | One row per enquiry (`KCM-2026-000001`): operational status, payment status, response status, priority, owner, deadlines. `Version` stops two people overwriting each other |
| Tasks, Checklist, ChecklistTemplates | Follow-ups and checklist items per ticket; templates are edited in **Ops settings** |
| Notes | Internal and customer-facing notes. Append-only: notes are never edited or deleted |
| Quotes | Quotation versions (draft → approval → sent → accepted/declined) |
| Payments | Deposits, balances and refunds. A payment only counts once **Finance has verified it** |
| Suppliers, SupplierQuotes | Lodges, transport and other suppliers, and their quotes per ticket |
| Attachments | Files uploaded to tickets (stored in a private Drive folder) |
| Notifications | In-dashboard notifications (the bell). No SMS/WhatsApp is sent from here |
| OpsSettings | Extra statuses you add |

Please don't rename tabs or column headers: the script relies on them.

**Updating from an earlier version:**

1. Replace everything in `Code.gs` with the new [`dist/KCM-Backend.gs`](apps-script/dist/KCM-Backend.gs) and save.
2. Run **`setup`** once more (function dropdown, or **KCM → Run setup**). It adds new tabs and columns without touching your data.
3. Optional: **KCM → Create tickets from existing bookings** turns bookings that came in before the Operations Centre into tickets (it skips ones already done).
4. **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. The URL stays the same, so the website needs no change.

**Data-encryption key:** authenticator secrets are encrypted with AES-256-GCM using a key in Script Properties. **KCM → Rotate data-encryption key** creates a new key and re-encrypts everything. Never copy those Script Properties into the code or GitHub.

## Limits to know (free Google account)

- About **100 emails a day**: sign-in codes, partner emails and admin alerts.
- Apps Script runs for up to 6 minutes per request, which is plenty here.
- Comfortable for a pilot with hundreds of partners and a few thousand bookings. When you outgrow it, the website only talks to the backend through `kcm-api.js`, so moving to Supabase or a server means replacing the Apps Script, not the pages.

## Kaycee in the dashboard: the staff assistant (optional AI mode)

The dashboard has a help assistant (**Ask Kaycee**, bottom right). It works straight away with a built-in, free assistant that understands most rewordings and typos.

For fully flexible answers, switch on AI mode:

1. Create an API key at [console.anthropic.com](https://console.anthropic.com) (add a small amount of credit; each question costs a fraction of a cent with the default model).
2. In Apps Script: **Project Settings → Script Properties → Add script property**: `ANTHROPIC_API_KEY` = your key. Optional: `ASSISTANT_MODEL` (default `claude-haiku-5-5`).
3. No redeploy is needed for a property change.

Rules: only signed-in staff can use it, 40 questions per person per hour, questions are not stored, and the model may only answer from the KCM help articles. Remove the property to switch AI mode off. Never put the key in the code or on GitHub.

## Demo data (for testing)

To try every screen with realistic examples, open the Sheet and click **KCM Admin → Load demo data (testing only)**. It creates about 33 tickets at every stage (9 left unassigned so you can practise assigning) (new, assigned, quoting, awaiting deposit, payment verification, confirmed, travelling, completed, lost, cancelled, on hold, refund pending), customers, tasks, notes, quotations, payments, suppliers, partner applications, payouts, ratings, website messages and demo staff accounts. It takes a few minutes; if it says "Part loaded", click it again to continue.

- Everything fake is labelled: names end in **(demo)**, emails end in **@demo.kcm.test**, descriptions start with **[DEMO]**. No emails or WhatsApp messages are sent while it runs.
- Demo staff (password **Demo-Lowveld-2026**): `nomsa.ops@`, `sipho.ops@`, `ayesha.ops@` (Operations), `thandi.manager@` (Management), `fiona.finance@`, `sam.finance@` (Finance), `former.ops@` (disabled), all `@demo.kcm.test`. Partner: `lowveld.partner0@demo.kcm.test`.
- **Before going live:** **KCM Admin → Remove demo data**. It deletes only demo records and accounts; if no real tickets exist, numbering restarts at KCM-YYYY-000001.

The illustrated user guide for the whole team is [`docs/KCM-User-Guide.pdf`](../docs/KCM-User-Guide.pdf).

## Testing locally without Google

```bash
node backend/dev/mock-server.js          # runs all backend files with in-memory Google services on :8787
# then run the site with:  Site__ApiUrl=http://127.0.0.1:8787
node backend/dev/test-api.js             # 98 automated checks (scenarios + security) against the mock
```

Emails, including sign-in codes, are printed in the console and listed at `http://127.0.0.1:8787/__mail`. Everything the mock creates is **test data**; it disappears when the mock stops.

**After editing any `.gs` file:** run `python3 scripts/build_backend.py` to regenerate `dist/KCM-Backend.gs`. If tour prices change in the site, run `python3 scripts/gen_pricing.py http://127.0.0.1:5217` (with the site running) to regenerate `Pricing.gs`, so the server's quote estimates match the website.
