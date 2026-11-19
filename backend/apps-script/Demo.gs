/**
 * KCM demo data: fills the system with clearly labelled FAKE records so every screen can be tried out,
 * then removes them again before going live.
 *
 *  Sheet menu  KCM Admin → Load demo data (testing only)
 *              KCM Admin → Remove demo data
 *
 * Everything is marked:  names end in "(demo)", emails end in @demo.kcm.test, ticket descriptions start with [DEMO].
 * Records are created through the normal backend actions (assign, quote, approve, pay, verify, confirm…), so the
 * history, checklists, notifications and money figures behave exactly like real work.
 * No emails or WhatsApp alerts are sent while demo data is being created.
 * Loading is done in parts so it never hits Google's 6-minute limit: if a part runs out of time you are asked to
 * click "Load demo data" again and it carries on where it stopped.
 */
var DEMO_MODE_ = false;
const DEMO_DOMAIN = '@demo.kcm.test';
const DEMO_TAG = '(demo)';
/** Shared password for all demo staff and demo partners. Demo accounts are deleted by "Remove demo data". */
const DEMO_PASSWORD = 'Demo-Lowveld-2026';
const DEMO_STAFF = [
  { key: 'mgr', email: 'thandi.manager@demo.kcm.test', name: 'Thandi Nkosi (demo)', role: 'MANAGEMENT' },
  { key: 'fin', email: 'fiona.finance@demo.kcm.test', name: 'Fiona van Wyk (demo)', role: 'FINANCE' },
  { key: 'fin2', email: 'sam.finance@demo.kcm.test', name: 'Sam Pillay (demo)', role: 'FINANCE' },
  { key: 'nomsa', email: 'nomsa.ops@demo.kcm.test', name: 'Nomsa Mokoena (demo)', role: 'OPERATIONS' },
  { key: 'sipho', email: 'sipho.ops@demo.kcm.test', name: 'Sipho Dlamini (demo)', role: 'OPERATIONS' },
  { key: 'ayesha', email: 'ayesha.ops@demo.kcm.test', name: 'Ayesha Khan (demo)', role: 'OPERATIONS' },
  { key: 'former', email: 'former.ops@demo.kcm.test', name: 'Pieter Botha (demo, access removed)', role: 'OPERATIONS', status: 'disabled' },
];

const DAY_MS = 86400000;
const dIso_ = days => Utilities.formatDate(new Date(Date.now() + days * DAY_MS), 'Africa/Johannesburg', 'yyyy-MM-dd');

/* ------------------------------------------------------------------ helpers */
function demoCall_(action, token, payload) {
  if (!ACTIONS[action]) throw new Error('Unknown action ' + action);
  return ACTIONS[action](Object.assign({ token }, payload || {}));
}
function demoTokens_() {
  const T = {};
  DEMO_STAFF.filter(s => s.status !== 'disabled').forEach(s => { T[s.key] = startSession_(s.email, { mfa: true, provider: 'demo' }).token; });
  return T;
}
function demoStaffEmail_(key) { return DEMO_STAFF.filter(s => s.key === key)[0].email; }

/**
 * Moves one ticket forward through the real workflow, up to `target`.
 * o: { agent, priority, sell, lines, decline, notes, tasks, overdueTask, handoverTo }
 */
const DEMO_STAGES = ['assigned', 'requirements', 'supplier', 'quoteDraft', 'quoteSubmitted', 'quoteSent', 'accepted',
  'depositRecorded', 'depositVerified', 'confirmed', 'tripPrep', 'travelling', 'completed'];
