/**
 * KCM OPERATIONS CENTRE: customers, tickets, lifecycle, tasks, checklists, notes, handover,
 * quotations, payments, suppliers, attachments, notifications and reporting.
 *
 * Rules enforced here (not in the browser):
 *  - every action checks a permission (PERMS in Security.gs) and, for OPERATIONS staff, that they are on the ticket;
 *  - ticket and customer references are generated here, never chosen by users;
 *  - status changes go through guards (a booking cannot be confirmed without an accepted quote and verified deposit);
 *  - operational, payment and customer-response statuses are separate; payment status is derived from verified payments;
 *  - money is calculated here; recorded payments stay UNVERIFIED until finance verifies them (not the person who recorded them);
 *  - notes, history and payments are append-only (corrections are new records); optimistic versioning stops silent overwrites.
 */

Object.assign(TABS, {
  Customers: ['CustomerRef', 'Created', 'FullName', 'Email', 'Phone', 'WhatsApp', 'AltPhone', 'PreferredComms', 'Location', 'CustomerType',
    'ConsentAt', 'ConsentSource', 'Updated', 'Status', 'PhoneKey', 'CreatedBy'],
  Tickets: ['Ref', 'CustomerRef', 'Created', 'Received', 'Source', 'EnquiryType', 'OpStatus', 'PaymentStatus', 'ResponseStatus', 'Priority',
    'AssignedTo', 'SupportBy', 'CreatedBy', 'Updated', 'UpdatedBy', 'NextAction', 'NextActionDue', 'Description', 'Destination', 'Package',
    'PackageSlug', 'CustomTrip', 'DepartDate', 'ReturnDate', 'Nights', 'Adults', 'Children', 'Infants', 'Pensioners', 'Accommodation', 'Rooms',
    'Transport', 'Activities', 'AirportTransfer', 'CarHire', 'Insurance', 'Meals', 'SpecialRequests', 'Accessibility', 'Budget', 'PaymentPref',
    'IntakeNotes', 'CommsNotes', 'Outstanding', 'FollowUp', 'Deadline', 'WebsiteEstimate', 'LegacyRef', 'Template', 'Version', 'LastActivity',
    'ConfirmedAt', 'ClosedAt', 'HandoverSummary', 'Destinations'],
  Tasks: ['TaskID', 'TicketRef', 'Title', 'Description', 'AssignedTo', 'Priority', 'Due', 'Status', 'CreatedBy', 'Created', 'CompletedAt',
    'CompletedBy', 'CompletionNotes', 'Source', 'Updated'],
  ChecklistTemplates: ['TemplateID', 'Name', 'AppliesTo', 'Items', 'Active', 'Updated', 'UpdatedBy'],
  Checklist: ['ItemID', 'TicketRef', 'Section', 'Label', 'Ord', 'Done', 'AssignedTo', 'DoneAt', 'DoneBy', 'Notes', 'Applicable'],
  Notes: ['NoteID', 'TicketRef', 'Created', 'Author', 'Kind', 'Channel', 'Content', 'TaskID', 'Attachment'],
  Quotes: ['QuoteID', 'TicketRef', 'Version', 'Status', 'Lines', 'CostTotal', 'SellingPrice', 'Discount', 'VatMode', 'VatAmount', 'FinalAmount',
    'DepositPct', 'DepositAmount', 'ValidUntil', 'PreparedBy', 'PreparedAt', 'ApprovedBy', 'ApprovedAt', 'SentAt', 'SentBy', 'AcceptedAt',
    'DeclinedAt', 'RecordedBy', 'Notes', 'Margin'],
  Payments: ['PaymentID', 'TicketRef', 'QuoteID', 'Type', 'Amount', 'Method', 'Reference', 'PaidOn', 'RecordedBy', 'RecordedAt', 'Verification',
    'VerifiedBy', 'VerifiedAt', 'VerificationSource', 'Notes', 'IdempotencyKey', 'ApprovalStatus', 'ApprovedBy', 'ApprovedAt', 'VoidReason'],
  Suppliers: ['SupplierID', 'Name', 'Type', 'ContactName', 'Phone', 'Email', 'PartnerID', 'Notes', 'Created', 'CreatedBy', 'Active'],
  SupplierQuotes: ['SQID', 'TicketRef', 'SupplierID', 'SupplierName', 'Service', 'Amount', 'ValidUntil', 'Status', 'Notes', 'RecordedBy', 'RecordedAt'],
  Attachments: ['FileID', 'TicketRef', 'LinkKind', 'LinkID', 'Name', 'Mime', 'Size', 'DriveID', 'UploadedBy', 'UploadedAt'],
  Notifications: ['NotifID', 'Created', 'UserEmail', 'Type', 'TicketRef', 'Message', 'ReadAt', 'DedupKey'],
  OpsSettings: ['Key', 'Value', 'Updated', 'UpdatedBy'],
});

const OP_STATUSES = ['NEW ENQUIRY', 'AWAITING REVIEW', 'UNASSIGNED', 'ASSIGNED', 'REQUIREMENTS UNDER REVIEW', 'SUPPLIER RESEARCH',
  'QUOTATION IN PREPARATION', 'QUOTATION SENT', 'AWAITING CUSTOMER RESPONSE', 'ACCEPTED BY CUSTOMER', 'AWAITING DEPOSIT', 'PAYMENT VERIFICATION',
  'SUPPLIER CONFIRMATION', 'BOOKING CONFIRMED', 'TRIP PREPARATION', 'IN PROGRESS / TRAVELLING', 'COMPLETED', 'CANCELLED', 'LOST / DECLINED', 'ON HOLD'];
