/**
 * KCM Travel & Tours — pilot backend (Google Apps Script + Google Sheets)
 * ----------------------------------------------------------------------
 * The Google Sheet this script is attached to is the pilot database.
 * Deploy as a Web app (Execute as: Me · Who has access: Anyone) and paste the
 * /exec URL into the website settings (Site:ApiUrl). See backend/SETUP.md.
 *
 * Files (paste them into one Apps Script project, or paste dist/KCM-Backend.gs which combines them):
 *   Vendor.gs (crypto library) · Security.gs · Pricing.gs (generated) · Code.gs (this) · Ops.gs (Operations Centre)
 *
 * Security notes
 *  - No secrets live in these files. Settings and keys live in Script Properties.
 *  - Passwords: Argon2id (Security.gs). Privileged roles must use an authenticator app (TOTP MFA).
 *  - The script issues its own session token; only a SHA-256 hash is stored.
 *  - Every protected action checks a permission server-side (PERMS in Security.gs).
 *  - Partner photos and documents are stored privately in Drive; identity documents are only
 *    served to the partner who uploaded them and to staff allowed to review partners.
 */

const APP = {
  name: 'KCM Travel & Tours',
  version: '1.4.0',
  sessionDays: 7,
  privilegedSessionHours: 12,
  codeMinutes: 15,
  maxPhotoBytes: 4 * 1024 * 1024,
  maxDocBytes: 6 * 1024 * 1024,
  maxPhotosPerApplication: 30,
};


const TABS = {
  Users: ['Email', 'Name', 'Role', 'Status', 'Provider', 'Picture', 'Created', 'LastLogin', 'InvitedBy', 'PasswordHash', 'PasswordSalt', 'MfaSecret', 'MfaEnabledAt', 'RecoveryCodes'],
  Partners: ['ID', 'Created', 'Email', 'ContactName', 'Phone', 'BusinessName', 'PartnerType', 'Province', 'City',
    'Services', 'Description', 'RegNumber', 'Website', 'Social', 'YearsInBusiness', 'Summary', 'Details',
    'Status', 'PhotoCount', 'DriveFolderId', 'ReviewedBy', 'ReviewedAt', 'ReviewNote', 'Updated', 'Tier'],
  Photos: ['ID', 'PartnerID', 'Label', 'FileID', 'FileName', 'Uploaded', 'UploadedBy', 'Kind'],
  Bookings: ['Reference', 'Created', 'Tour', 'StartDate', 'Nights', 'Adults', 'Children', 'Infants', 'Pensioners',
    'Room', 'Extras', 'Payment', 'EstimatedTotal', 'Name', 'Email', 'Phone', 'Notes', 'Status', 'Source', 'TicketRef', 'ClientEstimate'],
  Messages: ['Created', 'Name', 'Email', 'Phone', 'Message', 'Status'],
  Jobs: ['JobID', 'Date', 'PartnerID', 'BookingRef', 'Service', 'Guests', 'Gross', 'CommissionPct', 'Payout', 'PayoutStatus', 'PaidOn', 'Notes', 'CreatedBy'],
  Ratings: ['ID', 'Created', 'PartnerID', 'BookingRef', 'GuestName', 'Stars', 'Comment', 'Status'],
  Activity: ['Time', 'Actor', 'Action', 'Target', 'Details'],
  Sessions: ['TokenHash', 'Email', 'Created', 'Expires', 'MFA'],
  Codes: ['Email', 'CodeHash', 'Expires', 'Attempts'],
};

/** required = photos; documents = proof the business/asset belongs to the applicant (private, staff-only). */
const PARTNER_TYPES = {
  vehicle: { label: 'Vehicle owner (car hire & transfers)', required: ['Front', 'Rear', 'Left side', 'Right side', 'Dashboard & front seats', 'Rear seats', 'Boot'],
    documents: ['Vehicle registration certificate', 'ID or driver\'s licence'] },
  accommodation: { label: 'Accommodation (hotel, lodge, B&B, guesthouse)', required: ['Exterior', 'Bedroom', 'Bathroom', 'Lounge or common area'],
    documents: ['Proof of ownership or lease', 'ID of owner or director'] },
  tour_operator: { label: 'Tour operator or travel agency', required: ['Logo', 'Vehicle or fleet'], documents: ['Business registration (CIPC)'] },
  guide: { label: 'Tour guide', required: ['Profile photo'], documents: ['Guide registration certificate'] },
  activity: { label: 'Activity provider', required: ['Activity photo', 'Safety equipment'], documents: ['Business registration or ID'] },
  other: { label: 'Other service', required: ['Photo of your service'], documents: ['Business registration or ID'] },
};

const STATUSES = ['Uploading', 'Pending', 'In review', 'Needs info', 'Approved', 'Rejected'];
const TIERS = ['Premium', 'Premium Plus', 'Signature'];
const PAYOUT_STATUSES = ['Pending', 'Approved', 'Paid', 'On hold'];
const BOOKING_STATUSES = ['New', 'Contacted', 'Confirmed', 'Paid', 'Completed', 'Cancelled'];

/* =====================================================================
 * Web entry points
 * ===================================================================== */

function doGet() {
  return json_({ ok: true, data: { name: APP.name, version: APP.version, googleSignIn: !!prop_('GOOGLE_CLIENT_ID') } });
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Bad request' });
  }
  const action = String(body.action || '');
  const handler = ACTIONS[action];
  if (!handler) return json_({ ok: false, error: 'Unknown action' });
  try {
    return json_({ ok: true, data: handler(body) });
  } catch (err) {
    const msg = err && err.userMessage ? err.userMessage : 'Something went wrong. Please try again.';
    if (!(err && err.userMessage)) console.error(action, err && err.stack || err);
    return json_({ ok: false, error: msg, code: err && err.code || 'error' });
  }
}

const ACTIONS = {
  // public
  ping: () => ({ name: APP.name, version: APP.version, googleSignIn: !!prop_('GOOGLE_CLIENT_ID') }),
  requestCode: requestCode_,
  signIn: signIn_,
  resetPassword: resetPassword_,
  registerPartner: registerPartner_,
  verifyCode: verifyCode_,
  googleSignIn: googleSignIn_,
  mfaVerify: mfaVerify_,
  mfaSetupConfirm: mfaSetupConfirm_,
  submitBooking: submitBooking_,
  submitMessage: submitMessage_,
  ratingInfo: ratingInfo_,
  submitRating: submitRating_,
  // signed in
  me: b => publicUser_(requireUser_(b.token)),
  signOut: signOut_,
  partnerTypes: () => PARTNER_TYPES,
  submitApplication: submitApplication_,
  uploadPhoto: uploadPhoto_,
  finalizeApplication: finalizeApplication_,
  myApplications: myApplications_,
  getPhoto: getPhoto_,
  partnerDashboard: partnerDashboard_,
  // staff
  dashboard: dashboard_,
  listApplications: listApplications_,
  getApplication: getApplication_,
  reviewApplication: reviewApplication_,
  listBookings: listBookings_,
  updateBooking: updateBooking_,
  listMessages: listMessages_,
  listUsers: listUsers_,
  saveUser: saveUser_,
  resetUserMfa: resetUserMfa_,
  activity: activity_,
  listJobs: listJobs_,
  saveJob: saveJob_,
  setPayoutStatus: setPayoutStatus_,
  listRatings: listRatings_,
  setRatingStatus: setRatingStatus_,
};

/* =====================================================================
 * Authentication
 * ===================================================================== */

function requestCode_(b) {
  const email = cleanEmail_(b.email);
  const cache = CacheService.getScriptCache();
  const key = 'code-rate:' + email;
  const count = Number(cache.get(key) || 0);
  if (count >= 5) throw userError_('Too many codes requested. Please wait 15 minutes and try again.');
  cache.put(key, String(count + 1), 15 * 60);

  const code = String(100000 + randomInt_(900000));
  withLock_(() => {
    const sh = sheet_('Codes');
    deleteRowsWhere_(sh, r => r[0] === email);
    sh.appendRow([email, hash_(code + ':' + email), new Date(Date.now() + APP.codeMinutes * 60000), 0]);
  });
  sendMail_(email, `Your ${APP.name} sign-in code: ${code}`,
    `<p>Hi,</p><p>Your sign-in code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
     <p>It expires in ${APP.codeMinutes} minutes. If you didn't ask for this code, you can ignore this email.</p>`);
  return { sent: true };
}

function verifyCode_(b) {
  const email = cleanEmail_(b.email);
  verifyCodeOnly_(email, b.code);
  return finishLogin_(email, { provider: 'email', name: b.name });
}

