/**
 * KCM security layer: roles & permissions, Argon2id passwords, TOTP multi-factor authentication,
 * AES-256-GCM encryption for stored secrets, and session handling.
 *
 * Crypto primitives come from Vendor.gs (bundled @noble/hashes + @noble/ciphers, MIT licence, audited libraries),
 * verified against RFC 9106 (Argon2id), RFC 6238 (TOTP) and AES-GCM test vectors before shipping.
 * All secrets (password pepper, data-encryption keys) live in Script Properties, never in this code.
 */

/* =====================================================================
 * Roles and permissions (enforced on every protected action, server-side)
 * ===================================================================== */

const ROLE = { SUPER_ADMIN: 'SUPER_ADMIN', ADMIN: 'ADMIN', MANAGEMENT: 'MANAGEMENT', FINANCE: 'FINANCE', OPERATIONS: 'OPERATIONS', PARTNER: 'PARTNER', CUSTOMER: 'CUSTOMER' };
const ALL_ROLES = Object.keys(ROLE);
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'FINANCE', 'OPERATIONS'];
/** Roles stored by earlier versions of the Sheet are read as their new equivalents (no data rewrite needed). */
const LEGACY_ROLES = { owner: 'SUPER_ADMIN', admin: 'ADMIN', viewer: 'OPERATIONS', partner: 'PARTNER', customer: 'CUSTOMER' };

/* ---------------------------------------------------------------------
 * Access profiles. A ROLE says what kind of account it is (staff, partner, customer, super admin).
 * What a staff member can SEE and DO comes from the access profiles they hold (one or more):
 * effective permissions = union of their profiles. Admins and managers build profiles by ticking
 * menu tabs and actions; built-in profiles can be edited, the Administrator profile is fixed.
 * --------------------------------------------------------------------- */

