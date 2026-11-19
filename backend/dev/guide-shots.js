/* Captures the user-guide screenshots against the mock backend loaded with DEMO data, and checks the main
   workflows through the real UI: assign, change status, verify, confirm, complete guard, refund approval,
   give access, revoke access, partner review. Output: /home/claude/guide-shots/*.png + results. */
const { chromium } = require('playwright-core');
const crypto = require('crypto');
const fs = require('fs');
const S = 'http://127.0.0.1:5217', M = 'http://127.0.0.1:8787', OUT = '/home/claude/guide-shots';
fs.mkdirSync(OUT, { recursive: true });
const J = async p => (await fetch(M + p)).json();
const call = async (action, payload = {}, token) => (await (await fetch(M, { method: 'POST', body: JSON.stringify(Object.assign({ action }, token ? { token } : {}, payload)) })).json());
const lastCode = async email => { const m = (await J('/__mail')).reverse().find(e => e.to === email && /sign-in code/.test(e.subject)); return /letter-spacing:4px">(\d{6})/.exec(m.htmlBody)[1]; };
function totp(secret, off = 0) { const B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of secret.replace(/\s/g, '')) bits += B.indexOf(c).toString(2).padStart(5, '0'); const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2))); const msg = Buffer.alloc(8); msg.writeUInt32BE(Math.floor(Date.now() / 30000) + off, 4); const h = crypto.createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15; return String(((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, '0'); }
const PW = 'Lowveld-test-2026x', DEMO_PW = 'Demo-Lowveld-2026';
const results = []; const check = (n, c, d) => { results.push([n, !!c, c ? '' : (d || '')]); console.log(c ? '  ✓' : '  ✗', n, c ? '' : (d || '')); };
const fails = [];

/* draw an orange ring + numbered badge around elements to show "press here" */
async function mark(p, items) {
  await p.evaluate(items => {
    document.querySelectorAll('.guide-mark').forEach(x => x.remove());
    items.forEach(([sel, label], i) => {
      const el = document.querySelector(sel); if (!el) return;
      const r = el.getBoundingClientRect();
      const ring = document.createElement('div'); ring.className = 'guide-mark';
      Object.assign(ring.style, { position: 'fixed', left: r.left - 5 + 'px', top: r.top - 5 + 'px', width: r.width + 10 + 'px', height: r.height + 10 + 'px', border: '3px solid #e8590c', borderRadius: '12px', zIndex: 99999, pointerEvents: 'none', boxShadow: '0 0 0 4px rgba(232,89,12,.18)' });
      const b = document.createElement('div'); b.className = 'guide-mark'; b.textContent = label || String(i + 1);
      Object.assign(b.style, { position: 'fixed', left: Math.max(4, r.left - 16) + 'px', top: Math.max(4, r.top - 16) + 'px', minWidth: '28px', height: '28px', padding: '0 7px', borderRadius: '14px', background: '#e8590c', color: '#fff', font: '700 15px/28px system-ui, sans-serif', textAlign: 'center', zIndex: 100000, pointerEvents: 'none', boxShadow: '0 2px 6px rgba(0,0,0,.3)' });
      document.body.append(ring, b);
    });
  }, items);
}
const unmark = p => p.evaluate(() => document.querySelectorAll('.guide-mark').forEach(x => x.remove()));
async function shot(p, name, opts = {}) {
  try {
    await p.waitForTimeout(opts.wait || 700);
    if (opts.mark) await mark(p, opts.mark);
    await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: !!opts.full, clip: opts.clip });
    if (opts.mark) await unmark(p);
  } catch (e) { fails.push(name + ': ' + e.message.split('\n')[0]); }
}
async function step(name, fn) { try { await fn(); } catch (e) { fails.push(name + ': ' + e.message.split('\n')[0]); console.log('  ! step failed:', name, e.message.split('\n')[0]); } }