function verifyCodeOnly_(email, rawCode) {
  const code = String(rawCode || '').replace(/\D/g, '');
  let ok = false;
  withLock_(() => {
    const sh = sheet_('Codes');
    const rows = sh.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] !== email) continue;
      const expired = new Date(rows[i][2]).getTime() < Date.now();
      const attempts = Number(rows[i][3] || 0);
      if (expired || attempts >= 5) { sh.deleteRow(i + 1); break; }
      if (rows[i][1] === hash_(code + ':' + email)) { ok = true; sh.deleteRow(i + 1); }
      else sh.getRange(i + 1, 4).setValue(attempts + 1);
      break;
    }
  });
  if (!ok) throw userError_('That code is wrong or has expired. Please request a new one.');
}

function googleSignIn_(b) {
  const clientId = prop_('GOOGLE_CLIENT_ID');
  if (!clientId) throw userError_('Google sign-in is not set up yet. Please use the email code option.');
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(b.credential || '')), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw userError_('Google sign-in failed. Please try again.');
  const info = JSON.parse(res.getContentText());
  const issuerOk = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
  if (info.aud !== clientId || !issuerOk || String(info.email_verified) !== 'true' || Number(info.exp) * 1000 < Date.now()) {
    throw userError_('Google sign-in could not be verified.');
  }
  return finishLogin_(cleanEmail_(info.email), { provider: 'google', name: info.name, picture: info.picture });
}

/* ---------- passwords (hashing lives in Security.gs) ---------- */
function pepper_() {
  const props = PropertiesService.getScriptProperties();
  let p = props.getProperty('PASSWORD_PEPPER');
  if (!p) { p = randomToken_(); props.setProperty('PASSWORD_PEPPER', p); }
  return p;
}
function checkPassword_(password) {
  const pw = String(password || '');
  if (pw.length < 10 || pw.length > 128) throw userError_('Your password must be at least 10 characters.');
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) throw userError_('Use letters and at least one number in your password.');
  if (/^(password|kcm|admin|qwerty|123456)/i.test(pw)) throw userError_('Please choose a less common password.');
  return pw;
}
function setPassword_(email, password) {
  const h = newPasswordHash_(password);
  setUserFields_(email, { PasswordHash: h.hash, PasswordSalt: h.scheme });
}
function loginRateLimit_(email) {
  const cache = CacheService.getScriptCache();
  const key = 'login-rate:' + email;
  const n = Number(cache.get(key) || 0);
  if (n >= 8) throw userError_('Too many sign-in attempts. Please wait 15 minutes, or reset your password.');
  cache.put(key, String(n + 1), 15 * 60);
  // global brake against password spraying across many accounts (Apps Script cannot see client IPs)
  const g = 'login-global:' + Math.floor(Date.now() / 60000);
  const gn = Number(cache.get(g) || 0);
  if (gn >= 60) throw userError_('Sign-in is busy. Please try again in a minute.');
  cache.put(g, String(gn + 1), 120);
}

/** Email + password sign-in. Partners can only sign in once an application has been approved (or we asked them for more info). */
function signIn_(b) {
  const email = cleanEmail_(b.email);
  loginRateLimit_(email);
  const user = findUser_(email);
  const wrong = userError_('That email or password is incorrect. First time signing in? Use "Forgot or set password".');
  const password = String(b.password || '').slice(0, 128);
  if (!user || !user.PasswordHash) { if (!user) argonHash_(password, randomBytes_(16), false); throw wrong; } // same work either way (timing)
  if (!verifyPassword_(user, password)) { log_(email, 'sign_in_failed', email, ''); throw wrong; }
  CacheService.getScriptCache().remove('login-rate:' + email);
  if (String(user.PasswordHash).indexOf('$argon2id$') !== 0) { setPassword_(email, password); log_(email, 'password_rehashed', email, 'argon2id'); }
  return finishLogin_(email, { provider: 'password' });
}

/** Forgot / first-time password: verify the emailed code, then save the new password and sign in. */
function resetPassword_(b) {
  const email = cleanEmail_(b.email);
  const password = checkPassword_(b.password);
  verifyCodeOnly_(email, b.code);
  if (!findUser_(email)) throw userError_('We couldn\'t find an account for that email. New partners: please register first.');
  setPassword_(email, password);
  revokeSessions_(email); // a password reset signs out every other device
  log_(email, 'password_set', email, '');
  return finishLogin_(email, { provider: 'password' });
}

/** Who may open a session. Pending partners get a clear status message instead of a session. */
function accessGate_(user) {
  if (user.Status === 'disabled') throw userError_('This account has been disabled. Please contact KCM Travel & Tours.');
  if (roleOf_(user) !== 'PARTNER' || user.Status === 'active') return;
  const apps = readTable_('Partners').filter(p => p.Email === user.Email);
  if (apps.some(p => p.Status === 'Approved' || p.Status === 'Needs info')) return;
  if (apps.length && apps.every(p => p.Status === 'Rejected')) throw userError_('Your application was not approved. Please check your email for feedback, or contact us on WhatsApp.', 'pending');
  throw userError_('Thanks! Your application is still being reviewed. You can sign in as soon as it\'s approved, and we\'ll email you then.', 'pending');
}

/** Only called after every required factor has been checked (finishLogin_ in Security.gs, or registration). */
function startSession_(email, opts) {
  const user = findUser_(email) || upsertUser_(email, opts);
  const token = randomToken_();
  const ms = needsMfa_(user) ? APP.privilegedSessionHours * 3600000 : APP.sessionDays * 86400000;
  withLock_(() => {
    const sh = sheet_('Sessions');
    deleteRowsWhere_(sh, r => new Date(r[3]).getTime() < Date.now()); // tidy expired sessions
    sh.appendRow([hash_(token), email, new Date(), new Date(Date.now() + ms), opts.mfa ? 'yes' : '']);
  });
  log_(email, 'sign_in', email, (opts.provider || '') + (opts.mfa ? ' + MFA' : ''));
  return { token, user: publicUser_(user) };
}

function signOut_(b) {
  const h = hash_(String(b.token || ''));
  withLock_(() => deleteRowsWhere_(sheet_('Sessions'), r => r[0] === h));
  CacheService.getScriptCache().remove('sess:' + h);
  return { signedOut: true };
}

/** allowPending: a newly registered partner may finish uploading and submit before approval, nothing else. */
function requireUser_(token, allowPending) {
  if (!token) throw userError_('Please sign in.', 'auth');
  const h = hash_(String(token));
  const cache = CacheService.getScriptCache();
  let sess = cache.get('sess:' + h);
  if (!sess) {
    const rows = sheet_('Sessions').getDataRange().getValues();
    const row = rows.find((r, i) => i > 0 && r[0] === h && new Date(r[3]).getTime() > Date.now());
    if (!row) throw userError_('Your session has expired. Please sign in again.', 'auth');
    sess = row[1] + '|' + (row[4] === 'yes' ? 'mfa' : '') + '|' + new Date(row[3]).getTime();
    cache.put('sess:' + h, sess, 300);
  }
  const [email, mfa, expires] = sess.split('|');
  if (Number(expires) < Date.now()) throw userError_('Your session has expired. Please sign in again.', 'auth');
  const user = findUser_(email);
  if (!user || user.Status === 'disabled') throw userError_('Please sign in.', 'auth');
  // a session opened before the user became privileged (or without MFA) cannot use a privileged role
  if (needsMfa_(user) && mfa !== 'mfa') throw userError_('Please sign in again with your authenticator app.', 'auth');
  if (user.Status === 'pending' && !allowPending) accessGate_(user);
  return user;
}


/* =====================================================================
 * Users & access
 * ===================================================================== */

function findUser_(email) {
  return readTable_('Users').find(u => u.Email === email) || null;
}

function upsertUser_(email, opts) {
  opts = opts || {};
  const owner = String(prop_('OWNER_EMAIL') || '').toLowerCase();
  let result;
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === email);
    const now = new Date();
    if (idx === -1) {
      const role = email === owner ? 'SUPER_ADMIN' : (opts.role || 'PARTNER');
      const row = [email, safe_(opts.name || ''), role, opts.status || 'active', opts.provider || '', safe_(opts.picture || ''), now, now, '', '', '', '', '', ''];
      sh.appendRow(row);
      result = rowToObj_(TABS.Users, row);
    } else {
      const r = rows[idx];
      if (email === owner && roleOf_({ Role: r[2] }) !== 'SUPER_ADMIN') r[2] = 'SUPER_ADMIN';
      if (!r[1] && opts.name) r[1] = safe_(opts.name);
      if (opts.picture) r[5] = safe_(opts.picture);
      if (opts.provider) r[4] = opts.provider;
      r[7] = now;
      sh.getRange(idx + 1, 1, 1, r.length).setValues([r]);
      result = rowToObj_(TABS.Users, r);
    }
  });
  return result;
}