/** Every permission, grouped for the profile builder. kind 'tab' = shows a left-panel tab; 'action' = something they can do. */
const PERM_CATALOG = [
  // menu tabs
  { id: 'ops.edit.own', kind: 'tab', group: 'Operations Centre', label: 'My Workspace and my tickets', help: 'My Workspace, My Assigned Tickets, tasks, quotations and bookings for tickets they own or support. They can work on those tickets.' },
  { id: 'ops.view.unassigned', kind: 'tab', group: 'Operations Centre', label: 'Unassigned Tickets', help: 'See tickets nobody owns yet.' },
  { id: 'ops.view.all', kind: 'tab', group: 'Operations Centre', label: 'Operations Overview and all tickets', help: 'See every ticket (read). Changing other people\'s tickets needs "Edit any ticket".' },
  { id: 'ops.view.money', kind: 'tab', group: 'Operations Centre', label: 'Tickets with money (read-only)', help: 'A read-only summary of tickets that have a quotation or payment. For finance.' },
  { id: 'pay.view', kind: 'tab', group: 'Operations Centre', label: 'Payments', help: 'Payment timeline, balances and refunds.' },
  { id: 'ops.workload', kind: 'tab', group: 'Operations Centre', label: 'Employee Workload', help: 'How many tickets and tasks each person has.' },
  { id: 'audit.view', kind: 'tab', group: 'Operations Centre', label: 'Activity & Audit History', help: 'Who did what, when.' },
  { id: 'ops.templates', kind: 'tab', group: 'Operations Centre', label: 'Checklists & statuses', help: 'Edit checklist templates.' },
  { id: 'dashboard.view', kind: 'tab', group: 'Website & partners', label: 'Website overview', help: 'Website figures and charts.' },
  { id: 'partners.view', kind: 'tab', group: 'Website & partners', label: 'Partner applications, Partners, Ratings', help: 'See partner applications and partners.' },
  { id: 'bookings.view', kind: 'tab', group: 'Website & partners', label: 'Website requests', help: 'Booking requests from the website.' },
  { id: 'payouts.view', kind: 'tab', group: 'Website & partners', label: 'Partner trips & payouts', help: 'Trips done by partners and what we owe them.' },
  { id: 'messages.view', kind: 'tab', group: 'Website & partners', label: 'Messages', help: 'Contact-form and careers messages.' },
  { id: 'users.view', kind: 'tab', group: 'Website & partners', label: 'Users & access', help: 'See staff accounts and access profiles.' },
  // actions
  { id: 'ops.intake', kind: 'action', group: 'Tickets', label: 'Register enquiries', help: 'Create a ticket from a call, WhatsApp or walk-in.' },
  { id: 'ops.claim', kind: 'action', group: 'Tickets', label: 'Pick up unassigned tickets', help: 'Take an unassigned ticket for themselves.' },
  { id: 'ops.assign', kind: 'action', group: 'Tickets', label: 'Assign and reassign tickets', help: 'Give tickets to anyone, hand over work.' },
  { id: 'ops.edit.any', kind: 'action', group: 'Tickets', label: 'Edit any ticket', help: 'Change tickets they do not own, reopen closed tickets.' },
  { id: 'ops.confirm', kind: 'action', group: 'Tickets', label: 'Confirm and cancel bookings', help: 'Mark a booking confirmed or cancel a confirmed booking.' },
  { id: 'ops.statuses', kind: 'action', group: 'Tickets', label: 'Manage custom statuses', help: 'Add or rename ticket statuses.' },
  { id: 'suppliers.manage', kind: 'action', group: 'Tickets', label: 'Manage suppliers', help: 'Add suppliers and supplier quotes.' },
  { id: 'quote.prepare', kind: 'action', group: 'Quotations', label: 'Prepare quotations', help: 'Draft quotations on tickets they can edit.' },
  { id: 'quote.approve', kind: 'action', group: 'Quotations', label: 'Approve quotations', help: 'Approve a quotation before it goes to the customer.' },
  { id: 'pay.record', kind: 'action', group: 'Money', label: 'Record payments received', help: 'Recorded payments stay unverified until finance checks them.' },
  { id: 'pay.verify', kind: 'action', group: 'Money', label: 'Verify payments and record refunds', help: 'Check payments against the bank, record refunds (refunds then need approval).' },
  { id: 'pay.refund.approve', kind: 'action', group: 'Money', label: 'Approve refunds (money out)', help: 'Approve a refund someone else recorded. Never their own.' },
  { id: 'payouts.manage', kind: 'action', group: 'Money', label: 'Record partner trips and payouts', help: 'Record trips and mark approved payouts as paid.' },
  { id: 'payouts.approve', kind: 'action', group: 'Money', label: 'Approve partner payouts (money out)', help: 'Approve a payout someone else recorded. Never their own.' },
  { id: 'partners.review', kind: 'action', group: 'Website & partners', label: 'Review partner applications', help: 'Approve, reject or ask for more info, see ID documents.' },
  { id: 'ratings.moderate', kind: 'action', group: 'Website & partners', label: 'Moderate ratings', help: 'Publish or hide guest ratings.' },
  { id: 'bookings.update', kind: 'action', group: 'Website & partners', label: 'Update website requests', help: 'Change the status of website booking requests.' },
  { id: 'users.manage', kind: 'action', group: 'People', label: 'Create and manage staff accounts', help: 'Add employees, set temporary passwords, give profiles, disable accounts.' },
  { id: 'profiles.manage', kind: 'action', group: 'People', label: 'Build access profiles', help: 'Create and edit access profiles like this one.' },
  { id: 'customers.erase', kind: 'action', group: 'People', label: 'Erase customer data (POPIA)', help: 'Permanently anonymise a customer on request.' },
];
const ALL_PERMS = PERM_CATALOG.map(p => p.id);
/** Holding any of these means the account must use an authenticator app. */
const PRIVILEGED_PERMS = ['users.manage', 'profiles.manage', 'pay.verify', 'pay.refund.approve', 'payouts.manage', 'payouts.approve', 'customers.erase', 'ops.view.all', 'ops.view.money'];