const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED', 'LOST / DECLINED'];
const CONFIRMED_INDEX = OP_STATUSES.indexOf('BOOKING CONFIRMED');
const PAYMENT_STATUSES_DERIVED = ['Not invoiced', 'Awaiting payment', 'Deposit pending', 'Deposit received', 'Partially paid', 'Fully paid', 'Overdue', 'Refund pending', 'Refunded'];
const RESPONSE_STATUSES = ['', 'Awaiting response', 'Interested', 'Accepted', 'Declined', 'No response'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const SOURCES = ['Kaycee AI', 'WhatsApp', 'Website booking form', 'Direct phone call', 'Email', 'Walk-in customer', 'Social media', 'Referral', 'Other'];
const ENQUIRY_TYPES = ['Package tour', 'Day tour', 'Custom trip', 'Accommodation only', 'Transfer / transport', 'Group or school trip', 'Corporate travel', 'General enquiry'];
const CUSTOMER_TYPES = ['Individual', 'Family', 'Group', 'School', 'Church', 'Corporate', 'Other'];
const COMMS = ['WhatsApp', 'Phone call', 'Email', 'SMS'];
const TASK_STATUSES = ['NOT STARTED', 'IN PROGRESS', 'WAITING', 'COMPLETED', 'CANCELLED'];
const NOTE_KINDS = ['internal', 'customer', 'supplier', 'handover', 'decision', 'problem'];
const PAYMENT_TYPES = ['deposit', 'instalment', 'balance', 'refund'];
const PAYMENT_METHODS = ['EFT', 'Card', 'Cash', 'SnapScan / Zapper', 'Payment gateway', 'Other'];
const VAT_RATE = 0.15;
const QUOTE_CATEGORIES = ['Accommodation', 'Transport', 'Activities', 'Additional services', 'Other'];
const TEMPLATE_BY_TYPE = { 'Package tour': 'full', 'Day tour': 'day', 'Custom trip': 'full', 'Accommodation only': 'accommodation',
  'Transfer / transport': 'transfer', 'Group or school trip': 'full', 'Corporate travel': 'full', 'General enquiry': 'general' };

const DEFAULT_CHECKLIST = {
  'Customer requirements': ['Customer details verified', 'Travel dates confirmed', 'Number of travellers confirmed', 'Special requirements reviewed', 'Budget established'],
  'Destination and activities': ['Destination researched', 'Attractions identified', 'Activities confirmed', 'Park or conservation requirements checked', 'Itinerary prepared'],
  Accommodation: ['Accommodation options researched', 'Availability checked', 'Supplier contacted', 'Supplier quotation received', 'Accommodation confirmed'],
  Transport: ['Transport requirements reviewed', 'Vehicle or transport option identified', 'Transport supplier contacted', 'Transport quotation received', 'Transport confirmed'],
  Quotation: ['Supplier costs compiled', 'Selling price calculated', 'VAT reviewed', 'Deposit calculated', 'Final quotation prepared', 'Quotation sent', 'Customer response recorded'],
  Payment: ['Invoice prepared', 'Payment instructions sent', 'Deposit received', 'Payment verified', 'Balance calculated', 'Final payment verified'],
  'Final confirmation': ['All suppliers confirmed', 'Customer confirmation sent', 'Booking reference issued', 'Travel itinerary prepared', 'Customer travel information sent', 'Trip coordination completed'],
};
const DEFAULT_TEMPLATES = [
  { id: 'full', name: 'Package with accommodation', appliesTo: ['Package tour', 'Custom trip', 'Group or school trip', 'Corporate travel'], sections: Object.keys(DEFAULT_CHECKLIST) },
  { id: 'day', name: 'Day tour (no accommodation)', appliesTo: ['Day tour'], sections: ['Customer requirements', 'Destination and activities', 'Transport', 'Quotation', 'Payment', 'Final confirmation'] },
  { id: 'transfer', name: 'Transfer / transport only', appliesTo: ['Transfer / transport'], sections: ['Customer requirements', 'Transport', 'Quotation', 'Payment', 'Final confirmation'] },
  { id: 'accommodation', name: 'Accommodation only', appliesTo: ['Accommodation only'], sections: ['Customer requirements', 'Accommodation', 'Quotation', 'Payment', 'Final confirmation'] },
  { id: 'general', name: 'General enquiry', appliesTo: ['General enquiry'], sections: ['Customer requirements'] },
];

Object.assign(ACTIONS, {
  opsConfig: opsConfig_,
  opsOverview: opsOverview_,
  myWorkspace: myWorkspace_,
  listTickets: listTickets_,
  getTicket: getTicket_,
  createTicket: createTicket_,
  updateTicket: updateTicket_,
  setTicketStatus: setTicketStatus_,
  setResponseStatus: setResponseStatus_,
  assignTicket: assignTicket_,
  addNote: addNote_,
  createTask: createTask_,
  updateTask: updateTask_,
  listTasks: listTasks_,
  updateChecklistItem: updateChecklistItem_,
  addChecklistItem: addChecklistItem_,
  applyChecklistTemplate: applyChecklistTemplate_,
  listTemplates: listTemplates_,
  saveTemplate: saveTemplate_,
  saveQuote: saveQuote_,
  quoteAction: quoteAction_,
  listQuotes: listQuotes_,
  recordPayment: recordPayment_,
  verifyPayment: verifyPayment_,
  approveRefund: approveRefund_,
  voidPayment: voidPayment_,
  listPayments: listPayments_,
  listSuppliers: listSuppliers_,
  saveSupplier: saveSupplier_,
  addSupplierQuote: addSupplierQuote_,
  updateSupplierQuote: updateSupplierQuote_,
  uploadTicketFile: uploadTicketFile_,
  getTicketFile: getTicketFile_,
  listCustomers: listCustomers_,
  getCustomer: getCustomer_,
  updateCustomer: updateCustomer_,
  eraseCustomer: eraseCustomer_,
  listNotifications: listNotifications_,
  markNotificationsRead: markNotificationsRead_,
  workload: workload_,
  saveCustomStatus: saveCustomStatus_,
});

/* =====================================================================
 * Generic table helpers
 * ===================================================================== */

function findRow_(name, id) {
  const rows = sheet_(name).getDataRange().getValues();
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === id);
  return idx > 0 ? { index: idx + 1, row: rowToObj_(TABS[name], rows[idx]) } : null;
}
function writeRow_(name, rowIndex, obj) {
  sheet_(name).getRange(rowIndex, 1, 1, TABS[name].length).setValues([TABS[name].map(h => (obj[h] === undefined || obj[h] === null ? '' : obj[h]))]);
}
function appendObj_(name, obj) {
  sheet_(name).appendRow(TABS[name].map(h => (obj[h] === undefined || obj[h] === null ? '' : obj[h])));
}
function nextSeq_(key) {
  return withLock_(() => {
    const props = PropertiesService.getScriptProperties();
    const n = Number(props.getProperty(key) || 0) + 1;
    props.setProperty(key, String(n));
    return n;
  });
}
function newTicketRef_() { const y = Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyy'); return 'KCM-' + y + '-' + String(nextSeq_('SEQ_TICKET_' + y)).padStart(6, '0'); }
function newCustomerRef_() { return 'CUS-' + String(nextSeq_('SEQ_CUSTOMER')).padStart(6, '0'); }
function newId_(prefix) { return prefix + '-' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyMMdd') + '-' + randomCode_(6); }

function dateOrBlank_(v, label) {
  if (v === '' || v === null || v === undefined) return '';
  const s = String(v);
  // date-only values are stored at 12:00 UTC: the same calendar day in every timezone from UTC-11 to UTC+11 (no drift)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00Z') : new Date(s);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) throw userError_('Please check the date' + (label ? ' for ' + label : '') + '.');
  return d;
}
function money_(v, label) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  if (!isFinite(n) || n < 0 || n > 50000000) throw userError_('Please check the amount' + (label ? ' for ' + label : '') + '.');
  return Math.round(n * 100) / 100;
}
function count_(v, max) { const n = Math.floor(Number(v) || 0); return Math.max(0, Math.min(max || 500, n)); }
function oneOf_(v, list, fallback) { return list.indexOf(v) !== -1 ? v : fallback; }
function phoneKey_(p) { let d = String(p || '').replace(/\D/g, ''); if (d.indexOf('0') === 0 && d.length === 10) d = '27' + d.slice(1); return d.length >= 9 ? d : ''; }
function day_(d) { return d ? new Date(d).getTime() : 0; }
/** A date-only deadline (stored 12:00 UTC) counts as passed once that whole day is over in South Africa. */
function pastDue_(d) { return !!d && day_(d) + 10 * 3600000 < Date.now(); }
function audit_(actor, ref, action, details) { log_(actor, action, ref, typeof details === 'string' ? details : JSON.stringify(details)); }

/* =====================================================================
 * Access to a ticket
 * ===================================================================== */

function involved_(user, t) {
  const me = user.Email;
  return t.AssignedTo === me || t.CreatedBy === me || String(t.SupportBy || '').split(',').map(s => s.trim()).indexOf(me) !== -1;
}
function canSeeTicket_(user, t) { return can_(user, 'ops.view.all') || (can_(user, 'ops.edit.own') && involved_(user, t)); }
function canEditTicket_(user, t) { return can_(user, 'ops.edit.any') || (can_(user, 'ops.edit.own') && involved_(user, t)); }
/** Loads a ticket the user may see; a ticket the user may not see looks exactly like one that doesn't exist (no IDOR hints). */
function loadTicket_(user, ref, needEdit) {
  const f = findRow_('Tickets', String(ref || ''));
  if (!f || !canSeeTicket_(user, f.row)) throw userError_('Ticket not found.', 'notfound');
  if (needEdit && !canEditTicket_(user, f.row)) throw userError_('You can view this ticket but not change it.', 'forbidden');
  return f;
}
function requireOpsUser_(token) {
  const user = requireUser_(token);
  if (!can_(user, 'ops.view.all') && !can_(user, 'ops.edit.own')) throw userError_('You do not have access to this.', 'forbidden');
  return user;
}
function touchTicket_(f, actor, extra) {
  const t = Object.assign({}, f.row, extra || {});
  t.Updated = new Date(); t.UpdatedBy = actor.Email; t.LastActivity = new Date(); t.Version = Number(f.row.Version || 0) + 1;
  writeRow_('Tickets', f.index, t);
  f.row = t;
  return t;
}
function checkVersion_(f, version) {
  if (version !== undefined && version !== null && version !== '' && Number(version) !== Number(f.row.Version || 0)) {
    throw userError_('Someone else updated this ticket a moment ago. Reload it to see their changes, then try again.', 'conflict');
  }
}

/* =====================================================================
 * Staff, notifications
 * ===================================================================== */

function staffList_() {
  return readTable_('Users').filter(u => isStaff_(u) && u.Status !== 'disabled').map(u => ({ email: u.Email, name: u.Name || u.Email, role: roleOf_(u) }));
}
function notify_(email, type, ref, message, dedupKey) {
  if (!email) return;
  if (dedupKey && readTable_('Notifications').some(n => n.DedupKey === dedupKey && n.UserEmail === email)) return;
  appendObj_('Notifications', { NotifID: newId_('N'), Created: new Date(), UserEmail: email, Type: type, TicketRef: ref || '', Message: safe_(message, 300), ReadAt: '', DedupKey: dedupKey || '' });
}
function notifyRoles_(roles, type, ref, message, dedupKey, exceptEmail) {
  staffList_().filter(s => roles.indexOf(s.role) !== -1 && s.email !== exceptEmail).forEach(s => notify_(s.email, type, ref, message, dedupKey ? dedupKey + ':' + s.email : ''));
}
function listNotifications_(b) {
  const user = requireUser_(b.token);
  const all = readTable_('Notifications').filter(n => n.UserEmail === user.Email);
  return { unread: all.filter(n => !n.ReadAt).length, items: all.slice(-60).reverse().map(n => ({ id: n.NotifID, created: iso_(n.Created), type: n.Type, ref: n.TicketRef, message: n.Message, read: !!n.ReadAt })) };
}
function markNotificationsRead_(b) {
  const user = requireUser_(b.token);
  const ids = Array.isArray(b.ids) ? b.ids.map(String) : null;
  withLock_(() => {
    const sh = sheet_('Notifications');
    const rows = sh.getDataRange().getValues();
    const col = TABS.Notifications.indexOf('ReadAt') + 1;
    rows.forEach((r, i) => { if (i > 0 && r[2] === user.Email && !r[6] && (!ids || ids.indexOf(r[0]) !== -1)) sh.getRange(i + 1, col).setValue(new Date()); });
  });
  return { ok: true };
}

/* =====================================================================
 * Config for the UI (lists, staff, statuses)
 * ===================================================================== */

function customStatuses_() {
  const s = readTable_('OpsSettings').find(x => x.Key === 'customStatuses');
  try { return s ? JSON.parse(s.Value) : []; } catch (e) { return []; }
}
function allStatuses_() { const c = customStatuses_(); return OP_STATUSES.slice(0, CONFIRMED_INDEX).concat(c, OP_STATUSES.slice(CONFIRMED_INDEX)); }

function opsConfig_(b) {
  const user = requireOpsUser_(b.token);
  return {
    statuses: allStatuses_(), closed: CLOSED_STATUSES, confirmed: 'BOOKING CONFIRMED', custom: customStatuses_(),
    paymentStatuses: PAYMENT_STATUSES_DERIVED, responseStatuses: RESPONSE_STATUSES.filter(Boolean), priorities: PRIORITIES, sources: SOURCES,
    enquiryTypes: ENQUIRY_TYPES, customerTypes: CUSTOMER_TYPES, comms: COMMS, taskStatuses: TASK_STATUSES, noteKinds: NOTE_KINDS,
    paymentTypes: PAYMENT_TYPES, paymentMethods: PAYMENT_METHODS, quoteCategories: QUOTE_CATEGORIES, vatRate: VAT_RATE,
    depositPct: Math.round(CATALOG.depositRate * 100), packages: Object.keys(CATALOG.tours).map(k => ({ slug: k, title: CATALOG.tours[k].title, nights: CATALOG.tours[k].nights })),
    staff: staffList_().filter(s => PERMS['ops.edit.own'].indexOf(s.role) !== -1), templates: templates_().map(t => ({ id: t.TemplateID, name: t.Name })),
    me: { email: user.Email, permissions: permissionsOf_(user), role: roleOf_(user) },
  };
}

function saveCustomStatus_(b) {
  const actor = requirePerm_(b.token, 'ops.statuses');
  const name = safe_(b.name, 40).toUpperCase().replace(/^'/, '');
  if (!/^[A-Z0-9 /&-]{3,40}$/.test(name)) throw userError_('Use 3–40 letters, numbers or spaces.');
  if (OP_STATUSES.indexOf(name) !== -1) throw userError_('That status already exists.');
  const list = customStatuses_();
  if (b.remove) { const i = list.indexOf(name); if (i !== -1) list.splice(i, 1); } else if (list.indexOf(name) === -1) list.push(name);
  withLock_(() => {
    const f = findRow_('OpsSettings', 'customStatuses');
    const row = { Key: 'customStatuses', Value: JSON.stringify(list), Updated: new Date(), UpdatedBy: actor.Email };
    if (f) writeRow_('OpsSettings', f.index, row); else appendObj_('OpsSettings', row);
  });
  audit_(actor.Email, 'settings', b.remove ? 'status_removed' : 'status_added', name);
  return { statuses: allStatuses_() };
}

/* =====================================================================
 * Customers (one profile, many enquiries; duplicates avoided by email / phone)
 * ===================================================================== */

function findCustomerMatch_(email, phone) {
  const e = String(email || '').toLowerCase(), pk = phoneKey_(phone);
  return readTable_('Customers').find(c => c.Status !== 'erased' && ((e && String(c.Email).toLowerCase() === e) || (pk && c.PhoneKey === pk))) || null;
}
function customerView_(c) {
  return { ref: c.CustomerRef, created: iso_(c.Created), name: c.FullName, email: c.Email, phone: c.Phone, whatsapp: c.WhatsApp, altPhone: c.AltPhone,
    preferredComms: c.PreferredComms, location: c.Location, type: c.CustomerType, consentAt: iso_(c.ConsentAt), consentSource: c.ConsentSource, status: c.Status };
}
function upsertCustomer_(d, actorEmail) {
  return withLock_(() => {
    const match = d.customerRef ? findRow_('Customers', d.customerRef) : null;
    if (d.customerRef && !match) throw userError_('Customer not found.');
    const existing = match ? match.row : findCustomerMatch_(d.email, d.phone);
    if (existing) {
      const f = match || findRow_('Customers', existing.CustomerRef);
      const c = Object.assign({}, f.row);
      // fill gaps only; never silently overwrite what the customer told us before
      [['FullName', d.name], ['Email', d.email], ['Phone', d.phone], ['WhatsApp', d.whatsapp], ['AltPhone', d.altPhone], ['PreferredComms', d.preferredComms],
        ['Location', d.location], ['CustomerType', d.type]].forEach(([k, v]) => { if (!c[k] && v) c[k] = safe_(v, 120); });
      if (!c.PhoneKey) c.PhoneKey = phoneKey_(c.Phone);
      if (d.consentSource && !c.ConsentAt) { c.ConsentAt = new Date(); c.ConsentSource = d.consentSource; }
      c.Updated = new Date();
      writeRow_('Customers', f.index, c);
      return { ref: c.CustomerRef, existing: true };
    }
    const ref = newCustomerRef_();
    appendObj_('Customers', { CustomerRef: ref, Created: new Date(), FullName: safe_(d.name, 80), Email: String(d.email || '').toLowerCase().slice(0, 120),
      Phone: safe_(d.phone, 30), WhatsApp: safe_(d.whatsapp, 30), AltPhone: safe_(d.altPhone, 30), PreferredComms: oneOf_(d.preferredComms, COMMS, ''),
      Location: safe_(d.location, 80), CustomerType: oneOf_(d.type, CUSTOMER_TYPES, 'Individual'), ConsentAt: d.consentSource ? new Date() : '',
      ConsentSource: safe_(d.consentSource, 60), Updated: new Date(), Status: 'active', PhoneKey: phoneKey_(d.phone), CreatedBy: actorEmail || 'public' });
    return { ref, existing: false };
  });
}
function listCustomers_(b) {
  requirePerm_(b.token, 'ops.intake');
  const q = String(b.q || '').toLowerCase().trim();
  if (q.length < 2) return [];
  const pk = phoneKey_(q);
  return readTable_('Customers').filter(c => c.Status !== 'erased' && (String(c.FullName).toLowerCase().indexOf(q) !== -1 || String(c.Email).toLowerCase().indexOf(q) !== -1 ||
    (pk && String(c.PhoneKey).indexOf(pk) !== -1) || c.CustomerRef.toLowerCase() === q)).slice(0, 15).map(customerView_);
}
function getCustomer_(b) {
  const user = requireOpsUser_(b.token);
  const f = findRow_('Customers', String(b.ref || ''));
  if (!f) throw userError_('Customer not found.', 'notfound');
  const tickets = readTable_('Tickets').filter(t => t.CustomerRef === f.row.CustomerRef && canSeeTicket_(user, t));
  if (!can_(user, 'ops.view.all') && !tickets.length) throw userError_('Customer not found.', 'notfound');
  return { customer: customerView_(f.row), tickets: tickets.map(t => ticketSummary_(t, null)) };
}
function updateCustomer_(b) {
  const user = requireOpsUser_(b.token);
  const f = findRow_('Customers', String(b.ref || ''));
  if (!f || f.row.Status === 'erased') throw userError_('Customer not found.', 'notfound');
  const mine = readTable_('Tickets').some(t => t.CustomerRef === f.row.CustomerRef && canEditTicket_(user, t));
  if (!can_(user, 'ops.edit.any') && !mine) throw userError_('Customer not found.', 'notfound');
  const d = b.customer || {}, c = Object.assign({}, f.row), changes = {};
  const set = (k, v) => { if (v !== undefined && String(v) !== String(c[k])) { changes[k] = [c[k], v]; c[k] = v; } };
  if (d.name !== undefined) { if (!String(d.name).trim()) throw userError_('Name cannot be empty.'); set('FullName', safe_(d.name, 80)); }
  if (d.email !== undefined) { const e = String(d.email).trim().toLowerCase(); if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw userError_('Please check the email address.'); set('Email', e); }
  if (d.phone !== undefined) { set('Phone', safe_(d.phone, 30)); c.PhoneKey = phoneKey_(c.Phone); }
  ['whatsapp:WhatsApp', 'altPhone:AltPhone', 'location:Location'].forEach(p => { const [k, col] = p.split(':'); if (d[k] !== undefined) set(col, safe_(d[k], 80)); });
  if (d.preferredComms !== undefined) set('PreferredComms', oneOf_(d.preferredComms, COMMS, ''));
  if (d.type !== undefined) set('CustomerType', oneOf_(d.type, CUSTOMER_TYPES, 'Individual'));
  c.Updated = new Date();
  withLock_(() => writeRow_('Customers', f.index, c));
  audit_(user.Email, c.CustomerRef, 'customer_updated', Object.keys(changes).reduce((o, k) => { o[k] = 'changed'; return o; }, {}));
  return customerView_(c);
}
/**
 * POPIA right to deletion: personal details are anonymised. Financial and booking records are kept (retention for tax/audit),
 * but no longer identify the person. Refused while the customer still has an open ticket.
 */
function eraseCustomer_(b) {
  const actor = requirePerm_(b.token, 'customers.erase');
  const f = findRow_('Customers', String(b.ref || ''));
  if (!f || f.row.Status === 'erased') throw userError_('Customer not found.');
  if (!String(b.reason || '').trim()) throw userError_('Please record why the data is being erased (e.g. customer request date).');
  const open = readTable_('Tickets').filter(t => t.CustomerRef === f.row.CustomerRef && CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  if (open.length) throw userError_('Close or cancel the customer\'s open tickets first (' + open.map(t => t.Ref).join(', ') + ').');
  const email = String(f.row.Email || '').toLowerCase(), pk = f.row.PhoneKey;
  withLock_(() => {
    writeRow_('Customers', f.index, Object.assign({}, f.row, { FullName: 'Erased customer', Email: '', Phone: '', WhatsApp: '', AltPhone: '', Location: '', PhoneKey: '', Status: 'erased', Updated: new Date() }));
    const scrub = (tab, emailCol, phoneCol, nameCol) => {
      const sh = sheet_(tab); const rows = sh.getDataRange().getValues();
      rows.forEach((r, i) => { if (i > 0 && ((email && String(r[emailCol]).toLowerCase() === email) || (pk && phoneKey_(r[phoneCol]) === pk))) { sh.getRange(i + 1, nameCol + 1).setValue('Erased'); sh.getRange(i + 1, emailCol + 1).setValue(''); sh.getRange(i + 1, phoneCol + 1).setValue(''); } });
    };
    scrub('Bookings', TABS.Bookings.indexOf('Email'), TABS.Bookings.indexOf('Phone'), TABS.Bookings.indexOf('Name'));
    scrub('Messages', TABS.Messages.indexOf('Email'), TABS.Messages.indexOf('Phone'), TABS.Messages.indexOf('Name'));
  });
  audit_(actor.Email, f.row.CustomerRef, 'customer_erased', safe_(b.reason, 300));
  return { erased: true };
}

/* =====================================================================
 * Tickets
 * ===================================================================== */

/** From the public website / Kaycee: creates (or links) the customer and a NEW ENQUIRY ticket. */
function opsCreateTicketFromPublic_(d) {
  const cust = upsertCustomer_({ name: d.customer.name, email: d.customer.email, phone: d.customer.phone, consentSource: d.customer.consentSource }, 'public');
  const type = d.dayTour ? 'Day tour' : d.package && d.package !== 'Trip enquiry' ? 'Package tour' : 'General enquiry';
  const ref = newTicketRef_();
  const t = { Ref: ref, CustomerRef: cust.ref, Created: new Date(), Received: new Date(), Source: d.source, EnquiryType: type, OpStatus: 'NEW ENQUIRY',
    PaymentStatus: 'Not invoiced', ResponseStatus: '', Priority: 'Normal', CreatedBy: d.source === 'Kaycee AI' ? 'Kaycee (website)' : 'Website', Updated: new Date(),
    Description: d.description, Destination: d.destination, Package: d.package, PackageSlug: d.packageSlug, DepartDate: d.departDate ? dateOrBlank_(d.departDate) : '',
    Nights: d.nights, Adults: d.adults, Children: d.children, Infants: d.infants, Pensioners: d.pensioners, Rooms: d.rooms, Activities: d.activities,
    AirportTransfer: (d.extras || []).some(x => /transfer/i.test(x)) ? 'Yes' : '', CarHire: (d.extras || []).some(x => /car hire/i.test(x)) ? 'Yes' : '',
    Insurance: (d.extras || []).some(x => /insurance/i.test(x)) ? 'Yes' : '', SpecialRequests: (d.extras || []).join(', '), Budget: d.budget, PaymentPref: d.paymentPref,
    WebsiteEstimate: d.estimate || 0, NextAction: 'Review enquiry and assign', NextActionDue: new Date(Date.now() + 4 * 3600000), Template: TEMPLATE_BY_TYPE[type], Version: 1, LastActivity: new Date() };
  withLock_(() => { appendObj_('Tickets', t); createChecklist_(ref, TEMPLATE_BY_TYPE[type]); });
  audit_(t.CreatedBy, ref, 'ticket_created', { source: d.source, customer: cust.ref, existingCustomer: cust.existing });
  notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'new_enquiry', ref, `New enquiry ${ref} via ${d.source}: ${d.package || 'trip enquiry'}`);
  return { ref, customerRef: cust.ref };
}

const TICKET_FIELDS = {
  // section A
  source: ['Source', 'enum', SOURCES], enquiryType: ['EnquiryType', 'enum', ENQUIRY_TYPES], received: ['Received', 'date'], description: ['Description', 'text', 2000],
  intakeNotes: ['IntakeNotes', 'text', 2000],
  // section C (travel)
  destination: ['Destination', 'text', 120], destinations: ['Destinations', 'text', 300], package: ['Package', 'text', 140], customTrip: ['CustomTrip', 'yesno'],
  departDate: ['DepartDate', 'date'], returnDate: ['ReturnDate', 'date'], nights: ['Nights', 'count', 120], adults: ['Adults', 'count', 500], children: ['Children', 'count', 500],
  infants: ['Infants', 'count', 100], pensioners: ['Pensioners', 'count', 500], accommodation: ['Accommodation', 'text', 120], rooms: ['Rooms', 'text', 200],
  transport: ['Transport', 'text', 300], activities: ['Activities', 'text', 400], airportTransfer: ['AirportTransfer', 'yesno'], carHire: ['CarHire', 'yesno'],
  insurance: ['Insurance', 'yesno'], meals: ['Meals', 'text', 200], specialRequests: ['SpecialRequests', 'text', 1000], accessibility: ['Accessibility', 'text', 500],
  budget: ['Budget', 'text', 60], paymentPref: ['PaymentPref', 'text', 60],
  // section E (agent may edit on own tickets)
  nextAction: ['NextAction', 'text', 200], nextActionDue: ['NextActionDue', 'date'], followUp: ['FollowUp', 'date'], commsNotes: ['CommsNotes', 'text', 2000],
  outstanding: ['Outstanding', 'text', 1000],
  // management only
  priority: ['Priority', 'enum', PRIORITIES, 'ops.assign'], deadline: ['Deadline', 'date', null, 'ops.assign'],
};
/** Whitelisted field mapping (protects against mass assignment: status, assignment, money and IDs can't be set through here). */
function applyTicketFields_(t, fields, user) {
  const changes = {};
  Object.keys(fields || {}).forEach(k => {
    const spec = TICKET_FIELDS[k];
    if (!spec || fields[k] === undefined) return;
    const [col, type, extra, perm] = spec;
    if (perm && !can_(user, perm)) throw userError_('Only management can change ' + k.replace(/([A-Z])/g, ' $1').toLowerCase() + '.', 'forbidden');
    let v = fields[k];
    if (type === 'enum') v = oneOf_(v, extra, t[col] || extra[0]);
    else if (type === 'date') v = dateOrBlank_(v, k);
    else if (type === 'count') v = v === '' ? '' : count_(v, extra);
    else if (type === 'yesno') v = v === true || v === 'Yes' ? 'Yes' : v === false || v === 'No' ? 'No' : '';
    else v = safe_(v, extra);
    const before = t[col] instanceof Date ? iso_(t[col]) : String(t[col] == null ? '' : t[col]);
    const after = v instanceof Date ? iso_(v) : String(v);
    if (before !== after) { changes[col] = [before.slice(0, 60), after.slice(0, 60)]; t[col] = v; }
  });
  if (t.DepartDate && t.ReturnDate && day_(t.ReturnDate) < day_(t.DepartDate)) throw userError_('The return date is before the departure date.');
  return changes;
}

/** Internal intake form (sections A–E). Incomplete forms can be saved; employees complete them later. */
function createTicket_(b) {
  const actor = requirePerm_(b.token, 'ops.intake');
  const c = b.customer || {}, f = b.fields || {};
  if (!c.customerRef && !String(c.name || '').trim() && !c.phone && !c.email) throw userError_('Add at least the customer\'s name or a contact number.');
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(c.email).trim())) throw userError_('Please check the customer\'s email address.');
  if (!f.source) throw userError_('Choose where the enquiry came from.');
  const cust = upsertCustomer_(Object.assign({}, c, { consentSource: c.consent ? 'Recorded by ' + actor.Email : '' }), actor.Email);
  const ref = newTicketRef_();
  const t = { Ref: ref, CustomerRef: cust.ref, Created: new Date(), Received: new Date(), OpStatus: 'NEW ENQUIRY', PaymentStatus: 'Not invoiced', ResponseStatus: '',
    Priority: 'Normal', CreatedBy: actor.Email, Updated: new Date(), UpdatedBy: actor.Email, Version: 1, LastActivity: new Date() };
  const mgr = can_(actor, 'ops.assign');
  applyTicketFields_(t, Object.assign({}, f, mgr ? {} : { priority: undefined, deadline: undefined }), actor);
  if (b.existingRef) t.IntakeNotes = safe_('Related to ' + b.existingRef + '. ' + (t.IntakeNotes || ''), 2000);
  t.Template = TEMPLATE_BY_TYPE[t.EnquiryType] || 'general';
  let assignee = String(b.assignTo || '').toLowerCase();
  if (assignee && !mgr && assignee !== actor.Email) throw userError_('Only management can assign tickets to other people.', 'forbidden');
  if (assignee && !staffList_().some(s => s.email === assignee && PERMS['ops.edit.own'].indexOf(s.role) !== -1)) throw userError_('Choose a valid employee.');
  if (!assignee && !mgr) assignee = actor.Email; // agents own what they register
  if (assignee) { t.AssignedTo = assignee; t.OpStatus = 'ASSIGNED'; }
  if (!t.NextAction) t.NextAction = assignee ? 'Contact the customer' : 'Review enquiry and assign';
  if (!t.NextActionDue) t.NextActionDue = new Date(Date.now() + 24 * 3600000);
  withLock_(() => { appendObj_('Tickets', t); createChecklist_(ref, t.Template); });
  audit_(actor.Email, ref, 'ticket_created', { source: t.Source, customer: cust.ref, existingCustomer: cust.existing, assignedTo: assignee || '' });
  if (assignee) afterAssign_(t, assignee, '', actor);
  else notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'new_enquiry', ref, `New enquiry ${ref} (${t.Source}) registered by ${actor.Name || actor.Email}`, '', actor.Email);
  return { ref, customerRef: cust.ref, existingCustomer: cust.existing };
}