function demoAdvance_(T, ref, target, o) {
  o = o || {};
  const upto = DEMO_STAGES.indexOf(target);
  const agentKey = o.agent || 'nomsa', ag = T[agentKey], agentEmail = demoStaffEmail_(agentKey);
  const reached = s => DEMO_STAGES.indexOf(s) <= upto;
  let quoteId = null;
  const tk = () => demoCall_('getTicket', T.mgr, { ref });

  if (reached('assigned')) {
    const t = tk();
    if (t.assignedTo !== agentEmail) demoCall_('assignTicket', T.mgr, { ref, assignee: agentEmail, priority: o.priority || 'Normal' });
  }
  if (reached('requirements')) {
    demoCall_('updateTicket', ag, { ref, fields: Object.assign({ budget: o.budget || 'R8 000 – R12 000', paymentPref: 'Deposit then balance' }, o.fields || {}) });
    demoCall_('setTicketStatus', ag, { ref, status: 'REQUIREMENTS UNDER REVIEW' });
    demoCall_('addNote', ag, { ref, kind: 'customer', channel: 'Phone call', content: o.callNote || '[DEMO] Called the customer to confirm dates, numbers and budget. Prefers WhatsApp for updates.' });
    const items = tk().checklist.filter(c => !c.done).slice(0, 3);
    items.forEach(c => demoCall_('updateChecklistItem', ag, { id: c.id, done: true, notes: 'Demo' }));
  }
  if (reached('supplier')) {
    demoCall_('addSupplierQuote', ag, { ref, supplierQuote: { supplierName: o.supplier || 'Lowveld Shuttles (demo)', service: o.supplierService || 'Transport: 4x4 safari vehicle with driver', amount: o.supplierCost || 3200, status: 'Received', notes: '[DEMO] Quote received by email' } });
  }
  if (reached('quoteDraft')) {
    const lines = o.lines || [{ category: 'Transport', description: 'Safari vehicle and driver', supplier: o.supplier || 'Lowveld Shuttles (demo)', cost: o.supplierCost || 3200 },
      { category: 'Activities', description: 'Kruger conservation fees', supplier: 'SANParks', cost: 1400 }];
    quoteId = demoCall_('saveQuote', ag, { ref, quote: { lines, sellingPrice: o.sell || 7500, vatMode: 'exclusive', depositPct: 30, validUntil: dIso_(14), notes: '[DEMO] Includes pickup from your accommodation.' } }).id;
  }
  if (reached('quoteSubmitted')) demoCall_('quoteAction', ag, { quoteId, step: 'submit' });
  if (reached('quoteSent')) {
    demoCall_('quoteAction', T.mgr, { quoteId, step: 'approve' });
    demoCall_('quoteAction', ag, { quoteId, step: 'send' });
  }
  if (o.decline && upto === DEMO_STAGES.indexOf('quoteSent')) {
    demoCall_('quoteAction', ag, { quoteId, step: 'decline', note: '[DEMO] Customer found a cheaper option.' });
    demoCall_('setTicketStatus', ag, { ref, status: 'LOST / DECLINED', note: '[DEMO] Customer chose another operator on price.' });
    return;
  }
  if (reached('accepted')) demoCall_('quoteAction', ag, { quoteId, step: 'accept', note: '[DEMO] Accepted on WhatsApp' });
  let money = null;
  if (reached('depositRecorded')) {
    money = tk().money;
    demoCall_('recordPayment', ag, { ref, payment: { type: 'deposit', amount: money.deposit, method: 'EFT', reference: 'DEMO-' + ref.slice(-6) + '-D', paidOn: dIso_(-2) } });
  }
  if (reached('depositVerified')) {
    const p = demoCall_('listPayments', T.fin, {}).payments.filter(x => x.ref === ref && x.verification === 'Unverified')[0];
    if (p) demoCall_('verifyPayment', T.fin, { id: p.id, decision: 'verify', source: '[DEMO] FNB business account statement' });
  }
  if (reached('confirmed')) demoCall_('setTicketStatus', T.mgr, { ref, status: 'BOOKING CONFIRMED' });
  if (reached('tripPrep')) demoCall_('setTicketStatus', ag, { ref, status: 'TRIP PREPARATION' });
  if (reached('travelling')) demoCall_('setTicketStatus', ag, { ref, status: 'IN PROGRESS / TRAVELLING' });
  if (reached('completed')) {
    money = tk().money;
    if (money.outstanding > 0) {
      const p = demoCall_('recordPayment', T.fin, { ref, payment: { type: 'balance', amount: money.outstanding, method: 'EFT', reference: 'DEMO-' + ref.slice(-6) + '-B', paidOn: dIso_(-1) } });
      demoCall_('verifyPayment', T.fin2, { id: p.id, decision: 'verify', source: '[DEMO] FNB business account statement' });
    }
    demoCall_('addNote', ag, { ref, kind: 'customer', channel: 'WhatsApp', content: '[DEMO] Customer sent thanks and photos after the trip.' });
    demoCall_('setTicketStatus', ag, { ref, status: 'COMPLETED' });
  }
}

/** New enquiry from the website form or Kaycee (creates a Bookings row + ticket, like a real visitor). */
function demoWebsiteEnquiry_(c, trip, source, extra) {
  return submitBooking_({ booking: Object.assign({
    tourSlug: trip.slug, tour: trip.title, startDate: trip.date, nights: trip.nights || 0, adults: trip.adults || 2, children: trip.children || 0,
    infants: 0, pensioners: trip.pensioners || 0, room: trip.room || 'double', extraCodes: trip.extras || [], payment: 'deposit',
    name: c.name, email: c.email, phone: c.phone, notes: '[DEMO] ' + (trip.notes || 'Demo enquiry'), consent: true, source,
  }, extra || {}), idempotencyKey: 'demo-' + Utilities.getUuid() }).reference;
}
/** Enquiry registered by an employee (WhatsApp, phone, email, walk-in...). */
function demoManualEnquiry_(T, agentKey, c, f) {
  return demoCall_('createTicket', T[agentKey], { customer: Object.assign({ consent: true }, c), fields: Object.assign({}, f, { description: '[DEMO] ' + (f.description || '') }) }).ref;
}

const DEMO_TRIPS = {
  kruger: { slug: 'kruger-day-safari', title: 'Kruger Full-Day Open-Vehicle Safari' },
  panorama: { slug: 'panorama-route', title: 'Panorama Route & God\'s Window Day Tour' },
};