const BUILTIN_PROFILES = [
  { id: 'administrator', name: 'Administrator', description: 'Everything, including staff accounts and access profiles. Cannot be edited.', perms: ALL_PERMS.slice(), locked: true },
  { id: 'manager', name: 'Manager', description: 'Runs operations: sees all tickets, assigns work, approves quotations, refunds and payouts, manages staff accounts.',
    perms: ALL_PERMS.filter(p => ['customers.erase', 'pay.verify', 'payouts.manage', 'ops.view.money'].indexOf(p) === -1) },
  { id: 'finance', name: 'Finance Administrator', description: 'Payments, balances, refunds and partner payouts. Sees only tickets that have money on them, read-only.',
    perms: ['ops.view.money', 'pay.view', 'pay.record', 'pay.verify', 'payouts.view', 'payouts.manage'] },
  { id: 'consultant', name: 'Travel Consultant', description: 'Works on their own and assigned tickets, can see and pick up unassigned tickets.',
    perms: ['ops.edit.own', 'ops.view.unassigned', 'ops.claim', 'ops.intake', 'quote.prepare', 'pay.record', 'suppliers.manage', 'messages.view', 'bookings.view'] },
  { id: 'web', name: 'Website & Partners Officer', description: 'Website requests, messages, partner applications and ratings. No access to the Operations Centre.',
    perms: ['dashboard.view', 'partners.view', 'partners.review', 'ratings.moderate', 'bookings.view', 'bookings.update', 'messages.view'] },
  { id: 'readonly', name: 'Read-only', description: 'Can look at operations, payments and the website pages but cannot change anything.',
    perms: ['dashboard.view', 'ops.view.all', 'pay.view', 'payouts.view', 'partners.view', 'bookings.view', 'messages.view'] },
];
/** Accounts from before access profiles (no Profiles value) get the profile matching their old role. */
const ROLE_DEFAULT_PROFILE = { ADMIN: 'administrator', MANAGEMENT: 'manager', FINANCE: 'finance', OPERATIONS: 'consultant' };

let PROFILE_CACHE_ = null;
function profiles_() {
  if (PROFILE_CACHE_) return PROFILE_CACHE_;
  const stored = {};
  readTable_('AccessProfiles').forEach(r => { stored[r.ProfileID] = r; });
  const list = BUILTIN_PROFILES.map(b => {
    const r = stored[b.id];
    return { id: b.id, name: r && !b.locked ? r.Name : b.name, description: r && !b.locked ? r.Description : b.description,
      perms: r && !b.locked ? cleanPerms_(r.Permissions) : b.perms.slice(), builtIn: true, locked: !!b.locked };
  });
  Object.keys(stored).filter(id => !BUILTIN_PROFILES.some(b => b.id === id)).forEach(id => {
    const r = stored[id];
    list.push({ id, name: r.Name, description: r.Description, perms: cleanPerms_(r.Permissions), builtIn: false, locked: false });
  });
  PROFILE_CACHE_ = list;
  return list;
}
function cleanPerms_(v) { return (Array.isArray(v) ? v : String(v || '').split(',')).map(x => String(x).trim()).filter(x => ALL_PERMS.indexOf(x) !== -1); }
function profileIdsOf_(u) {
  const ids = String((u && u.Profiles) || '').split(',').map(s => s.trim()).filter(Boolean);
  if (ids.length) return ids;
  const d = ROLE_DEFAULT_PROFILE[roleOf_(u)];
  return d ? [d] : [];
}