function updateTicket_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    checkVersion_(f, b.version);
    if (CLOSED_STATUSES.indexOf(f.row.OpStatus) !== -1 && !can_(user, 'ops.edit.any')) throw userError_('This ticket is closed.');
    const t = Object.assign({}, f.row);
    const changes = applyTicketFields_(t, b.fields || {}, user);
    if (!Object.keys(changes).length) return { ticket: ticketSummary_(f.row), unchanged: true };
    touchTicket_(f, user, t);
    audit_(user.Email, f.row.Ref, 'ticket_updated', changes);
    notifyOthers_(f.row, user, 'ticket_updated', `${user.Name || user.Email} updated ${f.row.Ref}`);
    return { ticket: ticketSummary_(f.row), version: f.row.Version };
  });
}
function notifyOthers_(t, user, type, msg) {
  [t.AssignedTo].concat(String(t.SupportBy || '').split(',')).map(s => String(s).trim()).filter(e => e && e !== user.Email)
    .forEach(e => notify_(e, type, t.Ref, msg, type + ':' + t.Ref + ':' + e + ':' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyyMMddHH')));
}

/* ---------- lifecycle ---------- */

function ticketMoney_(ref) {
  const quotes = readTable_('Quotes').filter(q => q.TicketRef === ref);
  const accepted = quotes.filter(q => q.Status === 'Accepted').sort((a, b) => num_(b.Version) - num_(a.Version))[0] || null;
  const pays = readTable_('Payments').filter(p => p.TicketRef === ref && p.Verification !== 'Voided');
  const verifiedIn = pays.filter(p => p.Type !== 'refund' && p.Verification === 'Verified').reduce((s, p) => s + num_(p.Amount), 0);
  const unverifiedIn = pays.filter(p => p.Type !== 'refund' && p.Verification === 'Unverified').reduce((s, p) => s + num_(p.Amount), 0);
  const refunds = pays.filter(p => p.Type === 'refund');
  const refunded = refunds.filter(p => p.ApprovalStatus === 'Approved').reduce((s, p) => s + num_(p.Amount), 0);
  const refundPending = refunds.some(p => p.ApprovalStatus === 'Pending approval');
  const paid = Math.round((verifiedIn - refunded) * 100) / 100;
  const final = accepted ? num_(accepted.FinalAmount) : 0, deposit = accepted ? num_(accepted.DepositAmount) : 0;
  return { accepted, quotes, pays, verifiedIn, unverifiedIn, refunded, refundPending, paid, final, deposit, outstanding: Math.max(0, Math.round((final - paid) * 100) / 100) };
}
function derivePaymentStatus_(t, m) {
  if (m.refundPending) return 'Refund pending';
  if (m.refunded > 0 && m.paid <= 0) return 'Refunded';
  if (!m.accepted) return 'Not invoiced';
  if (m.final > 0 && m.paid >= m.final) return 'Fully paid';
  if (m.deposit > 0 && m.paid >= m.deposit) return m.paid > m.deposit ? 'Partially paid' : 'Deposit received';
  if (m.paid > 0) return 'Partially paid';
  const due = t.Deadline ? day_(t.Deadline) : day_(m.accepted.AcceptedAt) + 7 * 86400000;
  if (due && due < Date.now() && CLOSED_STATUSES.indexOf(t.OpStatus) === -1) return 'Overdue';
  return m.deposit > 0 && m.deposit < m.final ? 'Deposit pending' : 'Awaiting payment';
}
function refreshPaymentStatus_(ref, actorEmail) {
  const f = findRow_('Tickets', ref);
  if (!f) return null;
  const m = ticketMoney_(ref);
  const ps = derivePaymentStatus_(f.row, m);
  if (ps !== f.row.PaymentStatus) { writeRow_('Tickets', f.index, Object.assign({}, f.row, { PaymentStatus: ps, LastActivity: new Date() })); audit_(actorEmail, ref, 'payment_status', { from: f.row.PaymentStatus, to: ps }); }
  return { status: ps, money: m };
}

/** Guards that stop status changes from skipping essential steps. Returns an error message or ''. */
function transitionProblem_(t, to, user, note) {
  const statuses = allStatuses_();
  if (statuses.indexOf(to) === -1) return 'Unknown status.';
  const from = t.OpStatus, m = ticketMoney_(t.Ref);
  const idx = s => OP_STATUSES.indexOf(s);
  const wasConfirmed = !!t.ConfirmedAt;
  if (CLOSED_STATUSES.indexOf(from) !== -1 && !can_(user, 'ops.edit.any')) return 'This ticket is closed. Ask management to reopen it.';
  if (['CANCELLED', 'LOST / DECLINED', 'ON HOLD'].indexOf(to) !== -1 && !String(note || '').trim()) return 'Please add a reason.';
  if (to === 'CANCELLED' && wasConfirmed && !can_(user, 'ops.confirm')) return 'Only management can cancel a confirmed booking.';
  if (to === 'ASSIGNED' && !t.AssignedTo) return 'Assign an employee first.';
  if (to === 'UNASSIGNED' && t.AssignedTo) return 'This ticket is assigned. Reassign it instead.';
  if (to === 'QUOTATION SENT' && !m.quotes.some(q => ['Sent', 'Accepted', 'Declined'].indexOf(q.Status) !== -1)) return 'Send a quotation first (Quotations → Send).';
  if (to === 'AWAITING CUSTOMER RESPONSE' && !m.quotes.some(q => q.Status === 'Sent')) return 'There is no sent quotation waiting for a response.';
  if (['ACCEPTED BY CUSTOMER', 'AWAITING DEPOSIT', 'SUPPLIER CONFIRMATION'].indexOf(to) !== -1 && !m.accepted) return 'Record the customer\'s acceptance of a quotation first.';
  if (to === 'PAYMENT VERIFICATION' && !m.pays.some(p => p.Type !== 'refund')) return 'Record a payment first.';
  if (to === 'BOOKING CONFIRMED') {
    if (!can_(user, 'ops.confirm')) return 'Only management can confirm a booking.';
    if (!m.accepted) return 'A booking needs an accepted quotation.';
    if (m.paid < (m.deposit || m.final) || m.paid <= 0) return 'A booking can only be confirmed once finance has verified the deposit (R' + zar_((m.deposit || m.final)) + ').';
  }
  if (['TRIP PREPARATION', 'IN PROGRESS / TRAVELLING'].indexOf(to) !== -1 && !wasConfirmed) return 'Confirm the booking first.';
  if (to === 'COMPLETED') {
    if (!wasConfirmed) return 'Only confirmed bookings can be completed. Use Cancelled or Lost for others.';
    if (m.outstanding > 0 && !(can_(user, 'ops.confirm') && String(note || '').trim())) return 'R' + zar_(m.outstanding) + ' is still outstanding. Management can complete it with a note.';
  }
  if (wasConfirmed && idx(to) !== -1 && idx(to) < CONFIRMED_INDEX && ['ON HOLD'].indexOf(to) === -1 && !can_(user, 'ops.confirm')) return 'Only management can move a confirmed booking back.';
  if (from === to) return 'The ticket already has this status.';
  return '';
}

function setTicketStatus_(b) {
  const user = requireOpsUser_(b.token);
  const to = String(b.status || '');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    checkVersion_(f, b.version);
    const problem = transitionProblem_(f.row, to, user, b.note);
    if (problem) throw userError_(problem, 'guard');
    const extra = { OpStatus: to };
    if (to === 'BOOKING CONFIRMED') extra.ConfirmedAt = new Date();
    if (CLOSED_STATUSES.indexOf(to) !== -1) extra.ClosedAt = new Date(); else if (f.row.ClosedAt) extra.ClosedAt = '';
    const from = f.row.OpStatus;
    touchTicket_(f, user, extra);
    if (b.note) addNoteRow_(f.row.Ref, user.Email, 'decision', '', `Status ${from} → ${to}: ${safe_(b.note, 1500)}`);
    audit_(user.Email, f.row.Ref, 'status_changed', { from, to, note: safe_(b.note || '', 200) });
    notifyOthers_(f.row, user, 'status_changed', `${f.row.Ref} moved to ${to}`);
    if (to === 'BOOKING CONFIRMED') {
      autoTask_(f.row, 'Send itinerary and travel information to the customer', f.row.AssignedTo, f.row.DepartDate ? new Date(day_(f.row.DepartDate) - 3 * 86400000) : new Date(Date.now() + 2 * 86400000));
      tickChecklist_(f.row.Ref, ['Booking reference issued'], user.Email);
    }
    return { ticket: ticketSummary_(f.row), version: f.row.Version };
  });
}

