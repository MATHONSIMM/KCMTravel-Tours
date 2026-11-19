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
/** Privileged roles must use multi-factor authentication (authenticator app). */
const MFA_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'FINANCE'];
/** Roles stored by earlier versions of the Sheet are read as their new equivalents (no data rewrite needed). */
const LEGACY_ROLES = { owner: 'SUPER_ADMIN', admin: 'ADMIN', viewer: 'OPERATIONS', partner: 'PARTNER', customer: 'CUSTOMER' };

const SA = 'SUPER_ADMIN', AD = 'ADMIN', MG = 'MANAGEMENT', FI = 'FINANCE', OP = 'OPERATIONS';
/** permission -> roles that hold it (least privilege). "own" permissions are further limited to the user's own records in code. */
const PERMS = {
  'dashboard.view': [SA, AD, MG, FI, OP],
  'users.view': [SA, AD],
  'users.manage': [SA, AD],
  'audit.view': [SA, AD, MG],
  'partners.view': [SA, AD, MG, FI],
  'partners.review': [SA, AD, MG],              // includes identity / ownership documents
  'payouts.view': [SA, AD, MG, FI],
  'payouts.manage': [SA, AD, FI],
  'ratings.moderate': [SA, AD, MG],
  'messages.view': [SA, AD, MG, OP],
  'bookings.view': [SA, AD, MG, FI, OP],
  'bookings.update': [SA, AD, MG],
  // Operations Centre
  'ops.intake': [SA, AD, MG, OP],
  'ops.view.all': [SA, AD, MG, FI],              // OPERATIONS only see tickets they own or support
  'ops.edit.any': [SA, AD, MG],
  'ops.edit.own': [SA, AD, MG, OP],
  'ops.assign': [SA, AD, MG],
  'ops.workload': [SA, AD, MG],
  'ops.templates': [SA, AD, MG],
  'ops.statuses': [SA, AD, MG],
  'ops.confirm': [SA, AD, MG],                   // confirm bookings, cancel confirmed bookings
  'quote.prepare': [SA, AD, MG, OP],
  'quote.approve': [SA, AD, MG],
  'pay.view': [SA, AD, MG, FI],
  'pay.record': [SA, AD, MG, FI, OP],             // recorded payments are UNVERIFIED until finance verifies
  'pay.verify': [SA, AD, FI],
  'pay.refund.approve': [SA, AD, FI],
  'customers.erase': [SA, AD],
  'suppliers.manage': [SA, AD, MG, OP],
};

function roleOf_(u) {
  const r = String((u && u.Role) || '');
  if (LEGACY_ROLES[r]) return LEGACY_ROLES[r];
  return ALL_ROLES.indexOf(r) !== -1 ? r : 'CUSTOMER';
}
function isStaff_(u) { return STAFF_ROLES.indexOf(roleOf_(u)) !== -1; }
function can_(u, perm) { return !!u && (PERMS[perm] || []).indexOf(roleOf_(u)) !== -1; }
function permissionsOf_(u) { return Object.keys(PERMS).filter(p => can_(u, p)); }
function needsMfa_(u) { return MFA_ROLES.indexOf(roleOf_(u)) !== -1; }

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
  if (roleOf_(target) === 'SUPER_ADMIN' || (roleOf_(target) === 'ADMIN' && roleOf_(actor) !== 'SUPER_ADMIN')) throw userError_('Only the super admin can reset this account.');
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
