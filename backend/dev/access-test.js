#!/usr/bin/env node
/**
 * Access redesign tests (v1.5): staff accounts with temporary passwords, sign-in by username, forced password change,
 * access profiles (tick-box permissions, several per person), consultants picking up unassigned tickets,
 * finance seeing only tickets with money, money-out approvals by a manager, no privilege escalation.
 *
 *   node backend/dev/mock-server.js &   # fresh emulator
 *   node backend/dev/access-test.js
 */
const crypto = require("crypto");
const API = process.env.API || "http://127.0.0.1:8787";
const results = [];
let current = "";
async function call(action, payload = {}, token) {
    const r = await fetch(API, { method: "POST", body: JSON.stringify(Object.assign({ action }, token ? { token } : {}, payload)) });
    return r.json();
}
async function ok(action, payload, token) { const r = await call(action, payload, token); if (!r.ok) throw new Error(`${action} failed: ${r.error}`); return r.data; }
function check(name, cond, detail) { results.push({ scenario: current, name, pass: !!cond }); if (!cond) console.log("   ✗", name, detail || ""); }
async function expectError(name, action, payload, token, re) {
    const r = await call(action, payload, token);
    check(name, !r.ok && (!re || re.test(r.error + " " + r.code)), r.ok ? "unexpectedly succeeded" : `${r.code}: ${r.error}`);
    return r;
}
const getJSON = async p => (await fetch(API + p)).json();
function totp(secret) {
    const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = ""; for (const c of secret) bits += B32.indexOf(c).toString(2).padStart(5, "0");
    const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
    const msg = Buffer.alloc(8); msg.writeUInt32BE(Math.floor(Date.now() / 30000), 4);
    const h = crypto.createHmac("sha1", key).update(msg).digest(); const o = h[19] & 15;
    return String(((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, "0");
}
async function lastCode(email) {
    const m = (await getJSON("/__mail")).reverse().find(e => e.to === email && /sign-in code/.test(e.subject));
    return /letter-spacing:4px">(\d{6})/.exec(m.htmlBody)[1];
}
/** Sign in with a temporary password, choose a new one, set up the authenticator if the profile needs it. */
async function firstSignIn(login, temp, newPw) {
    const r1 = await ok("signIn", { email: login, password: temp });
    let r = await ok("setFirstPassword", { challenge: r1.challenge, password: newPw });
    if (r.mfa === "setup") r = await ok("mfaSetupConfirm", { challenge: r.challenge, code: totp(r.secret) });
    return r;
}

(async () => {
    const T = {};
    const PW = "Lowveld-test-2026x", TEMP = "Welcome-KCM-2026";
    current = "Setup";
    await ok("requestCode", { email: "owner@example.com" });
    let r = await ok("resetPassword", { email: "owner@example.com", code: await lastCode("owner@example.com"), password: PW });
    r = await ok("mfaSetupConfirm", { challenge: r.challenge, code: totp(r.secret) });
    T.owner = r.token;
    const prof = await ok("listProfiles", {}, T.owner);
    check("built-in profiles: Administrator, Manager, Finance, Consultant, Website officer, Read-only",
        ["administrator", "manager", "finance", "consultant", "web", "readonly"].every(id => prof.profiles.some(p => p.id === id)) && prof.catalog.some(c => c.kind === "tab") && prof.catalog.some(c => c.kind === "action"));

    /* ---------- 1. admin creates an employee with a temporary password ---------- */
    current = "1 Create employee";
    await expectError("full name must include a surname", "saveUser", { email: "lindiwe@kcm.test.co", name: "Lindiwe", username: "lindiwe", jobTitle: "Travel Consultant", profiles: ["consultant"], tempPassword: TEMP }, T.owner, /surname/i);
    await expectError("a temporary password is required for a new employee", "saveUser", { email: "lindiwe@kcm.test.co", name: "Lindiwe Zulu", username: "lindiwe", profiles: ["consultant"] }, T.owner, /temporary password/i);
    await ok("saveUser", { email: "lindiwe@kcm.test.co", name: "Lindiwe Zulu", username: "lindiwe", jobTitle: "Travel Consultant", profiles: ["consultant"], tempPassword: TEMP }, T.owner);
    const mail = (await getJSON("/__mail")).reverse().find(m => m.to === "lindiwe@kcm.test.co");
    check("employee emailed that the account exists, but never the password", mail && /staff account/.test(mail.subject) && /lindiwe/.test(mail.htmlBody) && mail.htmlBody.indexOf(TEMP) === -1);
    await expectError("usernames are unique", "saveUser", { email: "other@kcm.test.co", name: "Other Person", username: "LINDIWE", profiles: ["consultant"], tempPassword: TEMP }, T.owner, /taken/i);
    const users = await ok("listUsers", {}, T.owner);
    const lu = users.find(u => u.email === "lindiwe@kcm.test.co");
    check("user list shows name, username, job role, profiles and 'must change password'", lu && lu.username === "lindiwe" && lu.jobTitle === "Travel Consultant" && lu.profiles.join() === "consultant" && lu.mustChangePassword);

    /* ---------- 2. the employee signs in with username + temporary password ---------- */
    current = "2 First sign-in";
    const s1 = await ok("signIn", { email: "lindiwe", password: TEMP });
    check("sign-in by username works; temporary password asks for a new password (no session yet)", s1.mustChangePassword === true && !!s1.challenge && !s1.token);
    await expectError("cannot keep the temporary password", "setFirstPassword", { challenge: s1.challenge, password: TEMP }, null, /not the temporary/i);
    const s2 = await ok("setFirstPassword", { challenge: s1.challenge, password: "Lindiwe-own-pass-77" });
    check("employee chooses own password and is signed in (consultant: no authenticator needed)", !!s2.token && s2.user.username === "lindiwe");
    T.lindiwe = s2.token;
    await expectError("the temporary password no longer works", "signIn", { email: "lindiwe@kcm.test.co", password: TEMP }, null, /incorrect/i);
    const me = await ok("me", {}, T.lindiwe);
    check("consultant has exactly the consultant profile's permissions",
        me.permissions.includes("ops.edit.own") && me.permissions.includes("ops.claim") && me.permissions.includes("ops.view.unassigned") && !me.permissions.includes("ops.view.all") && !me.permissions.includes("users.view"));

    /* ---------- 3. what the consultant cannot do ---------- */
    current = "3 No admin rights";
    await expectError("consultant cannot list users", "listUsers", {}, T.lindiwe, /access/i);
    await expectError("consultant cannot create or change users", "saveUser", { email: "x@kcm.test.co", name: "X Y", profiles: ["administrator"], tempPassword: TEMP }, T.lindiwe, /access/i);
    await expectError("consultant cannot build profiles", "saveProfile", { profile: { name: "Sneaky", permissions: ["users.manage"] } }, T.lindiwe, /access/i);
    await expectError("consultant cannot see the audit history", "activity", {}, T.lindiwe, /access/i);
    await expectError("consultant cannot see the operations overview", "opsOverview", {}, T.lindiwe, /access/i);

    /* ---------- 4. unassigned tickets: see and pick up ---------- */
    current = "4 Pick up tickets";
    const mk = async (name, phone) => (await ok("submitBooking", { booking: { tour: "Kruger Full-Day Open-Vehicle Safari", startDate: "2027-05-10", adults: 2, name, phone, consent: true, source: "website" } })).reference;
    const A = await mk("Ayanda Money", "0721110001"), B = await mk("Bongi Plain", "0721110002"), C = await mk("Carl Other", "0721110003");
    await ok("saveUser", { email: "thabo@kcm.test.co", name: "Thabo Mabuza", username: "thabo", jobTitle: "Travel Consultant", profiles: ["consultant"], tempPassword: TEMP }, T.owner);
    T.thabo = (await firstSignIn("thabo", TEMP, "Thabo-own-pass-77")).token;
    const un = await ok("listTickets", { view: "unassigned" }, T.lindiwe);
    check("consultant sees Unassigned tickets", [A, B, C].every(x => un.tickets.some(t => t.ref === x)));
    const tB = await ok("getTicket", { ref: B }, T.lindiwe);
    check("an unassigned ticket offers 'pick up' and is read-only until picked up", tB.allowed.claim === true && tB.allowed.edit === false);
    await expectError("consultant cannot assign a ticket to someone else", "assignTicket", { ref: C, assignee: "thabo@kcm.test.co" }, T.lindiwe, /access/i);
    const cl = await ok("claimTicket", { ref: A }, T.lindiwe);
    check("consultant picks up a ticket: it is assigned to them", cl.ticket.assignedTo === "lindiwe@kcm.test.co" && cl.ticket.opStatus === "ASSIGNED");
    await expectError("a ticket already picked up cannot be taken again", "claimTicket", { ref: A }, T.thabo, /already picked up|not found/i);
    await ok("claimTicket", { ref: C }, T.thabo);
    await expectError("consultant cannot open a colleague's ticket", "getTicket", { ref: C }, T.lindiwe, /not found/i);
    const mine = await ok("listTickets", { view: "mine" }, T.lindiwe);
    check("My tickets shows the picked-up ticket", mine.tickets.some(t => t.ref === A) && !mine.tickets.some(t => t.ref === C));
    const hist = (await ok("getTicket", { ref: A }, T.lindiwe)).history;
    check("pick-up is recorded in the ticket history", hist.some(h => h.action === "ticket_picked_up"));

    /* ---------- 5. change my own password ---------- */
    current = "5 Change password";
    await expectError("wrong current password is refused", "changeMyPassword", { current: "nope-nope-1", password: "Lindiwe-newer-88" }, T.lindiwe, /current password/i);
    await ok("changeMyPassword", { current: "Lindiwe-own-pass-77", password: "Lindiwe-newer-88" }, T.lindiwe);
    const again = await ok("signIn", { email: "lindiwe", password: "Lindiwe-newer-88" });
    check("employee signs in with the password they changed", !!again.token);
    T.lindiwe = again.token;

    /* ---------- 6. managers and profiles ---------- */
    current = "6 Managers & profiles";
    await ok("saveUser", { email: "zanele@kcm.test.co", name: "Zanele Khoza", username: "zanele", jobTitle: "Operations Manager", profiles: ["manager"], tempPassword: TEMP }, T.owner);
    const zr = await ok("signIn", { email: "zanele", password: TEMP });
    const zr2 = await ok("setFirstPassword", { challenge: zr.challenge, password: "Zanele-own-pass-77" });
    check("manager profile requires an authenticator app after the password change", zr2.mfa === "setup");
    T.zanele = (await ok("mfaSetupConfirm", { challenge: zr2.challenge, code: totp(zr2.secret) })).token;
    await ok("saveUser", { email: "musa@kcm.test.co", name: "Musa Ndlovu", username: "musa", jobTitle: "Driver-guide coordinator", profiles: ["consultant"], tempPassword: TEMP }, T.zanele);
    check("a manager creates employees like an admin", (await ok("listUsers", {}, T.zanele)).some(u => u.email === "musa@kcm.test.co"));
    await expectError("manager cannot give the Administrator profile", "saveUser", { email: "musa@kcm.test.co", profiles: ["administrator"] }, T.zanele, /do not have yourself/i);
    await expectError("nobody changes their own access", "saveUser", { email: "zanele@kcm.test.co", profiles: ["manager", "finance"] }, T.zanele, /your own access/i);
    const cp = await ok("saveProfile", { profile: { name: "Bookings clerk", description: "Website requests only", permissions: ["bookings.view", "bookings.update", "messages.view"] } }, T.zanele);
    check("a manager builds a new access profile by ticking tabs and actions", !!cp.id);
    await expectError("cannot build a profile with access you do not have", "saveProfile", { profile: { name: "Eraser", permissions: ["customers.erase"] } }, T.zanele, /do not have yourself/i);
    await expectError("the Administrator profile cannot be edited", "saveProfile", { profile: { id: "administrator", name: "Administrator", permissions: ["bookings.view"] } }, T.owner, /cannot be changed/i);
    await ok("saveUser", { email: "musa@kcm.test.co", profiles: ["consultant", cp.id] }, T.zanele);
    const musaU = (await ok("listUsers", {}, T.owner)).find(u => u.email === "musa@kcm.test.co");
    check("one person can hold several profiles", musaU.profiles.join() === "consultant," + cp.id);
    await expectError("a profile in use cannot be deleted", "deleteProfile", { id: cp.id }, T.zanele, /first/i);
    const mr = await ok("signIn", { email: "musa", password: TEMP });
    T.musa = (await ok("setFirstPassword", { challenge: mr.challenge, password: "Musa-own-pass-77" })).token;
    const musaMe = await ok("me", {}, T.musa);
    check("effective access = union of profiles (consultant + bookings clerk)", musaMe.permissions.includes("bookings.update") && musaMe.permissions.includes("ops.claim") && !musaMe.permissions.includes("ops.view.all"));

    /* ---------- 7. finance sees only tickets with money ---------- */
    current = "7 Finance view";
    const q = await ok("saveQuote", { ref: A, quote: { lines: [{ category: "Transport", description: "Day vehicle", cost: 2000 }], sellingPrice: 4000, vatMode: "exclusive", depositPct: 30 } }, T.lindiwe);
    await ok("quoteAction", { quoteId: q.id, step: "submit" }, T.lindiwe);
    await ok("quoteAction", { quoteId: q.id, step: "approve" }, T.zanele);
    await ok("quoteAction", { quoteId: q.id, step: "send" }, T.lindiwe);
    await ok("quoteAction", { quoteId: q.id, step: "accept" }, T.lindiwe);
    await ok("addNote", { ref: A, kind: "internal", content: "Customer prefers a window seat" }, T.lindiwe);
    await ok("saveUser", { email: "fiona@kcm.test.co", name: "Fiona Smith", username: "fiona", jobTitle: "Finance Administrator", profiles: ["finance"], tempPassword: TEMP }, T.owner);
    T.fiona = (await firstSignIn("fiona", TEMP, "Fiona-own-pass-77")).token;
    const ft = await ok("listTickets", {}, T.fiona);
    check("finance sees only tickets with a quotation or payment", ft.tickets.some(t => t.ref === A) && !ft.tickets.some(t => t.ref === B || t.ref === C));
    check("finance ticket rows are flagged read-only summary", ft.tickets.every(t => t.limited));
    const fa = await ok("getTicket", { ref: A }, T.fiona);
    check("finance opens the money summary: quotes and money, no notes, tasks or phone numbers", fa.limited && fa.quotes.length === 1 && fa.money.final > 0 && fa.notes.length === 0 && fa.tasks.length === 0 && !fa.customer.phone && fa.allowed.edit === false);
    await expectError("finance cannot open a ticket without money", "getTicket", { ref: B }, T.fiona, /not found/i);
    await expectError("finance cannot change a ticket", "updateTicket", { ref: A, fields: { budget: "R1" } }, T.fiona, /not change|not found|access/i);
    const tasksF = await ok("listTasks", {}, T.fiona);
    check("finance sees no tasks", tasksF.length === 0);

    /* ---------- 8. money out needs a manager ---------- */
    current = "8 Money out";
    const dep = await ok("recordPayment", { ref: A, payment: { type: "deposit", amount: 1380, method: "EFT", reference: "FNB-A1" } }, T.lindiwe);
    await ok("verifyPayment", { id: dep.id, decision: "verify", source: "FNB statement" }, T.fiona);
    const rf = await ok("recordPayment", { ref: A, payment: { type: "refund", amount: 200, method: "EFT", reference: "RF-A1", notes: "Goodwill" } }, T.fiona);
    await expectError("finance records a refund but cannot approve it", "approveRefund", { id: rf.id }, T.fiona, /access/i);
    await ok("saveUser", { email: "sam@kcm.test.co", name: "Sam Pillay", username: "sam", jobTitle: "Finance Manager", profiles: ["manager", "finance"], tempPassword: TEMP }, T.owner);
    T.sam = (await firstSignIn("sam", TEMP, "Sam-own-pass-7788")).token;
    const rf2 = await ok("recordPayment", { ref: A, payment: { type: "refund", amount: 100, method: "EFT", reference: "RF-A2", notes: "Second goodwill" } }, T.sam);
    await expectError("a manager who recorded a refund cannot approve their own (two-person rule)", "approveRefund", { id: rf2.id }, T.sam, /someone else/i);
    const ap = await ok("approveRefund", { id: rf.id }, T.zanele);
    check("a manager approves the refund finance recorded", ap.payment.approvalStatus === "Approved");
    // partner payouts
    const jobs = await call("listJobs", {}, T.fiona);
    check("finance can open partner trips & payouts", jobs.ok);

    /* ---------- 9. disabling and resetting ---------- */
    current = "9 Disable & reset";
    await ok("saveUser", { email: "thabo@kcm.test.co", status: "disabled" }, T.zanele);
    await expectError("a disabled employee's session stops working at once", "me", {}, T.thabo, /sign in/i);
    await expectError("a disabled employee cannot sign in", "signIn", { email: "thabo", password: "Thabo-own-pass-77" }, null, /disabled/i);
    await ok("saveUser", { email: "lindiwe@kcm.test.co", tempPassword: "Reset-KCM-2026x" }, T.zanele);
    await expectError("setting a new temporary password signs the employee out", "me", {}, T.lindiwe, /sign in/i);
    const rs = await ok("signIn", { email: "lindiwe", password: "Reset-KCM-2026x" });
    check("after a reset the employee must choose a new password again", rs.mustChangePassword === true);
    await expectError("the super admin cannot be changed", "saveUser", { email: "owner@example.com", status: "disabled" }, T.zanele, /super admin/i);
    const audit = await ok("activity", {}, T.owner);
    check("account and profile changes are in the audit history", ["user_created", "profile_created", "password_changed"].every(a => JSON.stringify(audit).includes(a)));

    const byS = {}; results.forEach(x => { byS[x.scenario] = byS[x.scenario] || [0, 0]; byS[x.scenario][x.pass ? 0 : 1]++; });
    console.log("\nScenario                 pass  fail"); Object.entries(byS).forEach(([k, [p, f]]) => console.log(k.padEnd(24), String(p).padStart(4), String(f).padStart(5)));
    const failed = results.filter(x => !x.pass).length;
    console.log(`\n${results.length - failed}/${results.length} checks passed${failed ? `, ${failed} FAILED` : ""}`);
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