function setResponseStatus_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const v = oneOf_(b.status, RESPONSE_STATUSES, null);
    if (v === null) throw userError_('Invalid response status.');
    if (v === 'Accepted') throw userError_('Record acceptance on the quotation itself (Quotations → Accepted), so it is linked to the right version.');
    const from = f.row.ResponseStatus;
    touchTicket_(f, user, { ResponseStatus: v });
    audit_(user.Email, f.row.Ref, 'response_status', { from, to: v });
    if (b.note) addNoteRow_(f.row.Ref, user.Email, 'customer', '', safe_(b.note, 1500));
    return { ticket: ticketSummary_(f.row), version: f.row.Version };
  });
}

/* ---------- assignment & handover ---------- */

function assignTicket_(b) {
  const actor = requirePerm_(b.token, 'ops.assign');
  const to = String(b.assignee || '').trim().toLowerCase();
  const staff = staffList_().filter(s => PERMS['ops.edit.own'].indexOf(s.role) !== -1);
  if (to && !staff.some(s => s.email === to)) throw userError_('Choose a valid employee.');
  const supporters = (Array.isArray(b.supporters) ? b.supporters : []).map(s => String(s).toLowerCase().trim()).filter(s => s && s !== to && staff.some(x => x.email === s)).slice(0, 5);
  return withLock_(() => {
    const f = loadTicket_(actor, b.ref, false);
    checkVersion_(f, b.version);
    const prev = f.row.AssignedTo || '';
    const extra = { AssignedTo: to, SupportBy: supporters.join(', ') };
    if (to && ['NEW ENQUIRY', 'AWAITING REVIEW', 'UNASSIGNED'].indexOf(f.row.OpStatus) !== -1) extra.OpStatus = 'ASSIGNED';
    if (!to && ['ASSIGNED', 'NEW ENQUIRY', 'AWAITING REVIEW'].indexOf(f.row.OpStatus) !== -1) extra.OpStatus = 'UNASSIGNED';
    if (b.priority) extra.Priority = oneOf_(b.priority, PRIORITIES, f.row.Priority);
    if (b.deadline !== undefined) extra.Deadline = dateOrBlank_(b.deadline, 'deadline');
    if (b.handoverSummary) extra.HandoverSummary = safe_(b.handoverSummary, 2000);
    if (to && (!f.row.NextAction || f.row.NextAction === 'Review enquiry and assign')) { extra.NextAction = 'Contact the customer and confirm requirements'; extra.NextActionDue = new Date(Date.now() + 24 * 3600000); }
    touchTicket_(f, actor, extra);
    // handover: previous work stays exactly where it is; we add a handover note and move the person's open tasks if asked
    if (prev && to && prev !== to) {
      addNoteRow_(f.row.Ref, actor.Email, 'handover', '', `Handover from ${prev} to ${to}.` + (b.handoverSummary ? '\n' + safe_(b.handoverSummary, 2000) : ''));
      if (b.moveTasks !== false) reassignOpenTasks_(f.row.Ref, prev, to, actor.Email);
      notify_(prev, 'reassigned', f.row.Ref, `${f.row.Ref} was reassigned to ${to}`);
    }
    audit_(actor.Email, f.row.Ref, prev && prev !== to ? 'ticket_reassigned' : 'ticket_assigned', { from: prev, to, supporters, priority: f.row.Priority });
    if (to && to !== prev) afterAssign_(f.row, to, prev, actor);
    supporters.forEach(s => notify_(s, 'supporting', f.row.Ref, `You were added as support on ${f.row.Ref}`, 'support:' + f.row.Ref + ':' + s));
    return { ticket: ticketSummary_(f.row), version: f.row.Version };
  });
}
function afterAssign_(t, to, prev, actor) {
  notify_(to, prev ? 'reassigned' : 'assigned', t.Ref, `${t.Ref} ${prev ? 'was handed over' : 'was assigned'} to you by ${actor.Name || actor.Email}`);
  const hasContactTask = readTable_('Tasks').some(k => k.TicketRef === t.Ref && k.Source === 'workflow:contact');
  if (!hasContactTask) autoTask_(t, 'Contact the customer and confirm requirements', to, new Date(Date.now() + 24 * 3600000), 'workflow:contact');
}
function reassignOpenTasks_(ref, from, to, actorEmail) {
  const sh = sheet_('Tasks');
  const rows = sh.getDataRange().getValues();
  const c = TABS.Tasks.indexOf('AssignedTo') + 1;
  rows.forEach((r, i) => { if (i > 0 && r[1] === ref && r[4] === from && ['COMPLETED', 'CANCELLED'].indexOf(r[7]) === -1) sh.getRange(i + 1, c).setValue(to); });
  audit_(actorEmail, ref, 'tasks_moved', { from, to });
}

/* ---------- notes (append-only) ---------- */

function addNoteRow_(ref, author, kind, channel, content, taskId) {
  const id = newId_('NT');
  appendObj_('Notes', { NoteID: id, TicketRef: ref, Created: new Date(), Author: author, Kind: kind, Channel: channel || '', Content: content, TaskID: taskId || '' });
  return id;
}
function addNote_(b) {
  const user = requireOpsUser_(b.token);
  const content = safe_(b.content, 4000);
  if (!content) throw userError_('Write the note first.');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const kind = oneOf_(b.kind, NOTE_KINDS, 'internal');
    const id = addNoteRow_(f.row.Ref, user.Email, kind, oneOf_(b.channel, COMMS.concat(['In person', 'Other']), ''), content, safe_(b.taskId, 40));
    let taskId = '';
    if (b.followUp && String(b.followUp.title || '').trim()) {
      const assignee = String(b.followUp.assignTo || user.Email).toLowerCase();
      if (assignee !== user.Email && !can_(user, 'ops.assign')) throw userError_('Only management can give tasks to other people.', 'forbidden');
      taskId = autoTask_(f.row, safe_(b.followUp.title, 140), assignee, dateOrBlank_(b.followUp.due, 'follow-up'), 'note:' + id, user.Email);
    }
    touchTicket_(f, user, {});
    audit_(user.Email, f.row.Ref, 'note_added', { kind, note: id, task: taskId });
    notifyOthers_(f.row, user, 'ticket_updated', `${user.Name || user.Email} added a note to ${f.row.Ref}`);
    return { id, taskId, version: f.row.Version };
  });
}

/* ---------- tasks ---------- */

function autoTask_(t, title, assignee, due, source, createdBy) {
  const id = newId_('T');
  appendObj_('Tasks', { TaskID: id, TicketRef: t.Ref, Title: title, AssignedTo: assignee || '', Priority: t.Priority || 'Normal', Due: due || '', Status: 'NOT STARTED',
    CreatedBy: createdBy || 'workflow', Created: new Date(), Source: source || 'workflow', Updated: new Date() });
  if (assignee && assignee !== createdBy) notify_(assignee, 'task_assigned', t.Ref, `New task on ${t.Ref}: ${title}`);
  return id;
}
function taskView_(k) {
  const overdue = k.Due && ['COMPLETED', 'CANCELLED'].indexOf(k.Status) === -1 && pastDue_(k.Due);
  return { id: k.TaskID, ref: k.TicketRef, title: k.Title, description: k.Description, assignedTo: k.AssignedTo, priority: k.Priority, due: iso_(k.Due), status: k.Status,
    createdBy: k.CreatedBy, created: iso_(k.Created), completedAt: iso_(k.CompletedAt), completedBy: k.CompletedBy, completionNotes: k.CompletionNotes, source: k.Source, overdue: !!overdue };
}
function createTask_(b) {
  const user = requireOpsUser_(b.token);
  const title = safe_(b.title, 140);
  if (!title) throw userError_('Give the task a title.');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const assignee = String(b.assignedTo || user.Email).toLowerCase();
    if (assignee !== user.Email && !can_(user, 'ops.assign')) throw userError_('Only management can give tasks to other people.', 'forbidden');
    if (!staffList_().some(s => s.email === assignee)) throw userError_('Choose a valid employee.');
    const id = newId_('T');
    appendObj_('Tasks', { TaskID: id, TicketRef: f.row.Ref, Title: title, Description: safe_(b.description, 1000), AssignedTo: assignee, Priority: oneOf_(b.priority, PRIORITIES, 'Normal'),
      Due: dateOrBlank_(b.due, 'due date'), Status: 'NOT STARTED', CreatedBy: user.Email, Created: new Date(), Source: 'manual', Updated: new Date() });
    touchTicket_(f, user, {});
    audit_(user.Email, f.row.Ref, 'task_created', { task: id, title, assignee });
    if (assignee !== user.Email) notify_(assignee, 'task_assigned', f.row.Ref, `New task on ${f.row.Ref}: ${title}`);
    return { id };
  });
}
function updateTask_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const tf = findRow_('Tasks', String(b.id || ''));
    if (!tf) throw userError_('Task not found.', 'notfound');
    const f = loadTicket_(user, tf.row.TicketRef, false);
    const own = tf.row.AssignedTo === user.Email;
    if (!own && !canEditTicket_(user, f.row)) throw userError_('Task not found.', 'notfound');
    const k = Object.assign({}, tf.row), changes = {};
    if (b.status !== undefined) {
      const s = oneOf_(b.status, TASK_STATUSES, null);
      if (!s) throw userError_('Invalid task status.');
      if (s !== k.Status) { changes.Status = [k.Status, s]; k.Status = s; }
      if (s === 'COMPLETED') { k.CompletedAt = new Date(); k.CompletedBy = user.Email; k.CompletionNotes = safe_(b.completionNotes, 1000); }
      else if (k.CompletedAt) { k.CompletedAt = ''; k.CompletedBy = ''; }
    }
    if (b.assignedTo !== undefined && b.assignedTo !== k.AssignedTo) {
      if (!can_(user, 'ops.assign')) throw userError_('Only management can reassign tasks.', 'forbidden');
      const to = String(b.assignedTo).toLowerCase();
      if (!staffList_().some(s => s.email === to)) throw userError_('Choose a valid employee.');
      changes.AssignedTo = [k.AssignedTo, to]; k.AssignedTo = to; notify_(to, 'task_assigned', k.TicketRef, `Task on ${k.TicketRef} assigned to you: ${k.Title}`);
    }
    if (b.due !== undefined) { k.Due = dateOrBlank_(b.due, 'due date'); changes.Due = 'changed'; }
    if (b.priority !== undefined) k.Priority = oneOf_(b.priority, PRIORITIES, k.Priority);
    k.Updated = new Date();
    writeRow_('Tasks', tf.index, k);
    touchTicket_(f, user, {});
    audit_(user.Email, k.TicketRef, 'task_updated', Object.assign({ task: k.TaskID }, changes));
    return taskView_(k);
  });
}
function listTasks_(b) {
  const user = requireOpsUser_(b.token);
  const tickets = {}; readTable_('Tickets').forEach(t => { tickets[t.Ref] = t; });
  let tasks = readTable_('Tasks').filter(k => tickets[k.TicketRef] && (canSeeTicket_(user, tickets[k.TicketRef]) || k.AssignedTo === user.Email));
  if (b.mine) tasks = tasks.filter(k => k.AssignedTo === user.Email);
  if (b.assignee && can_(user, 'ops.view.all')) tasks = tasks.filter(k => k.AssignedTo === b.assignee);
  if (b.open) tasks = tasks.filter(k => ['COMPLETED', 'CANCELLED'].indexOf(k.Status) === -1);
  return tasks.map(k => Object.assign(taskView_(k), { customer: tickets[k.TicketRef].CustomerRef, package: tickets[k.TicketRef].Package })).sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1).slice(0, 500);
}

/* ---------- checklists ---------- */