/** What the browser may know about a user. Never includes hashes, secrets or recovery codes. */
function publicUser_(u) {
  return { email: u.Email, name: u.Name || '', role: roleOf_(u), picture: u.Picture || '', isStaff: isStaff_(u), canEdit: can_(u, 'partners.review'),
    permissions: permissionsOf_(u), mfaRequired: needsMfa_(u), mfaEnabled: !!u.MfaSecret };
}

function listUsers_(b) {
  requirePerm_(b.token, 'users.view');
  return readTable_('Users').map(u => ({ email: u.Email, name: u.Name, role: roleOf_(u), status: u.Status, provider: u.Provider, created: iso_(u.Created), lastLogin: iso_(u.LastLogin), invitedBy: u.InvitedBy, mfa: !!u.MfaSecret }));
}

/** Invite a new user or change an existing user's role/status. Only the super admin manages admins; nobody changes their own access. */
function saveUser_(b) {
  const actor = requirePerm_(b.token, 'users.manage');
  const email = cleanEmail_(b.email);
  const role = LEGACY_ROLES[String(b.role)] || String(b.role || 'OPERATIONS').toUpperCase();
  const status = String(b.status || 'active');
  if (ALL_ROLES.indexOf(role) === -1 || ['active', 'disabled'].indexOf(status) === -1) throw userError_('Invalid role or status.');
  if (email === actor.Email) throw userError_('You cannot change your own access.');
  if (role === 'SUPER_ADMIN') throw userError_('The super admin role cannot be assigned here.');
  const target = findUser_(email);
  if (target && roleOf_(target) === 'SUPER_ADMIN') throw userError_('The super admin account cannot be changed.');
  if (roleOf_(actor) !== 'SUPER_ADMIN' && (role === 'ADMIN' || (target && roleOf_(target) === 'ADMIN'))) throw userError_('Only the super admin can add or change admins.');

  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === email);
    if (idx === -1) {
      sh.appendRow([email, safe_(b.name || ''), role, status, 'invited', '', new Date(), '', actor.Email, '', '']);
    } else {
      sh.getRange(idx + 1, 3, 1, 2).setValues([[role, status]]);
      if (b.name) sh.getRange(idx + 1, 2).setValue(safe_(b.name));
    }
  });
  if (target && (roleOf_(target) !== role || status === 'disabled')) revokeSessions_(email); // role changes apply immediately
  log_(actor.Email, target ? 'user_updated' : 'user_invited', email, (target ? roleOf_(target) + ' → ' : '') + role + ' / ' + status);
  if (!target && STAFF_ROLES.indexOf(role) !== -1) {
    sendMail_(email, `You've been given access to ${APP.name}`,
      `<p>Hi${b.name ? ' ' + esc_(b.name) : ''},</p><p>${esc_(actor.Name || actor.Email)} has given you <strong>${role}</strong> access to the ${APP.name} admin dashboard.</p>
       <p>Go to the website, click <strong>Sign in</strong>, then <strong>Forgot or set password</strong> to create your password with this email address (${esc_(email)}).${MFA_ROLES.indexOf(role) !== -1 ? ' You\'ll also be asked to set up an authenticator app (such as Google Authenticator or Microsoft Authenticator) on your phone.' : ''}</p>${siteLink_('/admin', 'Open the admin dashboard')}`);
  }
  return { saved: true };
}

/* =====================================================================
 * Partner applications
 * ===================================================================== */

/** Public: new partner fills in the whole form, chooses a password and submits. Creates a pending account + the application. */
function registerPartner_(b) {
  if (b.website) throw userError_('Something went wrong. Please try again.'); // honeypot
  publicRateLimit_();
  const a = b.account || {};
  const email = cleanEmail_(a.email);
  const password = checkPassword_(a.password);
  const owner = String(prop_('OWNER_EMAIL') || '').toLowerCase();
  if (email === owner || findUser_(email)) throw userError_('This email is already registered. Please sign in to add another business, or use "Forgot or set password".', 'exists');
  const name = safe_(a.name || (b.application || {}).contactName || '');
  upsertUser_(email, { name, provider: 'password', status: 'pending' });
  setPassword_(email, password);
  const session = startSession_(email, { provider: 'password', registering: true }); // pending partner: may only upload + submit
  const app = createApplication_(findUser_(email), b.application || {});
  log_(email, 'partner_registered', app.id, name);
  return Object.assign(app, { token: session.token });
}

function submitApplication_(b) {
  return createApplication_(requireUser_(b.token), b.application || {});
}

function createApplication_(user, d) {
  const type = String(d.partnerType || '');
  if (!PARTNER_TYPES[type]) throw userError_('Please choose what kind of partner you are.');
  const need = ['contactName', 'phone', 'businessName', 'province', 'city', 'description'];
  need.forEach(k => { if (!String(d[k] || '').trim()) throw userError_('Please complete all required fields.'); });

  const id = 'P-' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyMM') + '-' + randomCode_(4);
  const details = sanitizeDetails_(d.details || {});
  const folder = partnersFolder_().createFolder(id + ' · ' + String(d.businessName).slice(0, 60));
  const now = new Date();
  const row = [id, now, user.Email, safe_(d.contactName), safe_(d.phone), safe_(d.businessName), type, safe_(d.province), safe_(d.city),
    safe_((d.services || []).join(', ')), safe_(d.description, 2000), safe_(d.regNumber), safe_(d.website), safe_(d.social), safe_(d.years),
    safe_(summary_(type, details), 500), JSON.stringify(details), 'Uploading', 0, folder.getId(), '', '', '', now];
  withLock_(() => sheet_('Partners').appendRow(row));
  if (!user.Name && d.contactName) upsertUser_(user.Email, { name: d.contactName });
  log_(user.Email, 'application_started', id, PARTNER_TYPES[type].label);
  return { id, required: PARTNER_TYPES[type].required, documents: PARTNER_TYPES[type].documents };
}

function uploadPhoto_(b) {
  const user = requireUser_(b.token, true);
  const app = findApplication_(b.id);
  if (!app) throw userError_('Application not found.');
  const isOwner = app.row.Email === user.Email;
  if (!isOwner && !can_(user, 'partners.review')) throw userError_('You do not have access to this.', 'forbidden');
  if (['Uploading', 'Pending', 'In review', 'Needs info'].indexOf(app.row.Status) === -1) throw userError_('Photos can no longer be added to this application.');
  if (Number(app.row.PhotoCount || 0) >= APP.maxPhotosPerApplication) throw userError_('You have reached the maximum number of files.');

  const isDoc = b.kind === 'document';
  const m = String(b.dataUrl || '').match(isDoc ? /^data:(image\/(jpeg|png|webp)|application\/(pdf));base64,(.+)$/ : /^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!m) throw userError_(isDoc ? 'Please upload the document as a PDF or a photo (JPG or PNG).' : 'Please upload a JPG, PNG or WebP image.');
  const bytes = Utilities.base64Decode(m[m.length - 1]);
  if (bytes.length > (isDoc ? APP.maxDocBytes : APP.maxPhotoBytes)) throw userError_(isDoc ? 'That document is too large (max 6 MB).' : 'That photo is too large. Please use a smaller image.');
  if (!fileMatchesType_(bytes, m[1])) throw userError_('That file does not look like a real ' + (m[1] === 'application/pdf' ? 'PDF' : 'image') + '. Please upload the original file.');
  const label = safe_(b.label || (isDoc ? 'Document' : 'Photo'), 60);
  const ext = m[3] === 'pdf' ? 'pdf' : m[2] === 'jpeg' ? 'jpg' : m[2];
  const name = (isDoc ? 'DOC ' : '') + label.replace(/[^\w &-]/g, '') + '.' + ext;
  const file = DriveApp.getFolderById(app.row.DriveFolderId).createFile(Utilities.newBlob(bytes, m[1], name));
  const photoId = 'F-' + randomCode_(8);
  withLock_(() => {
    sheet_('Photos').appendRow([photoId, app.row.ID, label, file.getId(), name, new Date(), user.Email, isDoc ? 'document' : 'photo']);
    const fresh = findApplication_(b.id);
    sheet_('Partners').getRange(fresh.index, TABS.Partners.indexOf('PhotoCount') + 1).setValue(Number(fresh.row.PhotoCount || 0) + 1);
  });
  return { photoId, label, kind: isDoc ? 'document' : 'photo' };
}

