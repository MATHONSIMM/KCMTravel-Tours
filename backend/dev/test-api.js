#!/usr/bin/env node
/**
 * KCM backend regression tests: Operations Centre acceptance scenarios 1–7 + security cases.
 * Runs against the local Apps Script emulator (fresh, empty database):
 *
 *   node backend/dev/mock-server.js &      # http://127.0.0.1:8787
 *   node backend/dev/test-api.js           # exits 1 if any check fails
 *
 * Every check below is executed; the summary counts what actually ran.
 */
const crypto = require("crypto");
const API = process.env.API || "http://127.0.0.1:8787";
const results = [];
let current = "";

async function call(action, payload = {}, token) {
    const r = await fetch(API, { method: "POST", body: JSON.stringify(Object.assign({ action }, token ? { token } : {}, payload)) });
    return r.json();
}
async function ok(action, payload, token) {
    const r = await call(action, payload, token);
    if (!r.ok) throw new Error(`${action} failed: ${r.error}`);
    return r.data;
}
function check(name, cond, detail) { results.push({ scenario: current, name, pass: !!cond, detail: cond ? "" : (detail || "") }); if (!cond) console.log("   ✗", name, detail || ""); }
async function expectError(name, action, payload, token, re) {
    const r = await call(action, payload, token);
    check(name, !r.ok && (!re || re.test(r.error + " " + r.code)), r.ok ? "unexpectedly succeeded" : `${r.code}: ${r.error}`);
    return r;
}
const getJSON = async p => (await fetch(API + p)).json();
function totp(secret, offset = 0) {
    const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = ""; for (const c of secret) bits += B32.indexOf(c).toString(2).padStart(5, "0");
    const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
    const msg = Buffer.alloc(8); msg.writeUInt32BE(Math.floor(Date.now() / 30000) + offset, 4);
    const h = crypto.createHmac("sha1", key).update(msg).digest(); const o = h[19] & 15;
    return String(((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, "0");
}
async function lastCode(email) {
    const m = (await getJSON("/__mail")).reverse().find(e => e.to === email && /sign-in code/.test(e.subject));
    return /letter-spacing:4px">(\d{6})/.exec(m.htmlBody)[1];
}
const secrets = {};
/** First sign-in for an invited user: email code → choose password → (privileged) set up authenticator. */
async function onboard(email, password) {
    await ok("requestCode", { email });
    let r = await ok("resetPassword", { email, code: await lastCode(email), password });
    if (r.mfa === "setup") { secrets[email] = r.secret; r = await ok("mfaSetupConfirm", { challenge: r.challenge, code: totp(r.secret) }); }
    return r;
}
async function login(email, password) {
    let r = await ok("signIn", { email, password });
    if (r.mfa === "verify") { await new Promise(res => setTimeout(res, 30500 - (Date.now() % 30000) + 200)); r = await ok("mfaVerify", { challenge: r.challenge, code: totp(secrets[email]) }); }
    return r;
}
const PNG = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]).toString("base64");
const FAKE_PDF = "data:application/pdf;base64," + Buffer.from("<script>alert(1)</script> not a pdf").toString("base64");

