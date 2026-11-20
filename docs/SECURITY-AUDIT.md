# Security audit and Operations Centre upgrade: results

Version 1.4.0 of the backend (`backend/apps-script`). Audit date: 19 November 2026.

**What was tested and where.** Every result below comes from automated tests run against `backend/dev/mock-server.js`, which runs the real `.gs` files on Node with in-memory stand-ins for Google Sheets, Drive, Mail, Cache, Lock and Script Properties.

- `backend/dev/test-api.js`: **98/98 checks passed** (setup, the 7 business scenarios, 31 security checks, reporting).
- Playwright browser test of the real site against the same mock: **21/21 checks passed**.

**Not tested:** the code has not yet run on Google's real Apps Script servers (this build environment can't reach script.google.com). The first real run is when you paste `dist/KCM-Backend.gs` and run `setup`. Expect Argon2id sign-in to take about 1–2 seconds there. That is by design (slow hashing makes stolen hashes expensive to crack).

## 1. Problems found and fixed

| # | Problem in the previous version | Risk | Fix | Test |
|---|---|---|---|---|
| 1 | Passwords hashed with salted SHA-256 | Fast hash: a leaked Sheet could be cracked quickly | **Argon2id** (19 MiB memory, 2 passes, PHC format) plus a secret pepper kept in Script Properties. Old hashes are upgraded automatically on next sign-in | "pre-1.4 password still works and is re-hashed", "no plaintext passwords stored" |
| 2 | Sign-in codes and tokens came from a non-cryptographic random source | Guessable codes or session tokens | Cryptographic randomness (SHA-256 over UUIDs) for codes, tokens, salts and IDs; constant-time comparisons | covered by sign-in tests |
| 3 | No two-step sign-in | One leaked password = full admin access | **TOTP authenticator** compulsory for Super Admin, Admin, Management and Finance on *every* sign-in method (password, email code, Google, reset). Replay protection, 8 single-use hashed recovery codes, 5-attempt limit | 7 MFA tests |
| 4 | Three coarse roles (owner/admin/viewer), checked by role name | Over-broad access; viewers saw identity documents | **7 roles with a server-side permission matrix** (`PERMS` in `Security.gs`). Every action checks a named permission | 15 RBAC/IDOR tests |
| 5 | Booking price and reference produced in the browser | A visitor could submit any price or reference | Server recomputes the estimate from `Pricing.gs` and issues the ticket number (`KCM-YYYY-NNNNNN`). The browser value is ignored | scenario 1 |
| 6 | Double-clicks / retries created duplicate bookings | Duplicate tickets and quotes | Idempotency key per visit (cached 1 hour); duplicate payment references refused | scenarios 1 and 6 |
| 7 | Uploads accepted on the file name alone | A script renamed `.pdf` could be stored | File bytes checked against the claimed type (magic numbers); files stored in private Drive folders | 3 upload tests |
| 8 | Ownership/ID documents visible to every dashboard user | Unnecessary exposure of personal data (POPIA) | Only the owner and `partners.review` holders can open them; every view is logged | partner tests |
| 9 | Sessions survived a role change or password reset | A demoted or disabled user stayed signed in | Sessions revoked on role change, disable, password reset and MFA reset | "promoting a user revokes their old session" |
| 10 | Rate limiting only per email address | Password spraying across many accounts | Per-email lockout **plus** a site-wide cap of 60 failed sign-ins per minute; dummy hash on unknown emails so timing doesn't reveal which accounts exist | "login throttled" |
| 11 | Minimum password length 8, no weak-password check | Easily guessed passwords | 10+ characters; common patterns (password, kcm, admin, qwerty, 123456…) refused | "weak password refused" |
| 12 | Kaycee chat sent personal details without consent | POPIA | Consent checkbox required; server refuses a booking without consent and records when and where consent was given | UI test "Kaycee refuses to send without POPIA consent" |
| 13 | No Content-Security-Policy on the static site | Easier cross-site scripting | CSP and referrer meta tags added by `scripts/export_static.py`; all user text is escaped in the dashboard | UI test "note HTML is escaped" |

## 2. Controls now in place