/* ------------------------------------------------------------------ the demo script, in resumable parts */
function demoSteps_() {
  const C = n => ({ name: n.name + ' ' + DEMO_TAG, email: n.e + DEMO_DOMAIN, phone: n.p, whatsapp: n.p, type: n.t || 'Individual', location: n.l || '' });
  const people = {
    lerato: C({ name: 'Lerato Khumalo', e: 'lerato.khumalo', p: '071 200 0001', l: 'Johannesburg' }),
    johan: C({ name: 'Johan Pretorius', e: 'johan.p', p: '082 200 0002', t: 'Family', l: 'Pretoria' }),
    zanele: C({ name: 'Zanele Mthembu', e: 'zanele.m', p: '073 200 0003', l: 'Durban' }),
    grace: C({ name: 'Grace Chikwanha', e: 'grace.c', p: '074 200 0004', t: 'Church', l: 'Mbombela' }),
    david: C({ name: 'David Smith', e: 'david.smith', p: '+44 7700 900005', l: 'London, UK' }),
    priya: C({ name: 'Priya Naidoo', e: 'priya.n', p: '076 200 0006', t: 'Corporate', l: 'Sandton' }),
    themba: C({ name: 'Themba Zulu', e: 'themba.z', p: '078 200 0007', t: 'School', l: 'Witbank' }),
    anna: C({ name: 'Anna Müller', e: 'anna.m', p: '+49 151 2000008', l: 'Munich, Germany' }),
    kagiso: C({ name: 'Kagiso Molefe', e: 'kagiso.m', p: '079 200 0009', t: 'Family', l: 'Rustenburg' }),
    fatima: C({ name: 'Fatima Patel', e: 'fatima.p', p: '072 200 0010', l: 'Lenasia' }),
    bongani: C({ name: 'Bongani Ndlovu', e: 'bongani.n', p: '083 200 0011', t: 'Group', l: 'Soweto' }),
    sarah: C({ name: 'Sarah Jacobs', e: 'sarah.j', p: '084 200 0012', l: 'Cape Town' }),
    mpho: C({ name: 'Mpho Sithole', e: 'mpho.s', p: '061 200 0013', l: 'Nelspruit' }),
    chen: C({ name: 'Chen Wei', e: 'chen.w', p: '060 200 0014', t: 'Family', l: 'Midrand' }),
    nandi: C({ name: 'Nandi Mahlangu', e: 'nandi.m', p: '062 200 0015', l: 'Polokwane' }),
    peter: C({ name: 'Peter van der Merwe', e: 'peter.vdm', p: '063 200 0016', t: 'Group', l: 'Bloemfontein' }),
    ruth: C({ name: 'Ruth Mokwena', e: 'ruth.m', p: '064 200 0017', l: 'Hazyview' }),
    ahmed: C({ name: 'Ahmed Hassan', e: 'ahmed.h', p: '065 200 0018', t: 'Corporate', l: 'Rosebank' }),
  };
  const manual = (T, agent, who, f) => demoManualEnquiry_(T, agent, people[who], f);
  const pkg = (dest, days, adults, children, extra) => Object.assign({ enquiryType: 'Package tour', destination: dest, departDate: dIso_(days), returnDate: dIso_(days + 3), nights: 3, adults, children: children || 0, accommodation: '4-star lodge', airportTransfer: 'Yes' }, extra || {});

  return [
    { name: 'Demo staff accounts', run: () => {
      const hash = newPasswordHash_(DEMO_PASSWORD);
      DEMO_STAFF.forEach(s => {
        upsertUser_(s.email, { name: s.name, role: s.role, provider: 'demo', status: s.status || 'active' });
        setUserFields_(s.email, { Name: s.name, Role: s.role, Status: s.status || 'active', PasswordHash: hash.hash, PasswordSalt: hash.scheme, InvitedBy: 'demo data' });
      });
    } },
    { name: 'Demo suppliers', run: T => {
      [['Lowveld Shuttles (demo)', 'Transport', 'Thabo Mashaba', '013 000 1001'], ['Marula Bush Lodge (demo)', 'Accommodation', 'Lindiwe Shabangu', '013 000 1002'],
        ['Blyde Canyon Boat Cruises (demo)', 'Activity', 'Jan Steyn', '013 000 1003'], ['Kruger Gate Guides (demo)', 'Guide', 'Elias Nkuna', '013 000 1004'],
        ['Sabie River Guesthouse (demo)', 'Accommodation', 'Mary Coetzee', '013 000 1005'], ['KMIA Car Hire (demo)', 'Car hire', 'Desk manager', '013 000 1006']]
        .forEach(s => demoCall_('saveSupplier', T.mgr, { supplier: { name: s[0], type: s[1], contact: s[2], phone: s[3], email: s[0].split(' ')[0].toLowerCase() + DEMO_DOMAIN, notes: '[DEMO] supplier' } }));
    } },
    // ----- new and unassigned
    { name: 'New website enquiries', run: () => {
      demoWebsiteEnquiry_(people.lerato, Object.assign({ date: dIso_(25), adults: 2, extras: ['transfer'], notes: 'Celebrating our anniversary' }, DEMO_TRIPS.kruger), 'website');
      demoWebsiteEnquiry_(people.david, Object.assign({ date: dIso_(40), adults: 2, children: 1, notes: 'First time in South Africa' }, DEMO_TRIPS.panorama), 'website');
    } },
    { name: 'New Kaycee enquiries', run: () => {
      demoWebsiteEnquiry_(people.zanele, Object.assign({ date: dIso_(18), adults: 4, notes: 'Girls trip' }, DEMO_TRIPS.panorama), 'chat', { kaycee: { style: 'Scenic & photography', region: 'Panorama Route', budget: 'R2 000–R4 000 pp' } });
      demoWebsiteEnquiry_(people.anna, Object.assign({ date: dIso_(55), adults: 2, notes: 'Honeymoon' }, DEMO_TRIPS.kruger), 'chat', { kaycee: { style: 'Safari & wildlife', region: 'Kruger & Panorama', budget: 'R4 000+ pp' } });
    } },
    // ----- in progress
    { name: 'WhatsApp enquiry (assigned)', run: T => { const r = manual(T, 'sipho', 'johan', pkg('Kruger & Blyde River Canyon', 30, 2, 3, { source: 'WhatsApp', description: 'Family of 5 wants 3 nights near Kruger in the school holidays' })); demoAdvance_(T, r, 'assigned', { agent: 'sipho', priority: 'High' }); } },
    { name: 'Phone enquiry (requirements)', run: T => { const r = manual(T, 'nomsa', 'grace', { source: 'Direct phone call', enquiryType: 'Group or school trip', description: 'Church group of 28 for a day trip to God\'s Window', destination: 'Panorama Route', departDate: dIso_(45), adults: 28 }); demoAdvance_(T, r, 'requirements', { agent: 'nomsa', budget: 'R450 pp' }); } },
    { name: 'Email enquiry (supplier research)', run: T => { const r = manual(T, 'ayesha', 'priya', pkg('Hazyview', 21, 12, 0, { source: 'Email', enquiryType: 'Corporate travel', description: 'Team-building weekend for 12 staff' })); demoAdvance_(T, r, 'supplier', { agent: 'ayesha', supplier: 'Marula Bush Lodge (demo)', supplierService: 'Accommodation: 12 guests, 2 nights', supplierCost: 28000 }); } },
    { name: 'Quote being prepared', run: T => { const r = manual(T, 'nomsa', 'kagiso', pkg('Sabie', 35, 2, 2, { source: 'Referral' })); demoAdvance_(T, r, 'quoteDraft', { agent: 'nomsa', sell: 14500 }); } },
    { name: 'Quote waiting for approval', run: T => {
      const r = manual(T, 'sipho', 'themba', { source: 'Social media', enquiryType: 'Group or school trip', description: 'Grade 10 school tour, 40 learners', destination: 'Kruger', departDate: dIso_(60), adults: 4, children: 40 });
      demoAdvance_(T, r, 'quoteSubmitted', { agent: 'sipho', sell: 36000, supplierCost: 24000 });
      const r2 = manual(T, 'ayesha', 'fatima', pkg('Graskop', 28, 2, 0, { source: 'WhatsApp' }));
      demoAdvance_(T, r2, 'quoteSubmitted', { agent: 'ayesha', sell: 9200 });
    } },
    { name: 'Quote sent to customer', run: T => { const r = manual(T, 'nomsa', 'sarah', pkg('Kruger', 20, 2, 0, { source: 'Email' })); demoAdvance_(T, r, 'quoteSent', { agent: 'nomsa', sell: 11800 }); } },
    { name: 'Accepted, awaiting deposit', run: T => { const r = manual(T, 'sipho', 'chen', pkg('Kruger & Panorama', 26, 2, 2, { source: 'Walk-in customer' })); demoAdvance_(T, r, 'accepted', { agent: 'sipho', sell: 16800 }); } },
    { name: 'Deposits waiting for finance', run: T => {
      const r = manual(T, 'ayesha', 'nandi', pkg('Blyde River Canyon', 15, 2, 0, { source: 'WhatsApp' }));
      demoAdvance_(T, r, 'depositRecorded', { agent: 'ayesha', sell: 8600 });
      const r2 = demoWebsiteEnquiry_(people.mpho, Object.assign({ date: dIso_(12), adults: 3, notes: 'Birthday trip' }, DEMO_TRIPS.kruger), 'website');
      demoAdvance_(T, r2, 'depositRecorded', { agent: 'nomsa', sell: 6900 });
    } },
    { name: 'Confirmed booking', run: T => { const r = manual(T, 'nomsa', 'peter', pkg('Kruger', 10, 8, 0, { source: 'Direct phone call', enquiryType: 'Package tour' })); demoAdvance_(T, r, 'confirmed', { agent: 'nomsa', sell: 42000, supplierCost: 18000 }); } },
    { name: 'Trip preparation', run: T => { const r = manual(T, 'sipho', 'ruth', pkg('Panorama Route', 5, 2, 0, { source: 'WhatsApp' })); demoAdvance_(T, r, 'tripPrep', { agent: 'sipho', sell: 7200 }); } },
    { name: 'Travelling now', run: T => { const r = manual(T, 'ayesha', 'ahmed', pkg('Kruger', 0, 4, 0, { source: 'Email', enquiryType: 'Corporate travel' })); demoAdvance_(T, r, 'travelling', { agent: 'ayesha', sell: 19500 }); } },
    // ----- finished
    { name: 'Completed trips', run: T => {
      const a = manual(T, 'nomsa', 'bongani', pkg('Kruger', -20, 6, 0, { source: 'WhatsApp', enquiryType: 'Package tour' }));
      demoAdvance_(T, a, 'completed', { agent: 'nomsa', sell: 24000 });
      const b = manual(T, 'sipho', 'lerato', { source: 'Direct phone call', enquiryType: 'Day tour', description: 'Return customer: Panorama day tour', destination: 'Panorama Route', departDate: dIso_(-12), adults: 2 });
      demoAdvance_(T, b, 'completed', { agent: 'sipho', sell: 3600, supplierCost: 1800 });
    } },
    { name: 'Lost, cancelled and on hold', run: T => {
      const lost = manual(T, 'ayesha', 'david', pkg('Kruger', 50, 2, 0, { source: 'Email', description: 'Luxury lodge enquiry' }));
      demoAdvance_(T, lost, 'quoteSent', { agent: 'ayesha', sell: 38000, decline: true });
      const cancel = manual(T, 'nomsa', 'zanele', { source: 'WhatsApp', enquiryType: 'Transfer / transport', description: 'Airport transfer KMIA to Hazyview', destination: 'Hazyview', departDate: dIso_(8), adults: 2 });
      demoAdvance_(T, cancel, 'assigned', { agent: 'nomsa' });
      demoCall_('setTicketStatus', T.nomsa, { ref: cancel, status: 'CANCELLED', note: '[DEMO] Customer\'s flight was cancelled.' });
      const hold = manual(T, 'sipho', 'kagiso', { source: 'Referral', enquiryType: 'Custom trip', description: 'Mozambique add-on, waiting for passports', destination: 'Kruger & Mozambique', departDate: dIso_(90), adults: 2 });
      demoAdvance_(T, hold, 'requirements', { agent: 'sipho' });
      demoCall_('setTicketStatus', T.sipho, { ref: hold, status: 'ON HOLD', note: '[DEMO] Waiting for the customer\'s passports to be renewed.' });
    } },
    { name: 'Refund waiting for approval', run: T => {
      const r = manual(T, 'nomsa', 'johan', { source: 'Direct phone call', enquiryType: 'Day tour', description: 'Kruger day safari; one guest fell ill', destination: 'Kruger', departDate: dIso_(-5), adults: 3 });
      demoAdvance_(T, r, 'completed', { agent: 'nomsa', sell: 5400, supplierCost: 3000 });
      demoCall_('recordPayment', T.fin, { ref: r, payment: { type: 'refund', amount: 1200, method: 'EFT', reference: 'DEMO-RF-' + r.slice(-4), notes: '[DEMO] Goodwill refund: one guest could not travel' } });
    } },
    { name: 'Tasks, follow-ups and a handover', run: T => {
      const mine = demoCall_('listTickets', T.mgr, { view: 'tickets' }).tickets.filter(t => t.open && t.assignedTo);
      mine.slice(0, 6).forEach((t, i) => {
        const agent = DEMO_STAFF.filter(s => s.email === t.assignedTo)[0];
        if (!agent || !T[agent.key]) return;
        demoCall_('createTask', T[agent.key], { ref: t.ref, title: ['Send updated itinerary', 'Confirm pickup time with driver', 'Chase customer for ID copies', 'Call lodge to hold rooms', 'Check park gate times', 'Follow up on quotation'][i], priority: i % 3 === 0 ? 'High' : 'Normal', due: dIso_(i % 2 === 0 ? -2 : 3) });
      });
      // a handover: Sipho is "on leave", his WhatsApp ticket goes to Nomsa with a summary
      const sip = mine.filter(t => t.assignedTo === demoStaffEmail_('sipho'))[0];
      if (sip) demoCall_('assignTicket', T.mgr, { ref: sip.ref, assignee: demoStaffEmail_('nomsa'), handoverSummary: '[DEMO] Sipho on leave. Customer prefers WhatsApp; lodge quote pending; next step is the quotation.' });
    } },
    // ----- batch 2: richer records so every field and list has something in it
    { name: 'More unassigned enquiries (to practise assigning)', run: T => {
      [['peter', 'Email', 'Golf weekend for 8 at White River', 'White River', 'Corporate travel', 34, 8, 0],
        ['nandi', 'Social media', 'Graduation trip, 6 friends, budget conscious', 'Graskop & Pilgrim\'s Rest', 'Package tour', 48, 6, 0],
        ['fatima', 'Referral', 'Halaal-friendly safari for 2 families', 'Kruger', 'Package tour', 62, 4, 4],
        ['chen', 'Website booking form', 'Self-drive route with lodge stays', 'Panorama Route', 'Custom trip', 70, 2, 2],
        ['ahmed', 'Email', 'Conference shuttle KMIA ↔ Mbombela, 3 days', 'Mbombela', 'Transfer / transport', 16, 24, 0]]
        .forEach(x => {
          const r = demoManualEnquiry_(T, 'ayesha', people[x[0]], { source: x[1], description: x[2], destination: x[3], enquiryType: x[4], departDate: dIso_(x[5]), returnDate: dIso_(x[5] + 2), adults: x[6], children: x[7], budget: 'R' + (x[6] * 2500) + ' total' });
          demoCall_('assignTicket', T.mgr, { ref: r, assignee: '' }); // back to Unassigned for practice
        });
    } },
    { name: 'Fully detailed trips', run: T => {
      const full = (dest, days, adults, children, f) => Object.assign({
        enquiryType: 'Package tour', destination: dest, destinations: dest + ', Blyde River Canyon, God\'s Window', departDate: dIso_(days), returnDate: dIso_(days + 4), nights: 4, adults, children,
        accommodation: '4-star lodge, half board', rooms: (adults / 2) + ' double rooms' + (children ? ', 1 family room' : ''), transport: '4x4 safari vehicle with driver-guide', activities: 'Sunrise game drive, Blyde boat cruise, Bourke\'s Luck Potholes',
        airportTransfer: 'Yes', carHire: 'No', insurance: 'Yes', meals: 'Breakfast and dinner; one vegetarian', specialRequests: 'Anniversary cake on night 2', accessibility: 'One traveller uses a walking stick: ground-floor room please',
        budget: 'R25 000 – R35 000', paymentPref: '30% deposit, balance 30 days before', intakeNotes: '[DEMO] Detailed brief taken on the phone', commsNotes: 'Prefers WhatsApp after 17:00' }, f || {});
      const a = demoManualEnquiry_(T, 'nomsa', people.sarah, full('Kruger', 40, 2, 0, { source: 'Direct phone call' }));
      demoAdvance_(T, a, 'quoteSent', { agent: 'nomsa', sell: 28500, lines: [{ category: 'Accommodation', description: 'Marula Bush Lodge, 4 nights half board', supplier: 'Marula Bush Lodge (demo)', cost: 14800 }, { category: 'Transport', description: 'Safari vehicle and driver-guide, 5 days', supplier: 'Lowveld Shuttles (demo)', cost: 6200 }, { category: 'Activities', description: 'Blyde boat cruise and park fees', supplier: 'Blyde Canyon Boat Cruises (demo)', cost: 2100 }, { category: 'Additional services', description: 'Travel insurance', supplier: '', cost: 900 }] });
      const b = demoManualEnquiry_(T, 'sipho', people.johan, full('Hazyview', 22, 2, 2, { source: 'WhatsApp', accessibility: '' }));
      demoAdvance_(T, b, 'confirmed', { agent: 'sipho', sell: 33800, supplierCost: 21000 });
      demoCall_('recordPayment', T.sipho, { ref: b, payment: { type: 'instalment', amount: 8000, method: 'EFT', reference: 'DEMO-' + b.slice(-6) + '-I1', paidOn: dIso_(-1), notes: '[DEMO] Second instalment' } });
      const c = demoManualEnquiry_(T, 'ayesha', people.grace, full('Sabie', 30, 20, 8, { source: 'Email', enquiryType: 'Group or school trip', rooms: '14 rooms at Sabie River Guesthouse', transport: '2 x 22-seater buses', accessibility: '' }));
      demoAdvance_(T, c, 'accepted', { agent: 'ayesha', sell: 72000, supplierCost: 48000 });
    } },
    { name: 'More quotation states', run: T => {
      // approved but not yet sent
      const a = demoManualEnquiry_(T, 'nomsa', people.mpho, { source: 'WhatsApp', enquiryType: 'Day tour', description: 'Panorama day tour for 4', destination: 'Panorama Route', departDate: dIso_(19), adults: 4 });
      demoAdvance_(T, a, 'quoteSubmitted', { agent: 'nomsa', sell: 5200, supplierCost: 3000 });
      const qa = (demoCall_('getTicket', T.mgr, { ref: a }).quotes || [])[0];
      if (qa) demoCall_('quoteAction', T.mgr, { quoteId: qa.id, step: 'approve' });
      // revised quotation: version 1 superseded by version 2
      const b = demoManualEnquiry_(T, 'sipho', people.anna, { source: 'Email', enquiryType: 'Package tour', description: 'Honeymoon, wants a private plunge pool', destination: 'Kruger', departDate: dIso_(85), returnDate: dIso_(89), nights: 4, adults: 2 });
      demoAdvance_(T, b, 'quoteSent', { agent: 'sipho', sell: 46000, supplierCost: 30000 });
      const v2 = demoCall_('saveQuote', T.sipho, { ref: b, quote: { lines: [{ category: 'Accommodation', description: 'Luxury suite with plunge pool', cost: 30000 }], sellingPrice: 43500, discount: 1000, vatMode: 'exclusive', depositPct: 40, validUntil: dIso_(10), notes: '[DEMO] Revised after customer asked for a better rate' } });
      demoCall_('quoteAction', T.sipho, { quoteId: v2.id, step: 'submit' });
    } },
    { name: 'Website messages', run: () => {
      [['Tumi Maseko', 'Do you do day trips from Johannesburg to the Panorama Route?'], ['Lisa Brown', 'Can you arrange a wheelchair-friendly safari vehicle?'],
        ['Andile Cele', 'Price for a school group of 60 to Kruger in March?'], ['Hennie Joubert', 'Do you offer airport transfers from KMIA on Sundays?']]
        .forEach((m, i) => submitMessage_({ message: { name: m[0] + ' ' + DEMO_TAG, email: m[0].split(' ')[0].toLowerCase() + DEMO_DOMAIN, phone: '081 300 00' + (10 + i), message: '[DEMO] ' + m[1] } }));
    } },
    { name: 'Partner applications', run: T => {
      const hash = newPasswordHash_(DEMO_PASSWORD);
      const apps = [
        ['vehicle', 'Lowveld Executive Transfers (demo)', 'Bheki Mahlalela', 'Mbombela', 'Approved', 'Premium Plus', { make: 'Toyota', model: 'Fortuner 2.8 GD-6', year: '2022', seats: '7' }],
        ['accommodation', 'Marula Bush Lodge (demo)', 'Lindiwe Shabangu', 'Hazyview', 'Approved', 'Signature', { rooms: '12', stars: '4' }],
        ['guide', 'Kruger Gate Guides (demo)', 'Elias Nkuna', 'Skukuza', 'Approved', 'Premium', {}],
        ['tour_operator', 'Panorama Day Trips (demo)', 'Karen Steyn', 'Graskop', 'In review', '', {}],
        ['accommodation', 'Sabie River Guesthouse (demo)', 'Mary Coetzee', 'Sabie', 'Needs info', '', { rooms: '5' }],
        ['vehicle', 'Budget Kombi Hire (demo)', 'Sizwe Nkosi', 'Witbank', 'Rejected', '', { make: 'Toyota', model: 'Quantum', year: '2009', seats: '14' }],
        ['activity', 'Blyde Canyon Boat Cruises (demo)', 'Jan Steyn', 'Hoedspruit', 'Pending', '', {}],
      ];
      apps.forEach((a, i) => {
        const email = a[1].split(' ')[0].toLowerCase() + '.partner' + i + DEMO_DOMAIN;
        upsertUser_(email, { name: a[2] + ' ' + DEMO_TAG, provider: 'demo', status: a[4] === 'Approved' ? 'active' : 'pending' });
        setUserFields_(email, { PasswordHash: hash.hash, PasswordSalt: hash.scheme });
        const app = createApplication_(findUser_(email), { partnerType: a[0], contactName: a[2] + ' ' + DEMO_TAG, phone: '082 400 00' + (10 + i), businessName: a[1], province: 'Mpumalanga', city: a[3],
          description: '[DEMO] ' + a[1] + ' has served Lowveld visitors for several years with friendly, reliable service.', services: ['Tours'], details: a[6], yearsInBusiness: String(3 + i) });
        const found = findApplication_(app.id);
        const f = { Status: a[4], Updated: new Date() };
        if (a[4] !== 'Pending') { f.ReviewedBy = demoStaffEmail_('mgr'); f.ReviewedAt = new Date(); }
        if (a[4] === 'Needs info') f.ReviewNote = '[DEMO] Please add a clear photo of the bathroom and proof of ownership.';
        if (a[4] === 'Rejected') f.ReviewNote = '[DEMO] The vehicle is older than our 10-year limit.';
        if (a[5]) f.Tier = a[5];
        setApplicationFields_(found.index, f);
      });
    } },
    { name: 'Partner trips, payouts and ratings', run: T => {
      const partners = readTable_('Partners').filter(p => p.Status === 'Approved' && String(p.BusinessName).indexOf(DEMO_TAG) !== -1);
      const done = readTable_('Tickets').filter(t => t.OpStatus === 'COMPLETED' && String(t.Description).indexOf('[DEMO]') === 0).map(t => t.Ref);
      const refs = done.concat(['DEMO-OLD-1', 'DEMO-OLD-2', 'DEMO-OLD-3']);
      const statuses = ['Paid', 'Paid', 'Approved', 'Pending', 'On hold', 'Paid'];
      let k = 0;
      partners.forEach(p => refs.slice(0, 3).forEach((ref, i) => {
        const j = demoCall_('saveJob', T.fin, { job: { partnerId: p.ID, bookingRef: ref, service: p.PartnerType === 'accommodation' ? '2 nights, 2 guests' : 'Kruger day trip', guests: 2 + i, gross: 2500 + 900 * i, commissionPct: 15, date: dIso_(-30 + i * 9), notes: '[DEMO]' } });
        const s = statuses[k++ % statuses.length];
        if (s !== 'Pending') demoCall_('setPayoutStatus', T.fin, { id: j.id, status: s });
        if (i < 2) submitRating_({ partnerId: p.ID, bookingRef: ref, name: ['Lerato K.', 'Johan P.', 'Grace C.'][i] + ' ' + DEMO_TAG, stars: 5 - (k % 2), comment: '[DEMO] ' + ['Friendly, on time and very knowledgeable.', 'Great experience, the kids loved it.'][i] });
      }));
    } },
    { name: 'Spread the dates over the last two months', run: () => demoBackdate_() },
  ];
}