function templates_() {
  const rows = readTable_('ChecklistTemplates').filter(t => t.Active !== 'no');
  return rows.length ? rows : DEFAULT_TEMPLATES.map(t => ({ TemplateID: t.id, Name: t.name, AppliesTo: t.appliesTo.join(', '), Items: JSON.stringify(t.sections.reduce((a, s) => a.concat(DEFAULT_CHECKLIST[s].map(l => ({ section: s, label: l }))), [])), Active: 'yes' }));
}
function createChecklist_(ref, templateId) {
  const t = templates_().find(x => x.TemplateID === templateId) || templates_()[0];
  if (!t) return;
  let items = [];
  try { items = JSON.parse(t.Items || '[]'); } catch (e) { items = []; }
  const sh = sheet_('Checklist');
  const base = newId_('C');
  const rows = items.map((it, i) => { const o = { ItemID: base + '-' + i, TicketRef: ref, Section: safe_(it.section, 60), Label: safe_(it.label, 140), Ord: i, Done: '', AssignedTo: '', DoneAt: '', DoneBy: '', Notes: '', Applicable: 'yes' }; return TABS.Checklist.map(h => o[h] === undefined ? '' : o[h]); });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, TABS.Checklist.length).setValues(rows);
}
function tickChecklist_(ref, labels, by) {
  const sh = sheet_('Checklist');
  const rows = sh.getDataRange().getValues();
  rows.forEach((r, i) => { if (i > 0 && r[1] === ref && labels.indexOf(r[3]) !== -1 && r[5] !== 'yes') { sh.getRange(i + 1, 6, 1, 4).setValues([['yes', r[6], new Date(), by + ' (auto)']]); } });
}
function updateChecklistItem_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const cf = findRow_('Checklist', String(b.id || ''));
    if (!cf) throw userError_('Checklist item not found.', 'notfound');
    const f = loadTicket_(user, cf.row.TicketRef, true);
    const it = Object.assign({}, cf.row), changes = {};
    if (b.done !== undefined) { const v = b.done ? 'yes' : ''; if (v !== it.Done) { changes.done = [it.Done || 'no', v || 'no']; it.Done = v; it.DoneAt = v ? new Date() : ''; it.DoneBy = v ? user.Email : ''; } }
    if (b.applicable !== undefined) { it.Applicable = b.applicable ? 'yes' : 'no'; changes.applicable = it.Applicable; }
    if (b.notes !== undefined) { it.Notes = safe_(b.notes, 500); changes.notes = 'changed'; }
    if (b.assignedTo !== undefined) {
      const to = String(b.assignedTo).toLowerCase();
      if (to && to !== user.Email && !can_(user, 'ops.assign')) throw userError_('Only management can assign checklist items to other people.', 'forbidden');
      it.AssignedTo = to; changes.assignedTo = to;
    }
    writeRow_('Checklist', cf.index, it);
    touchTicket_(f, user, {});
    audit_(user.Email, it.TicketRef, 'checklist_updated', Object.assign({ item: it.Label }, changes));
    return checklistView_(it);
  });
}
function addChecklistItem_(b) {
  const user = requireOpsUser_(b.token);
  const label = safe_(b.label, 140);
  if (!label) throw userError_('Write the checklist item.');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const it = { ItemID: newId_('C'), TicketRef: f.row.Ref, Section: safe_(b.section || 'Other', 60), Label: label, Ord: 999, Done: '', Applicable: 'yes' };
    appendObj_('Checklist', it);
    audit_(user.Email, f.row.Ref, 'checklist_item_added', { item: label });
    return checklistView_(it);
  });
}
function applyChecklistTemplate_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const t = templates_().find(x => x.TemplateID === b.templateId);
    if (!t) throw userError_('Template not found.');
    const have = readTable_('Checklist').filter(c => c.TicketRef === f.row.Ref).map(c => c.Section + '|' + c.Label);
    let items = []; try { items = JSON.parse(t.Items || '[]'); } catch (e) { items = []; }
    items.filter(it => have.indexOf(it.section + '|' + it.label) === -1).forEach((it, i) => appendObj_('Checklist', { ItemID: newId_('C') + i, TicketRef: f.row.Ref, Section: it.section, Label: it.label, Ord: 500 + i, Done: '', Applicable: 'yes' }));
    touchTicket_(f, user, { Template: t.TemplateID });
    audit_(user.Email, f.row.Ref, 'checklist_template_applied', t.Name);
    return { ok: true };
  });
}
function checklistView_(c) { return { id: c.ItemID, section: c.Section, label: c.Label, order: num_(c.Ord), done: c.Done === 'yes', assignedTo: c.AssignedTo, doneAt: iso_(c.DoneAt), doneBy: c.DoneBy, notes: c.Notes, applicable: c.Applicable !== 'no' }; }
function listTemplates_(b) {
  requireOpsUser_(b.token);
  return templates_().map(t => { let items = []; try { items = JSON.parse(t.Items || '[]'); } catch (e) { /* */ } return { id: t.TemplateID, name: t.Name, appliesTo: t.AppliesTo, items }; });
}
/** Items as text: one per line, "Section: item". */
function saveTemplate_(b) {
  const actor = requirePerm_(b.token, 'ops.templates');
  const name = safe_(b.name, 80);
  if (!name) throw userError_('Name the template.');
  const items = String(b.items || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 80).map(l => {
    const i = l.indexOf(':');
    return i > 0 ? { section: safe_(l.slice(0, i), 60), label: safe_(l.slice(i + 1), 140) } : { section: 'General', label: safe_(l, 140) };
  }).filter(x => x.label);
  if (!items.length) throw userError_('Add at least one item.');
  return withLock_(() => {
    if (!readTable_('ChecklistTemplates').length) DEFAULT_TEMPLATES.forEach(t => appendObj_('ChecklistTemplates', { TemplateID: t.id, Name: t.name, AppliesTo: t.appliesTo.join(', '), Items: JSON.stringify(t.sections.reduce((a, s) => a.concat(DEFAULT_CHECKLIST[s].map(l => ({ section: s, label: l }))), [])), Active: 'yes', Updated: new Date(), UpdatedBy: 'default' }));
    const id = b.id && /^[a-z0-9-]{2,30}$/.test(b.id) ? b.id : 'tpl-' + randomCode_(5).toLowerCase();
    const f = findRow_('ChecklistTemplates', id);
    const row = { TemplateID: id, Name: name, AppliesTo: safe_((b.appliesTo || []).join ? b.appliesTo.join(', ') : b.appliesTo, 300), Items: JSON.stringify(items), Active: b.active === false ? 'no' : 'yes', Updated: new Date(), UpdatedBy: actor.Email };
    if (f) writeRow_('ChecklistTemplates', f.index, row); else appendObj_('ChecklistTemplates', row);
    audit_(actor.Email, 'template:' + id, 'template_saved', { name, items: items.length });
    return { id };
  });
}

/* ---------- quotations (versioned; amounts calculated here) ---------- */

function calcQuote_(d) {
  const lines = (Array.isArray(d.lines) ? d.lines : []).slice(0, 40).map(l => ({ category: oneOf_(l.category, QUOTE_CATEGORIES, 'Other'), description: safe_(l.description, 140),
    supplier: safe_(l.supplier, 80), cost: money_(l.cost, 'a cost line') })).filter(l => l.description || l.cost);
  const cost = Math.round(lines.reduce((s, l) => s + l.cost, 0) * 100) / 100;
  let selling = d.sellingPrice !== undefined && d.sellingPrice !== '' ? money_(d.sellingPrice, 'selling price') : 0;
  if (!selling && d.markupPct !== undefined && d.markupPct !== '') { const mk = Number(d.markupPct); if (!isFinite(mk) || mk < 0 || mk > 500) throw userError_('Check the markup %.'); selling = Math.round(cost * (1 + mk / 100) * 100) / 100; }
  if (!selling) throw userError_('Enter a selling price (or a markup %).');
  const discount = money_(d.discount, 'discount');
  if (discount > selling) throw userError_('The discount is bigger than the selling price.');
  const vatMode = oneOf_(d.vatMode, ['none', 'inclusive', 'exclusive'], 'none');
  const sub = Math.round((selling - discount) * 100) / 100;
  const vat = vatMode === 'exclusive' ? Math.round(sub * VAT_RATE * 100) / 100 : vatMode === 'inclusive' ? Math.round(sub * VAT_RATE / (1 + VAT_RATE) * 100) / 100 : 0;
  const final = vatMode === 'exclusive' ? Math.round((sub + vat) * 100) / 100 : sub;
  const pct = d.depositPct === undefined || d.depositPct === '' ? Math.round(CATALOG.depositRate * 100) : Number(d.depositPct);
  if (!isFinite(pct) || pct < 0 || pct > 100) throw userError_('Deposit % must be between 0 and 100.');
  const deposit = Math.round(final * pct / 100 * 100) / 100;
  const net = vatMode === 'none' ? final : final - vat;
  return { lines, cost, selling, discount, vatMode, vat, final, depositPct: pct, deposit, margin: Math.round((net - cost) * 100) / 100 };
}
function quoteView_(q, user, money) {
  const expired = q.Status === 'Sent' && q.ValidUntil && day_(q.ValidUntil) + 86400000 < Date.now();
  let lines = []; try { lines = JSON.parse(q.Lines || '[]'); } catch (e) { /* */ }
  const v = { id: q.QuoteID, ref: q.TicketRef, version: num_(q.Version), status: expired ? 'Expired' : q.Status, lines, cost: num_(q.CostTotal), selling: num_(q.SellingPrice),
    discount: num_(q.Discount), vatMode: q.VatMode, vat: num_(q.VatAmount), final: num_(q.FinalAmount), depositPct: num_(q.DepositPct), deposit: num_(q.DepositAmount),
    validUntil: iso_(q.ValidUntil), preparedBy: q.PreparedBy, preparedAt: iso_(q.PreparedAt), approvedBy: q.ApprovedBy, approvedAt: iso_(q.ApprovedAt), sentAt: iso_(q.SentAt),
    sentBy: q.SentBy, acceptedAt: iso_(q.AcceptedAt), declinedAt: iso_(q.DeclinedAt), notes: q.Notes, margin: num_(q.Margin) };
  if (!can_(user, 'quote.prepare') && !can_(user, 'pay.view')) { v.lines = []; v.cost = 0; v.margin = 0; }
  if (money && q.Status === 'Accepted') { v.paid = money.paid; v.outstanding = money.outstanding; }
  return v;
}
function saveQuote_(b) {
  const user = requirePerm_(b.token, 'quote.prepare');
  const calc = calcQuote_(b.quote || {});
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const all = readTable_('Quotes').filter(q => q.TicketRef === f.row.Ref);
    const draft = b.quoteId ? findRow_('Quotes', String(b.quoteId)) : null;
    if (b.quoteId && (!draft || draft.row.TicketRef !== f.row.Ref)) throw userError_('Quotation not found.');
    if (draft && ['Draft', 'Awaiting approval'].indexOf(draft.row.Status) === -1) throw userError_('This version can no longer be changed. Create a revised version instead.');
    const row = { TicketRef: f.row.Ref, Status: 'Draft', Lines: JSON.stringify(calc.lines), CostTotal: calc.cost, SellingPrice: calc.selling, Discount: calc.discount, VatMode: calc.vatMode,
      VatAmount: calc.vat, FinalAmount: calc.final, DepositPct: calc.depositPct, DepositAmount: calc.deposit, ValidUntil: dateOrBlank_((b.quote || {}).validUntil, 'valid until') || new Date(Date.now() + 14 * 86400000),
      PreparedBy: user.Email, PreparedAt: new Date(), RecordedBy: user.Email, Notes: safe_((b.quote || {}).notes, 1000), Margin: calc.margin };
    let id;
    if (draft) { id = draft.row.QuoteID; writeRow_('Quotes', draft.index, Object.assign({}, draft.row, row, { QuoteID: id, Version: draft.row.Version })); }
    else { id = newId_('Q'); appendObj_('Quotes', Object.assign(row, { QuoteID: id, Version: all.reduce((m, q) => Math.max(m, num_(q.Version)), 0) + 1 })); }
    const extra = {};
    if (['NEW ENQUIRY', 'AWAITING REVIEW', 'ASSIGNED', 'REQUIREMENTS UNDER REVIEW', 'SUPPLIER RESEARCH'].indexOf(f.row.OpStatus) !== -1) extra.OpStatus = 'QUOTATION IN PREPARATION';
    touchTicket_(f, user, extra);
    tickChecklist_(f.row.Ref, ['Supplier costs compiled', 'Selling price calculated', 'Deposit calculated'], user.Email);
    audit_(user.Email, f.row.Ref, draft ? 'quote_draft_updated' : 'quote_version_created', { quote: id, final: calc.final, deposit: calc.deposit });
    return { id, calc };
  });
}
/** submit (for approval) · approve · send · accept · decline · reopen (back to draft) */
function quoteAction_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const qf = findRow_('Quotes', String(b.quoteId || ''));
    if (!qf) throw userError_('Quotation not found.', 'notfound');
    const f = loadTicket_(user, qf.row.TicketRef, true);
    const q = Object.assign({}, qf.row), a = String(b.step || '');
    const extra = {};
    const supersede = except => { const sh = sheet_('Quotes'); sh.getDataRange().getValues().forEach((r, i) => { if (i > 0 && r[1] === q.TicketRef && r[0] !== except && ['Draft', 'Awaiting approval', 'Approved', 'Sent'].indexOf(r[3]) !== -1) sh.getRange(i + 1, 4).setValue('Superseded'); }); };
    if (a === 'submit') {
      if (q.Status !== 'Draft') throw userError_('Only drafts can be submitted for approval.');
      q.Status = 'Awaiting approval';
      notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'quote_approval', q.TicketRef, `Quotation v${q.Version} on ${q.TicketRef} needs approval (R${zar_(num_(q.FinalAmount))})`, '', user.Email);
    } else if (a === 'approve') {
      if (!can_(user, 'quote.approve')) throw userError_('Only management can approve quotations.', 'forbidden');
      if (['Draft', 'Awaiting approval'].indexOf(q.Status) === -1) throw userError_('This quotation is not waiting for approval.');
      q.Status = 'Approved'; q.ApprovedBy = user.Email; q.ApprovedAt = new Date();
      if (q.PreparedBy !== user.Email) notify_(q.PreparedBy, 'quote_approved', q.TicketRef, `Quotation v${q.Version} on ${q.TicketRef} was approved`);
    } else if (a === 'send') {
      if (q.Status !== 'Approved') throw userError_('A quotation must be approved before it is sent.');
      supersede(q.QuoteID);
      q.Status = 'Sent'; q.SentAt = new Date(); q.SentBy = user.Email;
      extra.OpStatus = 'QUOTATION SENT'; extra.ResponseStatus = 'Awaiting response';
      tickChecklist_(q.TicketRef, ['Final quotation prepared', 'Quotation sent', 'VAT reviewed'], user.Email);
      const cust = findRow_('Customers', f.row.CustomerRef);
      let channel = b.channel || 'recorded';
      if (b.emailCustomer && cust && cust.row.Email) {
        sendMail_(cust.row.Email, `Your quotation ${q.TicketRef} (v${q.Version}) from KCM Travel & Tours`, quoteEmailHtml_(f.row, cust.row, q));
        channel = 'Email';
      }
      addNoteRow_(q.TicketRef, user.Email, 'customer', channel === 'Email' ? 'Email' : oneOf_(b.channel, COMMS, ''), `Quotation v${q.Version} sent to the customer${channel === 'Email' ? ' by email' : ' (' + (b.channel || 'channel not recorded') + ')'}: R${zar_(num_(q.FinalAmount))}, deposit R${zar_(num_(q.DepositAmount))}.`);
    } else if (a === 'accept') {
      if (['Sent', 'Approved'].indexOf(q.Status) === -1) throw userError_('Only a sent quotation can be accepted.');
      if (q.ValidUntil && day_(q.ValidUntil) + 86400000 < Date.now() && !can_(user, 'quote.approve')) throw userError_('This quotation has expired. Management can still record acceptance, or send a revised version.');
      supersede(q.QuoteID);
      q.Status = 'Accepted'; q.AcceptedAt = new Date();
      extra.OpStatus = 'ACCEPTED BY CUSTOMER'; extra.ResponseStatus = 'Accepted';
      tickChecklist_(q.TicketRef, ['Customer response recorded'], user.Email);
      autoTask_(f.row, 'Send invoice and payment instructions for the deposit', f.row.AssignedTo || user.Email, new Date(Date.now() + 86400000), 'workflow:invoice');
      notifyOthers_(f.row, user, 'quote_accepted', `Quotation v${q.Version} on ${q.TicketRef} was accepted by the customer`);
      notifyRoles_(['FINANCE'], 'quote_accepted', q.TicketRef, `${q.TicketRef}: quotation accepted (R${zar_(num_(q.FinalAmount))}). Expect a deposit.`, 'qa:' + q.QuoteID);
    } else if (a === 'decline') {
      if (['Sent', 'Approved'].indexOf(q.Status) === -1) throw userError_('Only a sent quotation can be declined.');
      q.Status = 'Declined'; q.DeclinedAt = new Date(); extra.ResponseStatus = 'Declined'; extra.OpStatus = 'AWAITING CUSTOMER RESPONSE';
    } else if (a === 'reopen') {
      if (q.Status !== 'Awaiting approval') throw userError_('Only a quotation waiting for approval can be sent back to draft.');
      q.Status = 'Draft';
    } else throw userError_('Unknown action.');
    writeRow_('Quotes', qf.index, q);
    if (b.note) addNoteRow_(q.TicketRef, user.Email, 'decision', '', `Quotation v${q.Version} ${a}: ${safe_(b.note, 1000)}`);
    touchTicket_(f, user, extra);
    audit_(user.Email, q.TicketRef, 'quote_' + a, { quote: q.QuoteID, version: q.Version, final: q.FinalAmount });
    const ps = refreshPaymentStatus_(q.TicketRef, user.Email);
    return { quote: quoteView_(q, user), paymentStatus: ps && ps.status };
  });
}
function quoteEmailHtml_(t, c, q) {
  let lines = []; try { lines = JSON.parse(q.Lines || '[]'); } catch (e) { /* */ }
  const cats = {}; lines.forEach(l => { cats[l.category] = 1; });
  return `<p>Hi ${esc_(String(c.FullName || '').split(' ')[0] || 'there')},</p><p>Thank you for choosing KCM Travel &amp; Tours. Here is your quotation <strong>${esc_(t.Ref)}</strong> (version ${q.Version}).</p>
    <table style="border-collapse:collapse;margin:12px 0">
    <tr><td style="padding:6px 12px 6px 0;color:#666">Trip</td><td><strong>${esc_(t.Package || t.Destination || 'Your trip')}</strong></td></tr>
    ${t.DepartDate ? `<tr><td style="padding:6px 12px 6px 0;color:#666">Travel date</td><td><strong>${esc_(Utilities.formatDate(new Date(t.DepartDate), 'Africa/Johannesburg', 'd MMM yyyy'))}</strong></td></tr>` : ''}
    <tr><td style="padding:6px 12px 6px 0;color:#666">Includes</td><td>${esc_(Object.keys(cats).join(', ') || 'As discussed')}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#666">Total</td><td><strong>R${zar_(num_(q.FinalAmount))}</strong>${q.VatMode === 'inclusive' ? ' (incl. VAT)' : q.VatMode === 'exclusive' ? ' (incl. VAT of R' + zar_(num_(q.VatAmount)) + ')' : ''}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#666">Deposit to secure</td><td><strong>R${zar_(num_(q.DepositAmount))}</strong></td></tr>
    ${q.ValidUntil ? `<tr><td style="padding:6px 12px 6px 0;color:#666">Valid until</td><td>${esc_(Utilities.formatDate(new Date(q.ValidUntil), 'Africa/Johannesburg', 'd MMM yyyy'))}</td></tr>` : ''}</table>
    <p>To accept, simply reply to this email or WhatsApp us on 076 436 0010 quoting <strong>${esc_(t.Ref)}</strong>. We'll then send payment instructions. Your booking is confirmed once the deposit has been received and verified.</p>`;
}
function listQuotes_(b) {
  const user = requireOpsUser_(b.token);
  const tickets = {}; readTable_('Tickets').forEach(t => { tickets[t.Ref] = t; });
  let quotes = readTable_('Quotes').filter(q => tickets[q.TicketRef] && canSeeTicket_(user, tickets[q.TicketRef]));
  if (b.status) quotes = quotes.filter(q => quoteView_(q, user).status === b.status);
  return quotes.map(q => Object.assign(quoteView_(q, user), { customer: tickets[q.TicketRef].CustomerRef, package: tickets[q.TicketRef].Package, assignedTo: tickets[q.TicketRef].AssignedTo })).reverse().slice(0, 300);
}