- **Access rules (v1.5):** access comes from access profiles (one or more per person). Nobody can change their own access; nobody can give or build a profile with access they don't hold themselves (no privilege escalation); only an administrator changes an administrator; nobody can be made Super Admin through the website. Partners and customers never hold staff permissions.
- **Temporary passwords:** staff accounts start with a temporary password (Argon2id-hashed like any password) that works once, expires after 7 days and is never emailed. First sign-in requires a new password before any session or MFA step. `changeMyPassword` needs the current password and signs out other devices. The pick-up flag is set server-side only (`claimTicket`), never from the request body. Tested: `backend/dev/access-test.js` (52 checks).
- **Least privilege for finance:** finance sees only tickets with a quotation or payment, as a read-only money summary (no notes, tasks, files, contact details); tasks, customer records and non-payment files of those tickets are refused.
- **No IDOR:** Operations staff only reach tickets they own or support. Someone else's ticket answers exactly like a missing one, so ticket numbers can't be probed.
- **Mass-assignment protection:** ticket updates go through a whitelist of fields (`TICKET_FIELDS`); unknown fields are ignored, and priority and owner changes need their own permissions.
- **Concurrent edits:** each ticket has a `Version`. A stale save is refused with "someone else updated this ticket".
- **Money:** only Finance (or Admin) can verify a payment. Unverified payments never count towards "paid". Refunds and partner payouts are recorded by one person and approved by a manager (never the recorder). Payment status is calculated by the server, not typed in. Agents see payment status but not bank references.
- **Bookings:** only Management/Admin can confirm a booking, and only once a quotation is accepted and a verified payment exists. Kaycee can't confirm anything; it only creates an enquiry.
- **Status rules:** the 20-status lifecycle has guards (for example, only confirmed bookings can be completed, and an unpaid balance blocks completion unless a manager overrides it with a note; cancelling, on hold and lost all need a reason).
- **Audit trail:** every change is written to `Activity` (who, when, old → new). Notes are append-only.
- **Encryption:** authenticator secrets are encrypted with **AES-256-GCM**; the key is versioned and rotatable and lives only in Script Properties.
- **Secrets:** no secret is in the website code or the GitHub repository. The only built-in credential is the test admin's Argon2id hash, which has no pepper; remove that account before going live.

## 3. Known limitations of the pilot platform (Google Sheets + Apps Script)

These can't be fixed inside Apps Script. They are acceptable for a pilot but should be addressed before KCM handles high volumes or card data.

1. **The Google account is the master key.** Anyone who can open the Sheet or the script can read and change everything, bypassing the website's rules. Protect it with Google's own 2-Step Verification and don't share the Sheet.
2. **The session token is stored in the browser** (`localStorage`), because Apps Script can't set secure HttpOnly cookies. CSP and output escaping reduce the risk, but a cross-site scripting bug would expose it. Privileged sessions expire after 12 hours.
3. **No client IP address** is visible to Apps Script, so rate limits are per email and site-wide, not per IP.
4. **No custom security headers** (HSTS, X-Frame-Options, frame-ancestors). GitHub Pages provides HTTPS; the CSP is a meta tag, which can't block framing.
5. **Not a transactional database.** Writes are serialised with a script lock, which is safe at pilot volumes but slow under load. There are no foreign keys; the code enforces relationships.
6. **The audit log is append-only through the website only.** The Sheet owner can still edit it directly.
7. **Limits:** about 100 emails a day on a free Google account; Argon2id settings are modest because Apps Script CPU is limited.
8. **WhatsApp:** there is no WhatsApp integration. Enquiries that arrive on WhatsApp are captured manually with **Register enquiry → Source: WhatsApp**, and "Open chat" links simply open WhatsApp. CallMeBot team alerts are not active (the service replied "bot is full").
9. **No card payments are taken on the site**, by design. Payments are recorded after the fact and verified by Finance.

## 4. Production requirements (when KCM outgrows the pilot)

Not configured or purchased as part of this work:

- A server backend (ASP.NET Core API is the natural fit for this project) with a managed PostgreSQL or SQL Server database, transactions and nightly backups.
- HttpOnly, Secure, SameSite cookies for sessions, with CSRF protection.
- Hosting that sets security headers (HSTS, CSP, frame-ancestors) and a web application firewall with per-IP rate limiting.
- Keys in a secrets manager (Azure Key Vault or AWS KMS), not app settings.
- Encrypted, access-controlled file storage for documents.
- The official **WhatsApp Business Cloud API** (Meta) if WhatsApp messages should be logged automatically.
- A payment gateway (PayFast, Paystack or Peach) with webhooks verified on the server.

The website only talks to the backend through `kcm-api.js`, so the move replaces the backend, not the pages.

## 5. POPIA notes

- Consent is recorded per customer (date and source) for both the booking form and Kaycee.
- **Erase customer** (Admin only) removes the customer's name and contact details from Customers, Bookings and Messages, and records why. It is blocked while the customer has open tickets. Financial records keep amounts and ticket numbers, because accounting law requires them.
- Suggested retention: delete or anonymise enquiries that never became bookings after 12 months; keep booking and payment records for 5 years (Tax Administration Act); delete partner ID documents once a partner leaves, unless needed for a dispute.
- Appoint an Information Officer and register them with the Information Regulator, and publish the privacy policy on the site.

## 6. Next milestones

1. Paste `dist/KCM-Backend.gs`, run `setup`, deploy a new version, and repeat the main scenarios once on the real Google account.
2. Every privileged user sets up their authenticator; remove the test admin.
3. Decide on team alerts: Telegram (free, quick) or the Meta WhatsApp Business API.
4. Add a privacy policy page and an Information Officer.
5. Plan the move to a server backend once volume or card payments require it.