function roleOf_(u) {
  const r = String((u && u.Role) || '');
  if (LEGACY_ROLES[r]) return LEGACY_ROLES[r];
  return ALL_ROLES.indexOf(r) !== -1 ? r : 'CUSTOMER';
}
function isStaff_(u) { return STAFF_ROLES.indexOf(roleOf_(u)) !== -1; }
/** Effective permissions: super admin has everything; partners and customers never hold staff permissions. */
function permissionsOf_(u) {
  if (!u) return [];
  if (u.__perms) return u.__perms;
  let out = [];
  if (roleOf_(u) === 'SUPER_ADMIN') out = ALL_PERMS.slice();
  else if (isStaff_(u)) {
    const ids = profileIdsOf_(u), seen = {};
    profiles_().filter(p => ids.indexOf(p.id) !== -1).forEach(p => p.perms.forEach(x => { seen[x] = 1; }));
    out = ALL_PERMS.filter(x => seen[x]);
  }
  try { Object.defineProperty(u, '__perms', { value: out, enumerable: false, configurable: true }); } catch (e) { /* frozen object */ }
  return out;
}
function can_(u, perm) { return permissionsOf_(u).indexOf(perm) !== -1; }
function needsMfa_(u) { return roleOf_(u) === 'SUPER_ADMIN' || permissionsOf_(u).some(p => PRIVILEGED_PERMS.indexOf(p) !== -1); }
/** Account tier stored in Users.Role for staff, derived from what their profiles allow (used for labels and older code paths). */
function tierFor_(perms) {
  if (perms.indexOf('users.manage') !== -1 && perms.indexOf('customers.erase') !== -1) return 'ADMIN';
  if (perms.indexOf('users.manage') !== -1 || perms.indexOf('ops.assign') !== -1 || perms.indexOf('ops.view.all') !== -1) return 'MANAGEMENT';
  if (perms.indexOf('pay.verify') !== -1 || perms.indexOf('ops.view.money') !== -1) return 'FINANCE';
  return 'OPERATIONS';
}
function permsOfProfiles_(ids) {
  const seen = {};
  profiles_().filter(p => ids.indexOf(p.id) !== -1).forEach(p => p.perms.forEach(x => { seen[x] = 1; }));
  return ALL_PERMS.filter(x => seen[x]);
}
/** Staff holding a permission (for notifications). */
function staffWith_(perm) { return readTable_('Users').filter(u => u.Status !== 'disabled' && isStaff_(u) && can_(u, perm)); }

/** Signed-in user holding a permission. Privileged sessions must have passed MFA. */
function requirePerm_(token, perm) {
  const user = requireUser_(token);
  if (!can_(user, perm)) throw userError_('You do not have access to this.', 'forbidden');
  return user;
}
/** Back-compat for older call sites: any of the listed permissions. */
function requireAnyPerm_(token, perms) {
  const user = requireUser_(token);
  if (!perms.some(p => can_(user, p))) throw userError_('You do not have access to this.', 'forbidden');
  return user;
}

/* =====================================================================
 * Byte helpers (Apps Script has no TextEncoder / crypto.getRandomValues)
 * ===================================================================== */