function finalizeApplication_(b) {
  const user = requireUser_(b.token, true);
  const app = findApplication_(b.id);
  if (!app || app.row.Email !== user.Email) throw userError_('Application not found.');
  const files = photosFor_(app.row.ID);
  const labels = files.filter(p => p.Kind !== 'document').map(p => p.Label);
  const docs = files.filter(p => p.Kind === 'document').map(p => p.Label);
  const t = PARTNER_TYPES[app.row.PartnerType];
  const missing = t.required.filter(r => labels.indexOf(r) === -1);
  if (missing.length) throw userError_('Please add these photos first: ' + missing.join(', '));
  const missingDocs = (t.documents || []).filter(r => docs.indexOf(r) === -1);
  if (missingDocs.length) throw userError_('Please add these documents first: ' + missingDocs.join(', '));
  const wasNeedsInfo = app.row.Status === 'Needs info';
  setApplicationFields_(app.index, { Status: 'Pending', Updated: new Date() });
  log_(user.Email, wasNeedsInfo ? 'application_resubmitted' : 'application_submitted', app.row.ID, app.row.BusinessName);

  sendMail_(user.Email, `We've received your partner application (${app.row.ID})`,
    `<p>Hi ${esc_(app.row.ContactName)},</p><p>Thank you for applying to partner with ${APP.name}. Your application <strong>${app.row.ID}</strong> for <strong>${esc_(app.row.BusinessName)}</strong> is now with our team.</p>
     <p>We review every partner carefully, including the photos and documents, and usually reply within 3 working days. Once you're approved you can sign in with this email address and the password you chose.</p>`);
  whatsapp_(`${wasNeedsInfo ? '🔁 Partner application updated' : '🆕 New partner application'} (${app.row.ID})\n${app.row.BusinessName}\n${t.label}\n${app.row.City}, ${app.row.Province}\nContact: ${app.row.ContactName} · ${app.row.Phone}\n${files.length} photos & documents\n\nReview it: ${siteUrl_('/admin#applications/' + app.row.ID)}`);
  staffEmails_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT']).forEach(to => sendMail_(to, `New partner application: ${app.row.BusinessName}`,
    `<p>A new ${esc_(PARTNER_TYPES[app.row.PartnerType].label.toLowerCase())} application is waiting for review.</p>
     <p><strong>${esc_(app.row.BusinessName)}</strong> · ${esc_(app.row.City)}, ${esc_(app.row.Province)}<br>${esc_(app.row.Summary)}</p>${siteLink_('/admin#applications', 'Review it in the dashboard')}`));
  return { status: 'Pending' };
}

function myApplications_(b) {
  const user = requireUser_(b.token);
  return readTable_('Partners').filter(p => p.Email === user.Email).map(p => applicationView_(p, true));
}

function listApplications_(b) {
  requirePerm_(b.token, 'partners.view');
  return readTable_('Partners').map(p => applicationView_(p, false)).reverse();
}

function getApplication_(b) {
  const user = requireUser_(b.token);
  const app = findApplication_(b.id);
  if (!app) throw userError_('Application not found.');
  const own = app.row.Email === user.Email;
  if (!own && !can_(user, 'partners.view')) throw userError_('You do not have access to this.', 'forbidden');
  if (app.row.Status === 'Pending' && can_(user, 'partners.review')) {
    setApplicationFields_(app.index, { Status: 'In review', ReviewedBy: user.Email, Updated: new Date() });
    app.row.Status = 'In review'; app.row.ReviewedBy = user.Email;
    log_(user.Email, 'application_opened', app.row.ID, app.row.BusinessName);
  }
  const view = applicationView_(app.row, true);
  const files = photosFor_(app.row.ID).map(p => ({ id: p.ID, label: p.Label, fileId: p.FileID, uploaded: iso_(p.Uploaded), kind: p.Kind || 'photo', name: p.FileName }));
  view.photos = files.filter(f => f.kind !== 'document');
  // identity / ownership documents: only the applicant and partner reviewers
  view.documents = own || can_(user, 'partners.review') ? files.filter(f => f.kind === 'document') : [];
  return view;
}

function getPhoto_(b) {
  const user = requireUser_(b.token);
  const photo = readTable_('Photos').find(p => p.FileID === b.fileId);
  if (!photo) throw userError_('Photo not found.');
  const app = findApplication_(photo.PartnerID);
  const own = app && app.row.Email === user.Email;
  const allowed = own || (photo.Kind === 'document' ? can_(user, 'partners.review') : can_(user, 'partners.view'));
  if (!allowed) throw userError_('You do not have access to this.', 'forbidden');
  if (photo.Kind === 'document' && !own) log_(user.Email, 'document_viewed', photo.PartnerID, photo.Label); // audit access to ID documents
  const blob = DriveApp.getFileById(photo.FileID).getBlob();
  return { dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
}

function reviewApplication_(b) {
  const actor = requirePerm_(b.token, 'partners.review');
  const app = findApplication_(b.id);
  if (!app) throw userError_('Application not found.');
  const decision = { approve: 'Approved', reject: 'Rejected', needs_info: 'Needs info' }[b.decision];
  if (!decision) throw userError_('Invalid decision.');
  const note = safe_(b.note || '', 1000);
  if (decision !== 'Approved' && !note) throw userError_('Please add a note for the partner.');
  const tier = decision === 'Approved' ? (TIERS.indexOf(b.tier) !== -1 ? b.tier : 'Premium') : '';
  const fields = { Status: decision, ReviewedBy: actor.Email, ReviewedAt: new Date(), ReviewNote: note, Updated: new Date() };
  if (tier) fields.Tier = tier;
  setApplicationFields_(app.index, fields);
  if (decision === 'Approved') activateUser_(app.row.Email);
  log_(actor.Email, 'application_' + b.decision, app.row.ID, note);

  const p = app.row;
  const bodies = {
    Approved: `<p>Hi ${esc_(p.ContactName)},</p><p>Good news: <strong>${esc_(p.BusinessName)}</strong> has been <strong>approved</strong> as a ${APP.name} <strong>${tier}</strong> partner (${p.ID}).</p>
      ${note ? `<p>${esc_(note)}</p>` : ''}<p>You can now <strong>sign in with your email address and the password you chose</strong> when you registered to see your partner portal: your listings, trips, payouts, statements and guest ratings.</p>
      <p>Our team will contact you about next steps, including confirming your banking details for payments. Welcome aboard!</p>${siteLink_('/account', 'Sign in to your partner portal')}`,
    Rejected: `<p>Hi ${esc_(p.ContactName)},</p><p>Thank you for applying to partner with ${APP.name}. After reviewing <strong>${esc_(p.BusinessName)}</strong> (${p.ID}), we are not able to approve the application at this time.</p>
      <p><strong>Feedback:</strong> ${esc_(note)}</p><p>You're welcome to apply again in future.</p>`,
    'Needs info': `<p>Hi ${esc_(p.ContactName)},</p><p>We're reviewing <strong>${esc_(p.BusinessName)}</strong> (${p.ID}) and need a little more from you:</p>
      <p><strong>${esc_(note)}</strong></p><p>Sign in with your email and password to add the photos or documents, then resubmit.</p>${siteLink_('/account', 'Update your application')}`,
  };
  const subjects = { Approved: `You're approved! Welcome to ${APP.name}`, Rejected: `Update on your ${APP.name} application`, 'Needs info': `We need a bit more information (${p.ID})` };
  sendMail_(p.Email, subjects[decision], bodies[decision]);
  return { status: decision };
}

/* =====================================================================
 * Bookings & messages (from the public website)
 * ===================================================================== */

/**
 * Public: website booking form and Kaycee chat. Everything from the browser is untrusted:
 * fields are validated and length-limited, the price is recalculated here (priceQuote_ in Pricing.gs),
 * the reference is generated here, and a retry with the same idempotency key returns the same ticket.
 */
function submitBooking_(b) {
  if (b.website) return { saved: true }; // honeypot
  publicRateLimit_();
  const d = b.booking || {};
  const idem = String(b.idempotencyKey || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
  const cache = CacheService.getScriptCache();
  if (idem) { const prev = cache.get('idem:booking:' + idem); if (prev) return JSON.parse(prev); }

  const name = safe_(d.name, 80), phone = safe_(d.phone, 30), email = String(d.email || '').trim().toLowerCase().slice(0, 120);
  if (!name) throw userError_('Please add your name.');
  if (!email && !phone) throw userError_('Please add your email or cell number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw userError_('Please check your email address.');
  if (phone && !/^[0-9 +()-]{9,20}$/.test(phone)) throw userError_('Please check your cell number.');
  if (d.consent !== true) throw userError_('Please agree to the privacy notice so we can contact you.');
  const source = d.source === 'chat' ? 'chat' : 'website';
  const est = priceQuote_({ tourSlug: d.tourSlug, tour: d.tour, nights: d.nights, adults: d.adults, children: d.children, infants: d.infants,
    pensioners: d.pensioners, room: d.room, extras: d.extraCodes, payment: d.payment });
  const tourTitle = est ? est.title : safe_(d.tour, 120) || 'Trip enquiry';
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(d.startDate || '')) ? String(d.startDate) : '';
  const k = d.kaycee && typeof d.kaycee === 'object' ? d.kaycee : {};

  const ticket = opsCreateTicketFromPublic_({
    source: source === 'chat' ? 'Kaycee AI' : 'Website booking form',
    customer: { name, email, phone, consentSource: source === 'chat' ? 'Kaycee chat' : 'Website booking form' },
    package: tourTitle, packageSlug: est ? est.slug : '', destination: safe_(k.region, 60), activities: safe_(k.style, 80),
    departDate: startDate, nights: est ? est.nights : num_(d.nights), adults: num_(d.adults), children: num_(d.children), infants: num_(d.infants), pensioners: num_(d.pensioners),
    rooms: safe_(d.room, 40), extras: est ? est.extras : [], budget: safe_(k.budget, 40), paymentPref: safe_(d.payment, 30),
    description: safe_(d.notes, 1500), estimate: est ? est.total : 0, dayTour: est ? est.nights === 0 : false,
  });
  const ref = ticket.ref;
  const row = [ref, new Date(), tourTitle, startDate || safe_(d.startDate, 30), est ? est.nights : num_(d.nights), num_(d.adults), num_(d.children), num_(d.infants), num_(d.pensioners),
    safe_(d.room), safe_((est ? est.extras : []).join(', ')), safe_(d.payment), est ? est.total : 0, name, email, phone, safe_(d.notes, 600), 'New', source, ref, num_(d.total)];
  withLock_(() => sheet_('Bookings').appendRow(row));
  log_(email || phone, 'booking_request', ref, tourTitle + (est && num_(d.total) && num_(d.total) !== est.total ? ' · browser total ignored (R' + num_(d.total) + ' vs R' + est.total + ')' : ''));

  const travellers = num_(d.adults) + num_(d.children) + num_(d.pensioners) + num_(d.infants);
  const q = { reference: ref, tour: tourTitle, startDate: startDate || 'flexible', nights: est ? est.nights : num_(d.nights), room: d.room, extras: est ? est.extras : [], total: est ? est.total : 0, name };
  staffEmails_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT']).forEach(to => sendMail_(to, `New enquiry ${ref}: ${tourTitle}`,
    `<p><strong>${esc_(name)}</strong> (${esc_(phone)}${email ? ', ' + esc_(email) : ''}) asked about <strong>${esc_(tourTitle)}</strong> from ${esc_(q.startDate)} for ${travellers} travellers via ${source === 'chat' ? 'Kaycee' : 'the booking form'}.${est ? ' Website estimate: R' + est.total.toLocaleString('en-ZA') + '.' : ''}</p>${siteLink_('/admin#ticket/' + ref, 'Open the ticket')}`));
  whatsapp_(`🧳 New enquiry ${ref}${source === 'chat' ? ' (via Kaycee)' : ''}\n${tourTitle}\nWhen: ${q.startDate}${q.nights ? ' · ' + q.nights + ' nights' : ''}\nTravellers: ${travellers || '-'}\n${est ? 'Estimate: R' + est.total.toLocaleString('en-ZA') + '\n' : ''}${name} · ${phone}${email ? ' · ' + email : ''}\n\nOpen: ${siteUrl_('/admin#ticket/' + ref)}`);
  if (email) sendMail_(email, `Your KCM trip quote ${ref}`, quoteHtml_(q, travellers));
  const out = { saved: true, reference: ref, estimate: est ? est.total : null, emailed: !!email };
  if (idem) cache.put('idem:booking:' + idem, JSON.stringify(out), 3600);
  return out;
}