/* ---------- payments (recorded → verified by finance; refunds need a second person) ---------- */

function paymentView_(p, full) {
  const v = { id: p.PaymentID, ref: p.TicketRef, quoteId: p.QuoteID, type: p.Type, amount: num_(p.Amount), method: p.Method, paidOn: iso_(p.PaidOn), recordedBy: p.RecordedBy,
    recordedAt: iso_(p.RecordedAt), verification: p.Verification, verifiedBy: p.VerifiedBy, verifiedAt: iso_(p.VerifiedAt), approvalStatus: p.ApprovalStatus, approvedBy: p.ApprovedBy };
  if (full) Object.assign(v, { reference: p.Reference, verificationSource: p.VerificationSource, notes: p.Notes, voidReason: p.VoidReason });
  return v;
}
function recordPayment_(b) {
  const user = requirePerm_(b.token, 'pay.record');
  const d = b.payment || {};
  const type = oneOf_(d.type, PAYMENT_TYPES, null);
  if (!type) throw userError_('Choose the payment type.');
  if (type === 'refund' && !can_(user, 'pay.verify')) throw userError_('Only finance can record refunds.', 'forbidden');
  const amount = money_(d.amount, 'amount');
  if (amount <= 0) throw userError_('Enter the amount received.');
  const method = oneOf_(d.method, PAYMENT_METHODS, null);
  if (!method) throw userError_('Choose the payment method.');
  const reference = safe_(d.reference, 60);
  if (['EFT', 'Card', 'Payment gateway', 'SnapScan / Zapper'].indexOf(method) !== -1 && !reference) throw userError_('Add the payment reference (bank or gateway reference).');
  const paidOn = dateOrBlank_(d.paidOn, 'payment date') || new Date();
  if (day_(paidOn) > Date.now() + 86400000) throw userError_('The payment date is in the future.');
  const idem = String(b.idempotencyKey || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, false);
    if (!can_(user, 'pay.view') && !canEditTicket_(user, f.row)) throw userError_('Ticket not found.', 'notfound');
    const all = readTable_('Payments');
    if (idem) { const dup = all.find(p => p.IdempotencyKey === idem); if (dup) return { id: dup.PaymentID, duplicate: true }; }
    if (reference && all.some(p => p.Verification !== 'Voided' && p.Type === type && String(p.Reference).toLowerCase() === reference.toLowerCase() && p.Method === method)) {
      throw userError_('A payment with this reference is already recorded. Check the payment timeline before adding it again.');
    }
    const m = ticketMoney_(f.row.Ref);
    if (!m.accepted) throw userError_('Record the customer\'s acceptance of a quotation before recording payments.');
    if (type === 'refund' && amount > m.paid) throw userError_('A refund cannot be more than the verified amount paid (R' + zar_(m.paid) + ').');
    if (type !== 'refund' && amount > m.final - m.paid - m.unverifiedIn + 0.01 && !String(d.notes || '').trim()) throw userError_('This is more than the outstanding balance. Add a note explaining the overpayment.');
    const id = newId_('PAY');
    appendObj_('Payments', { PaymentID: id, TicketRef: f.row.Ref, QuoteID: m.accepted.QuoteID, Type: type, Amount: amount, Method: method, Reference: reference, PaidOn: paidOn,
      RecordedBy: user.Email, RecordedAt: new Date(), Verification: 'Unverified', Notes: safe_(d.notes, 500), IdempotencyKey: idem, ApprovalStatus: type === 'refund' ? 'Pending approval' : '' });
    const extra = {};
    if (type !== 'refund' && ['ACCEPTED BY CUSTOMER', 'AWAITING DEPOSIT'].indexOf(f.row.OpStatus) !== -1) extra.OpStatus = 'PAYMENT VERIFICATION';
    touchTicket_(f, user, extra);
    audit_(user.Email, f.row.Ref, type === 'refund' ? 'refund_requested' : 'payment_recorded', { payment: id, amount, method, verification: 'Unverified' });
    notifyRoles_(type === 'refund' ? ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] : ['FINANCE'], type === 'refund' ? 'refund_approval' : 'payment_verify', f.row.Ref,
      `${f.row.Ref}: ${type === 'refund' ? 'refund of' : 'payment of'} R${zar_(amount)} ${type === 'refund' ? 'needs approval' : 'needs verification'}`, '', user.Email);
    const ps = refreshPaymentStatus_(f.row.Ref, user.Email);
    return { id, paymentStatus: ps.status };
  });
}
function verifyPayment_(b) {
  const user = requirePerm_(b.token, 'pay.verify');
  const decision = b.decision === 'reject' ? 'Rejected' : b.decision === 'verify' ? 'Verified' : null;
  if (!decision) throw userError_('Choose verify or reject.');
  const source = safe_(b.source, 120);
  if (decision === 'Verified' && !source) throw userError_('Record how you verified it (e.g. "Bank statement 19 Nov, FNB").');
  return withLock_(() => {
    const pf = findRow_('Payments', String(b.id || ''));
    if (!pf || pf.row.Type === 'refund') throw userError_('Payment not found.', 'notfound');
    if (pf.row.Verification !== 'Unverified') throw userError_('This payment has already been ' + pf.row.Verification.toLowerCase() + '. Verified records cannot be changed; void it with a reason instead.');
    const self = pf.row.RecordedBy === user.Email;
    if (self && roleOf_(user) !== 'SUPER_ADMIN') throw userError_('Someone other than the person who recorded a payment must verify it.', 'forbidden');
    const p = Object.assign({}, pf.row, { Verification: decision, VerifiedBy: user.Email, VerifiedAt: new Date(), VerificationSource: source + (self ? ' [self-verified by super admin]' : '') });
    if (b.notes) p.Notes = safe_((p.Notes ? p.Notes + ' | ' : '') + b.notes, 500);
    writeRow_('Payments', pf.index, p);
    audit_(user.Email, p.TicketRef, 'payment_' + decision.toLowerCase(), { payment: p.PaymentID, amount: p.Amount, source, selfVerified: self });
    const ps = refreshPaymentStatus_(p.TicketRef, user.Email);
    const t = findRow_('Tickets', p.TicketRef);
    if (t) {
      if (decision === 'Verified') tickChecklist_(p.TicketRef, ps.money.paid >= ps.money.final ? ['Deposit received', 'Payment verified', 'Balance calculated', 'Final payment verified'] : ['Deposit received', 'Payment verified', 'Balance calculated'], user.Email);
      notifyOthers_(t.row, user, 'payment_' + decision.toLowerCase(), `${p.TicketRef}: payment of R${zar_(num_(p.Amount))} ${decision.toLowerCase()} (${ps.status})`);
    }
    return { payment: paymentView_(p, true), paymentStatus: ps.status, outstanding: ps.money.outstanding };
  });
}
function approveRefund_(b) {
  const user = requirePerm_(b.token, 'pay.refund.approve');
  return withLock_(() => {
    const pf = findRow_('Payments', String(b.id || ''));
    if (!pf || pf.row.Type !== 'refund') throw userError_('Refund not found.', 'notfound');
    if (pf.row.ApprovalStatus !== 'Pending approval') throw userError_('This refund is not waiting for approval.');
    if (pf.row.RecordedBy === user.Email) throw userError_('A different person must approve a refund (two-person rule).', 'forbidden');
    const approve = b.decision !== 'reject';
    const p = Object.assign({}, pf.row, { ApprovalStatus: approve ? 'Approved' : 'Rejected', ApprovedBy: user.Email, ApprovedAt: new Date(), Verification: approve ? 'Verified' : 'Rejected', VerifiedBy: user.Email, VerifiedAt: new Date(), VerificationSource: safe_(b.source || 'Refund approval', 120) });
    writeRow_('Payments', pf.index, p);
    audit_(user.Email, p.TicketRef, approve ? 'refund_approved' : 'refund_rejected', { payment: p.PaymentID, amount: p.Amount });
    const ps = refreshPaymentStatus_(p.TicketRef, user.Email);
    return { payment: paymentView_(p, true), paymentStatus: ps.status };
  });
}
function voidPayment_(b) {
  const user = requirePerm_(b.token, 'pay.verify');
  const reason = safe_(b.reason, 300);
  if (!reason) throw userError_('Give the reason for voiding this payment record.');
  return withLock_(() => {
    const pf = findRow_('Payments', String(b.id || ''));
    if (!pf) throw userError_('Payment not found.', 'notfound');
    if (pf.row.Verification === 'Voided') throw userError_('Already voided.');
    if (pf.row.Verification === 'Verified' && pf.row.VerifiedBy === user.Email && roleOf_(user) !== 'SUPER_ADMIN') throw userError_('Another finance user must void a payment you verified.', 'forbidden');
    const p = Object.assign({}, pf.row, { Verification: 'Voided', VoidReason: reason + ' (by ' + user.Email + ', ' + new Date().toISOString().slice(0, 10) + ')' });
    writeRow_('Payments', pf.index, p);
    audit_(user.Email, p.TicketRef, 'payment_voided', { payment: p.PaymentID, amount: p.Amount, reason, previously: pf.row.Verification });
    const ps = refreshPaymentStatus_(p.TicketRef, user.Email);
    return { paymentStatus: ps.status };
  });
}
function listPayments_(b) {
  const user = requirePerm_(b.token, 'pay.view');
  const tickets = {}; readTable_('Tickets').forEach(t => { tickets[t.Ref] = t; });
  let pays = readTable_('Payments');
  if (b.verification) pays = pays.filter(p => p.Verification === b.verification || (b.verification === 'Pending approval' && p.ApprovalStatus === 'Pending approval'));
  const byTicket = {};
  Object.keys(tickets).forEach(ref => { if (tickets[ref].PaymentStatus && tickets[ref].PaymentStatus !== 'Not invoiced') { const m = ticketMoney_(ref); byTicket[ref] = { ref, status: tickets[ref].PaymentStatus, final: m.final, deposit: m.deposit, paid: m.paid, unverified: m.unverifiedIn, outstanding: m.outstanding, package: tickets[ref].Package, customer: tickets[ref].CustomerRef, opStatus: tickets[ref].OpStatus }; } });
  return { payments: pays.map(p => Object.assign(paymentView_(p, true), { package: (tickets[p.TicketRef] || {}).Package })).reverse().slice(0, 500), tickets: Object.values(byTicket) };
}