/** Gives the demo records realistic "received" dates over the past ~9 weeks so the charts have a shape. */
function demoBackdate_() {
  withLock_(() => {
    const back = (tab, cols, pick) => {
      const sh = sheet_(tab), values = sh.getDataRange().getValues();
      const idx = cols.map(c => TABS[tab].indexOf(c));
      let n = 0;
      for (let r = 1; r < values.length; r++) {
        if (!pick(values[r])) continue;
        const d = new Date(Date.now() - ((n * 37) % 62 + 1) * DAY_MS - (n % 9) * 3600000); n++;
        idx.forEach(i => { if (i !== -1) values[r][i] = d; });
      }
      if (values.length > 1) sh.getRange(1, 1, values.length, values[0].length).setValues(values);
    };
    const isDemo = row => row.join(' ').indexOf('[DEMO]') !== -1 || row.join(' ').indexOf(DEMO_DOMAIN) !== -1 || row.join(' ').indexOf(DEMO_TAG) !== -1;
    const demoCust = {}; readTable_('Customers').forEach(c => { if (String(c.Email).indexOf(DEMO_DOMAIN) !== -1) demoCust[c.CustomerRef] = 1; });
    // keep tickets that are still NEW recent so the "incoming" view looks fresh
    back('Tickets', ['Created', 'Received'], r => demoCust[r[1]] && ['NEW ENQUIRY', 'UNASSIGNED', 'AWAITING REVIEW'].indexOf(r[TABS.Tickets.indexOf('OpStatus')]) === -1);
    back('Bookings', ['Created'], isDemo);
    back('Partners', ['Created'], isDemo);
    back('Messages', ['Created'], isDemo);
    back('Ratings', ['Created'], isDemo);
  });
}