(async () => {
    const T = {};
    const PW = "Lowveld-test-2026x";
    /* ---------------- staff setup ---------------- */
    current = "Setup";
    const owner = await onboard("owner@example.com", PW);
    check("owner (SUPER_ADMIN) must set up MFA and gets 8 recovery codes", owner.token && owner.recoveryCodes && owner.recoveryCodes.length === 8);
    T.owner = owner.token;
    for (const [email, role] of [["manager@kcm.test.co", "MANAGEMENT"], ["finance@kcm.test.co", "FINANCE"], ["finance2@kcm.test.co", "FINANCE"], ["agent1@kcm.test.co", "OPERATIONS"], ["agent2@kcm.test.co", "OPERATIONS"], ["admin2@kcm.test.co", "ADMIN"]]) {
        await ok("saveUser", { email, role, name: role.toLowerCase() + " " + email.split("@")[0] }, T.owner);
        T[email.split("@")[0]] = (await onboard(email, PW)).token;
    }
    check("OPERATIONS staff are not forced to use MFA", !secrets["agent1@kcm.test.co"] && !!T.agent1);
    check("FINANCE and MANAGEMENT must use MFA", !!secrets["finance@kcm.test.co"] && !!secrets["manager@kcm.test.co"]);
    const me = await ok("me", {}, T.agent1);
    check("me returns role + permissions, never hashes or secrets", me.role === "OPERATIONS" && Array.isArray(me.permissions) && !JSON.stringify(me).match(/argon|PasswordHash|MfaSecret|Recovery/i));

    /* ---------------- Scenario 1: new customer enquiry ---------------- */
    current = "1 New enquiry";
    const idem = crypto.randomUUID();
    const booking = { tourSlug: "kruger-day-safari", tour: "Kruger Full-Day Open-Vehicle Safari", startDate: "2027-03-14", nights: 0, adults: 2, children: 1, infants: 0, pensioners: 0, room: "double", extraCodes: ["transfer"], payment: "deposit", total: 1, name: "Lerato Khumalo", email: "lerato@example.com", phone: "071 234 5678", notes: "Celebrating a birthday", consent: true, source: "website" };
    await expectError("booking without POPIA consent is refused", "submitBooking", { booking: Object.assign({}, booking, { consent: false }) }, null, /privacy/i);
    const sub = await ok("submitBooking", { booking, idempotencyKey: idem });
    T.ref1 = sub.reference;
    check("ticket number generated by the server in KCM-YYYY-NNNNNN format", /^KCM-\d{4}-\d{6}$/.test(sub.reference), sub.reference);
    check("tampered browser price (R1) ignored; server estimate used", sub.estimate === 2 * 1650 + 1650 * 0.5 + 950, String(sub.estimate));
    const again = await ok("submitBooking", { booking, idempotencyKey: idem });
    check("same submission retried (idempotency key) returns the same ticket", again.reference === sub.reference);
    const incoming = await ok("listTickets", { view: "incoming" }, T.manager);
    const t1 = incoming.tickets.find(t => t.ref === T.ref1);
    check("management sees the new ticket in Incoming Enquiries", !!t1 && t1.opStatus === "NEW ENQUIRY" && t1.source === "Website booking form");
    check("customer details captured and linked by customer reference", t1 && /^CUS-\d{6}$/.test(t1.customerRef) && t1.customerName === "Lerato Khumalo");
    const chat = await ok("submitBooking", { booking: { tour: "Kruger Full-Day Open-Vehicle Safari", startDate: "2027-04-01", adults: 2, name: "Lerato K", phone: "0712345678", consent: true, source: "chat", kaycee: { style: "Safari & wildlife", region: "Kruger & Panorama", budget: "R2 000–R4 000" } } });
    const t2 = (await ok("getTicket", { ref: chat.reference }, T.manager));
    check("Kaycee enquiry creates a ticket with source 'Kaycee AI' and her collected fields", t2.source === "Kaycee AI" && t2.fields.Destination === "Kruger & Panorama" && t2.fields.Budget === "R2 000–R4 000");
    check("same phone number links to the existing customer (no duplicate)", t2.customerRef === t1.customerRef);
    const unassigned = await ok("listTickets", { view: "unassigned" }, T.manager);
    check("new tickets appear in Unassigned Tickets", unassigned.tickets.some(t => t.ref === T.ref1));
    const mgrNotes = await ok("listNotifications", {}, T.manager);
    check("management is notified of new enquiries (internal notification)", mgrNotes.items.some(n => n.type === "new_enquiry" && n.ref === T.ref1));
    // manual WhatsApp intake
    const manual = await ok("createTicket", { customer: { name: "Sipho Dlamini", phone: "082 555 0101", whatsapp: "082 555 0101", type: "Family", consent: true },
        fields: { source: "WhatsApp", enquiryType: "Package tour", description: "Family of 5, Kruger in April", destination: "Kruger", adults: 2, children: 3 } }, T.agent1);
    check("employee can register a WhatsApp enquiry manually; agent owns it", /^KCM-/.test(manual.ref));
    const mt = await ok("getTicket", { ref: manual.ref }, T.agent1);
    check("manual intake: agent assigned to their own registration, checklist created", mt.assignedTo === "agent1@kcm.test.co" && mt.checklist.length > 20);

    /* ---------------- Scenario 2: assignment ---------------- */
    current = "2 Assignment";
    let tk = await ok("getTicket", { ref: T.ref1 }, T.manager);
    check("day tour got the day-tour checklist (no accommodation section)", !tk.checklist.some(c => c.section === "Accommodation") && tk.checklist.some(c => c.section === "Transport"));
    const as = await ok("assignTicket", { ref: T.ref1, assignee: "agent1@kcm.test.co", priority: "High", version: tk.version }, T.manager);
    check("manager assigns the ticket; status moves to ASSIGNED", as.ticket.assignedTo === "agent1@kcm.test.co" && as.ticket.opStatus === "ASSIGNED");
    const ws = await ok("myWorkspace", {}, T.agent1);
    check("employee sees it in My Workspace", ws.tickets.some(t => t.ref === T.ref1));
    check("workflow created a 'contact the customer' task for the employee", ws.pending.concat(ws.overdue).some(k => k.ref === T.ref1 && /Contact the customer/.test(k.title)));
    const an = await ok("listNotifications", {}, T.agent1);
    check("employee receives an assignment notification", an.items.some(n => n.type === "assigned" && n.ref === T.ref1));

    /* ---------------- Scenario 3: processing ---------------- */
    current = "3 Processing";
    tk = await ok("getTicket", { ref: T.ref1 }, T.agent1);
    const up = await ok("updateTicket", { ref: T.ref1, version: tk.version, fields: { specialRequests: "Birthday cake on arrival", accessibility: "One traveller uses a walking stick", nextAction: "Check vehicle availability", budget: "R6 000" } }, T.agent1);
    check("employee updates requirements", up.version === tk.version + 1);
    await expectError("stale version is refused (no silent overwrite)", "updateTicket", { ref: T.ref1, version: tk.version, fields: { budget: "R1" } }, T.agent1, /conflict|someone else/i);
    const mass = await ok("updateTicket", { ref: T.ref1, version: up.version, fields: { OpStatus: "BOOKING CONFIRMED", opStatus: "BOOKING CONFIRMED", paymentStatus: "Fully paid", assignedTo: "agent2@kcm.test.co", Ref: "KCM-1", priority: "Low" } }, T.agent1).catch(e => ({ error: e.message }));
    tk = await ok("getTicket", { ref: T.ref1 }, T.agent1);
    check("mass assignment blocked: status, payment, assignee, ref can't be set via update; agents can't change priority", tk.opStatus === "ASSIGNED" && tk.paymentStatus === "Not invoiced" && tk.assignedTo === "agent1@kcm.test.co" && tk.priority === "High", JSON.stringify(mass).slice(0, 120));
    const item = tk.checklist.find(c => c.label === "Customer details verified");
    const ci = await ok("updateChecklistItem", { id: item.id, done: true, notes: "Called Lerato" }, T.agent1);
    check("checklist item completed with who and when", ci.done && ci.doneBy === "agent1@kcm.test.co" && ci.doneAt);
    const note = await ok("addNote", { ref: T.ref1, kind: "customer", channel: "Phone call", content: "Spoke to Lerato <script>alert(1)</script>: prefers a 05:30 pickup.", followUp: { title: "Confirm pickup time with driver", due: new Date(Date.now() + 86400000).toISOString().slice(0, 10) } }, T.agent1);
    check("internal note added and follow-up task created from it", note.id && note.taskId);
    const task = await ok("createTask", { ref: T.ref1, title: "Get transport quote", priority: "High", due: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) }, T.agent1);
    check("employee creates a task", !!task.id);
    await expectError("agent cannot give tasks to other employees", "createTask", { ref: T.ref1, title: "x", assignedTo: "agent2@kcm.test.co" }, T.agent1, /management/i);
    const sq = await ok("addSupplierQuote", { ref: T.ref1, supplierQuote: { supplierName: "Lowveld Shuttles", service: "Transport: Kruger day vehicle", amount: 2600, status: "Received", notes: "Spoke to Thabo" } }, T.agent1);
    check("supplier quotation recorded", !!sq.id);
    tk = await ok("getTicket", { ref: T.ref1 }, T.agent1);
    check("supplier contact moved status to SUPPLIER RESEARCH and ticked the checklist", tk.opStatus === "SUPPLIER RESEARCH" && tk.checklist.find(c => c.label === "Transport quotation received").done);
    await expectError("status guard: cannot jump to BOOKING CONFIRMED", "setTicketStatus", { ref: T.ref1, status: "BOOKING CONFIRMED", version: tk.version }, T.agent1, /management|accepted|deposit/i);
    await expectError("status guard: cannot mark QUOTATION SENT without sending a quote", "setTicketStatus", { ref: T.ref1, status: "QUOTATION SENT", version: tk.version }, T.agent1, /quotation/i);
    const st = await ok("setTicketStatus", { ref: T.ref1, status: "REQUIREMENTS UNDER REVIEW", version: tk.version }, T.agent1);
    check("employee updates the status (allowed transition)", st.ticket.opStatus === "REQUIREMENTS UNDER REVIEW");

    /* ---------------- Scenario 4: absence / handover ---------------- */
    current = "4 Handover";
    tk = await ok("getTicket", { ref: T.ref1 }, T.manager);
    const before = { notes: tk.notes.length, done: tk.checklist.filter(c => c.done).length, history: tk.history.length };
    await ok("assignTicket", { ref: T.ref1, assignee: "agent2@kcm.test.co", version: tk.version, handoverSummary: "Transport quote in. Next: prepare quotation. Customer prefers WhatsApp." }, T.manager);
    const t4 = await ok("getTicket", { ref: T.ref1 }, T.agent2);
    check("new employee opens the ticket (same ticket, not a new one)", t4.ref === T.ref1 && t4.assignedTo === "agent2@kcm.test.co");
    check("previous notes intact plus a handover note", t4.notes.length === before.notes + 1 && t4.notes.some(n => n.kind === "handover" && /Transport quote in/.test(n.content)) && t4.notes.some(n => n.author === "agent1@kcm.test.co"));
    check("completed checklist items kept", t4.checklist.filter(c => c.done).length === before.done);
    check("open tasks moved to the new employee; history keeps agent1's work", t4.tasks.filter(k => k.status !== "COMPLETED").every(k => k.assignedTo === "agent2@kcm.test.co") && t4.history.some(h => h.actor === "agent1@kcm.test.co"));
    check("handover view has customer, requirements, supplier quotes, payment status, next action", t4.customer.name === "Lerato Khumalo" && t4.fields.SpecialRequests && t4.supplierQuotes.length === 1 && t4.paymentStatus && t4.nextAction);
    await expectError("previous employee no longer has access (least privilege)", "getTicket", { ref: T.ref1 }, T.agent1, /not found/i);
    const n2 = await ok("listNotifications", {}, T.agent2);
    check("new employee notified of the reassignment", n2.items.some(n => n.type === "reassigned" && n.ref === T.ref1));

    /* ---------------- Scenario 5: quotation ---------------- */
    current = "5 Quotation";
    const q1 = await ok("saveQuote", { ref: T.ref1, quote: { lines: [{ category: "Transport", description: "Day vehicle", cost: 2600 }, { category: "Activities", description: "Park fees", cost: 1200 }], sellingPrice: 6000, discount: 300, vatMode: "exclusive", depositPct: 30, validUntil: "2027-01-31" } }, T.agent2);
    check("backend calculates VAT, final, deposit and margin", q1.calc.final === 6555 && q1.calc.vat === 855 && q1.calc.deposit === 1966.5 && q1.calc.margin === 1900, JSON.stringify(q1.calc));
    await ok("quoteAction", { quoteId: q1.id, step: "submit" }, T.agent2);
    await expectError("an agent cannot approve a quotation", "quoteAction", { quoteId: q1.id, step: "approve" }, T.agent2, /management/i);
    await expectError("an unapproved quotation cannot be sent", "quoteAction", { quoteId: q1.id, step: "send" }, T.agent2, /approved/i);
    await ok("quoteAction", { quoteId: q1.id, step: "approve" }, T.manager);
    const sent1 = await ok("quoteAction", { quoteId: q1.id, step: "send", emailCustomer: true }, T.agent2);
    check("approved quotation sent; customer emailed", sent1.quote.status === "Sent" && (await getJSON("/__mail")).some(m => m.to === "lerato@example.com" && /quotation/.test(m.subject)));
    const q2 = await ok("saveQuote", { ref: T.ref1, quote: { lines: [{ category: "Transport", description: "Day vehicle", cost: 2600 }, { category: "Activities", description: "Park fees", cost: 1200 }], sellingPrice: 5800, vatMode: "exclusive", depositPct: 30 } }, T.agent2);
    await ok("quoteAction", { quoteId: q2.id, step: "approve" }, T.manager);
    await ok("quoteAction", { quoteId: q2.id, step: "send" }, T.agent2);
    const quotes = (await ok("getTicket", { ref: T.ref1 }, T.agent2)).quotes;
    check("revised quotation is a new version; version 1 kept (superseded, not overwritten)", quotes.length === 2 && quotes[0].version === 2 && quotes[1].version === 1 && quotes[1].status === "Superseded" && quotes[1].final === 6555);
    await expectError("cannot record payment before acceptance", "recordPayment", { ref: T.ref1, payment: { type: "deposit", amount: 100, method: "Cash" } }, T.agent2, /acceptance/i);
    const acc = await ok("quoteAction", { quoteId: q2.id, step: "accept", note: "Accepted on WhatsApp" }, T.agent2);
    tk = await ok("getTicket", { ref: T.ref1 }, T.agent2);
    check("customer acceptance recorded on the quotation and the ticket", acc.quote.status === "Accepted" && tk.opStatus === "ACCEPTED BY CUSTOMER" && tk.responseStatus === "Accepted" && acc.paymentStatus === "Deposit pending");
    check("separate statuses: operational ≠ payment ≠ response", tk.opStatus !== tk.paymentStatus && tk.paymentStatus !== tk.responseStatus);

    /* ---------------- Scenario 6: payment ---------------- */
    current = "6 Payment";
    const final = 6670, deposit = 2001; // 5800 + 15% VAT; 30%
    check("accepted quote amounts", tk.money.final === final && tk.money.deposit === deposit, JSON.stringify(tk.money));
    const payKey = crypto.randomUUID();
    const p1 = await ok("recordPayment", { ref: T.ref1, payment: { type: "deposit", amount: deposit, method: "EFT", reference: "FNB-8821", paidOn: new Date().toISOString().slice(0, 10) }, idempotencyKey: payKey }, T.agent2);
    check("deposit recorded as UNVERIFIED by the agent", p1.id && p1.paymentStatus === "Deposit pending");
    const dup = await ok("recordPayment", { ref: T.ref1, payment: { type: "deposit", amount: deposit, method: "EFT", reference: "FNB-8821" }, idempotencyKey: payKey }, T.agent2);
    check("double-submit with the same idempotency key does not duplicate", dup.duplicate === true && dup.id === p1.id);
    await expectError("same bank reference cannot be recorded twice", "recordPayment", { ref: T.ref1, payment: { type: "deposit", amount: deposit, method: "EFT", reference: "fnb-8821" } }, T.agent2, /already recorded/i);
    tk = await ok("getTicket", { ref: T.ref1 }, T.manager);
    await expectError("booking cannot be confirmed before finance verifies the deposit", "setTicketStatus", { ref: T.ref1, status: "BOOKING CONFIRMED", version: tk.version }, T.manager, /verified/i);
    await expectError("agent cannot verify payments", "verifyPayment", { id: p1.id, decision: "verify", source: "x" }, T.agent2, /access/i);
    await expectError("finance must say how the payment was verified", "verifyPayment", { id: p1.id, decision: "verify" }, T.finance, /verified it/i);
    const v1 = await ok("verifyPayment", { id: p1.id, decision: "verify", source: "FNB statement 19 Nov" }, T.finance);
    check("finance verifies; status 'Deposit received'; outstanding balance correct", v1.paymentStatus === "Deposit received" && v1.outstanding === final - deposit, JSON.stringify(v1));
    await expectError("a verified payment cannot be re-verified or edited", "verifyPayment", { id: p1.id, decision: "reject" }, T.finance2, /already/i);
    tk = await ok("getTicket", { ref: T.ref1 }, T.manager);
    const conf = await ok("setTicketStatus", { ref: T.ref1, status: "BOOKING CONFIRMED", version: tk.version }, T.manager);
    check("management confirms the booking after verification", conf.ticket.opStatus === "BOOKING CONFIRMED");
    const p2 = await ok("recordPayment", { ref: T.ref1, payment: { type: "balance", amount: final - deposit, method: "EFT", reference: "FNB-9900" } }, T.finance);
    await expectError("finance cannot verify a payment they recorded themselves", "verifyPayment", { id: p2.id, decision: "verify", source: "statement" }, T.finance, /someone other/i);
    const v2 = await ok("verifyPayment", { id: p2.id, decision: "verify", source: "FNB statement 20 Nov" }, T.finance2);
    check("second finance user verifies; fully paid, nothing outstanding", v2.paymentStatus === "Fully paid" && v2.outstanding === 0);
    const rf = await ok("recordPayment", { ref: T.ref1, payment: { type: "refund", amount: 500, method: "EFT", reference: "RF-1", notes: "Goodwill refund: late pickup" } }, T.finance);
    await expectError("refund needs a different approver (two-person rule)", "approveRefund", { id: rf.id }, T.finance, /different person/i);
    const ar = await ok("approveRefund", { id: rf.id }, T.admin2);
    check("refund approved by a second person; balance updates", ar.paymentStatus === "Partially paid");
    const pl = await ok("listPayments", {}, T.finance);
    const hist = (await ok("getTicket", { ref: T.ref1 }, T.manager)).history.map(h => h.action);
    check("financial history auditable (recorded, verified, refund requested/approved)", ["payment_recorded", "payment_verified", "refund_requested", "refund_approved", "payment_status"].every(a => hist.includes(a)) && pl.payments.length >= 3);

    /* ---------------- Scenario 7: security ---------------- */
    current = "7 Security";
    await expectError("unauthenticated call to a protected endpoint is refused", "listTickets", {}, null, /sign in/i);
    await expectError("forged token is refused", "getTicket", { ref: T.ref1 }, "deadbeef".repeat(8), /expired|sign in/i);
    await expectError("employee cannot access restricted finance operations (list payments)", "listPayments", {}, T.agent2, /access/i);
    await expectError("employee cannot assign tickets", "assignTicket", { ref: manual.ref, assignee: "agent2@kcm.test.co" }, T.agent1, /access/i);
    await expectError("IDOR: employee cannot open another employee's ticket", "getTicket", { ref: manual.ref }, T.agent2, /not found/i);
    await expectError("IDOR: employee cannot add notes to another employee's ticket", "addNote", { ref: manual.ref, content: "x" }, T.agent2, /not found/i);
    await expectError("employee cannot change their own role (no user management)", "saveUser", { email: "agent1@kcm.test.co", role: "ADMIN" }, T.agent1, /access/i);
    await expectError("admin cannot change their own role", "saveUser", { email: "admin2@kcm.test.co", role: "MANAGEMENT" }, T.admin2, /own access/i);
    await expectError("admin cannot create another admin (super admin only)", "saveUser", { email: "x@kcm.test.co", role: "ADMIN" }, T.admin2, /super admin/i);
    await expectError("nobody can assign SUPER_ADMIN", "saveUser", { email: "y@kcm.test.co", role: "SUPER_ADMIN" }, T.owner, /super admin/i);
    await expectError("manager cannot erase customer data", "eraseCustomer", { ref: t1.customerRef, reason: "x" }, T.manager, /access/i);
    await expectError("POPIA erase blocked while tickets are open", "eraseCustomer", { ref: t1.customerRef, reason: "Customer request 19 Nov" }, T.owner, /open tickets/i);
    const pubActions = ["ping", "ratingInfo", "partnerTypes"];
    let leaked = false;
    for (const a of pubActions) { const r = await call(a, { partnerId: "x", bookingRef: T.ref1 }); if (JSON.stringify(r).includes("prefers a 05:30 pickup")) leaked = true; }
    for (const a of ["getTicket", "listTickets", "myWorkspace", "listTasks", "listQuotes"]) { const r = await call(a, { ref: T.ref1 }); if (r.ok) leaked = true; }
    check("internal notes are not reachable without staff authentication", !leaked);
    // partner isolation
    const reg = async (email, biz) => { const r = await ok("registerPartner", { account: { email, password: PW, name: biz }, application: { partnerType: "guide", contactName: biz, phone: "0820000000", businessName: biz, province: "Mpumalanga", city: "Sabie", description: "Experienced guide in the Lowveld for many years.", services: ["Guided tours"] } }); return r; };
    const pa = await reg("guidea@example.com", "Guide A"), pb = await reg("guideb@example.com", "Guide B");
    await expectError("partner cannot read another partner's application", "getApplication", { id: pb.id }, pa.token, /access|sign/i);
    await expectError("partner cannot reach the Operations Centre", "listTickets", {}, pa.token, /access|review|sign/i);
    await expectError("upload whose bytes don't match the claimed type is rejected", "uploadPhoto", { id: pa.id, label: "Profile photo", dataUrl: PNG.replace("iVBORw", "aGVsbG") }, pa.token, /look like|upload/i);
    await expectError("fake PDF (script inside) rejected on ticket attachments", "uploadTicketFile", { ref: T.ref1, name: "proof.pdf", dataUrl: FAKE_PDF }, T.agent2, /match/i);
    const okUp = await ok("uploadTicketFile", { ref: T.ref1, name: "itinerary.png", dataUrl: PNG }, T.agent2);
    check("valid attachment accepted and stored privately", !!okUp.id);
    // MFA cannot be bypassed
    const s1 = await ok("signIn", { email: "manager@kcm.test.co", password: PW });
    check("privileged password sign-in returns an MFA challenge, not a session", s1.mfa === "verify" && !s1.token);
    await ok("requestCode", { email: "manager@kcm.test.co" });
    const s2 = await ok("verifyCode", { email: "manager@kcm.test.co", code: await lastCode("manager@kcm.test.co") });
    check("email-code sign-in also requires MFA for privileged roles", s2.mfa === "verify" && !s2.token);
    await expectError("wrong authenticator code rejected", "mfaVerify", { challenge: s1.challenge, code: "000000" }, null, /not right/i);
    const rc = await ok("mfaVerify", { challenge: s2.challenge, recoveryCode: "nope" }).catch(e => ({ err: e.message }));
    check("invalid recovery code rejected", !!rc.err);
    const goodRc = await ok("mfaVerify", { challenge: s1.challenge, recoveryCode: owner.recoveryCodes ? "" : "" }).catch(e => ({ err: e.message }));
    check("empty recovery code rejected", !!goodRc.err);
    // role change takes effect immediately and forces MFA
    await ok("saveUser", { email: "agent1@kcm.test.co", role: "MANAGEMENT" }, T.owner);
    await expectError("promoting a user revokes their old session (must sign in again with MFA)", "listTickets", {}, T.agent1, /sign in|expired/i);
    const prom = await ok("signIn", { email: "agent1@kcm.test.co", password: PW });
    check("promoted user must now set up MFA", prom.mfa === "setup" && !prom.token);
    await ok("saveUser", { email: "agent1@kcm.test.co", role: "OPERATIONS" }, T.owner);
    // brute force throttling
    for (let i = 0; i < 8; i++) await call("signIn", { email: "agent2@kcm.test.co", password: "wrong-pass-" + i });
    await expectError("login throttled after repeated failures", "signIn", { email: "agent2@kcm.test.co", password: PW }, null, /too many/i);
    // weak passwords
    await expectError("weak password refused", "registerPartner", { account: { email: "weak@example.com", password: "password12" }, application: {} }, null, /less common|10 characters/i);
    // legacy hash upgraded to Argon2id
    await getJSON("/__legacy?email=legacy@example.com&password=" + encodeURIComponent(PW) + "&role=PARTNER");
    const lg = await ok("signIn", { email: "legacy@example.com", password: PW }).catch(e => ({ err: e.message }));
    const urow = (await getJSON("/__sheet?name=Users")).find(r => r[0] === "legacy@example.com");
    check("pre-1.4 password still works and is re-hashed with Argon2id", (lg.token || /reviewed|approved/.test(lg.err || "")) && String(urow[9]).startsWith("$argon2id$v=19$m=19456,t=2,p=1$"), String(urow[9]).slice(0, 30));
    const users = await getJSON("/__sheet?name=Users");
    check("no plaintext passwords stored; MFA secrets encrypted (AES-GCM, versioned)", !JSON.stringify(users).includes(PW) && users.slice(1).filter(r => r[11]).length >= 4 && users.slice(1).filter(r => r[11]).every(r => /^v\d+:/.test(r[11])));
    // test admin
    const ta = await ok("signIn", { email: "admin@kcm.test", password: "Kaycee@Kruger26" });
    check("built-in test admin signs in (Argon2id) and must set up an authenticator", ta.mfa === "setup" && !ta.token);
    // KCM internal finance view isn't visible to operations in getTicket
    const opsView = await ok("getTicket", { ref: T.ref1 }, T.agent2);
    check("agents see payment status but not bank references", opsView.payments.length > 0 && opsView.payments.every(p => p.reference === undefined));

    /* ---------------- Reporting ---------------- */
    current = "Reporting";
    const ov = await ok("opsOverview", { range: "month" }, T.manager);
    check("overview figures come from records", ov.kpis.enquiries >= 3 && ov.kpis.confirmed === 1 && ov.quoteConversion.sent >= 1 && ov.paymentProgress.due >= final);
    await expectError("operations staff cannot open the management overview", "opsOverview", {}, T.agent2, /access/i);
    const wl = await ok("workload", {}, T.manager);
    check("employee workload shows active tickets per employee", wl.find(w => w.email === "agent2@kcm.test.co").activeTickets >= 1);
    const search = await ok("listTickets", { q: "lerato" }, T.manager), byPhone = await ok("listTickets", { q: "0712345678" }, T.manager);
    check("search by customer name and by phone number", search.total >= 2 && byPhone.total >= 2);

    /* ---------------- summary ---------------- */
    const pass = results.filter(r => r.pass).length, fail = results.length - pass;
    const by = {}; results.forEach(r => { by[r.scenario] = by[r.scenario] || [0, 0]; by[r.scenario][r.pass ? 0 : 1]++; });
    console.log("\nScenario                 pass  fail");
    Object.entries(by).forEach(([k, [p, f]]) => console.log(k.padEnd(24), String(p).padStart(4), String(f).padStart(5)));
    console.log(`\n${pass}/${results.length} checks passed${fail ? ", " + fail + " FAILED" : ""}`);
    require("fs").writeFileSync(process.env.OUT || "/tmp/kcm-api-results.json", JSON.stringify(results, null, 1));
    process.exit(fail ? 1 : 0);
})().catch(e => { console.error("ABORTED:", e.message); console.log(results.filter(r => !r.pass)); process.exit(2); });