/* ---------- suppliers ---------- */

function listSuppliers_(b) {
  requireOpsUser_(b.token);
  const own = readTable_('Suppliers').filter(s => s.Active !== 'no').map(s => ({ id: s.SupplierID, name: s.Name, type: s.Type, contact: s.ContactName, phone: s.Phone, email: s.Email, partnerId: s.PartnerID, notes: s.Notes }));
  const partners = readTable_('Partners').filter(p => p.Status === 'Approved' && !own.some(s => s.partnerId === p.ID))
    .map(p => ({ id: 'partner:' + p.ID, name: p.BusinessName, type: (PARTNER_TYPES[p.PartnerType] || {}).label || p.PartnerType, contact: p.ContactName, phone: p.Phone, email: p.Email, partnerId: p.ID, notes: 'KCM partner · ' + (p.Tier || '') }));
  return own.concat(partners);
}
function saveSupplier_(b) {
  const user = requirePerm_(b.token, 'suppliers.manage');
  const d = b.supplier || {};
  const name = safe_(d.name, 100);
  if (!name) throw userError_('Supplier name is required.');
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(d.email))) throw userError_('Please check the email address.');
  return withLock_(() => {
    const f = d.id ? findRow_('Suppliers', String(d.id)) : null;
    const row = { SupplierID: f ? f.row.SupplierID : newId_('S'), Name: name, Type: safe_(d.type, 60), ContactName: safe_(d.contact, 80), Phone: safe_(d.phone, 30), Email: String(d.email || '').toLowerCase().slice(0, 120),
      PartnerID: safe_(d.partnerId, 30), Notes: safe_(d.notes, 500), Created: f ? f.row.Created : new Date(), CreatedBy: f ? f.row.CreatedBy : user.Email, Active: d.active === false ? 'no' : 'yes' };
    if (f) writeRow_('Suppliers', f.index, row); else appendObj_('Suppliers', row);
    audit_(user.Email, 'supplier:' + row.SupplierID, f ? 'supplier_updated' : 'supplier_created', name);
    return { id: row.SupplierID };
  });
}
function addSupplierQuote_(b) {
  const user = requireOpsUser_(b.token);
  const d = b.supplierQuote || {};
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const sup = d.supplierId ? listSuppliers_({ token: b.token }).find(s => s.id === d.supplierId) : null;
    const name = sup ? sup.name : safe_(d.supplierName, 100);
    if (!name) throw userError_('Choose or name the supplier.');
    const id = newId_('SQ');
    appendObj_('SupplierQuotes', { SQID: id, TicketRef: f.row.Ref, SupplierID: sup ? sup.id : '', SupplierName: name, Service: safe_(d.service, 140), Amount: money_(d.amount, 'supplier quote'),
      ValidUntil: dateOrBlank_(d.validUntil, 'valid until'), Status: oneOf_(d.status, ['Requested', 'Received', 'Accepted', 'Declined'], 'Received'), Notes: safe_(d.notes, 500), RecordedBy: user.Email, RecordedAt: new Date() });
    if (d.status !== 'Requested') tickChecklist_(f.row.Ref, /accommodation|lodge|hotel|room|guest/i.test(d.service || '') ? ['Supplier quotation received'] : /transport|vehicle|transfer|car|shuttle/i.test(d.service || '') ? ['Transport quotation received'] : [], user.Email);
    addNoteRow_(f.row.Ref, user.Email, 'supplier', '', `Supplier ${name}: ${safe_(d.service, 140)}${num_(d.amount) ? ' · R' + zar_(num_(d.amount)) : ''} (${d.status || 'Received'})${d.notes ? ' — ' + safe_(d.notes, 300) : ''}`);
    touchTicket_(f, user, f.row.OpStatus === 'REQUIREMENTS UNDER REVIEW' || f.row.OpStatus === 'ASSIGNED' ? { OpStatus: 'SUPPLIER RESEARCH' } : {});
    audit_(user.Email, f.row.Ref, 'supplier_quote_added', { id, supplier: name, amount: num_(d.amount) });
    return { id };
  });
}
function updateSupplierQuote_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const sf = findRow_('SupplierQuotes', String(b.id || ''));
    if (!sf) throw userError_('Supplier quote not found.', 'notfound');
    loadTicket_(user, sf.row.TicketRef, true);
    const s = Object.assign({}, sf.row, { Status: oneOf_(b.status, ['Requested', 'Received', 'Accepted', 'Declined'], sf.row.Status) });
    if (b.amount !== undefined) s.Amount = money_(b.amount);
    writeRow_('SupplierQuotes', sf.index, s);
    audit_(user.Email, s.TicketRef, 'supplier_quote_updated', { id: s.SQID, status: s.Status });
    if (s.Status === 'Accepted') tickChecklist_(s.TicketRef, /accommodation|lodge|hotel|room|guest/i.test(s.Service) ? ['Accommodation confirmed'] : /transport|vehicle|transfer|car|shuttle/i.test(s.Service) ? ['Transport confirmed'] : [], user.Email);
    return { ok: true };
  });
}

/* ---------- attachments (private Drive folder) ---------- */

