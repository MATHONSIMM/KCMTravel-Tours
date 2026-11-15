# Pilot backend setup (Google Sheet + Apps Script)

While KCM is in its pilot stage, a **Google Sheet is the database**. A small Google Apps Script attached to the Sheet does the backend work:

- sign-in (Google account or a 6-digit email code)
- partner registration, with photos saved privately in Google Drive
- admin review, with emails to partners
- user access levels
- bookings and contact messages from the website

The Sheet **"KCM Travel & Tours – Pilot Database"** has already been created in your Google Drive (mphikelelimm@gmail.com), with all the tabs and column headers.

## 1. Add the backend script (about 5 minutes)

1. Open the Sheet in Google Drive.
2. Go to **Extensions → Apps Script**.
3. In the editor, delete everything in `Code.gs` and paste the contents of [`backend/apps-script/Code.gs`](apps-script/Code.gs).
4. Click **Project Settings** (the gear icon) and tick **Show "appsscript.json" manifest file in editor**. Go back to the editor, open `appsscript.json` and replace it with [`backend/apps-script/appsscript.json`](apps-script/appsscript.json).
5. Click **Save**.
6. In the function dropdown, choose **`setup`** and click **Run**. Google asks for permission:
   - **Review permissions** → choose your account.
   - Google says *"Google hasn't verified this app"*. This is normal for your own script. Click **Advanced → Go to (project name) (unsafe)**, then **Allow**.
   - Setup creates the private photo folder, hides the technical tabs and makes **you the owner**.

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

## 3. (Optional) "Continue with Google" button

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

| Role | Can do |
|---|---|
| **owner** | Everything, including adding and removing admins. Set automatically for the account that ran `setup`. |
| **admin** | Review applications, update bookings, give viewer access. |
| **viewer** | See the whole dashboard, change nothing. |
| **partner** | See and update only their own applications. |

To give someone access, sign in to the website and open **Admin → Users & access → Give someone access**. They then sign in with that email.

## What's where

| Tab | Contents |
|---|---|
| Users | Everyone who signed in, plus their role and status |
| Partners | Partner applications. Type-specific answers are in `Summary` (readable) and `Details` (JSON). |
| Photos | One row per photo. Files are in Drive → *KCM Partner Uploads (private)* |
| Bookings | Booking requests from the website |
| Messages | Contact form messages |
| Activity | Audit log |
| Sessions, Codes | Hidden technical tabs. Don't edit. |

Please don't rename tabs or column headers: the script relies on them.

## Limits to know (free Google account)

- About **100 emails a day**: sign-in codes, partner emails and admin alerts.
- Apps Script runs for up to 6 minutes per request, which is plenty here.
- Comfortable for a pilot with hundreds of partners and a few thousand bookings. When you outgrow it, the website only talks to the backend through `kcm-api.js`, so moving to Supabase or a server means replacing the Apps Script, not the pages.

## Testing locally without Google

```bash
node backend/dev/mock-server.js          # runs Code.gs with in-memory Google services on :8787
# then run the site with:  Site__ApiUrl=http://127.0.0.1:8787
```

Emails, including sign-in codes, are printed in the console and listed at `http://127.0.0.1:8787/__mail`.