function utf8_(s) { const b = unescape(encodeURIComponent(String(s))); const out = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out; }
function utf8Decode_(bytes) { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return decodeURIComponent(escape(s)); }
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64_(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=');
  }
  return s;
}
function unb64_(s) {
  s = String(s).replace(/[^A-Za-z0-9+/]/g, '');
  const out = [];
  for (let i = 0; i < s.length; i += 4) {
    const n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | ((B64.indexOf(s[i + 2]) & 63) << 6) | (B64.indexOf(s[i + 3]) & 63);
    out.push((n >> 16) & 255); if (s[i + 2]) out.push((n >> 8) & 255); if (s[i + 3]) out.push(n & 255);
  }
  return new Uint8Array(out);
}
function hex_(bytes) { let s = ''; for (let i = 0; i < bytes.length; i++) s += ('0' + (bytes[i] & 255).toString(16)).slice(-2); return s; }
/** Cryptographically secure random bytes: SHA-256 over server-generated random UUIDs (v4, SecureRandom-backed). */
function randomBytes_(n) {
  const out = new Uint8Array(n);
  let filled = 0;
  while (filled < n) {
    const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid() + filled);
    for (let i = 0; i < d.length && filled < n; i++) out[filled++] = d[i] & 255;
  }
  return out;
}
function randomToken_() { return hex_(randomBytes_(32)); }
/** Uniform random integer in [0, max) without modulo bias. */
function randomInt_(max) {
  const limit = Math.floor(4294967296 / max) * max;
  for (;;) { const b = randomBytes_(4); const v = ((b[0] << 24) >>> 0) + (b[1] << 16) + (b[2] << 8) + b[3]; if (v < limit) return v % max; }
}
function constantTimeEqual_(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* =====================================================================
 * Passwords: Argon2id (RFC 9106), OWASP minimum parameters m=19 MiB, t=2, p=1.
 * The private pepper (Script Properties) is passed as the Argon2 secret key.
 * Older iterated-SHA-256 hashes still verify and are upgraded on the next successful sign-in.
 * ===================================================================== */

const ARGON = { m: 19456, t: 2, p: 1, dkLen: 32 };

function argonHash_(password, saltBytes, usePepper) {
  const opts = { t: ARGON.t, m: ARGON.m, p: ARGON.p, dkLen: ARGON.dkLen };
  if (usePepper) opts.key = utf8_(pepper_());
  return KCMCrypto.argon2id(utf8_(password), saltBytes, opts);
}
/** Returns the PHC-format string stored in Users.PasswordHash; Users.PasswordSalt holds the scheme marker. */
function newPasswordHash_(password) {
  const salt = randomBytes_(16);
  return { hash: `$argon2id$v=19$m=${ARGON.m},t=${ARGON.t},p=${ARGON.p}$${b64_(salt).replace(/=+$/, '')}$${b64_(argonHash_(password, salt, true)).replace(/=+$/, '')}`, scheme: 'argon2id' };
}
/** true / false. Supports argon2id (peppered), argon2id-np (built-in test admin, no pepper) and the legacy scheme. */
function verifyPassword_(user, password) {
  const stored = String(user.PasswordHash || ''), scheme = String(user.PasswordSalt || '');
  if (!stored) return false;
  if (stored.indexOf('$argon2id$') === 0) {
    const parts = stored.split('$'); // ['', 'argon2id', 'v=19', 'm=..,t=..,p=..', salt, hash]
    const params = {}; parts[3].split(',').forEach(kv => { const [k, v] = kv.split('='); params[k] = Number(v); });
    const opts = { t: params.t, m: params.m, p: params.p, dkLen: 32 };
    if (scheme !== 'argon2id-np') opts.key = utf8_(pepper_());
    const out = KCMCrypto.argon2id(utf8_(password), unb64_(parts[4]), opts);
    return constantTimeEqual_(b64_(out).replace(/=+$/, ''), parts[5]);
  }
  return constantTimeEqual_(legacyHashPassword_(password, scheme), stored); // pre-1.4 scheme
}
function legacyHashPassword_(password, salt) {
  let h = salt + ':' + password + ':' + (String(salt).indexOf('np:') === 0 ? '' : pepper_());
  for (let i = 0; i < 1000; i++) h = hash_(h + ':' + salt);
  return h;
}

/* =====================================================================
 * Application-level encryption: AES-256-GCM with versioned keys (rotation-ready).
 * Format: "v<keyVersion>:<base64(iv[12] | ciphertext+tag)>". Keys: Script Properties DATA_KEY_V<n>.
 * ===================================================================== */

function dataKey_(version) {
  const props = PropertiesService.getScriptProperties();
  let v = version || Number(props.getProperty('DATA_KEY_VERSION') || 0);
  if (!v) { v = 1; props.setProperty('DATA_KEY_V1', b64_(randomBytes_(32))); props.setProperty('DATA_KEY_VERSION', '1'); }
  const k = props.getProperty('DATA_KEY_V' + v);
  if (!k) throw new Error('Missing data key v' + v);
  return { version: v, key: unb64_(k) };
}
function encrypt_(plain) {
  const { version, key } = dataKey_();
  const iv = randomBytes_(12);
  const ct = KCMCrypto.gcm(key, iv).encrypt(utf8_(plain));
  const buf = new Uint8Array(12 + ct.length); buf.set(iv, 0); buf.set(ct, 12);
  return 'v' + version + ':' + b64_(buf);
}
function decrypt_(blob) {
  const m = String(blob || '').match(/^v(\d+):(.+)$/);
  if (!m) throw new Error('Bad ciphertext');
  const { key } = dataKey_(Number(m[1]));
  const buf = unb64_(m[2]);
  return utf8Decode_(KCMCrypto.gcm(key, buf.slice(0, 12)).decrypt(buf.slice(12)));
}
/** Creates a new key version and re-encrypts stored secrets. Old key versions are kept so old backups stay readable. */
function rotateDataKey_() {
  const props = PropertiesService.getScriptProperties();
  const next = Number(props.getProperty('DATA_KEY_VERSION') || 1) + 1;
  props.setProperty('DATA_KEY_V' + next, b64_(randomBytes_(32)));
  const col = TABS.Users.indexOf('MfaSecret');
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const plain = rows.map((r, i) => (i > 0 && r[col] ? decrypt_(r[col]) : null)); // decrypt with old versions first
    props.setProperty('DATA_KEY_VERSION', String(next));
    plain.forEach((p, i) => { if (p) sh.getRange(i + 1, col + 1).setValue(encrypt_(p)); });
  });
  return next;
}