/* ------------------------------------------------------------------ run / remove */
function loadDemoData_() {
  const props = PropertiesService.getScriptProperties();
  const steps = demoSteps_();
  let start = Number(props.getProperty('DEMO_PROGRESS') || 0);
  if (start >= steps.length) return { done: true, message: 'Demo data is already loaded. Use "Remove demo data" first if you want to load it again.' };
  const t0 = Date.now(), errors = [];
  DEMO_MODE_ = true;
  try {
    if (start === 0) steps[0].run(), start = 1, props.setProperty('DEMO_PROGRESS', '1');
    const T = demoTokens_();
    for (let i = start; i < steps.length; i++) {
      if (Date.now() - t0 > 4.3 * 60000) return { done: false, message: `Part loaded (${i} of ${steps.length} steps). Click "Load demo data" again to continue.` };
      try { steps[i].run(T); } catch (e) { errors.push(steps[i].name + ': ' + e.message); console.error('Demo step failed', steps[i].name, e && e.stack); }
      props.setProperty('DEMO_PROGRESS', String(i + 1));
    }
  } finally { DEMO_MODE_ = false; }
  log_('system', 'demo_data_loaded', 'demo', errors.length ? errors.join(' | ').slice(0, 1500) : 'all steps');
  return { done: true, errors, message: 'Demo data loaded.' + (errors.length ? ' Some steps had problems:\n• ' + errors.join('\n• ') : '') };
}

