const { chromium } = require('playwright-core');
const crypto = require('crypto');
const S = 'http://127.0.0.1:5217', M = 'http://127.0.0.1:8787';
const J = async p => (await fetch(M + p)).json();
const call = async (action, payload = {}, token) => (await (await fetch(M, { method: 'POST', body: JSON.stringify(Object.assign({ action }, token ? { token } : {}, payload)) })).json());
const lastCode = async email => { const m = (await J('/__mail')).reverse().find(e => e.to === email && /sign-in code/.test(e.subject)); return /letter-spacing:4px">(\d{6})/.exec(m.htmlBody)[1]; };
function totp(secret) { const B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of secret) bits += B.indexOf(c).toString(2).padStart(5, '0'); const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2))); const msg = Buffer.alloc(8); msg.writeUInt32BE(Math.floor(Date.now() / 30000), 4); const h = crypto.createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15; return String(((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, '0'); }
const res = []; const check = (n, c, d) => { res.push(!!c); console.log(c ? '  ✓' : '  ✗', n, c ? '' : d || ''); };
(async () => {
  await call('requestCode', { email: 'owner@example.com' });
  let r = (await call('resetPassword', { email: 'owner@example.com', code: await lastCode('owner@example.com'), password: 'Lowveld-test-2026x' })).data;
  const OWNER = (await call('mfaSetupConfirm', { challenge: r.challenge, code: totp(r.secret) })).data.token;
  const NOMSA = (await call('signIn', { email: 'nomsa.ops@demo.kcm.test', password: 'Demo-Lowveld-2026' })).data.token;
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const asUser = async t => { const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); const u = (await call('me', {}, t)).data; await p.addInitScript(([t, u]) => localStorage.setItem('kcm-session', JSON.stringify({ token: t, user: u })), [t, u]); return p; };
  const p = await asUser(OWNER);
  // 1. click "Unassigned" -> pick Nomsa
  await p.goto(S + '/admin#unassigned'); await p.waitForSelector('.ops-table [data-qa]');
  const before = (await call('listTickets', { view: 'unassigned' }, OWNER)).data.tickets.length;
  const ref = await p.getAttribute('.ops-table tbody tr:first-child [data-qa]', 'data-qa');
  await p.click('.ops-table tbody tr:first-child [data-qa]'); await p.waitForSelector('.assign-menu');
  await p.waitForTimeout(400); await p.screenshot({ path: '/home/claude/ops-shots/assign-menu.png' });
  const opts = await p.$$eval('.assign-menu [data-to]', bs => bs.map(x => x.textContent));
  check('menu lists people whose profile lets them own tickets (finance-only Fiona is not offered; Sam, Manager + Finance, is)', opts.some(o => /Nomsa/.test(o)) && opts.some(o => /Sam Pillay/.test(o)) && !opts.some(o => /Fiona/.test(o)), opts.join(' | '));
  check('menu shows each person\'s active ticket count', opts.some(o => /active/.test(o)));
  await p.click('.assign-menu [data-to="nomsa.ops@demo.kcm.test"]'); await p.waitForSelector('.toast'); await p.waitForTimeout(1500);
  let t = (await call('getTicket', { ref }, OWNER)).data;
  check('clicking Unassigned and choosing Nomsa assigns the ticket', t.assignedTo === 'nomsa.ops@demo.kcm.test' && t.opStatus === 'ASSIGNED', t.assignedTo + ' ' + t.opStatus);
  check('the ticket leaves the Unassigned list', (await call('listTickets', { view: 'unassigned' }, OWNER)).data.tickets.length === before - 1 && !(await p.$(`[data-qa="${ref}"]`)));
  // 2. reassign from All Tickets
  await p.goto(S + '/admin#tickets'); await p.waitForSelector(`[data-qa="${ref}"]`);
  await p.click(`[data-qa="${ref}"]`); await p.waitForSelector('.assign-menu .is-current');
  check('current owner is marked in the menu', /Nomsa/.test(await p.textContent('.assign-menu .is-current')));
  await p.click('.assign-menu [data-to="sipho.ops@demo.kcm.test"]'); await p.waitForSelector('.toast'); await p.waitForTimeout(1500);
  t = (await call('getTicket', { ref }, OWNER)).data;
  check('reassigning to Sipho moves the ticket and keeps a handover note', t.assignedTo === 'sipho.ops@demo.kcm.test' && t.notes.some(n => n.kind === 'handover'));
  check('the list shows the new owner straight away', /Sipho/.test(await p.textContent(`[data-qa="${ref}"]`)));
  // 3. "More options" opens the full assign form
  await p.click(`[data-qa="${ref}"]`); await p.click('.assign-menu [data-more]'); await p.waitForSelector('[data-ops-modal][open] select[name=assignee]');
  check('More options opens the full form (handover note, supporters, deadline)', !!(await p.$('[data-ops-modal][open] textarea[name=handover]')));
  await p.keyboard.press('Escape');
  // 4. bulk: tick two tickets, assign to Ayesha
  await p.goto(S + '/admin#unassigned'); await p.waitForSelector('[data-sel]');
  const refs = await p.$$eval('[data-sel]', xs => xs.slice(0, 2).map(x => x.dataset.sel));
  for (const r2 of refs) await p.check(`[data-sel="${r2}"]`);
  await p.waitForSelector('[data-bulk]:not([hidden])');
  await p.selectOption('[data-bulk-to]', 'ayesha.ops@demo.kcm.test');
  await p.screenshot({ path: '/home/claude/ops-shots/assign-bulk.png' });
  await p.click('[data-bulk-go]'); await p.waitForSelector('.toast'); await p.waitForTimeout(2000);
  const owners = await Promise.all(refs.map(async r2 => (await call('getTicket', { ref: r2 }, OWNER)).data.assignedTo));
  check('bulk: two ticked tickets assigned to Ayesha in one go', owners.every(o => o === 'ayesha.ops@demo.kcm.test'), owners.join(','));
  // 5. unassign
  await p.goto(S + '/admin#tickets'); await p.waitForSelector(`[data-qa="${refs[0]}"]`);
  await p.click(`[data-qa="${refs[0]}"]`); await p.click('.assign-menu .assign-menu-unassign'); await p.waitForTimeout(1500);
  check('a ticket can be unassigned again', !(await call('getTicket', { ref: refs[0] }, OWNER)).data.assignedTo);
  // 6. operations staff see names, not the picker
  const a = await asUser(NOMSA); await a.goto(S + '/admin#mine'); await a.waitForSelector('.ops-table');
  check('Operations staff cannot reassign from the list (no picker or tick-boxes)', !(await a.$('[data-qa]')) && !(await a.$('[data-sel]')));
  const forged = await call('assignTicket', { ref, assignee: 'nomsa.ops@demo.kcm.test' }, NOMSA);
  check('and the backend refuses if they try anyway', !forged.ok);
  console.log('ERRORS', JSON.stringify(errs)); console.log(res.filter(Boolean).length + '/' + res.length + ' assignment checks passed');
  await b.close();
})().catch(e => { console.log('FAIL', e.stack); process.exit(1); });