/* =====================================================================
 * TOTP multi-factor authentication (RFC 6238, 30 s, 6 digits, SHA-1 for authenticator-app compatibility)
 * ===================================================================== */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32_(bytes) { let bits = '', s = ''; bytes.forEach(b => { bits += ('00000000' + b.toString(2)).slice(-8); }); for (let i = 0; i + 5 <= bits.length; i += 5) s += B32[parseInt(bits.substr(i, 5), 2)]; return s; }
function unbase32_(s) { let bits = ''; String(s).toUpperCase().replace(/[^A-Z2-7]/g, '').split('').forEach(c => { bits += ('00000' + B32.indexOf(c).toString(2)).slice(-5); }); const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.substr(i, 8), 2)); return new Uint8Array(out); }
function totpAt_(secretB32, step) {
  const msg = new Uint8Array(8);
  let x = step; for (let i = 7; i >= 0; i--) { msg[i] = x & 255; x = Math.floor(x / 256); }
  const h = KCMCrypto.hmac(KCMCrypto.sha1, unbase32_(secretB32), msg);
  const o = h[19] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1000000).padStart(6, '0');
}
/** Accepts the current code ±1 step (clock drift) and refuses a code that was already used (replay). */
function verifyTotp_(email, secretB32, code) {
  code = String(code || '').replace(/\D/g, '');
  if (code.length !== 6) return false;
  const now = Math.floor(Date.now() / 30000);
  const cache = CacheService.getScriptCache();
  const last = Number(cache.get('totp-last:' + email) || 0);
  for (let d = -1; d <= 1; d++) {
    const step = now + d;
    if (step <= last) continue;
    if (constantTimeEqual_(totpAt_(secretB32, step), code)) { cache.put('totp-last:' + email, String(step), 300); return true; }
  }
  return false;
}

/* =====================================================================
 * Login completion: every sign-in method (password, email code, Google, password reset) ends here,
 * so the MFA requirement cannot be bypassed by choosing a different method.
 * ===================================================================== */

function finishLogin_(email, opts) {
  const user = upsertUser_(email, opts);
  if (!opts.registering) accessGate_(user);
  if (!needsMfa_(user)) return startSession_(email, Object.assign({}, opts, { mfa: false }));
  const challenge = randomToken_();
  const enrolled = !!user.MfaSecret;
  const state = { email, provider: opts.provider || '', stage: enrolled ? 'verify' : 'setup', attempts: 0 };
  let out = { mfa: state.stage, challenge };
  if (!enrolled) {
    state.secret = base32_(randomBytes_(20));
    const label = encodeURIComponent('KCM Travel & Tours:' + email);
    out = Object.assign(out, { secret: state.secret, otpauth: `otpauth://totp/${label}?secret=${state.secret}&issuer=${encodeURIComponent('KCM Travel & Tours')}&period=30&digits=6` });
  }
  CacheService.getScriptCache().put('mfa:' + hash_(challenge), JSON.stringify(state), 600);
  log_(email, 'mfa_challenge', email, state.stage);
  return out;
}

function mfaState_(challenge) {
  const key = 'mfa:' + hash_(String(challenge || ''));
  const raw = CacheService.getScriptCache().get(key);
  if (!raw) throw userError_('This sign-in step has expired. Please sign in again.', 'auth');
  const st = JSON.parse(raw);
  st.attempts++;
  if (st.attempts > 5) { CacheService.getScriptCache().remove(key); throw userError_('Too many wrong codes. Please sign in again.', 'auth'); }
  CacheService.getScriptCache().put(key, JSON.stringify(st), 600);
  return { key, st };
}

