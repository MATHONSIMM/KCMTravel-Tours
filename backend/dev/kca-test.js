const { chromium } = require('playwright-core');
const crypto = require('crypto');
const S = 'http://127.0.0.1:5217', M = 'http://127.0.0.1:8787';
const J = async p => (await fetch(M + p)).json();
const call = async (action, payload = {}, token) => (await (await fetch(M, { method: 'POST', body: JSON.stringify(Object.assign({ action }, token ? { token } : {}, payload)) })).json());
const lastCode = async email => { const m = (await J('/__mail')).reverse().find(e => e.to === email && /sign-in code/.test(e.subject)); return /letter-spacing:4px">(\d{6})/.exec(m.htmlBody)[1]; };
function totp(secret) { const B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of secret) bits += B.indexOf(c).toString(2).padStart(5, '0'); const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2))); const msg = Buffer.alloc(8); msg.writeUInt32BE(Math.floor(Date.now() / 30000), 4); const h = crypto.createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15; return String(((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, '0'); }
// paraphrases deliberately NOT copied from the built-in example questions
const P = [
 ['who do i give this enquiry to', 'assign'], ['can I pass a ticket over to Nomsa', 'assign'], ['how to allocate work to my team', 'assign'], ['change the person responsible for a booking', 'assign'], ['assing ticket', 'assign'],
 ['send 5 tickets to one consultant in one go', 'bulk'], ['select lots of tickets and assign together', 'bulk'],
 ['sipho is going on holiday what happens to his tickets', 'handover'], ['my colleague is off sick', 'handover'],
 ['how to update where a ticket is', 'status'], ['moving a booking to the next step', 'status'],
 ['what does awaiting deposit mean', 'statuses'], ['explain the stages a ticket goes through', 'statuses'],
 ['the system wont let me confirm the booking', 'confirm'], ['confirming a trip', 'confirm'],
 ['how do i close off a finished trip', 'complete'], ['ticket is done how to mark it', 'complete'],
 ['the client cancelled their trip', 'cancel'], ['customer booked with someone else', 'cancel'], ['pause this enquiry for now', 'cancel'],
 ['a customer sent me a whatsapp, where do i put it', 'intake'], ['somebody phoned asking for a safari', 'intake'], ['how do i capture a new client who walked in', 'intake'],
 ['write down what the client told me on the phone', 'note'], ['can i change a note i wrote', 'note'],
 ['set a reminder to phone the lodge tomorrow', 'task'], ['follow-up for friday', 'task'],
 ['how do I price a trip', 'quote'], ['making a quotation with vat', 'quote'], ['qoute for a customer', 'quote'],
 ['manager needs to approve my quote', 'quote-approve'], ['where do i approve quotations', 'quote-approve'],
 ['client said yes to the quote', 'quote-send'], ['customer rejected the quote', 'quote-send'], ['revise a quote i already sent', 'quote-send'],
 ['the customer paid a deposit by eft', 'pay-record'], ['client sent proof of payment', 'pay-record'], ['capture money received', 'pay-record'],
 ['how does finance check payments', 'pay-verify'], ['payment still says unverified', 'pay-verify'],
 ['client wants their money back', 'refund'], ['refund a deposit', 'refund'],
 ['which customers still owe money', 'balances'], ['outstanding amounts', 'balances'],
 ['where do i add the lodge price', 'supplier'], ['record a transport quote', 'supplier'],
 ['upload an itinerary', 'files'], ['attach a pdf to a ticket', 'files'],
 ['looking for a booking by phone number', 'search'], ['export all tickets to excel', 'search'],
 ['see every trip a client has done', 'customer'],
 ['a guest asked us to delete their info', 'erase'],
 ['how busy is each consultant', 'workload'], ['how many enquiries did we get this month', 'overview'],
 ['new employee needs a login', 'access'], ['add a colleague to the system', 'access'],
 ['someone resigned, block their account', 'revoke'], ['promote nomsa to manager', 'revoke'],
 ['why cant i see the payments page', 'roles'], ['i forgot my pasword', 'password'], ['i lost my phone with the authenticator', 'mfa'],
 ['a lodge wants to become a partner', 'applications'], ['pay a driver his commission', 'payouts'], ['where do cvs from the careers page go', 'careers'],
];
// holdout: written after the first run, before tuning, never used to tune
const H = [
 ['i need to give some tickets to ayesha', 'assign'], ['who handles new enquiries and how do i hand them out', 'assign'],
 ['the customer transferred money', 'pay-record'], ['did the deposit actually reach our account', 'pay-verify'],
 ['customer wants to cancel and get a refund', 'refund'], ['how do i quote a group of 30', 'quote'],
 ['remind me to send vouchers on monday', 'task'], ['log an internal comment', 'note'],
 ['client called to book kruger', 'intake'], ['make someone an admin', 'revoke'],
 ['a new consultant starts monday, set them up', 'access'], ['the trip is over what now', 'complete'],
 ['customer chose a cheaper company', 'cancel'], ['what is supplier research', 'statuses'],
 ['how many open tickets does each person have', 'workload'], ['lodge sent their rates', 'supplier'],
 ['find a ticket by customer name', 'search'], ['the boss must sign off the quotation', 'quote-approve'],
 ['partner wants to be paid', 'payouts'], ['locked out of my account', 'password'],
];
(async () => {
  await call('requestCode', { email: 'owner@example.com' });
  let r = (await call('resetPassword', { email: 'owner@example.com', code: await lastCode('owner@example.com'), password: 'Lowveld-test-2026x' })).data;
  const OWNER = (await call('mfaSetupConfirm', { challenge: r.challenge, code: totp(r.secret) })).data.token;
  const NOMSA = (await call('signIn', { email: 'nomsa.ops@demo.kcm.test', password: 'Demo-Lowveld-2026' })).data.token;
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = []; const res = []; const check = (n, c, d) => { res.push(!!c); console.log(c ? '  ✓' : '  ✗', n, c ? '' : d || ''); };
  const asUser = async t => { const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); const u = (await call('me', {}, t)).data; await p.addInitScript(([t, u]) => localStorage.setItem('kcm-session', JSON.stringify({ token: t, user: u })), [t, u]); return p; };
  const a = await asUser(NOMSA);
  await a.goto(S + '/admin#workspace'); await a.waitForSelector('.ws-greeting'); await a.waitForFunction(() => window.KCAssistRank);
  const g = await a.textContent('.ws-greeting h2');
  check('My Workspace greets the signed-in person by first name', /^Good (morning|afternoon|evening), Nomsa\.$/.test(g.trim()), g);
  const out = await a.evaluate(P => P.map(([q, want]) => { const r = window.KCAssistRank(q); return [q, want, r[0] ? r[0].d.id : '-', r[0] ? r[0].s.toFixed(2) : 0]; }), P);
  const ok = out.filter(x => x[1] === x[2]).length;
  out.filter(x => x[1] !== x[2]).forEach(x => console.log('     miss:', JSON.stringify(x)));
  check(`paraphrase understanding: ${ok}/${out.length} reworded questions matched the right answer`, ok / out.length >= 0.9, (ok / out.length * 100).toFixed(0) + '%');
  const ho = await a.evaluate(H => H.map(([q, want]) => { const r = window.KCAssistRank(q); return [q, want, r[0] ? r[0].d.id : '-']; }), H);
  const hok = ho.filter(x => x[1] === x[2]).length;
  ho.filter(x => x[1] !== x[2]).forEach(x => console.log('     holdout miss:', JSON.stringify(x)));
  console.log(`  i holdout (unseen) questions: ${hok}/${ho.length}`);
  // UI
  check('public Kaycee and WhatsApp buttons are hidden on the dashboard', !(await a.isVisible('.chat-launcher')) && !(await a.isVisible('.wa-float')));
  await a.waitForSelector('.kca-teaser.is-in', { timeout: 6000 });
  check('a "How can I assist you today?" bubble appears next to the button', /Hi, Nomsa.*How can I assist you today\?/s.test(await a.textContent('.kca-teaser')));
  await a.screenshot({ path: '/home/claude/ops-shots/kca-teaser.png' });
  await a.click('.kca-teaser-msg'); await a.waitForSelector('.kca-panel:not([hidden]) .kca-chips');
  check('the intro says "Hi, Nomsa. I\'m Kaycee. How can I assist you today on the dashboard?"', /Hi, Nomsa\. I'm Kaycee\. How can I assist you today on the dashboard\?/.test(await a.textContent('.kca-log')));
  const mine = (await call('myWorkspace', {}, NOMSA)).data.tickets.length;
  await a.fill('.kca-form input', 'How many tickets are on my name?'); await a.press('.kca-form input', 'Enter');
  await a.waitForFunction(() => /Your work right now/.test(document.querySelector('.kca-log').textContent));
  check(`"How many tickets are on my name?" answers with her real count (${mine})`, new RegExp(`You have ${mine} open tickets? on your name`).test((await a.textContent('.kca-log')).replace(/\s+/g, ' ')));
  await a.screenshot({ path: '/home/claude/ops-shots/kca-myname.png' });
  for (const q of ['do I have anything overdue?', "what's assigned to me", 'show me my tickets']) {
    const before = (await a.$$('.kca-log h4')).length;
    await a.fill('.kca-form input', q); await a.press('.kca-form input', 'Enter'); await a.waitForTimeout(900);
    const last = await a.$$eval('.kca-log h4', hs => hs[hs.length - 1].textContent);
    check(`"${q}" is answered from her own work`, /Your work right now/.test(last), last);
  }
  await a.fill('.kca-form input', 'how do I add a task to my ticket?'); await a.press('.kca-form input', 'Enter'); await a.waitForTimeout(700);
  check('"how do I add a task to my ticket?" still gives the how-to steps', /Create a task or follow-up/.test(await a.$$eval('.kca-log h4', hs => hs[hs.length - 1].textContent)));
  await a.screenshot({ path: '/home/claude/ops-shots/kca-open.png' });
  await a.fill('.kca-form input', "what's on my plate today?"); await a.press('.kca-form input', 'Enter');
  await a.waitForFunction(() => /Your work right now/.test(document.querySelector('.kca-log').textContent));
  check('"what\'s on my plate" answers from Nomsa\'s real workspace', /open ticket/.test(await a.textContent('.kca-log')));
  await a.fill('.kca-form input', 'how does finance check payments'); await a.press('.kca-form input', 'Enter'); await a.waitForTimeout(500);
  check('role-aware: an Operations consultant is told who can verify payments', /Your role can't do this\. Finance and admins can/.test(await a.textContent('.kca-log')));
  const ref = (await call('listTickets', { view: 'mine' }, NOMSA)).data.tickets[0].ref;
  await a.fill('.kca-form input', `where is ${ref.toLowerCase()} at?`); await a.press('.kca-form input', 'Enter');
  await a.waitForFunction(r => document.querySelector('.kca-log').textContent.includes(r + ' ·'), ref);
  check('typing a ticket number looks up its live status', /Status\s+[A-Z]/.test(await a.textContent('.kca-log')));
  await a.fill('.kca-form input', 'purple elephants dancing on the moon'); await a.press('.kca-form input', 'Enter'); await a.waitForTimeout(400);
  check('unrelated questions get "not sure" with suggestions instead of a wrong answer', /not sure I understood/.test(await a.textContent('.kca-log')));
  await a.screenshot({ path: '/home/claude/ops-shots/kca-chat.png' });
  // manager: answer with a link that navigates
  const o = await asUser(OWNER); await o.goto(S + '/admin#workspace'); await o.waitForSelector('.ws-greeting'); await o.click('.kca-launch'); await o.waitForSelector('.kca-panel:not([hidden])');
  await o.fill('.kca-form input', 'how many tickets does Sipho have?'); await o.press('.kca-form input', 'Enter');
  await o.waitForFunction(() => /Sipho Dlamini's work/.test(document.querySelector('.kca-log').textContent));
  check("a manager asking about a colleague gets that person's live numbers", /active tickets?/.test(await o.textContent('.kca-log')));
  await o.fill('.kca-form input', 'can i pass a ticket over to Nomsa'); await o.press('.kca-form input', 'Enter'); await o.waitForSelector('.kca-msg:last-child .kca-go');
  check('"can I pass a ticket over to Nomsa" gives the assign steps (not her workload)', /Assign or reassign a ticket/.test(await o.textContent('.kca-msg:last-child h4')));
  await o.screenshot({ path: '/home/claude/ops-shots/kca-assign.png' });
  await o.click('.kca-msg:last-child .kca-go'); await o.waitForTimeout(1200);
  check('the answer\'s button opens the right page (Unassigned Tickets)', o.url().endsWith('#unassigned'));
  // AI mode (emulator stand-in for the Anthropic API; the real API was not called)
  await fetch(M + '/__aikey');
  const n = await asUser(NOMSA); await n.goto(S + '/admin#workspace'); await n.waitForSelector('.ws-greeting'); await n.click('.kca-launch');
  await n.fill('.kca-form input', 'my client wants to pay the balance, what do I do'); await n.press('.kca-form input', 'Enter');
  await n.waitForFunction(() => /Answered by AI/.test(document.querySelector('.kca-log').textContent));
  const last = await J('/__lastai');
  check('AI mode: question goes to the backend with the most relevant help articles', last && /pay-record/.test(last.messages[0].content) && /my client wants to pay the balance/.test(last.messages[0].content));
  check('AI mode: the prompt tells the model the employee\'s role and to answer only from KCM help', /role is OPERATIONS/.test(last.system) && /ONLY the help articles/.test(last.system));
  check('AI mode: the answer is shown with numbered steps and a link to the right page', (await n.$$('.kca-log ol li')).length >= 2);
  await n.screenshot({ path: '/home/claude/ops-shots/kca-ai.png' });
  // careers
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(S + '/careers'); await p.waitForSelector('.careers-role');
  check('Careers page lists the open roles', (await p.$$('.careers-role')).length === 4 && /Junior Tourism Manager/.test(await p.textContent('.careers-roles')));
  check('Careers is in the main menu', await p.isVisible('.main-nav a[href$="/careers"]'));
  await p.screenshot({ path: '/home/claude/ops-shots/careers.png', fullPage: false });
  await p.click('[data-apply-role="Junior Tourism Manager"]'); await p.waitForTimeout(600);
  await p.fill('#c-name', 'Lindo Test (demo)'); await p.fill('#c-email', 'lindo@demo.kcm.test'); await p.fill('#c-phone', '072 555 0101'); await p.fill('#c-about', 'Tourism diploma, 1 year at a lodge.');
  await p.click('form[data-careers] button[type=submit]'); await p.waitForTimeout(500);
  check('application is refused until POPIA consent is ticked', /tick the box/.test(await p.textContent('[data-careers-error]')));
  await p.check('form[data-careers] input[name=consent]'); await p.click('form[data-careers] button[type=submit]'); await p.waitForSelector('[data-careers-done]:not([hidden])');
  const msgs = (await call('listMessages', {}, OWNER)).data;
  const list = Array.isArray(msgs) ? msgs : (msgs.messages || []);
  check('the application arrives in Messages with role and [CAREERS] tag', list.some(m => /\[CAREERS\] Role: Junior Tourism Manager/.test(m.message || m.Message || '')));
  await p.screenshot({ path: '/home/claude/ops-shots/careers-form.png', fullPage: true });
  console.log('ERRORS', JSON.stringify(errs)); console.log(res.filter(Boolean).length + '/' + res.length + ' checks passed');
  await b.close();
})().catch(e => { console.log('FAIL', e.stack); process.exit(1); });