/** The quote the traveller receives by email (prices are estimates until a consultant confirms availability). */
function quoteHtml_(d, travellers) {
  const row = (k, v) => v ? `<tr><td style="padding:6px 12px 6px 0;color:#666">${k}</td><td style="padding:6px 0"><strong>${esc_(v)}</strong></td></tr>` : '';
  const total = num_(d.total);
  return `<p>Hi ${esc_(String(d.name || '').split(' ')[0] || 'there')},</p>
    <p>Thanks for planning your trip with KCM Travel &amp; Tours. Here's your quote. A consultant will confirm availability and the final price within one working day.</p>
    <table style="border-collapse:collapse;margin:12px 0">
      ${row('Reference', d.reference)}${row('Trip', d.tour)}${row('Travel date', d.startDate)}${row('Nights', num_(d.nights) ? String(num_(d.nights)) : '')}
      ${row('Travellers', travellers ? String(travellers) : '')}${row('Room', d.room)}${row('Extras', (d.extras || []).join(', '))}
      ${row('Estimated total', total ? 'R' + total.toLocaleString('en-ZA') + ' (estimate)' : 'Your consultant will price this for you')}
    </table>
    <p>Questions or changes? Reply to this email or WhatsApp us on <a href="https://wa.me/27764360010?text=${encodeURIComponent('Hi KCM, about my quote ' + d.reference)}">076 436 0010</a> and quote <strong>${esc_(d.reference)}</strong>.</p>`;
}

function submitMessage_(b) {
  if (b.website) return { saved: true };
  publicRateLimit_();
  const d = b.message || {};
  if (!d.name || !d.message) throw userError_('Missing message details.');
  withLock_(() => sheet_('Messages').appendRow([new Date(), safe_(d.name), safe_(d.email), safe_(d.phone), safe_(d.message, 1500), 'New']));
  whatsapp_(`✉️ New website message from ${d.name}${d.phone ? ' · ' + d.phone : ''}\n${String(d.message).slice(0, 400)}\n\nOpen: ${siteUrl_('/admin#messages')}`);
  return { saved: true };
}

function listBookings_(b) {
  requirePerm_(b.token, 'bookings.view');
  return readTable_('Bookings').map(r => ({
    reference: r.Reference, created: iso_(r.Created), tour: r.Tour, startDate: iso_(r.StartDate) || String(r.StartDate), nights: r.Nights,
    travellers: num_(r.Adults) + num_(r.Children) + num_(r.Infants) + num_(r.Pensioners), adults: r.Adults, children: r.Children,
    room: r.Room, extras: r.Extras, payment: r.Payment, total: num_(r.EstimatedTotal), name: r.Name, email: r.Email, phone: r.Phone, notes: r.Notes, status: r.Status, source: r.Source,
  })).reverse();
}

function updateBooking_(b) {
  const actor = requirePerm_(b.token, 'bookings.update');
  if (BOOKING_STATUSES.indexOf(b.status) === -1) throw userError_('Invalid status.');
  let found = false;
  withLock_(() => {
    const sh = sheet_('Bookings');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === b.reference);
    if (idx > 0) { sh.getRange(idx + 1, TABS.Bookings.indexOf('Status') + 1).setValue(b.status); found = true; }
  });
  if (!found) throw userError_('Booking not found.');
  log_(actor.Email, 'booking_status', b.reference, b.status);
  return { status: b.status };
}

function listMessages_(b) {
  requirePerm_(b.token, 'messages.view');
  return readTable_('Messages').map(m => ({ created: iso_(m.Created), name: m.Name, email: m.Email, phone: m.Phone, message: m.Message, status: m.Status })).reverse();
}

/* =====================================================================
 * Dashboard
 * ===================================================================== */