(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const mk = async (w = 1440, h = 900, mobile = false) => { const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept()); p.on('console', m => { if (m.type() === 'error' && !/unsplash|ERR_|Failed to load resource|google/.test(m.text())) errs.push(m.text()); }); return p; };
  const asUser = async (token, w, h, mobile) => { const p = await mk(w, h, mobile); const u = (await call('me', {}, token)).data; await p.addInitScript(([t, u]) => { localStorage.setItem('kcm-session', JSON.stringify({ token: t, user: u })); }, [token, u]); return p; };
  const go = async (p, hash, sel) => { await p.goto(S + '/admin' + hash); await p.waitForSelector(sel || '[data-adm-body] > *', { timeout: 15000 }); await p.waitForTimeout(900); };

  // ---------- accounts ----------
  await call('requestCode', { email: 'owner@example.com' });
  let r = (await call('resetPassword', { email: 'owner@example.com', code: await lastCode('owner@example.com'), password: PW })).data;
  r = (await call('mfaSetupConfirm', { challenge: r.challenge, code: totp(r.secret) })).data; const OWNER = r.token;
  const staffLogin = async email => { let x = (await call('signIn', { email, password: DEMO_PW })).data; if (x.mfa === 'setup') x = (await call('mfaSetupConfirm', { challenge: x.challenge, code: totp(x.secret) })).data; return x.token; };
  const NOMSA = await staffLogin('nomsa.ops@demo.kcm.test'), MGR = await staffLogin('thandi.manager@demo.kcm.test'), FIN = await staffLogin('fiona.finance@demo.kcm.test'), FIN2 = await staffLogin('sam.finance@demo.kcm.test');
  check('demo staff can sign in with the demo password', NOMSA && MGR && FIN && FIN2);

  // ---------- public site ----------
  const pub = await mk();
  await step('public', async () => {
    await pub.goto(S + '/'); await pub.waitForTimeout(1500); await shot(pub, '01-home');
    await pub.goto(S + '/book?tour=kruger-day-safari&adults=2'); await pub.waitForTimeout(1200); await shot(pub, '02-booking-form');
    await pub.goto(S + '/'); await pub.click('.chat-launcher'); await pub.waitForSelector('.chat-choice'); await pub.waitForTimeout(1200); await shot(pub, '03-kaycee');
    await pub.goto(S + '/'); await pub.waitForTimeout(800);
    await shot(pub, '04-header-signin', { mark: [['.auth-link[data-open-signin]', '1']], clip: { x: 0, y: 0, width: 1440, height: 120 } });
    await pub.click('.auth-link[data-open-signin]'); await pub.waitForTimeout(800); await shot(pub, '05-signin-modal');
  });
  // MFA screens via the built-in test admin
  await step('mfa', async () => {
    const t = await mk();
    await t.goto(S + '/admin'); await t.waitForSelector('[data-adm-body] [data-step-password]');
    await t.fill('[data-adm-body] [data-step-password] input[name=email]', 'admin@kcm.test'); await t.fill('[data-adm-body] [data-step-password] input[name=password]', 'Kaycee@Kruger26');
    await shot(t, '06-admin-signin', { mark: [['[data-adm-body] [data-step-password] input[name=email]', '1'], ['[data-adm-body] [data-step-password] input[name=password]', '2'], ['[data-adm-body] [data-step-password] button[type=submit]', '3']] });
    await t.click('[data-adm-body] [data-step-password] button[type=submit]');
    await t.waitForSelector('[data-adm-body] [data-step-mfa-setup]:not([hidden]) [data-mfa-qr] svg', { timeout: 20000 });
    await shot(t, '07-mfa-setup', { full: true });
    const secret = (await t.textContent('[data-mfa-secret]')).replace(/\s/g, '');
    await t.fill('[data-adm-body] [data-step-mfa-setup] input[name=code]', totp(secret)); await t.click('[data-adm-body] [data-step-mfa-setup] button[type=submit]');
    await t.waitForSelector('[data-adm-body] [data-step-recovery]:not([hidden])'); await shot(t, '08-recovery-codes', { full: true });
    check('test admin goes through authenticator setup and gets recovery codes', (await t.$$('[data-recovery-list] li')).length === 8);
  });

  // ---------- owner / admin tour ----------
  const o = await asUser(OWNER);
  await step('owner tour', async () => {
    await go(o, '#ops', '.ops-kpis'); await shot(o, '10-ops-overview', { full: true });
    check('overview shows demo figures (not zeros)', !/Enquiries\s*0\b/.test((await o.textContent('.ops-kpis')).replace(/\s+/g, ' ')), (await o.textContent('.ops-kpis')).replace(/\s+/g, ' ').slice(0, 200));
    await go(o, '#workspace'); await shot(o, '11-workspace-admin');
    await go(o, '#incoming', '.ops-table'); await shot(o, '12-incoming', { mark: [['.ops-table tbody tr:first-child a.ref', '1']] });
    check('incoming enquiries list has demo tickets', (await o.$$('.ops-table tbody tr')).length >= 4);
    await go(o, '#tickets', '.ops-table'); await shot(o, '13-all-tickets', { full: true });
    await shot(o, '13b-ticket-filters', { clip: { x: 240, y: 90, width: 1200, height: 260 } });
    await go(o, '#tasks'); await shot(o, '14-tasks', { full: true });
    await go(o, '#quotes'); await shot(o, '15-quotes');
    await go(o, '#opsbookings'); await shot(o, '16-bookings');
    await go(o, '#completed'); await shot(o, '17-completed');
    await go(o, '#workload'); await shot(o, '18-workload');
    await go(o, '#activity'); await shot(o, '19-activity');
    await go(o, '#opssettings'); await shot(o, '20-ops-settings');
    await go(o, '#overview'); await shot(o, '21-website-overview', { full: true });
    await go(o, '#applications'); await shot(o, '22-applications');
    await go(o, '#partners'); await shot(o, '23-partners');
    await go(o, '#payouts'); await shot(o, '24-payouts');
    await go(o, '#ratings'); await shot(o, '25-ratings');
    await go(o, '#bookings'); await shot(o, '26-website-requests');
    await go(o, '#messages'); await shot(o, '27-messages');
    await o.click('.notif-btn'); await o.waitForSelector('.notif-list'); await shot(o, '28-notifications', { clip: { x: 760, y: 80, width: 680, height: 620 } }); await o.click('.notif-btn');
  });

  // ---------- assign an unassigned ticket (management) ----------
  const m = await asUser(MGR);
  let assignedRef = null;
  await step('assign', async () => {
    await go(m, '#unassigned', '.ops-table');
    assignedRef = (await m.textContent('.ops-table tbody tr:first-child a.ref')).trim();
    await m.click('.ops-table tbody tr:first-child a.ref'); await m.waitForSelector('.tk-head');
    await shot(m, '30-ticket-new', { mark: [['[data-act=assign]', '1']] });
    await m.click('[data-act=assign]'); await m.waitForSelector('[data-ops-modal][open]');
    await m.selectOption('[data-ops-modal] select[name=assignee]', 'nomsa.ops@demo.kcm.test'); await m.selectOption('[data-ops-modal] select[name=priority]', 'High');
    await shot(m, '31-assign-modal', { mark: [['[data-ops-modal] select[name=assignee]', '2'], ['[data-ops-modal] select[name=priority]', '3'], ['[data-ops-modal] button[type=submit]', '4']] });
    await m.click('[data-ops-modal] button[type=submit]'); await m.waitForSelector('.toast'); await m.waitForTimeout(1500);
    check('management assigns an unassigned demo ticket to Nomsa', /Nomsa Mokoena/.test(await m.textContent('.tk-facts')));
  });

  // ---------- agent: workspace, ticket tabs, change status ----------
  const a = await asUser(NOMSA);
  await step('agent', async () => {
    await go(a, '#workspace', '.kpis'); await shot(a, '32-agent-workspace', { full: true });
    check('Nomsa sees her newly assigned ticket in My Workspace', (await a.textContent('[data-adm-body]')).includes(assignedRef));
    const hidden = await a.$$eval('.adm-nav a', els => els.filter(e => e.hidden).map(e => e.dataset.view));
    check('Operations staff do not see Payments, Workload or Users', ['payments', 'workload', 'users'].every(x => hidden.includes(x)));
    await shot(a, '33-agent-menu', { clip: { x: 0, y: 84, width: 240, height: 816 } });
    // a ticket in requirements review
    const list = (await call('listTickets', { view: 'mine' }, NOMSA)).data.tickets;
    const req = list.find(t => t.opStatus === 'REQUIREMENTS UNDER REVIEW') || list.find(t => t.opStatus === 'ASSIGNED');
    await go(a, '#ticket/' + req.ref, '.tk-head');
    await shot(a, '34-ticket-summary', { full: true, mark: [['[data-act=status]', '1'], ['[data-act=note]', '2'], ['[data-act=task]', '3'], ['nav[role=tablist], .tk-tabs', '4']] });
    for (const [tab, name] of [['req', '35-tab-requirements'], ['tasks', '36-tab-tasks'], ['check', '37-tab-checklist'], ['notes', '38-tab-notes'], ['supp', '39-tab-suppliers'], ['hist', '40-tab-history']]) {
      await a.click(`[data-tab=${tab}]`); await a.waitForTimeout(700); await shot(a, name, { full: true });
    }
    await a.click('[data-act=status]'); await a.waitForSelector('[data-ops-modal][open]');
    await a.selectOption('[data-ops-modal] select[name=status]', 'SUPPLIER RESEARCH');
    await shot(a, '41-status-modal', { mark: [['[data-ops-modal] select[name=status]', '1'], ['[data-ops-modal] button[type=submit]', '2']] });
    await a.click('[data-ops-modal] button[type=submit]'); await a.waitForTimeout(1500);
    check('agent moves a ticket to the next status', /SUPPLIER RESEARCH/.test(await a.textContent('.tk-facts')));
    // guard: agent cannot confirm a booking
    await a.click('[data-act=status]'); await a.waitForSelector('[data-ops-modal][open]');
    const opts = await a.$$eval('[data-ops-modal] select[name=status] option', os => os.map(x => x.value));
    if (opts.includes('BOOKING CONFIRMED')) { await a.selectOption('[data-ops-modal] select[name=status]', 'BOOKING CONFIRMED'); await a.click('[data-ops-modal] button[type=submit]'); await a.waitForTimeout(1200); await shot(a, '42-status-guard'); }
    const facts = await a.textContent('.tk-facts');
    check('agent cannot confirm a booking (the system refuses)', !/BOOKING CONFIRMED/.test(facts));
    await a.keyboard.press('Escape');
    // quotation tab on a ticket with a sent quote
    const qt = list.find(t => t.opStatus === 'QUOTATION SENT') || list.find(t => /QUOTATION/.test(t.opStatus));
    if (qt) { await go(a, '#ticket/' + qt.ref, '.tk-head'); await a.click('[data-tab=quotes]'); await a.waitForTimeout(800); await shot(a, '43-tab-quotes', { full: true }); }
    const pt = list.find(t => t.opStatus === 'PAYMENT VERIFICATION');
    if (pt) { await go(a, '#ticket/' + pt.ref, '.tk-head'); await a.click('[data-tab=pay]'); await a.waitForTimeout(800); await shot(a, '44-tab-payments', { full: true }); }
    // intake form
    await go(a, '#intake', '[data-intake]'); await shot(a, '45-intake', { full: true });
    // new quotation editor
    await go(a, '#ticket/' + req.ref, '.tk-head'); await a.click('[data-tab=quotes]'); await a.waitForTimeout(500);
    const qn = await a.$('[data-qnew]');
    if (qn) { await qn.click(); await a.waitForSelector('[data-ops-modal][open] .q-lines'); await a.fill('[data-ops-modal] [data-line] input[name=desc] >> nth=0', 'Safari vehicle and driver'); await a.fill('[data-ops-modal] [data-line] input[name=cost] >> nth=0', '3200'); await a.fill('[data-ops-modal] input[name=selling]', '7500'); await a.selectOption('[data-ops-modal] select[name=vat]', 'exclusive'); await a.waitForTimeout(400); await shot(a, '46-quote-editor'); await a.keyboard.press('Escape'); }
  });

  // ---------- finance: verify deposit; management confirms; travelling → complete guard ----------
  const f = await asUser(FIN);
  let verifiedRef = null;
  await step('finance', async () => {
    await go(f, '#payments', '.pay-list'); await shot(f, '50-finance-verify', { mark: [['.pay-list [data-verify]', '1']] });
    verifiedRef = (await f.textContent('.pay-list li:first-child a')).trim();
    await f.click('.pay-list [data-verify]'); await f.waitForSelector('[data-ops-modal][open]'); await f.fill('[data-ops-modal] input[name=source]', 'FNB business account statement');
    await shot(f, '51-verify-modal', { mark: [['[data-ops-modal] input[name=source]', '2'], ['[data-ops-modal] button[type=submit]', '3']] });
    await f.click('[data-ops-modal] button[type=submit]'); await f.waitForSelector('.toast'); await f.waitForTimeout(800);
    check('finance verifies a demo deposit', /Deposit received/.test(await f.textContent('.toast')));
    await f.click('[data-pmode=balances]'); await f.waitForTimeout(600); await shot(f, '52-finance-balances', { full: true });
    await f.click('[data-pmode=refunds]'); await f.waitForTimeout(600); await shot(f, '53-finance-refunds');
  });
  await step('confirm', async () => {
    await go(m, '#ticket/' + verifiedRef, '.tk-head');
    await m.click('[data-act=status]'); await m.waitForSelector('[data-ops-modal][open]');
    await m.selectOption('[data-ops-modal] select[name=status]', 'BOOKING CONFIRMED'); await m.click('[data-ops-modal] button[type=submit]'); await m.waitForTimeout(1500);
    check('management confirms the booking once finance has verified the deposit', /BOOKING CONFIRMED/.test(await m.textContent('.tk-facts')));
    await shot(m, '54-confirmed-ticket');
    // the travelling trip has an outstanding balance: completion is refused until it's paid
    const all = (await call('listTickets', { view: 'tickets' }, MGR)).data.tickets;
    const trav = all.find(t => t.opStatus === 'IN PROGRESS / TRAVELLING');
    await go(m, '#ticket/' + trav.ref, '.tk-head'); await m.click('[data-act=status]'); await m.waitForSelector('[data-ops-modal][open]');
    await m.selectOption('[data-ops-modal] select[name=status]', 'COMPLETED'); await m.click('[data-ops-modal] button[type=submit]'); await m.waitForTimeout(1200);
    await shot(m, '55-complete-guard');
    check('a trip with an unpaid balance cannot be completed without a management note', !/COMPLETED/.test(await m.textContent('.tk-facts')));
    await m.fill('[data-ops-modal] textarea[name=note]', 'Balance to be paid on arrival back; approved by management'); await m.click('[data-ops-modal] button[type=submit]'); await m.waitForTimeout(1500);
    check('management can complete it with a note (override is recorded)', /COMPLETED/.test(await m.textContent('.tk-facts')));
  });
  // refund approval by a second finance person
  const f2 = await asUser(FIN2);
  await step('refund', async () => {
    await go(f2, '#payments', '[data-adm-body] .chips'); await f2.click('[data-pmode=refunds]'); await f2.waitForTimeout(600);
    await shot(f2, '56-refund-approve', { mark: [['[data-refund]', '1']] });
    await f2.click('[data-refund]'); await f2.waitForTimeout(400); const mod = await f2.$('[data-ops-modal][open] button[type=submit]'); if (mod) await mod.click();
    await f2.waitForTimeout(1500);
    check('a second finance person approves the demo refund', !(await f2.$('[data-refund]')));
  });

  // ---------- access: give, change role, revoke ----------
  await step('access', async () => {
    await go(o, '#users', '[data-invite]');
    await o.fill('[data-invite] input[name=email]', 'new.agent@demo.kcm.test'); await o.fill('[data-invite] input[name=name]', 'Lindiwe Zwane (demo)'); await o.selectOption('[data-invite] select[name=role]', 'OPERATIONS');
    await shot(o, '60-give-access', { mark: [['[data-invite] input[name=email]', '1'], ['[data-invite] select[name=role]', '2'], ['[data-invite] button[type=submit]', '3']] });
    await o.click('[data-invite] button[type=submit]'); await o.waitForSelector('.toast'); await o.waitForTimeout(1500);
    check('admin gives a new person Operations access', (await o.textContent('[data-adm-body]')).includes('new.agent@demo.kcm.test'));
    await o.selectOption('[data-ustatus="ayesha.ops@demo.kcm.test"]', 'disabled'); await o.waitForSelector('.toast'); await o.waitForTimeout(1000);
    const blocked = await call('listTickets', { view: 'mine' }, await (async () => { const x = await call('signIn', { email: 'ayesha.ops@demo.kcm.test', password: DEMO_PW }); return x.data && x.data.token; })());
    check('revoked user can no longer sign in or use the system', !blocked.ok);
    await go(o, '#users', '[data-invite]');
    await shot(o, '61-users-access', { full: true, mark: [['[data-role="sipho.ops@demo.kcm.test"]', 'A'], ['[data-ustatus="ayesha.ops@demo.kcm.test"]', 'B']] });
    await o.selectOption('[data-ustatus="ayesha.ops@demo.kcm.test"]', 'active'); await o.waitForTimeout(1000);
    const back = await call('signIn', { email: 'ayesha.ops@demo.kcm.test', password: DEMO_PW });
    check('access can be given back (status active again)', back.ok && back.data.token);
  });

  // ---------- partner review ----------
  await step('partner review', async () => {
    await go(o, '#applications');
    await o.click('tr[data-open]'); await o.waitForSelector('[data-decide=approve]'); await o.waitForTimeout(800);
    await shot(o, '62-application-detail', { mark: [['[data-decide=approve]', '1'], ['[data-decide=needs_info]', '2'], ['[data-decide=reject]', '3']] });
    await o.click('[data-decide=approve]'); await o.waitForSelector('.toast'); await o.waitForTimeout(1200);
    const apps = (await call('listApplications', {}, OWNER)).data;
    check('admin approves a demo partner application', (Array.isArray(apps) ? apps : apps.applications || []).some(x => /Blyde/.test(x.businessName) && x.status === 'Approved'));
  });

  // ---------- partner portal ----------
  await step('partner portal', async () => {
    const pt = (await call('signIn', { email: 'lowveld.partner0@demo.kcm.test', password: DEMO_PW })).data.token;
    const pp = await asUser(pt); await pp.goto(S + '/account'); await pp.waitForTimeout(2500); await shot(pp, '63-partner-portal', { full: true });
  });

  // ---------- customer profile, collapsed menu, dark mode, phone ----------
  await step('extras', async () => {
    const t = (await call('listTickets', { view: 'tickets' }, OWNER)).data.tickets.find(x => x.opStatus === 'COMPLETED');
    await go(o, '#ticket/' + t.ref, '.tk-head'); const prof = await o.$('a:has-text("Profile")'); if (prof) { await prof.click(); await o.waitForTimeout(1200); await shot(o, '64-customer-profile', { full: true }); }
    await go(o, '#workspace'); await o.click('[data-nav-group]:has-text("Website")'); await o.waitForTimeout(400);
    await shot(o, '65-menu-collapsed', { clip: { x: 0, y: 84, width: 240, height: 816 }, mark: [['[data-nav-group]:nth-of-type(1)', '1']] });
    await o.click('[data-nav-group]:has-text("Website")');
    await o.goto(S + '/admin?theme=dark#ops'); await o.waitForSelector('.ops-kpis'); await shot(o, '66-dark-mode');
    const ph = await asUser(OWNER, 390, 844, true);
    await ph.goto(S + '/admin#workspace'); await ph.waitForTimeout(2500); await shot(ph, '67-phone');
  });

  console.log('\nSTEP FAILURES', JSON.stringify(fails, null, 1));
  console.log('PAGE ERRORS', JSON.stringify(errs.slice(0, 10)));
  console.log(results.filter(r => r[1]).length + '/' + results.length + ' workflow checks passed');
  fs.writeFileSync(OUT + '/results.json', JSON.stringify({ results, fails, errs }, null, 1));
  await b.close();
})().catch(e => { console.log('FATAL', e.stack); process.exit(1); });