/** Second step for enrolled users: 6-digit authenticator code or a one-time recovery code. */
function mfaVerify_(b) {
  const { key, st } = mfaState_(b.challenge);
  if (st.stage !== 'verify') throw userError_('Please finish setting up your authenticator app.');
  const user = findUser_(st.email);
  if (!user || !user.MfaSecret) throw userError_('Please sign in again.', 'auth');
  let ok = false, usedRecovery = false;
  if (b.recoveryCode) {
    const codes = JSON.parse(user.RecoveryCodes || '[]');
    const h = hash_(String(b.recoveryCode).replace(/[^A-Za-z0-9]/g, '').toUpperCase() + ':' + st.email);
    const idx = codes.indexOf(h);
    if (idx !== -1) { codes.splice(idx, 1); setUserFields_(st.email, { RecoveryCodes: JSON.stringify(codes) }); ok = true; usedRecovery = true; }
  } else {
    ok = verifyTotp_(st.email, decrypt_(user.MfaSecret), b.code);
  }
  if (!ok) { log_(st.email, 'mfa_failed', st.email, ''); throw userError_('That code is not right. Check the time on your phone and try the newest code.'); }
  CacheService.getScriptCache().remove(key);
  if (usedRecovery) log_(st.email, 'mfa_recovery_code_used', st.email, '');
  return startSession_(st.email, { provider: st.provider, mfa: true });
}

/** First-time setup: the user scanned the QR code / typed the key and confirms with a current code. */
function mfaSetupConfirm_(b) {
  const { key, st } = mfaState_(b.challenge);
  if (st.stage !== 'setup' || !st.secret) throw userError_('Please sign in again.', 'auth');
  if (!verifyTotp_(st.email, st.secret, b.code)) throw userError_('That code is not right. Make sure you added the key to your authenticator app and use the newest code.');
  const recovery = [], hashes = [];
  for (let i = 0; i < 8; i++) {
    let c = ''; for (let j = 0; j < 10; j++) c += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt_(32)];
    recovery.push(c.slice(0, 5) + '-' + c.slice(5)); hashes.push(hash_(c + ':' + st.email));
  }
  setUserFields_(st.email, { MfaSecret: encrypt_(st.secret), MfaEnabledAt: new Date(), RecoveryCodes: JSON.stringify(hashes) });
  CacheService.getScriptCache().remove(key);
  log_(st.email, 'mfa_enabled', st.email, '');
  return Object.assign(startSession_(st.email, { provider: st.provider, mfa: true }), { recoveryCodes: recovery });
}

/** Admins can reset another person's authenticator (lost phone). Never their own, and admins cannot reset the super admin. */
function resetUserMfa_(b) {
  const actor = requirePerm_(b.token, 'users.manage');
  const email = cleanEmail_(b.email);
  if (email === actor.Email) throw userError_('You cannot reset your own authenticator. Ask another administrator.');
  const target = findUser_(email);
  if (!target) throw userError_('User not found.');
  if (roleOf_(target) === 'SUPER_ADMIN') throw userError_('Only the super admin can reset this account.');
  setUserFields_(email, { MfaSecret: '', MfaEnabledAt: '', RecoveryCodes: '' });
  revokeSessions_(email);
  log_(actor.Email, 'mfa_reset', email, '');
  return { reset: true };
}

function setUserFields_(email, fields) {
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === email);
    if (idx < 1) return;
    Object.keys(fields).forEach(k => { const c = TABS.Users.indexOf(k); if (c !== -1) sh.getRange(idx + 1, c + 1).setValue(fields[k]); });
  });
}

function revokeSessions_(email) {
  withLock_(() => {
    const sh = sheet_('Sessions');
    const rows = sh.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) if (rows[i][1] === email) { CacheService.getScriptCache().remove('sess:' + rows[i][0]); sh.deleteRow(i + 1); }
  });
}