function dashboard_(b) {
  const user = requirePerm_(b.token, 'dashboard.view');
  const partners = readTable_('Partners').filter(p => p.Status !== 'Uploading');
  const bookings = readTable_('Bookings');
  const users = readTable_('Users');
  const count = (list, key) => list.reduce((acc, x) => { const k = x[key] || 'Unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});

  // applications per week, last 12 weeks
  const weeks = [];
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - start.getDay() - 7 * 11);
  for (let i = 0; i < 12; i++) { const d = new Date(start); d.setDate(d.getDate() + i * 7); weeks.push({ week: iso_(d).slice(0, 10), applications: 0, bookings: 0 }); }
  const weekIndex = date => Math.floor((new Date(date).getTime() - start.getTime()) / (7 * 86400000));
  partners.forEach(p => { const i = weekIndex(p.Created); if (i >= 0 && i < 12) weeks[i].applications++; });
  bookings.forEach(x => { const i = weekIndex(x.Created); if (i >= 0 && i < 12) weeks[i].bookings++; });

  const value = bookings.filter(x => x.Status !== 'Cancelled').reduce((s, x) => s + num_(x.EstimatedTotal), 0);
  const jobs = readTable_('Jobs');
  const ratings = readTable_('Ratings').filter(r => r.Status !== 'Hidden');
  const payoutsPending = jobs.filter(j => j.PayoutStatus !== 'Paid').reduce((s, j) => s + num_(j.Payout), 0);
  const avgRating = ratings.length ? ratings.reduce((s, r) => s + num_(r.Stars), 0) / ratings.length : 0;
  const byTour = {};
  bookings.forEach(x => { byTour[x.Tour] = (byTour[x.Tour] || 0) + num_(x.EstimatedTotal); });

  return {
    you: publicUser_(user),
    kpis: {
      pending: partners.filter(p => p.Status === 'Pending' || p.Status === 'In review').length,
      needsInfo: partners.filter(p => p.Status === 'Needs info').length,
      approved: partners.filter(p => p.Status === 'Approved').length,
      applications: partners.length,
      bookings: bookings.length,
      newBookings: bookings.filter(x => x.Status === 'New').length,
      bookingValue: value,
      users: users.length,
      staff: users.filter(u => isStaff_(u)).length,
      inReview: partners.filter(p => p.Status === 'In review').length,
      trips: jobs.length,
      payoutsPending,
      grossEarned: jobs.reduce((s, j) => s + num_(j.Gross), 0),
      avgRating: Math.round(avgRating * 10) / 10,
      ratings: ratings.length,
    },
    byStatus: count(partners, 'Status'),
    byType: Object.entries(count(partners, 'PartnerType')).reduce((acc, [k, v]) => { acc[(PARTNER_TYPES[k] || {}).label || k] = v; return acc; }, {}),
    byProvince: count(partners, 'Province'),
    bookingsByStatus: count(bookings, 'Status'),
    valueByTour: byTour,
    weekly: weeks,
    recent: readTable_('Activity').slice(-15).reverse().map(a => ({ time: iso_(a.Time), actor: a.Actor, action: a.Action, target: a.Target, details: a.Details })),
    sheetUrl: can_(user, 'users.manage') ? SpreadsheetApp.getActiveSpreadsheet().getUrl() : '',
  };
}

function activity_(b) {
  requirePerm_(b.token, 'audit.view');
  return readTable_('Activity').slice(-300).reverse().map(a => ({ time: iso_(a.Time), actor: a.Actor, action: a.Action, target: a.Target, details: a.Details }));
}

/* =====================================================================
 * Partner portal: trips, payouts and ratings
 * ===================================================================== */

/** Everything a partner sees about their own businesses. Never includes other partners' data. */
function partnerDashboard_(b) {
  const user = requireUser_(b.token);
  const listings = readTable_('Partners').filter(p => p.Email === user.Email);
  const ids = listings.map(p => p.ID);
  const jobs = readTable_('Jobs').filter(j => ids.indexOf(j.PartnerID) !== -1);
  const ratings = readTable_('Ratings').filter(r => ids.indexOf(r.PartnerID) !== -1 && r.Status !== 'Hidden');
  const names = {}; listings.forEach(p => { names[p.ID] = p.BusinessName; });

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ month: Utilities.formatDate(d, 'Africa/Johannesburg', 'yyyy-MM'), trips: 0, payout: 0 }); }
  jobs.forEach(j => {
    const key = Utilities.formatDate(new Date(j.Date), 'Africa/Johannesburg', 'yyyy-MM');
    const m = months.find(x => x.month === key); if (m) { m.trips++; m.payout += num_(j.Payout); }
  });

  const stars = [0, 0, 0, 0, 0];
  ratings.forEach(r => { const s = Math.min(5, Math.max(1, num_(r.Stars))); stars[s - 1]++; });
  const avg = ratings.length ? ratings.reduce((s, r) => s + num_(r.Stars), 0) / ratings.length : 0;

  return {
    listings: listings.map(p => {
      const pj = jobs.filter(j => j.PartnerID === p.ID), pr = ratings.filter(r => r.PartnerID === p.ID);
      const v = applicationView_(p, false);
      v.trips = pj.length; v.earned = pj.reduce((s, j) => s + num_(j.Payout), 0);
      v.rating = pr.length ? Math.round(pr.reduce((s, r) => s + num_(r.Stars), 0) / pr.length * 10) / 10 : 0; v.ratingCount = pr.length;
      return v;
    }),
    totals: {
      trips: jobs.length,
      guests: jobs.reduce((s, j) => s + num_(j.Guests), 0),
      gross: jobs.reduce((s, j) => s + num_(j.Gross), 0),
      paid: jobs.filter(j => j.PayoutStatus === 'Paid').reduce((s, j) => s + num_(j.Payout), 0),
      pending: jobs.filter(j => j.PayoutStatus !== 'Paid').reduce((s, j) => s + num_(j.Payout), 0),
      rating: Math.round(avg * 10) / 10, ratingCount: ratings.length,
    },
    months,
    stars,
    jobs: jobs.map(j => jobView_(j, names)).reverse(),
    ratings: ratings.map(r => ({ created: iso_(r.Created), partnerId: r.PartnerID, business: names[r.PartnerID] || '', guest: r.GuestName, stars: num_(r.Stars), comment: r.Comment })).reverse(),
  };
}

function jobView_(j, names) {
  return {
    id: j.JobID, date: iso_(j.Date), partnerId: j.PartnerID, business: names ? names[j.PartnerID] || '' : '', bookingRef: j.BookingRef, service: j.Service,
    guests: num_(j.Guests), gross: num_(j.Gross), commissionPct: num_(j.CommissionPct), payout: num_(j.Payout), payoutStatus: j.PayoutStatus || 'Pending', paidOn: iso_(j.PaidOn), notes: j.Notes,
  };
}

function listJobs_(b) {
  requirePerm_(b.token, 'payouts.view');
  const names = {}; readTable_('Partners').forEach(p => { names[p.ID] = p.BusinessName; });
  return readTable_('Jobs').map(j => jobView_(j, names)).reverse();
}

/** Record a trip/job done by a partner. Payout = gross minus KCM commission. */
function saveJob_(b) {
  const actor = requirePerm_(b.token, 'payouts.manage');
  const j = b.job || {};
  const partner = findApplication_(j.partnerId);
  if (!partner || partner.row.Status !== 'Approved') throw userError_('Choose an approved partner.');
  const gross = num_(j.gross), pct = Math.min(100, Math.max(0, num_(j.commissionPct === undefined ? 15 : j.commissionPct)));
  if (gross <= 0) throw userError_('Enter the trip value.');
  const date = j.date ? new Date(j.date) : new Date();
  if (isNaN(date.getTime())) throw userError_('Invalid date.');
  const payout = Math.round(gross * (1 - pct / 100));
  const id = 'J-' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyMM') + '-' + randomCode_(4);
  withLock_(() => sheet_('Jobs').appendRow([id, date, partner.row.ID, safe_(j.bookingRef, 30), safe_(j.service, 120), num_(j.guests), gross, pct, payout, 'Pending', '', safe_(j.notes, 300), actor.Email]));
  log_(actor.Email, 'trip_recorded', id, partner.row.BusinessName + ' · R' + gross);
  return { id, payout };
}

function setPayoutStatus_(b) {
  const actor = requirePerm_(b.token, 'payouts.manage');
  if (PAYOUT_STATUSES.indexOf(b.status) === -1) throw userError_('Invalid payout status.');
  let job = null;
  withLock_(() => {
    const sh = sheet_('Jobs');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === b.id);
    if (idx > 0) {
      sh.getRange(idx + 1, TABS.Jobs.indexOf('PayoutStatus') + 1).setValue(b.status);
      sh.getRange(idx + 1, TABS.Jobs.indexOf('PaidOn') + 1).setValue(b.status === 'Paid' ? new Date() : '');
      job = rowToObj_(TABS.Jobs, rows[idx]);
    }
  });
  if (!job) throw userError_('Trip not found.');
  log_(actor.Email, 'payout_' + String(b.status).toLowerCase().replace(/\s/g, '_'), b.id, 'R' + job.Payout);
  if (b.status === 'Paid') {
    const p = findApplication_(job.PartnerID);
    if (p) sendMail_(p.row.Email, `Payout sent: R${num_(job.Payout).toLocaleString('en-ZA')} (${job.JobID})`,
      `<p>Hi ${esc_(p.row.ContactName)},</p><p>We've paid <strong>R${num_(job.Payout).toLocaleString('en-ZA')}</strong> for ${esc_(job.Service || 'your trip')} (${job.JobID}${job.BookingRef ? ', booking ' + esc_(job.BookingRef) : ''}).</p>${siteLink_('/account#payouts', 'View your statement')}`);
  }
  return { status: b.status };
}

/** Public: what the rating page needs to show (no personal data). */
function ratingInfo_(b) {
  const p = findApplication_(String(b.partnerId || ''));
  if (!p || p.row.Status !== 'Approved') throw userError_('This rating link is not valid.');
  const job = readTable_('Jobs').find(j => j.PartnerID === p.row.ID && j.BookingRef === b.bookingRef);
  if (!job) throw userError_('This rating link is not valid.');
  const done = readTable_('Ratings').some(r => r.PartnerID === p.row.ID && r.BookingRef === b.bookingRef);
  return { business: p.row.BusinessName, type: (PARTNER_TYPES[p.row.PartnerType] || {}).label || '', service: job.Service, alreadyRated: done };
}