function opsFolder_() {
  const id = prop_('OPS_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recreate */ } }
  const folder = DriveApp.createFolder('KCM Operations Files (private)');
  PropertiesService.getScriptProperties().setProperty('OPS_FOLDER_ID', folder.getId());
  return folder;
}
function uploadTicketFile_(b) {
  const user = requireOpsUser_(b.token);
  const m = String(b.dataUrl || '').match(/^data:(image\/(jpeg|png|webp)|application\/(pdf));base64,(.+)$/);
  if (!m) throw userError_('Upload a PDF or a JPG/PNG/WebP image.');
  const bytes = Utilities.base64Decode(m[m.length - 1]);
  if (bytes.length > APP.maxDocBytes) throw userError_('That file is too large (max 6 MB).');
  if (!fileMatchesType_(bytes, m[1])) throw userError_('That file does not match its type. Please upload the original file.');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const name = safe_(b.name || 'file', 80).replace(/[^\w .&()-]/g, '') || 'file';
    const file = opsFolder_().createFile(Utilities.newBlob(bytes, m[1], f.row.Ref + ' ' + name));
    const id = newId_('F');
    appendObj_('Attachments', { FileID: id, TicketRef: f.row.Ref, LinkKind: oneOf_(b.linkKind, ['note', 'task', 'checklist', 'payment', 'ticket'], 'ticket'), LinkID: safe_(b.linkId, 40),
      Name: name, Mime: m[1], Size: bytes.length, DriveID: file.getId(), UploadedBy: user.Email, UploadedAt: new Date() });
    touchTicket_(f, user, {});
    audit_(user.Email, f.row.Ref, 'file_uploaded', { file: id, name });
    return { id, name };
  });
}
function getTicketFile_(b) {
  const user = requireOpsUser_(b.token);
  const af = findRow_('Attachments', String(b.id || ''));
  if (!af) throw userError_('File not found.', 'notfound');
  loadTicket_(user, af.row.TicketRef, false);
  if (af.row.LinkKind === 'payment' && !can_(user, 'pay.view')) throw userError_('File not found.', 'notfound');
  const blob = DriveApp.getFileById(af.row.DriveID).getBlob();
  return { name: af.row.Name, dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
}

/* =====================================================================
 * Views: summary, full workspace, register, workspace, overview, workload
 * ===================================================================== */

function ticketSummary_(t, ctx) {
  const now = Date.now();
  const open = CLOSED_STATUSES.indexOf(t.OpStatus) === -1;
  const v = { ref: t.Ref, customerRef: t.CustomerRef, created: iso_(t.Created), received: iso_(t.Received), source: t.Source, enquiryType: t.EnquiryType, opStatus: t.OpStatus,
    paymentStatus: t.PaymentStatus || 'Not invoiced', responseStatus: t.ResponseStatus, priority: t.Priority, assignedTo: t.AssignedTo, supportBy: t.SupportBy, createdBy: t.CreatedBy,
    updated: iso_(t.Updated), updatedBy: t.UpdatedBy, nextAction: t.NextAction, nextActionDue: iso_(t.NextActionDue), deadline: iso_(t.Deadline), destination: t.Destination,
    package: t.Package, departDate: iso_(t.DepartDate), travellers: num_(t.Adults) + num_(t.Children) + num_(t.Infants) + num_(t.Pensioners), version: num_(t.Version),
    lastActivity: iso_(t.LastActivity), open, overdue: open && ((t.NextActionDue && day_(t.NextActionDue) < now) || pastDue_(t.Deadline)), legacyRef: t.LegacyRef };
  if (ctx && ctx.customers) { const c = ctx.customers[t.CustomerRef]; if (c) { v.customerName = c.FullName; v.customerPhone = c.Phone; v.customerEmail = c.Email; } }
  if (ctx && ctx.tasks) { const ks = ctx.tasks[t.Ref] || []; v.openTasks = ks.filter(k => ['COMPLETED', 'CANCELLED'].indexOf(k.Status) === -1).length; v.overdueTasks = ks.filter(k => taskView_(k).overdue).length; }
  return v;
}
function getTicket_(b) {
  const user = requireOpsUser_(b.token);
  const f = loadTicket_(user, b.ref, false);
  const t = f.row, ref = t.Ref;
  const cust = findRow_('Customers', t.CustomerRef);
  const money = ticketMoney_(ref);
  const seePay = can_(user, 'pay.view');
  const view = Object.assign(ticketSummary_(t), {
    fields: TABS.Tickets.reduce((o, h) => { o[h] = t[h] instanceof Date ? iso_(t[h]) : t[h]; return o; }, {}),
    customer: cust ? customerView_(cust.row) : null,
    tasks: readTable_('Tasks').filter(k => k.TicketRef === ref).map(taskView_),
    checklist: readTable_('Checklist').filter(c => c.TicketRef === ref).map(checklistView_).sort((a, b) => a.order - b.order),
    notes: readTable_('Notes').filter(n => n.TicketRef === ref).map(n => ({ id: n.NoteID, created: iso_(n.Created), author: n.Author, kind: n.Kind, channel: n.Channel, content: n.Content, taskId: n.TaskID })).reverse(),
    quotes: money.quotes.map(q => quoteView_(q, user, money)).sort((a, b) => b.version - a.version),
    payments: money.pays.concat(readTable_('Payments').filter(p => p.TicketRef === ref && p.Verification === 'Voided')).map(p => paymentView_(p, seePay)),
    money: { final: money.final, deposit: money.deposit, paid: money.paid, unverified: money.unverifiedIn, refunded: money.refunded, outstanding: money.outstanding, acceptedQuote: money.accepted ? money.accepted.QuoteID : '' },
    supplierQuotes: readTable_('SupplierQuotes').filter(s => s.TicketRef === ref).map(s => ({ id: s.SQID, supplier: s.SupplierName, supplierId: s.SupplierID, service: s.Service, amount: num_(s.Amount), validUntil: iso_(s.ValidUntil), status: s.Status, notes: s.Notes, recordedBy: s.RecordedBy, recordedAt: iso_(s.RecordedAt) })),
    files: readTable_('Attachments').filter(a => a.TicketRef === ref && (a.LinkKind !== 'payment' || seePay)).map(a => ({ id: a.FileID, name: a.Name, mime: a.Mime, size: num_(a.Size), linkKind: a.LinkKind, linkId: a.LinkID, uploadedBy: a.UploadedBy, uploadedAt: iso_(a.UploadedAt) })),
    history: readTable_('Activity').filter(a => a.Target === ref).map(a => ({ time: iso_(a.Time), actor: a.Actor, action: a.Action, details: a.Details })).reverse(),
    allowed: { edit: canEditTicket_(user, t), assign: can_(user, 'ops.assign'), confirm: can_(user, 'ops.confirm'), quotePrepare: can_(user, 'quote.prepare') && canEditTicket_(user, t),
      quoteApprove: can_(user, 'quote.approve'), payRecord: can_(user, 'pay.record') && (seePay || canEditTicket_(user, t)), payVerify: can_(user, 'pay.verify'), payView: seePay,
      refundApprove: can_(user, 'pay.refund.approve'), management: can_(user, 'ops.edit.any') },
  });
  if (!cust) view.customer = { ref: t.CustomerRef, name: '(customer record missing)' };
  return view;
}

function listTickets_(b) {
  const user = requireOpsUser_(b.token);
  const customers = {}; readTable_('Customers').forEach(c => { customers[c.CustomerRef] = c; });
  const tasks = {}; readTable_('Tasks').forEach(k => { (tasks[k.TicketRef] = tasks[k.TicketRef] || []).push(k); });
  let list = readTable_('Tickets').filter(t => canSeeTicket_(user, t));
  const view = String(b.view || 'all');
  if (view === 'incoming') list = list.filter(t => ['NEW ENQUIRY', 'AWAITING REVIEW'].indexOf(t.OpStatus) !== -1);
  if (view === 'unassigned') list = list.filter(t => !t.AssignedTo && CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  if (view === 'mine') list = list.filter(t => t.AssignedTo === user.Email || String(t.SupportBy || '').indexOf(user.Email) !== -1);
  if (view === 'bookings') list = list.filter(t => !!t.ConfirmedAt && ['CANCELLED'].indexOf(t.OpStatus) === -1);
  if (view === 'completed') list = list.filter(t => t.OpStatus === 'COMPLETED');
  if (view === 'open') list = list.filter(t => CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  const eq = (k, col) => { if (b[k]) list = list.filter(t => String(t[col]) === String(b[k])); };
  eq('status', 'OpStatus'); eq('priority', 'Priority'); eq('source', 'Source'); eq('paymentStatus', 'PaymentStatus');
  if (b.assignee) list = list.filter(t => b.assignee === '(none)' ? !t.AssignedTo : t.AssignedTo === b.assignee);
  if (b.destination) { const d = String(b.destination).toLowerCase(); list = list.filter(t => (String(t.Destination) + ' ' + t.Package + ' ' + t.Destinations).toLowerCase().indexOf(d) !== -1); }
  if (b.from) list = list.filter(t => day_(t.Created) >= day_(dateOrBlank_(b.from)));
  if (b.to) list = list.filter(t => day_(t.Created) < day_(dateOrBlank_(b.to)) + 86400000);
  if (b.overdue) list = list.filter(t => ticketSummary_(t).overdue || (tasks[t.Ref] || []).some(k => taskView_(k).overdue));
  if (b.q) {
    const q = String(b.q).toLowerCase().trim(), pk = phoneKey_(q);
    list = list.filter(t => {
      const c = customers[t.CustomerRef] || {};
      return [t.Ref, t.LegacyRef, t.CustomerRef, c.FullName, c.Email, t.Destination, t.Package, t.AssignedTo].some(x => String(x || '').toLowerCase().indexOf(q) !== -1) ||
        (pk.length >= 6 && [c.PhoneKey, phoneKey_(c.WhatsApp), phoneKey_(c.AltPhone)].some(x => String(x || '').indexOf(pk) !== -1));
    });
  }
  const sort = String(b.sort || 'updated');
  const pr = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
  list.sort((a, c) => sort === 'priority' ? (pr[a.Priority] - pr[c.Priority]) || day_(c.Updated) - day_(a.Updated)
    : sort === 'due' ? (day_(a.NextActionDue) || 9e15) - (day_(c.NextActionDue) || 9e15)
      : sort === 'created' ? day_(c.Created) - day_(a.Created) : day_(c.LastActivity || c.Updated) - day_(a.LastActivity || a.Updated));
  const total = list.length;
  return { total, tickets: list.slice(0, Math.min(500, Number(b.limit) || 200)).map(t => ticketSummary_(t, { customers, tasks })) };
}

function myWorkspace_(b) {
  const user = requireOpsUser_(b.token);
  const me = user.Email, now = Date.now(), week = now + 7 * 86400000;
  const customers = {}; readTable_('Customers').forEach(c => { customers[c.CustomerRef] = c; });
  const allTasks = readTable_('Tasks');
  const tasksBy = {}; allTasks.forEach(k => { (tasksBy[k.TicketRef] = tasksBy[k.TicketRef] || []).push(k); });
  const tickets = readTable_('Tickets').filter(t => t.AssignedTo === me || String(t.SupportBy || '').indexOf(me) !== -1);
  const mine = allTasks.filter(k => k.AssignedTo === me).map(taskView_);
  const open = mine.filter(k => ['COMPLETED', 'CANCELLED'].indexOf(k.status) === -1);
  return {
    tickets: tickets.filter(t => CLOSED_STATUSES.indexOf(t.OpStatus) === -1).map(t => ticketSummary_(t, { customers, tasks: tasksBy })).sort((a, c) => (a.nextActionDue || '9') < (c.nextActionDue || '9') ? -1 : 1),
    pending: open.filter(k => !k.overdue),
    overdue: open.filter(k => k.overdue),
    upcoming: open.filter(k => k.due && day_(k.due) >= now && day_(k.due) <= week).concat(tickets.filter(t => t.NextActionDue && day_(t.NextActionDue) >= now && day_(t.NextActionDue) <= week && CLOSED_STATUSES.indexOf(t.OpStatus) === -1)
      .map(t => ({ id: '', ref: t.Ref, title: 'Next action: ' + (t.NextAction || 'follow up'), due: iso_(t.NextActionDue), status: 'TICKET' }))).sort((a, c) => a.due < c.due ? -1 : 1),
    completed: mine.filter(k => k.status === 'COMPLETED' && day_(k.completedAt) > now - 30 * 86400000).slice(-20).reverse(),
    activity: readTable_('Activity').filter(a => a.Actor === me).slice(-25).reverse().map(a => ({ time: iso_(a.Time), action: a.Action, target: a.Target, details: a.Details })),
  };
}

function rangeOf_(b) {
  const now = new Date(), start = new Date(now); start.setHours(0, 0, 0, 0);
  const r = String(b.range || 'month');
  if (r === 'today') return [start, now];
  if (r === 'week') { const d = new Date(start); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [d, now]; }
  if (r === 'year') return [new Date(now.getFullYear(), 0, 1), now];
  if (r === 'custom') { const f = dateOrBlank_(b.from, 'from') || new Date(now.getFullYear(), 0, 1); const t = dateOrBlank_(b.to, 'to') || now; return [f, new Date(day_(t) + 86400000 - 1)]; }
  return [new Date(now.getFullYear(), now.getMonth(), 1), now];
}
/** All figures come from the Sheet records at the time of the request. Nothing is hard-coded. */
function opsOverview_(b) {
  const user = requirePerm_(b.token, 'ops.view.all');
  const [from, to] = rangeOf_(b);
  const inRange = d => d && day_(d) >= from.getTime() && day_(d) <= to.getTime();
  const tickets = readTable_('Tickets');
  const open = tickets.filter(t => CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  const created = tickets.filter(t => inRange(t.Created));
  const tasks = readTable_('Tasks');
  const quotes = readTable_('Quotes');
  const cnt = (list, key) => list.reduce((a, x) => { const k = x[key] || '—'; a[k] = (a[k] || 0) + 1; return a; }, {});
  const spanDays = Math.max(1, Math.ceil((to - from) / 86400000));
  const bucket = spanDays <= 31 ? 'day' : spanDays <= 120 ? 'week' : 'month';
  const keyOf = d => { const x = new Date(d); if (bucket === 'day') return Utilities.formatDate(x, 'Africa/Johannesburg', 'yyyy-MM-dd'); if (bucket === 'month') return Utilities.formatDate(x, 'Africa/Johannesburg', 'yyyy-MM'); const m = new Date(x); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return Utilities.formatDate(m, 'Africa/Johannesburg', 'yyyy-MM-dd'); };
  const series = {}; for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) series[keyOf(d)] = 0;
  created.forEach(t => { const k = keyOf(t.Created); series[k] = (series[k] || 0) + 1; });
  const staff = staffList_().filter(s => PERMS['ops.edit.own'].indexOf(s.role) !== -1);
  const workload = staff.map(s => ({ email: s.email, name: s.name, active: open.filter(t => t.AssignedTo === s.email).length,
    overdue: open.filter(t => t.AssignedTo === s.email && ticketSummary_(t).overdue).length + tasks.filter(k => k.AssignedTo === s.email && taskView_(k).overdue).length }));
  const sent = quotes.filter(q => inRange(q.SentAt)), accepted = quotes.filter(q => inRange(q.AcceptedAt));
  const confirmedInRange = tickets.filter(t => inRange(t.ConfirmedAt));
  let due = 0, received = 0;
  open.concat(tickets.filter(t => t.OpStatus === 'COMPLETED' && inRange(t.ClosedAt))).forEach(t => { if (t.PaymentStatus && t.PaymentStatus !== 'Not invoiced') { const m = ticketMoney_(t.Ref); due += m.final; received += m.paid; } });
  const dest = {}; tickets.filter(t => t.ConfirmedAt).forEach(t => { const k = t.Destination || t.Package || '—'; dest[k] = (dest[k] || 0) + 1; });
  return {
    range: { from: iso_(from), to: iso_(to), bucket },
    kpis: {
      enquiries: created.length,
      awaitingReview: open.filter(t => ['NEW ENQUIRY', 'AWAITING REVIEW'].indexOf(t.OpStatus) !== -1).length,
      unassigned: open.filter(t => !t.AssignedTo).length,
      inProgress: open.filter(t => t.AssignedTo && !t.ConfirmedAt).length,
      quotesPreparing: open.filter(t => t.OpStatus === 'QUOTATION IN PREPARATION').length + quotes.filter(q => ['Draft', 'Awaiting approval'].indexOf(q.Status) !== -1).length,
      quotesAwaiting: open.filter(t => ['QUOTATION SENT', 'AWAITING CUSTOMER RESPONSE'].indexOf(t.OpStatus) !== -1).length,
      confirmed: confirmedInRange.length,
      outstandingPayments: Math.round(open.filter(t => ['Not invoiced', 'Fully paid', 'Refunded'].indexOf(t.PaymentStatus || 'Not invoiced') === -1).reduce((s, t) => s + ticketMoney_(t.Ref).outstanding, 0)),
      overdueTasks: tasks.filter(k => taskView_(k).overdue).length,
      completed: tickets.filter(t => t.OpStatus === 'COMPLETED' && inRange(t.ClosedAt)).length,
      cancelled: tickets.filter(t => t.OpStatus === 'CANCELLED' && inRange(t.ClosedAt)).length,
    },
    enquiriesOverTime: Object.keys(series).sort().map(k => ({ label: k, value: series[k] })),
    bySource: cnt(created, 'Source'),
    byStatus: cnt(open, 'OpStatus'),
    byDestination: dest,
    workload,
    quoteConversion: { sent: sent.length, accepted: accepted.length, rate: sent.length ? Math.round(accepted.length / sent.length * 100) : 0 },
    bookingConversion: { enquiries: created.length, confirmed: created.filter(t => t.ConfirmedAt).length, rate: created.length ? Math.round(created.filter(t => t.ConfirmedAt).length / created.length * 100) : 0 },
    paymentProgress: { due: Math.round(due), received: Math.round(received) },
    you: { permissions: permissionsOf_(user) },
  };
}

function workload_(b) {
  requirePerm_(b.token, 'ops.workload');
  const tickets = readTable_('Tickets'), tasks = readTable_('Tasks');
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  return staffList_().filter(s => PERMS['ops.edit.own'].indexOf(s.role) !== -1).map(s => {
    const mineOpen = tickets.filter(t => t.AssignedTo === s.email && CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
    const myTasks = tasks.filter(k => k.AssignedTo === s.email);
    const last = readTable_('Activity').filter(a => a.Actor === s.email).slice(-1)[0];
    return { email: s.email, name: s.name, role: s.role, activeTickets: mineOpen.length, overdueTickets: mineOpen.filter(t => ticketSummary_(t).overdue).length,
      supporting: tickets.filter(t => String(t.SupportBy || '').indexOf(s.email) !== -1 && CLOSED_STATUSES.indexOf(t.OpStatus) === -1).length,
      openTasks: myTasks.filter(k => ['COMPLETED', 'CANCELLED'].indexOf(k.Status) === -1).length, overdueTasks: myTasks.filter(k => taskView_(k).overdue).length,
      completedThisMonth: tickets.filter(t => t.AssignedTo === s.email && t.OpStatus === 'COMPLETED' && day_(t.ClosedAt) >= monthStart.getTime()).length,
      tasksDoneThisMonth: myTasks.filter(k => k.Status === 'COMPLETED' && day_(k.CompletedAt) >= monthStart.getTime()).length, lastActivity: last ? iso_(last.Time) : '' };
  });
}

/* =====================================================================
 * Scheduled sweep (hourly trigger): overdue tasks, deadlines, unassigned and inactive tickets.
 * Internal notifications only; nothing is claimed to be sent externally.
 * ===================================================================== */

function opsSweep() {
  const now = Date.now(), dayKey = Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyyMMdd');
  const tickets = readTable_('Tickets').filter(t => CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  withLock_(() => {
    readTable_('Tasks').forEach(k => {
      if (['COMPLETED', 'CANCELLED'].indexOf(k.Status) !== -1 || !k.Due || !k.AssignedTo) return;
      const due = day_(k.Due);
      if (pastDue_(k.Due)) notify_(k.AssignedTo, 'task_overdue', k.TicketRef, `Overdue task on ${k.TicketRef}: ${k.Title}`, 'overdue:' + k.TaskID + ':' + dayKey);
      else if (due - now < 24 * 3600000) notify_(k.AssignedTo, 'deadline_soon', k.TicketRef, `Due within 24 hours on ${k.TicketRef}: ${k.Title}`, 'soon:' + k.TaskID);
    });
    tickets.forEach(t => {
      if (!t.AssignedTo && now - day_(t.Created) > 4 * 3600000) notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'unassigned', t.Ref, `${t.Ref} has been unassigned for more than 4 hours`, 'unassigned:' + t.Ref + ':' + dayKey);
      if (pastDue_(t.Deadline)) notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'deadline_missed', t.Ref, `${t.Ref} missed its processing deadline`, 'missed:' + t.Ref + ':' + dayKey);
      if (t.AssignedTo && t.NextActionDue && day_(t.NextActionDue) < now) notify_(t.AssignedTo, 'next_action_overdue', t.Ref, `${t.Ref}: next action is overdue (${t.NextAction || 'follow up'})`, 'nextdue:' + t.Ref + ':' + dayKey);
      if (now - day_(t.LastActivity || t.Updated) > 3 * 86400000) {
        notify_(t.AssignedTo, 'inactive', t.Ref, `${t.Ref} has had no activity for 3 days`, 'inactive:' + t.Ref + ':' + dayKey);
        notifyRoles_(['MANAGEMENT'], 'inactive', t.Ref, `${t.Ref} has had no activity for 3 days`, 'inactive-m:' + t.Ref + ':' + dayKey);
      }
      if (t.PaymentStatus && ['Deposit pending', 'Awaiting payment'].indexOf(t.PaymentStatus) !== -1) refreshPaymentStatus_(t.Ref, 'system');
    });
  });
}

/* =====================================================================
 * Setup & migration (non-destructive)
 * ===================================================================== */

function opsSetup_() {
  ['Customers', 'Tickets', 'Tasks', 'ChecklistTemplates', 'Checklist', 'Notes', 'Quotes', 'Payments', 'Suppliers', 'SupplierQuotes', 'Attachments', 'Notifications', 'OpsSettings'].forEach(name => {
    const sh = sheet_(name);
    sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight('bold').setBackground('#0e1512').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  opsFolder_();
  try {
    if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'opsSweep')) ScriptApp.newTrigger('opsSweep').timeBased().everyHours(1).create();
  } catch (e) { console.error('Could not create the hourly trigger', e); }
}

/** Creates tickets for website bookings received before the Operations Centre existed. Safe to run more than once. */
function backfillTickets_() {
  let created = 0;
  const rows = sheet_('Bookings').getDataRange().getValues();
  const refCol = TABS.Bookings.indexOf('TicketRef');
  rows.forEach((r, i) => {
    if (i === 0 || r[refCol] || !r[0]) return;
    const b = rowToObj_(TABS.Bookings, r);
    const t = opsCreateTicketFromPublic_({ source: b.Source === 'chat' ? 'Kaycee AI' : 'Website booking form', customer: { name: b.Name, email: b.Email, phone: b.Phone, consentSource: 'Website (before Operations Centre)' },
      package: b.Tour, packageSlug: '', destination: '', activities: '', departDate: /^\d{4}-\d{2}-\d{2}/.test(iso_(b.StartDate)) ? iso_(b.StartDate).slice(0, 10) : '', nights: num_(b.Nights),
      adults: num_(b.Adults), children: num_(b.Children), infants: num_(b.Infants), pensioners: num_(b.Pensioners), rooms: b.Room, extras: String(b.Extras || '').split(', ').filter(Boolean),
      budget: '', paymentPref: b.Payment, description: String(b.Notes || ''), estimate: num_(b.EstimatedTotal), dayTour: num_(b.Nights) === 0 });
    const f = findRow_('Tickets', t.ref);
    writeRow_('Tickets', f.index, Object.assign({}, f.row, { LegacyRef: b.Reference, Created: b.Created || f.row.Created, Received: b.Created || f.row.Received }));
    sheet_('Bookings').getRange(i + 1, refCol + 1).setValue(t.ref);
    created++;
  });
  return created;
}
function menuBackfillTickets_() { SpreadsheetApp.getUi().alert('Created ' + backfillTickets_() + ' ticket(s) from earlier bookings.'); }