/** Removes every demo record (and only demo records) from every tab. */
function removeDemoData_() {
  const demoCust = {}, demoTickets = {}, demoPartners = {}, demoJobs = {};
  readTable_('Customers').forEach(c => { if (String(c.Email).indexOf(DEMO_DOMAIN) !== -1 || String(c.FullName).indexOf(DEMO_TAG) !== -1) demoCust[c.CustomerRef] = 1; });
  readTable_('Tickets').forEach(t => { if (demoCust[t.CustomerRef] || String(t.Description).indexOf('[DEMO]') === 0) demoTickets[t.Ref] = 1; });
  const folders = [];
  readTable_('Partners').forEach(p => { if (String(p.Email).indexOf(DEMO_DOMAIN) !== -1) { demoPartners[p.ID] = 1; if (p.DriveFolderId) folders.push(p.DriveFolderId); } });
  readTable_('Jobs').forEach(j => { if (demoPartners[j.PartnerID]) demoJobs[j.JobID] = 1; });
  const keys = Object.keys(demoCust).concat(Object.keys(demoTickets), Object.keys(demoPartners), Object.keys(demoJobs));
  const isDemo = row => {
    const s = row.map(String).join('\u0001');
    if (s.indexOf(DEMO_DOMAIN) !== -1 || s.indexOf(DEMO_TAG) !== -1 || s.indexOf('[DEMO]') !== -1) return true;
    return row.some(v => keys.indexOf(String(v)) !== -1);
  };
  const removed = {};
  withLock_(() => {
    Object.keys(TABS).forEach(tab => {
      if (['ChecklistTemplates', 'OpsSettings'].indexOf(tab) !== -1) return;
      const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
      if (!sh || sh.getLastRow() < 2) return;
      const values = sh.getDataRange().getValues();
      const keep = [values[0]].concat(values.slice(1).filter(r => !isDemo(r)));
      const n = values.length - keep.length;
      if (!n) return;
      sh.getRange(1, 1, keep.length, keep[0].length).setValues(keep);
      sh.deleteRows(keep.length + 1, n); // drop the rows freed at the bottom
      removed[tab] = n;
    });
  });
  folders.forEach(id => { try { DriveApp.getFolderById(id).setTrashed(true); } catch (e) { /* already gone */ } });
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('DEMO_PROGRESS');
  // restart ticket numbering for this year if no real tickets exist yet
  const year = Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyy');
  if (!readTable_('Tickets').length) { props.deleteProperty('SEQ_TICKET_' + year); }
  if (!readTable_('Customers').length) { props.deleteProperty('SEQ_CUSTOMER'); }
  log_('system', 'demo_data_removed', 'demo', JSON.stringify(removed));
  return removed;
}

function menuLoadDemo_() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Load demo data?', 'This adds FAKE customers, tickets, quotations, payments, staff and partners for testing. Everything is labelled "(demo)" and can be removed with "Remove demo data". No emails or WhatsApp messages are sent.\n\nDemo staff password: ' + DEMO_PASSWORD, ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  const r = loadDemoData_();
  ui.alert(r.message);
}
function menuRemoveDemo_() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Remove all demo data?', 'Every record marked "(demo)", "[DEMO]" or @demo.kcm.test is deleted from every tab, including the demo staff and partner accounts. Real records are not touched. This cannot be undone.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  const r = removeDemoData_();
  const lines = Object.keys(r).map(k => '• ' + k + ': ' + r[k]);
  ui.alert(lines.length ? 'Demo data removed:\n' + lines.join('\n') : 'No demo data was found.');
}