/** Public: a guest rates a partner after a trip. One rating per booking per partner. */
function submitRating_(b) {
  if (b.website) return { saved: true };
  publicRateLimit_();
  const info = ratingInfo_(b);
  if (info.alreadyRated) throw userError_('Thank you, a rating has already been received for this trip.');
  const stars = Math.round(num_(b.stars));
  if (stars < 1 || stars > 5) throw userError_('Please choose 1 to 5 stars.');
  withLock_(() => sheet_('Ratings').appendRow(['R-' + randomCode_(6), new Date(), b.partnerId, safe_(b.bookingRef, 30), safe_(b.name || 'Guest', 60), stars, safe_(b.comment, 800), 'Published']));
  log_(String(b.name || 'Guest'), 'rating', b.partnerId, stars + ' stars');
  return { saved: true };
}

function listRatings_(b) {
  requireAnyPerm_(b.token, ['partners.view', 'ratings.moderate']);
  const names = {}; readTable_('Partners').forEach(p => { names[p.ID] = p.BusinessName; });
  return readTable_('Ratings').map(r => ({ id: r.ID, created: iso_(r.Created), partnerId: r.PartnerID, business: names[r.PartnerID] || r.PartnerID, bookingRef: r.BookingRef, guest: r.GuestName, stars: num_(r.Stars), comment: r.Comment, status: r.Status })).reverse();
}

function setRatingStatus_(b) {
  const actor = requirePerm_(b.token, 'ratings.moderate');
  if (['Published', 'Hidden'].indexOf(b.status) === -1) throw userError_('Invalid status.');
  let ok = false;
  withLock_(() => {
    const sh = sheet_('Ratings');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === b.id);
    if (idx > 0) { sh.getRange(idx + 1, TABS.Ratings.indexOf('Status') + 1).setValue(b.status); ok = true; }
  });
  if (!ok) throw userError_('Rating not found.');
  log_(actor.Email, 'rating_' + b.status.toLowerCase(), b.id, '');
  return { status: b.status };
}

/* =====================================================================
 * Helpers
 * ===================================================================== */

function applicationView_(p, full) {
  let details = {};
  try { details = JSON.parse(p.Details || '{}'); } catch (e) { /* ignore */ }
  const v = {
    id: p.ID, created: iso_(p.Created), updated: iso_(p.Updated), email: p.Email, contactName: p.ContactName, phone: p.Phone,
    businessName: p.BusinessName, partnerType: p.PartnerType, partnerTypeLabel: (PARTNER_TYPES[p.PartnerType] || {}).label || p.PartnerType,
    province: p.Province, city: p.City, services: p.Services, summary: p.Summary, status: p.Status, photoCount: Number(p.PhotoCount || 0),
    reviewedBy: p.ReviewedBy, reviewedAt: iso_(p.ReviewedAt), reviewNote: p.ReviewNote, tier: p.Tier || '',
    required: (PARTNER_TYPES[p.PartnerType] || {}).required || [],
    requiredDocuments: (PARTNER_TYPES[p.PartnerType] || {}).documents || [],
  };
  if (full) Object.assign(v, { description: p.Description, regNumber: p.RegNumber, website: p.Website, social: p.Social, years: p.YearsInBusiness, details });
  return v;
}

function summary_(type, d) {
  const parts = {
    vehicle: [d.make, d.model, d.year, d.seats ? d.seats + ' seats' : '', d.transmission, d.colour],
    accommodation: [d.propertyType, d.rooms ? d.rooms + ' rooms' : '', d.sleeps ? 'sleeps ' + d.sleeps : '', d.grading, d.rateFrom ? 'from R' + d.rateFrom : ''],
    tour_operator: [d.fleetSize ? d.fleetSize + ' vehicles' : '', d.tourTypes, d.satsa ? 'SATSA ' + d.satsa : ''],
    guide: [d.guideLevel, d.languages, d.regions],
    activity: [d.activityType, d.capacity ? 'up to ' + d.capacity + ' people' : '', d.priceFrom ? 'from R' + d.priceFrom : ''],
    other: [d.serviceType],
  }[type] || [];
  return parts.filter(Boolean).join(' · ');
}

function sanitizeDetails_(d) {
  const out = {};
  Object.keys(d).slice(0, 40).forEach(k => {
    if (!/^[a-zA-Z]{1,30}$/.test(k)) return;
    const v = d[k];
    out[k] = Array.isArray(v) ? v.slice(0, 20).map(x => safe_(x, 80)) : safe_(v, 300);
  });
  return out;
}

function findApplication_(id) {
  const sh = sheet_('Partners');
  const rows = sh.getDataRange().getValues();
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === id);
  return idx > 0 ? { index: idx + 1, row: rowToObj_(TABS.Partners, rows[idx]) } : null;
}

function setApplicationFields_(rowIndex, fields) {
  withLock_(() => {
    const sh = sheet_('Partners');
    Object.keys(fields).forEach(k => sh.getRange(rowIndex, TABS.Partners.indexOf(k) + 1).setValue(fields[k]));
  });
}

function photosFor_(partnerId) {
  return readTable_('Photos').filter(p => p.PartnerID === partnerId);
}

function partnersFolder_() {
  const id = prop_('PARTNER_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recreate below */ } }
  const folder = DriveApp.createFolder('KCM Partner Uploads (private)');
  PropertiesService.getScriptProperties().setProperty('PARTNER_FOLDER_ID', folder.getId());
  return folder;
}

function staffEmails_(roles) {
  return readTable_('Users').filter(u => roles.indexOf(roleOf_(u)) !== -1 && u.Status !== 'disabled' && !/\.test$/.test(u.Email)).map(u => u.Email);
}

/** Checks the file's real signature (magic bytes), not just the type the browser claims. */
function fileMatchesType_(bytes, mime) {
  const b = i => bytes[i] & 255;
  if (mime === 'image/jpeg') return b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF;
  if (mime === 'image/png') return b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47;
  if (mime === 'image/webp') return b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50;
  if (mime === 'application/pdf') return b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46;
  return false;
}

function publicRateLimit_() {
  const cache = CacheService.getScriptCache();
  const key = 'public-rate:' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(key) || 0);
  if (n >= 30) throw userError_('We are receiving a lot of requests. Please try again in a minute or message us on WhatsApp.');
  cache.put(key, String(n + 1), 120);
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readTable_(name) {
  const values = sheet_(name).getDataRange().getValues();
  const headers = TABS[name];
  return values.slice(1).filter(r => r[0] !== '').map(r => rowToObj_(headers, r));
}

function rowToObj_(headers, row) {
  const o = {};
  headers.forEach((h, i) => { o[h] = row[i] === undefined ? '' : row[i]; });
  return o;
}

function deleteRowsWhere_(sh, pred) {
  const rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) if (pred(rows[i])) sh.deleteRow(i + 1);
}

/** One script-wide lock serialises every write (Sheets has no transactions). Re-entrant within one request. */
let LOCK_DEPTH = 0;
function withLock_(fn) {
  if (LOCK_DEPTH > 0) { LOCK_DEPTH++; try { return fn(); } finally { LOCK_DEPTH--; } }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  LOCK_DEPTH = 1;
  try { return fn(); } finally { LOCK_DEPTH = 0; lock.releaseLock(); }
}

/** Append-only audit trail. There is no API to edit or delete Activity rows. */
function log_(actor, action, target, details) {
  try { sheet_('Activity').appendRow([new Date(), safe_(actor), action, safe_(target), safe_(details, 2000)]); } catch (e) { console.error(e); }
}

function sendMail_(to, subject, html) {
  try {
    MailApp.sendEmail({
      to, subject, name: APP.name,
      htmlBody: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0e1512;max-width:560px">${html}
        <hr style="border:0;border-top:1px solid #ddd;margin:24px 0"><p style="font-size:12px;color:#666">${APP.name} · Mbombela, Mpumalanga · 076 436 0010</p></div>`,
    });
  } catch (e) { console.error('Mail failed', to, e); }
}

function activateUser_(email) {
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === email);
    if (idx > 0 && rows[idx][3] === 'pending') sh.getRange(idx + 1, 4).setValue('active');
  });
}

function siteUrl_(path) {
  return String(prop_('SITE_URL') || 'https://mathonsimm.github.io/KCMTravel-Tours').replace(/\/$/, '') + path;
}

/**
 * WhatsApp alerts to the KCM team. Pilot provider: CallMeBot (free). Each number that should get alerts sends
 * "I allow callmebot to send me messages" to CallMeBot once, gets an API key, then is added in the Sheet menu
 * (KCM → WhatsApp alerts). Stored in Script Properties as WHATSAPP_ALERTS = [{"phone":"2776…","apikey":"…"}].
 * Never throws: an alert failing must not block a booking or application (the email alerts still go out).
 */
function whatsapp_(text) {
  let list = [];
  try { list = JSON.parse(prop_('WHATSAPP_ALERTS') || '[]'); } catch (e) { list = []; }
  if (!list.length) return 0;
  const requests = list.map(x => ({
    url: 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(x.phone) + '&text=' + encodeURIComponent(String(text).slice(0, 1500)) + '&apikey=' + encodeURIComponent(x.apikey),
    muteHttpExceptions: true,
  }));
  try {
    const res = UrlFetchApp.fetchAll(requests);
    res.forEach((r, i) => { if (r.getResponseCode() !== 200) console.error('WhatsApp alert failed', list[i].phone, r.getResponseCode(), r.getContentText().slice(0, 200)); });
    return res.filter(r => r.getResponseCode() === 200).length;
  } catch (e) { console.error('WhatsApp alert failed', e); return 0; }
}

function siteLink_(path, label) {
  const base = String(prop_('SITE_URL') || '').replace(/\/$/, '');
  return base ? `<p><a href="${base}${path}" style="display:inline-block;background:#a8481f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">${label}</a></p>` : '';
}

function prop_(key) { return PropertiesService.getScriptProperties().getProperty(key); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function hash_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join(''); }
function randomCode_(n) { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < n; i++) s += c[randomInt_(c.length)]; return s; }
function iso_(v) { if (!v) return ''; const d = v instanceof Date ? v : new Date(v); return isNaN(d.getTime()) ? '' : d.toISOString(); }
function num_(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function userError_(message, code) { const e = new Error(message); e.userMessage = message; e.code = code || 'user'; return e; }

function cleanEmail_(v) {
  const email = String(v || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) throw userError_('Please enter a valid email address.');
  return email;
}

/** Cleans text for the sheet: trims, limits length and stops spreadsheet formula injection. */
function safe_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max || 200);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

/* =====================================================================
 * Setup & sheet menu
 * ===================================================================== */

/** Run once from the Apps Script editor (Run ▶ setup). Creates the tabs, the private photo folder and makes you the owner. */
/**
 * Built-in TEST admin so the dashboard can be tried before real admins are invited.
 * Email: admin@kcm.test (password shared with the owner privately). Remove it before going live:
 * Sheet menu KCM → Remove test admin (or disable it in the dashboard under Users & access).
 */
const TEST_ADMIN = { email: 'admin@kcm.test', name: 'Test Admin', salt: 'argon2id-np', hash: '$argon2id$v=19$m=19456,t=2,p=1$AT5zVv7vHoW/6Q6sQ1nCPg$JzSaFKqceqkfit+IkMB/XdFP7/lUVaOhOnyJJVjrLf0' };
function ensureTestAdmin_() {
  if (prop_('TEST_ADMIN_REMOVED') === '1') return;
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === TEST_ADMIN.email);
    const row = [TEST_ADMIN.email, TEST_ADMIN.name, 'ADMIN', 'active', 'test', '', new Date(), '', 'setup', TEST_ADMIN.hash, TEST_ADMIN.salt];
    if (idx > 0) sh.getRange(idx + 1, 1, 1, row.length).setValues([[row[0], row[1], row[2], rows[idx][3] === 'disabled' ? 'disabled' : 'active', row[4], row[5], rows[idx][6] || row[6], rows[idx][7], row[8], row[9], row[10]]]);
    else sh.appendRow(row);
  });
}
function menuRemoveTestAdmin_() {
  PropertiesService.getScriptProperties().setProperty('TEST_ADMIN_REMOVED', '1');
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === TEST_ADMIN.email);
    if (idx > 0) sh.deleteRow(idx + 1);
  });
  SpreadsheetApp.getUi().alert('The test admin (admin@kcm.test) has been removed.');
}

function setup() {
  Object.keys(TABS).forEach(name => {
    const sh = sheet_(name);
    const header = sh.getRange(1, 1, 1, TABS[name].length);
    header.setValues([TABS[name]]).setFontWeight('bold').setBackground('#0e1512').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  const props = PropertiesService.getScriptProperties();
  const me = Session.getEffectiveUser().getEmail().toLowerCase();
  if (!props.getProperty('OWNER_EMAIL')) props.setProperty('OWNER_EMAIL', me);
  if (!props.getProperty('SITE_URL')) props.setProperty('SITE_URL', 'https://mathonsimm.github.io/KCMTravel-Tours');
  partnersFolder_();
  pepper_();
  dataKey_();
  ensureTestAdmin_();
  if (typeof opsSetup_ === 'function') opsSetup_();
  upsertUser_(props.getProperty('OWNER_EMAIL'), { provider: 'owner' });
  // hide technical tabs
  ['Sessions', 'Codes'].forEach(n => sheet_(n).hideSheet());
  log_(me, 'setup', SpreadsheetApp.getActiveSpreadsheet().getName(), 'v' + APP.version);
  MailApp.getRemainingDailyQuota(); // triggers the email permission prompt during setup
  return 'Setup complete. Owner: ' + props.getProperty('OWNER_EMAIL');
}

function menuWhatsApp_() {
  const ui = SpreadsheetApp.getUi();
  let list = [];
  try { list = JSON.parse(prop_('WHATSAPP_ALERTS') || '[]'); } catch (e) { list = []; }
  const current = list.length ? list.map(x => x.phone).join(', ') : 'none yet';
  const r = ui.prompt('WhatsApp alerts',
    'Numbers getting alerts now: ' + current + '\n\nTo add a number: from that phone, WhatsApp the text\n"I allow callmebot to send me messages" to +34 644 71 81 99.\nYou\'ll get an API key back. Then enter here:  number, apikey\n(e.g. 27764360010, 1234567)\n\nType "clear" to remove all numbers.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const v = r.getResponseText().trim();
  if (v.toLowerCase() === 'clear') { PropertiesService.getScriptProperties().setProperty('WHATSAPP_ALERTS', '[]'); ui.alert('All WhatsApp alert numbers removed.'); return; }
  const parts = v.split(',').map(x => x.trim());
  let phone = (parts[0] || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '27' + phone.slice(1);
  if (phone.length < 10 || !parts[1]) { ui.alert('Please enter it as: number, apikey'); return; }
  list = list.filter(x => x.phone !== phone).concat([{ phone, apikey: parts[1] }]);
  PropertiesService.getScriptProperties().setProperty('WHATSAPP_ALERTS', JSON.stringify(list));
  const sent = whatsapp_('✅ KCM Travel & Tours: WhatsApp alerts are switched on for this number.');
  ui.alert(sent ? 'Saved. A test message was sent to WhatsApp.' : 'Saved, but the test message could not be sent. Check the number and API key.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('KCM Admin')
    .addItem('Run setup', 'menuSetup_')
    .addItem('Set Google Sign-In client ID', 'menuClientId_')
    .addItem('Set website address', 'menuSiteUrl_')
    .addItem('WhatsApp alerts…', 'menuWhatsApp_')
    .addItem('Remove test admin', 'menuRemoveTestAdmin_')
    .addSeparator()
    .addItem('Create tickets from existing bookings', 'menuBackfillTickets_')
    .addItem('Rotate data-encryption key', 'menuRotateKey_')
    .addToUi();
}

function menuSetup_() { SpreadsheetApp.getUi().alert(setup()); }
function menuRotateKey_() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Rotate the data-encryption key?', 'Stored secrets are re-encrypted with a new key. Older key versions are kept so backups stay readable.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  ui.alert('Done. Now using key version ' + rotateDataKey_() + '.');
}

function menuClientId_() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Google Sign-In', 'Paste the OAuth Client ID (ends with .apps.googleusercontent.com):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const v = r.getResponseText().trim();
  if (v && !/\.apps\.googleusercontent\.com$/.test(v)) return ui.alert('That does not look like a Google OAuth Client ID.');
  PropertiesService.getScriptProperties().setProperty('GOOGLE_CLIENT_ID', v);
  ui.alert(v ? 'Google Sign-In client ID saved.' : 'Google Sign-In switched off.');
}

function menuSiteUrl_() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Website address', 'Used for links in emails, e.g. https://mathonsimm.github.io/KCMTravel-Tours', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() === ui.Button.OK && r.getResponseText().trim()) {
    PropertiesService.getScriptProperties().setProperty('SITE_URL', r.getResponseText().trim());
    ui.alert('Saved.');
  }
}
