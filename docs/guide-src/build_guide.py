#!/usr/bin/env python3
"""Builds the KCM Travel & Tours user guide (HTML -> PDF via Chrome)."""
import html, pathlib, datetime

ROOT = pathlib.Path(__file__).resolve().parent  # docs/guide-src
FONTS = ROOT.parents[1] / 'KcmTravel/wwwroot/fonts'
LOGO = ROOT.parents[1] / 'KcmTravel/wwwroot/images/brand/kcm-logo.svg'
E = html.escape

sections = []          # (id, title, html)
fig_no = [0]

def fig(name, caption, size='full'):
    fig_no[0] += 1
    return f'<figure class="fig {size}"><img src="img/{name}.jpg" alt=""><figcaption><b>Figure {fig_no[0]}.</b> {caption}</figcaption></figure>'

def steps(*items):
    return '<ol class="steps">' + ''.join(f'<li>{i}</li>' for i in items) + '</ol>'

def tip(text, kind='tip'):
    label = {'tip': 'Tip', 'note': 'Good to know', 'warn': 'Important'}[kind]
    return f'<div class="callout {kind}"><b>{label}</b><p>{text}</p></div>'

def table(head, rows, cls=''):
    return f'<table class="{cls}"><thead><tr>' + ''.join(f'<th>{h}</th>' for h in head) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table>'

def sec(id_, title, body):
    sections.append((id_, title, body))

def btn(t): return f'<span class="ui">{E(t)}</span>'

# ------------------------------------------------------------------ content
sec('about', 'What the system is', f'''
<p>The KCM Travel &amp; Tours system has two parts that work together:</p>
<ul>
<li><b>The public website</b>: what customers see. They browse tours, fill in the booking form or chat with <b>Kaycee</b>, the trip-planning assistant. Every request is saved automatically.</li>
<li><b>The staff dashboard</b> (at <b>/admin</b>): where the KCM team handles every enquiry from first contact until the trip is finished. The main part of the dashboard is the <b>KCM Operations Centre</b>.</li>
</ul>
<p>Behind both sits a private <b>Google Sheet</b> that stores the records, and a Google Apps Script program that enforces the rules.</p>
<h3>The one idea to understand: the ticket</h3>
<p>Every enquiry becomes a <b>ticket</b> with a number like <b>KCM-2026-000014</b>. The ticket follows the customer's request from start to finish: who is handling it, what the customer wants, the quotation, the payments, notes, tasks and a full history. Whether the enquiry came from the website, Kaycee, WhatsApp, a phone call or a walk-in, it ends up as a ticket in the same place.</p>
<p>Each ticket has three separate statuses. The system checks every action against the person's role, so hiding a menu item is never the only protection.</p>
{table(['Status', 'What it tells you'], [
 ['<b>Operational</b>', 'Where the work is in the journey, e.g. QUOTATION SENT, BOOKING CONFIRMED'],
 ['<b>Payment</b>', 'Worked out from verified payments (nobody types it in), e.g. Deposit pending, Fully paid'],
 ['<b>Customer response</b>', 'What the customer said about the quotation, e.g. Accepted, Declined'],
])}
<h3>Who uses it</h3>
{table(['Role', 'Typical person', 'What they can do'], [
 ['<b>Super Admin</b>', 'The owner', 'Everything, including managing other admins.'],
 ['<b>Admin</b>', 'Office manager', 'Users and access, partners, all tickets, payment verification, refunds, customer data erasure.'],
 ['<b>Management</b>', 'Operations manager', 'All tickets, assigning work, approving quotations, confirming and completing bookings, workload, settings, partner review.'],
 ['<b>Finance</b>', 'Bookkeeper', 'Sees all tickets and payments; <b>verifies</b> payments, approves refunds, manages partner payouts.'],
 ['<b>Operations</b>', 'Travel consultant', 'Registers enquiries and works on the tickets given to them: notes, tasks, checklists, quotations, recording payments (unverified).'],
 ['<b>Partner</b>', 'Lodge, driver, guide', 'Only their own listings, trips, payouts and ratings in the partner portal.'],
], 'roles')}
''')

sec('signin', 'Signing in', f'''
<h3>Staff sign-in</h3>
{steps('Open the website and click ' + btn('Sign in') + ' at the top right (Figure ' + str(fig_no[0]+1) + '), or go straight to <b>/admin</b>.',
       'Type your email address and password, then click ' + btn('Sign in') + '.',
       'If your role needs it, type the 6-digit code from your authenticator app (see below).')}
{fig('04-header-signin', 'The Sign in button in the website header.')}
{fig('06-admin-signin', 'The dashboard sign-in: (1) email, (2) password, (3) Sign in.')}
<h3>First time, or forgot your password</h3>
<p>Click <b>Forgot or set password?</b> under the sign-in button. Enter your email, then the 6-digit code that arrives in your inbox, then choose a password of at least 10 characters. Very common passwords (such as "password123") are refused. Setting a new password signs you out on every other device.</p>
<h3>Two-step sign-in (authenticator app)</h3>
<p><b>Super Admin, Admin, Management and Finance</b> must use an authenticator app such as Google Authenticator or Microsoft Authenticator. Operations staff and partners don't need one.</p>
{steps('The first time you sign in, a QR code appears (Figure ' + str(fig_no[0]+1) + ').',
       'On your phone, open the authenticator app, tap <b>+</b> and scan the code.',
       'Type the 6-digit code the app shows and click ' + btn('Turn on two-step verification') + '.',
       'You are shown <b>8 recovery codes</b>, once only. Save them somewhere safe (a password manager, or print them). Each one works once if you lose your phone.',
       'From then on, every sign-in asks for the current 6-digit code from the app.')}
{fig('07-mfa-setup', 'Setting up the authenticator: scan the QR code, then type the 6-digit code.', 'tall')}
{fig('08-recovery-codes', 'Your 8 recovery codes. Tick the box to confirm you saved them.', 'tall')}
{tip('Lost your phone and your recovery codes? Ask a Super Admin or Admin to click <b>Reset</b> next to your name in <b>Users &amp; access</b>. You set the app up again at your next sign-in.', 'tip')}
''')

sec('layout', 'Finding your way around', f'''
<p>The dark menu on the left has two groups. Click a group heading to fold it away and keep the menu tidy; the dashboard remembers your choice on that computer.</p>
{table(['Group', 'Pages'], [
 ['<b>KCM Operations Centre</b>', 'My Workspace, Operations Overview, Incoming Enquiries, Unassigned Tickets, All Tickets, My Assigned Tickets, Tasks &amp; Follow-ups, Quotations, Bookings, Payments, Completed Orders, Employee Workload, Activity &amp; Audit History, Checklists &amp; statuses'],
 ['<b>Website &amp; partners</b>', 'Website overview, Partner applications, Partners, Partner trips &amp; payouts, Ratings, Website requests, Messages, Users &amp; access'],
])}
<p>You only see the pages your role is allowed to use. For example, Operations staff do not see Payments, Workload or Users &amp; access (Figure {fig_no[0]+2}).</p>
<div class="two">{fig('65-menu-collapsed', 'Click a group heading (1) to fold or unfold it.', 'narrow')}{fig('33-agent-menu', 'The menu as an Operations consultant sees it.', 'narrow')}</div>
<h3>The buttons at the top of every page</h3>
<ul>
<li>{btn('+ Register enquiry')}: record an enquiry that came in by WhatsApp, phone, email or in person.</li>
<li><b>The bell</b>: your notifications, such as a ticket assigned to you, a quotation waiting for approval or a payment to verify. A red number shows how many are unread.</li>
<li>{btn('Refresh')}: reload the page with the latest data.</li>
<li><b>The sun / moon button</b> in the header switches between light and dark mode.</li>
</ul>
{fig('28-notifications', 'The notification bell opened.', 'half')}
{tip('The dashboard also works on a phone. The menu then runs across the top of the screen.', 'note')}
''')

sec('website', 'How enquiries arrive from the website', f'''
<p>Customers can reach KCM in three ways on the website. Each one creates a ticket straight away, with a ticket number shown to the customer.</p>
<h3>1. The booking form</h3>
<p>The customer picks a tour, a date and the number of travellers, sees an estimated price, adds their contact details, ticks the privacy (POPIA) consent box and sends it. The system works out the estimate itself, so a customer cannot change the price in their browser.</p>
{fig('02-booking-form', 'The public booking form.')}
<h3>2. Kaycee, the trip-planning assistant</h3>
<p>Kaycee asks a few simple questions (style of trip, region, dates, group size, budget) and then sends the request. She cannot confirm bookings or take payments; she only creates the enquiry for the team.</p>
{fig('03-kaycee', 'Kaycee on the home page.')}
<h3>3. WhatsApp, phone, email and walk-ins</h3>
<p>These are <b>not</b> imported automatically. An employee records them with {btn('+ Register enquiry')} (see "Registering an enquiry"). The WhatsApp "Open chat" links in a ticket simply open WhatsApp; the conversation is not saved in the system unless you add a note.</p>
''')

sec('workspace', 'Daily work: My Workspace', f'''
<p><b>My Workspace</b> is the first page every team member sees. It shows only <b>your</b> work:</p>
<ul>
<li>The counters: your open tickets, overdue tasks, things due this week and what you finished in the last 30 days.</li>
<li><b>My tickets</b>: every ticket assigned to you, with its status, payment status and next action.</li>
<li><b>My tasks</b>: change a task's status from the drop-down, or click {btn('Done')} to finish it.</li>
<li><b>Upcoming deadlines</b> for the next 7 days, <b>Recently completed</b> work and <b>My recent activity</b>.</li>
</ul>
{fig('32-agent-workspace', 'My Workspace for Nomsa, an Operations consultant (demo data).', 'tall')}
''')

sec('ticket', 'Working on a ticket', f'''
<p>Click a ticket number anywhere (it is shown in orange) to open the ticket page.</p>
{fig('34-ticket-summary', 'A ticket: (1) Change status, (2) Add note, (3) Add task, (4) the tabs.', 'tall')}
<h3>The top of the ticket</h3>
<p>The header shows where the enquiry came from, the customer, the trip, and six key facts: <b>operational status</b>, <b>payment status</b>, <b>customer response</b>, <b>priority</b>, <b>who it is assigned to</b> and the <b>next action</b> with its due date. Click <b>Edit</b> under Next action to change it.</p>
<h3>The tabs</h3>
{table(['Tab', 'What it is for'], [
 ['<b>Summary</b>', 'Everything at a glance: original enquiry, customer, travel requirements, progress, money and the latest notes.'],
 ['<b>Requirements</b>', 'The full travel details: dates, travellers, accommodation, transport, activities, budget, special requests. Edit and click Save.'],
 ['<b>Tasks</b>', 'Follow-ups for this ticket, with due dates and who is responsible.'],
 ['<b>Checklist</b>', 'A ready-made list of things to do for this type of trip. Tick each item when done; the system records who and when.'],
 ['<b>Notes</b>', 'Internal notes and records of customer conversations. Notes can never be edited or deleted.'],
 ['<b>Quotations</b>', 'Prepare, submit, approve, send and record the customer\'s answer.'],
 ['<b>Payments</b>', 'Deposits, balances and refunds, and whether finance has verified them.'],
 ['<b>Suppliers</b>', 'Quotes from lodges, transport and other suppliers for this trip.'],
 ['<b>Files</b>', 'Attach documents such as itineraries or proof of payment (PDF, images).'],
 ['<b>History</b>', 'Every change ever made: who, when, and old value to new value.'],
])}
<div class="two">{fig('37-tab-checklist', 'Checklist tab.', 'half')}{fig('40-tab-history', 'History tab: the full audit trail.', 'half')}</div>
<h3>Changing the status</h3>
{steps('Click ' + btn('Change status') + '.', 'Choose the new status from the list (1).', 'Add a note if needed (required for Cancelled, Lost and On hold).', 'Click ' + btn('Change status') + ' (2).')}
{fig('41-status-modal', 'Changing a ticket\'s status.')}
<p>The system checks that the earlier steps have happened. If something is missing it says so in red and nothing changes. For example, an Operations consultant cannot confirm a booking (Figure {fig_no[0]+1}), and a booking can only be confirmed once finance has verified the deposit.</p>
<div class="two">{fig('42-status-guard', '"Only management can confirm a booking."', 'half')}{fig('55-complete-guard', 'An unpaid balance blocks completion unless management adds a note.', 'half')}</div>
<h3>Adding a note or a task</h3>
<p>Click {btn('Add note')}, choose the type (internal, customer communication, supplier, decision or problem) and how you spoke to the customer (WhatsApp, phone, email, SMS). You can create a follow-up task from the same note. Click {btn('Add task')} to create a task with a due date and priority.</p>
{fig('38-tab-notes', 'The Notes tab.')}
''')

sec('intake', 'Registering an enquiry (WhatsApp, phone, email, walk-in)', f'''
{steps('Click ' + btn('+ Register enquiry') + ' at the top of any Operations page.',
       '<b>A. Customer</b>: name, phone, WhatsApp, email. If the phone number or email already exists, the system links the enquiry to the same customer instead of creating a duplicate. Tick the POPIA consent box once the customer agrees.',
       '<b>B. Enquiry</b>: where it came from (WhatsApp, phone call, email...), the type of trip and a short description.',
       '<b>C. Travel</b>: destination, dates, number of travellers, accommodation, transport and extras.',
       '<b>D. Budget and payment preference</b>.',
       '<b>E. Next action</b>: what happens next and by when. You can also start a draft quotation.',
       'Click ' + btn('Save enquiry') + '. If you are an Operations consultant, the ticket is assigned to you automatically.')}
{fig('45-intake', 'The Register enquiry form (top part).', 'tall')}
''')

sec('quotes', 'Quotations', f'''
<p>A quotation goes through these steps. Each step is recorded on the ticket.</p>
{table(['Step', 'Who', 'What happens'], [
 ['1. Prepare', 'Consultant', 'Open the <b>Quotations</b> tab and click <b>Prepare quotation</b>. Add cost lines (accommodation, transport, activities...), the selling price or a markup, any discount, VAT treatment, deposit percentage and the valid-until date. A preview shows the total, VAT, deposit and margin; the system recalculates everything when you save.'],
 ['2. Submit', 'Consultant', 'Click <b>Submit for approval</b>. Management is notified.'],
 ['3. Approve', 'Management', 'Check the figures and click <b>Approve</b>. A quotation must be approved before it can be sent.'],
 ['4. Send', 'Consultant or Management', 'Click <b>Send to customer</b>. You can email it to the customer from the system, or mark it as sent by WhatsApp.'],
 ['5. Customer answer', 'Consultant', 'Click <b>Customer accepted</b> or <b>Customer declined</b> and note how the customer replied.'],
])}
{fig('46-quote-editor', 'Preparing a quotation, with the live preview at the bottom.')}
{tip('Need to change a quotation that was already sent? Click <b>New version</b>. It becomes version 2 and the old version is kept, marked "Superseded", so you always have the history.', 'tip')}
{fig('43-tab-quotes', 'The Quotations tab on a ticket.')}
{fig('15-quotes', 'The Quotations page lists all quotations; use the filters to see those awaiting approval.')}
''')

sec('payments', 'Payments', f'''
<h3>Recording a payment (anyone handling the ticket)</h3>
{steps('Open the ticket, go to the <b>Payments</b> tab and click <b>Record payment</b>.',
       'Choose deposit, instalment or balance; enter the amount, method (EFT, card, cash...), the bank reference and the date paid.',
       'Save. The payment shows as <b>Unverified</b>. It does <b>not</b> count as paid until finance checks it.')}
{fig('44-tab-payments', 'The Payments tab on a ticket: the deposit is recorded but still unverified.')}
<h3>Verifying payments (Finance)</h3>
{steps('Open <b>Payments</b> in the menu. The <b>Needs verification</b> tab lists unverified payments.',
       'Check the money is really in the bank account, then click ' + btn('Verify') + ' (1).',
       'Say how you checked (for example "FNB business account statement") and click ' + btn('Verify') + '.',
       'If the money did not arrive, click ' + btn('Reject') + ' and give a reason.')}
{fig('50-finance-verify', 'Payments waiting for finance to verify.')}
{fig('51-verify-modal', 'Verifying a payment: (2) how it was checked, (3) Verify.')}
<p>Rules that protect KCM's money:</p>
<ul>
<li>The person who recorded a payment cannot verify it; someone else must.</li>
<li>The same bank reference cannot be recorded twice, and pressing Save twice doesn't create two payments.</li>
<li>A verified payment cannot be changed. Mistakes are corrected with a reversal or a refund, so the history stays complete.</li>
<li><b>Refunds</b> are recorded by finance and must be approved by a <b>different</b> finance person or an admin (Figure {fig_no[0]+2}).</li>
</ul>
<div class="two">{fig('52-finance-balances', 'Balances: what each ticket owes.', 'half')}{fig('56-refund-approve', 'Approving a refund (1).', 'half')}</div>
''')

sec('management', 'For management: assigning, approving and confirming', f'''
<h3>New enquiries</h3>
<p><b>Incoming Enquiries</b> lists everything nobody has reviewed yet; <b>Unassigned Tickets</b> lists tickets with no owner. Use the search box and filters (status, priority, employee, source, payment status, destination, dates, overdue only) to find anything quickly. {btn('CSV')} downloads the list for Excel.</p>
{fig('12-incoming', 'Incoming Enquiries. Click a ticket number (1) to open it.')}
<h3>Assigning a ticket</h3>
{steps('Open the ticket and click ' + btn('Assign') + ' (Figure ' + str(fig_no[0]+1) + ', marker 1).',
       'Choose the employee (2) and the priority (3). You can add supporting employees and a deadline.',
       'Click ' + btn('Assign') + ' (4). The employee is notified and gets a "Contact the customer" task automatically.')}
{fig('30-ticket-new', 'A new ticket with the Assign button (1).')}
{fig('31-assign-modal', 'Assigning: (2) employee, (3) priority, (4) Assign.')}
<h3>Handing over (leave, sick days)</h3>
<p>Click {btn('Reassign / hand over')}, choose the new employee and write a short handover summary. Nothing is lost: notes, checklist ticks, quotations and history stay on the ticket, open tasks move to the new person, and the previous person no longer sees the ticket.</p>
<h3>Confirming and completing</h3>
<p>Only management can set <b>BOOKING CONFIRMED</b>, and only when a quotation has been accepted <b>and</b> finance has verified the deposit. A trip can be marked <b>COMPLETED</b> once it is confirmed; if a balance is still unpaid, management must add a note explaining why.</p>
{fig('54-confirmed-ticket', 'A confirmed booking.')}
<h3>Operations Overview</h3>
<p>The overview shows live figures calculated from the records: enquiries received, unassigned work, quotations, confirmed bookings, outstanding payments, overdue tasks, conversion rates, enquiries by source and destination, and each employee's workload. Choose <b>Today, This week, This month, This year</b> or a <b>Custom</b> date range.</p>
{fig('10-ops-overview', 'Operations Overview (demo data).', 'tall')}
{fig('18-workload', 'Employee Workload: active tickets, overdue tasks and work per person.')}
<h3>Checklists &amp; statuses</h3>
<p>Under <b>Checklists &amp; statuses</b> management can edit the checklist templates used for each trip type (full package, day tour, accommodation only, transfer, general), and add extra statuses if KCM needs them.</p>
''')

sec('lifecycle', 'The ticket journey: all statuses', f'''
<p>A typical booking moves down this list. Some steps happen automatically (for example, recording a supplier quote moves the ticket to Supplier research).</p>
{table(['#', 'Status', 'Meaning', 'Who usually sets it'], [
 ['1', 'NEW ENQUIRY', 'Just arrived from the website, Kaycee or staff intake', 'Automatic'],
 ['2', 'AWAITING REVIEW', 'Waiting for management to look at it', 'Management'],
 ['3', 'UNASSIGNED', 'Reviewed but nobody owns it yet', 'Management'],
 ['4', 'ASSIGNED', 'An employee is responsible', 'Automatic when assigned'],
 ['5', 'REQUIREMENTS UNDER REVIEW', 'Confirming dates, numbers, budget with the customer', 'Consultant'],
 ['6', 'SUPPLIER RESEARCH', 'Getting prices from lodges, transport, activities', 'Consultant / automatic'],
 ['7', 'QUOTATION IN PREPARATION', 'Quotation being drafted or waiting for approval', 'Automatic'],
 ['8', 'QUOTATION SENT', 'Approved quotation sent to the customer', 'Automatic when sent'],
 ['9', 'AWAITING CUSTOMER RESPONSE', 'Waiting for the customer to decide', 'Consultant'],
 ['10', 'ACCEPTED BY CUSTOMER', 'Customer accepted the quotation', 'Automatic when accepted'],
 ['11', 'AWAITING DEPOSIT', 'Waiting for the deposit to be paid', 'Consultant'],
 ['12', 'PAYMENT VERIFICATION', 'Payment recorded; finance must verify', 'Automatic'],
 ['13', 'SUPPLIER CONFIRMATION', 'Confirming bookings with suppliers', 'Consultant'],
 ['14', 'BOOKING CONFIRMED', 'Booking confirmed (deposit verified)', '<b>Management only</b>'],
 ['15', 'TRIP PREPARATION', 'Vouchers, itinerary, driver details', 'Consultant'],
 ['16', 'IN PROGRESS / TRAVELLING', 'The customer is on the trip', 'Consultant'],
 ['17', 'COMPLETED', 'Trip finished', 'Consultant / management'],
 ['18', 'CANCELLED', 'Cancelled (reason required)', 'Consultant; management if it was confirmed'],
 ['19', 'LOST / DECLINED', 'Customer declined or went elsewhere (reason required)', 'Consultant'],
 ['20', 'ON HOLD', 'Paused, for example waiting for passports (reason required)', 'Consultant'],
], 'status-table')}
''')

sec('access', 'For admins: giving and removing access', f'''
<p>Open <b>Users &amp; access</b> (Super Admin and Admin only).</p>
<h3>Give someone access</h3>
{steps('In <b>Give someone access</b>, type their email (1) and name.',
       'Choose the role (2): Management, Finance or Operations (only a Super Admin can create an Admin).',
       'Click ' + btn('Give access') + ' (3). They then sign in with <b>Forgot or set password?</b> to choose their password.')}
{fig('60-give-access', 'Giving a new employee access.')}
<h3>Change a role, remove access or reset two-step sign-in</h3>
<ul>
<li><b>Change role</b>: pick a new role from the drop-down in the Role column (A). The change happens at once and the person must sign in again.</li>
<li><b>Remove access</b>: change Status to <b>disabled</b> (B). They are signed out immediately and cannot sign in. Change it back to <b>active</b> to restore access. Their past work stays on the tickets.</li>
<li><b>Reset</b> (in the Two-step column): for someone who lost their phone. They set up the authenticator again at their next sign-in.</li>
</ul>
{fig('61-users-access', 'Users &amp; access: (A) role, (B) status (active / disabled).', 'tall')}
{tip('Nobody can change their own role, and nobody can be made Super Admin from the website. This stops anyone from giving themselves more power.', 'warn')}
<h3>Activity &amp; Audit History</h3>
<p>Every sign-in, change, approval and payment is written to a permanent log that cannot be edited from the dashboard. Use the filter to search by person, action or ticket number.</p>
{fig('19-activity', 'Activity &amp; Audit History.')}
''')

sec('partners', 'Partners: lodges, drivers and guides', f'''
<p>Businesses apply to become KCM partners on the <b>Partner with us</b> page. They upload photos and proof of ownership and choose a password.</p>
<h3>Reviewing an application</h3>
{steps('Open <b>Partner applications</b> and click an application.',
       'Check the photos, the ownership documents (only staff who review partners can open these, and every view is logged) and the details.',
       'Click ' + btn('Approve') + ' (1) and choose a tier, ' + btn('Ask for more info') + ' (2) or ' + btn('Reject') + ' (3). For "more info" and "reject" you must write a note. The partner is emailed your decision.')}
{fig('62-application-detail', 'Reviewing a partner application.')}
<h3>Partners, trips, payouts and ratings</h3>
<ul>
<li><b>Partners</b>: all approved partners.</li>
<li><b>Partner trips &amp; payouts</b>: record each trip a partner did, the commission and the payout; mark payouts Approved, Paid or On hold. The partner is emailed when a payout is marked Paid.</li>
<li><b>Ratings</b>: guest ratings of partners, which you can hide if needed.</li>
</ul>
<div class="two">{fig('24-payouts', 'Partner trips &amp; payouts.', 'half')}{fig('25-ratings', 'Guest ratings.', 'half')}</div>
<h3>What partners see</h3>
<p>Approved partners sign in on the website and see their own portal: their businesses, trips, earnings, payouts and ratings. They cannot see anything else.</p>
{fig('63-partner-portal', 'The partner portal (demo partner).', 'tall')}
''')

sec('requests', 'Website requests and messages', f'''
<p><b>Website requests</b> lists every booking-form and Kaycee request as it was submitted (each one also has a ticket in the Operations Centre). <b>Messages</b> lists notes sent from the Contact page. Both can be downloaded as CSV.</p>
{fig('26-website-requests', 'Website requests.')}
''')

sec('demo', 'Demo data for testing', f'''
<p>To try everything out before going live, the system can fill itself with <b>fake</b> records: about 23 tickets at every stage of the journey (new, assigned, quoting, waiting for deposit, confirmed, travelling, completed, lost, cancelled, on hold), customers, tasks, notes, quotations, payments waiting for verification, a refund waiting for approval, suppliers, partner applications, payouts, ratings and website messages.</p>
<p>Everything fake is clearly labelled: names end in <b>(demo)</b>, emails end in <b>@demo.kcm.test</b> and descriptions start with <b>[DEMO]</b>. No emails or WhatsApp messages are sent while demo data is created.</p>
<h3>Load it</h3>
{steps('Open the Google Sheet and wait for the <b>KCM Admin</b> menu to appear.',
       'Click <b>KCM Admin → Load demo data (testing only)</b> and confirm.',
       'Wait until the message appears (it can take a few minutes). If it says "Part loaded", click the menu item again to continue.')}
<h3>Demo accounts</h3>
<p>All demo accounts use the password <b>Demo-Lowveld-2026</b>. Management and Finance accounts set up an authenticator at their first sign-in, like real ones.</p>
{table(['Email', 'Role', 'Use it to try'], [
 ['nomsa.ops@demo.kcm.test', 'Operations', 'A consultant\'s day: workspace, notes, tasks, quotations'],
 ['sipho.ops@demo.kcm.test', 'Operations', 'Second consultant'],
 ['ayesha.ops@demo.kcm.test', 'Operations', 'Third consultant'],
 ['thandi.manager@demo.kcm.test', 'Management', 'Assigning, approving quotations, confirming bookings'],
 ['fiona.finance@demo.kcm.test', 'Finance', 'Verifying payments'],
 ['sam.finance@demo.kcm.test', 'Finance', 'Approving refunds recorded by Fiona'],
 ['former.ops@demo.kcm.test', 'Operations (disabled)', 'Shows what removed access looks like'],
 ['lowveld.partner0@demo.kcm.test', 'Partner (approved)', 'The partner portal'],
])}
<h3>Remove it before going live</h3>
<p>Click <b>KCM Admin → Remove demo data</b> and confirm. Every demo record and demo account is deleted from every tab; real records are not touched. If no real tickets exist yet, ticket numbering starts again at KCM-2026-000001.</p>
''')

sec('golive', 'Going-live checklist', f'''
{steps('<b>KCM Admin → Remove demo data</b>.',
       '<b>KCM Admin → Remove test admin</b> (admin@kcm.test).',
       'Give each real employee access in <b>Users &amp; access</b> and make sure every Super Admin, Admin, Management and Finance user has set up their authenticator and saved their recovery codes.',
       'Turn on Google\'s own 2-Step Verification for the Google account that owns the Sheet: whoever controls that account controls all the data.',
       'Don\'t share the Google Sheet itself with staff; they use the dashboard.',
       'Check the privacy policy page and name an Information Officer (POPIA).',
       'Make a test booking on the live website and follow it all the way to Completed.')}
''')

sec('help', 'Troubleshooting', f'''
{table(['What you see', 'What to do'], [
 ['"We couldn\'t reach the server" when signing in', 'In Apps Script, open <b>Deploy → Manage deployments</b>, edit the deployment and check <b>Who has access</b> is <b>Anyone</b>. Then deploy a new version.'],
 ['The left menu is empty, or a yellow note says the Operations Centre isn\'t switched on', 'The Google backend is an old version. Paste the latest <b>KCM-Backend.gs</b> into Apps Script, run <b>setup</b>, then <b>Deploy → Manage deployments → Edit → New version</b>.'],
 ['Not sure which backend version is live', 'Open the backend web-app link in a browser. It shows the version number, for example "1.4.0".'],
 ['"Someone else updated this ticket a moment ago"', 'Two people edited the same ticket. Click Refresh to see their change, then make yours again. Nothing was overwritten.'],
 ['"Only management can confirm a booking" or another red message', 'The system is protecting a rule. The message says what is missing (for example, finance must verify the deposit first).'],
 ['A new employee doesn\'t see a page', 'Each role only sees its own pages. Check their role in Users &amp; access.'],
 ['Lost authenticator phone', 'Use a recovery code, or ask an admin to click Reset next to your name.'],
 ['The website doesn\'t show my change', 'Press Ctrl+F5 to reload the page without the browser\'s saved copy.'],
])}
''')

# ------------------------------------------------------------------ assemble
toc = ''.join(f'<li><a href="#{i}"><span>{n+1}. {E(t)}</span></a></li>' for n, (i, t, _) in enumerate(sections))
body = ''.join(f'<section id="{i}" class="chapter"><h2><span class="num">{n+1}</span>{E(t)}</h2>{h}</section>' for n, (i, t, h) in enumerate(sections))
today = datetime.date(2026, 11, 19).strftime('%d %B %Y')
doc = f'''<!DOCTYPE html><html lang="en-ZA"><head><meta charset="utf-8"><title>KCM Travel &amp; Tours: User Guide</title>
<style>
@font-face {{ font-family: Fraunces; src: url("file://{FONTS}/fraunces.woff2") format("woff2"); font-weight: 100 900; }}
@font-face {{ font-family: Manrope; src: url("file://{FONTS}/manrope.woff2") format("woff2"); font-weight: 200 800; }}
@page {{ size: A4; margin: 16mm 15mm 18mm; }}
:root {{ --ink: #14201b; --soft: #5b6a63; --accent: #b4542a; --line: #e5ddd1; --paper: #fbf8f3; --green: #1f5f45; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Manrope, Inter, sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.55; margin: 0; }}
h1, h2, h3 {{ font-family: Fraunces, Georgia, serif; font-weight: 500; line-height: 1.15; }}
.cover {{ height: 262mm; display: flex; flex-direction: column; justify-content: space-between; padding: 8mm 4mm; page-break-after: always; background: linear-gradient(160deg, #fbf8f3 0%, #f3ece1 100%); border-radius: 6mm; }}
.cover img.logo {{ width: 70mm; }}
.cover h1 {{ font-size: 40pt; margin: 0 0 6mm; letter-spacing: -.01em; }}
.cover h1 em {{ color: var(--accent); }}
.cover p.lead {{ font-size: 14pt; color: var(--soft); max-width: 140mm; margin: 0; }}
.cover .shot {{ width: 100%; border-radius: 3mm; box-shadow: 0 6px 24px rgba(0,0,0,.18); }}
.cover .meta {{ font-size: 9.5pt; color: var(--soft); display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 4mm; }}
.toc {{ page-break-after: always; }}
.toc h2 {{ font-size: 24pt; margin: 0 0 6mm; }}
.toc ol {{ list-style: none; padding: 0; columns: 1; }}
.toc li {{ padding: 1.4mm 0; border-bottom: 1px dotted var(--line); font-size: 11pt; }}
.toc a {{ color: var(--ink); text-decoration: none; }}
.howto {{ margin-top: 5mm; padding: 5mm 6mm; background: var(--paper); border-radius: 3mm; }}
.chapter {{ page-break-before: always; }}
.chapter h2 {{ font-size: 22pt; margin: 0 0 5mm; padding-bottom: 3mm; border-bottom: 2px solid var(--accent); display: flex; gap: 4mm; align-items: baseline; }}
.chapter h2 .num {{ font-family: Manrope, sans-serif; font-size: 11pt; font-weight: 800; color: #fff; background: var(--accent); border-radius: 50%; width: 9mm; height: 9mm; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transform: translateY(-1mm); }}
h3 {{ font-size: 14pt; margin: 6mm 0 2mm; color: var(--green); break-after: avoid; }}
p {{ margin: 0 0 3mm; }}
ul {{ margin: 0 0 3mm; padding-left: 5mm; }} li {{ margin-bottom: 1.2mm; }}
ol.steps {{ counter-reset: s; list-style: none; padding: 0; margin: 0 0 4mm; }}
ol.steps li {{ counter-increment: s; position: relative; padding: 1.4mm 0 1.4mm 10mm; break-inside: avoid; }}
ol.steps li::before {{ content: counter(s); position: absolute; left: 0; top: 1.2mm; width: 6.5mm; height: 6.5mm; border-radius: 50%; background: var(--green); color: #fff; font-weight: 800; font-size: 9pt; display: flex; align-items: center; justify-content: center; }}
.ui {{ display: inline-block; padding: 0 2.2mm; border: 1px solid #cdbfae; border-radius: 99px; background: #fff; font-weight: 700; font-size: 9pt; line-height: 1.6; white-space: nowrap; }}
figure.fig {{ margin: 3mm 0 5mm; break-inside: avoid; }}
figure.fig img {{ width: 100%; border: 1px solid var(--line); border-radius: 2mm; display: block; }}
figure.tall img {{ max-height: 170mm; width: auto; max-width: 100%; margin: 0 auto; }}
figure.half img, figure.narrow img {{ width: 100%; }}
figure.narrow img {{ max-height: 150mm; width: auto; margin: 0 auto; }}
figcaption {{ font-size: 8.8pt; color: var(--soft); margin-top: 1.5mm; }}
.two {{ display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; align-items: start; }}
table {{ width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 9.2pt; break-inside: auto; }}
thead {{ display: table-header-group; }}
tr {{ break-inside: avoid; }}
th {{ text-align: left; background: #f1ebe2; font-weight: 800; padding: 1.6mm 2.2mm; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .04em; }}
td {{ padding: 1.5mm 2.2mm; border-bottom: 1px solid var(--line); vertical-align: top; }}
table.roles td, table.roles th {{ padding: 1.4mm 2mm; font-size: 8.6pt; }}
table.status-table td, table.status-table th {{ padding: 1.2mm 2mm; font-size: 8.4pt; }}
table.status-table td:nth-child(2) {{ font-weight: 800; font-size: 8.5pt; white-space: nowrap; }}
.callout {{ border-left: 4px solid var(--green); background: #eef5f0; padding: 3mm 4mm; border-radius: 0 2mm 2mm 0; margin: 3mm 0 5mm; break-inside: avoid; }}
.callout b {{ display: block; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; color: var(--green); margin-bottom: 1mm; }}
.callout p {{ margin: 0; }}
.callout.note {{ border-color: #2f6f9f; background: #edf3f8; }} .callout.note b {{ color: #2f6f9f; }}
.callout.warn {{ border-color: var(--accent); background: #fbf0e9; }} .callout.warn b {{ color: var(--accent); }}
</style></head><body>
<div class="cover">
  <div><img class="logo" src="file://{LOGO}" alt="KCM Travel &amp; Tours"></div>
  <div><h1>User Guide<br><em>KCM Operations Centre</em></h1><p class="lead">How to use the KCM Travel &amp; Tours website and staff dashboard: from a customer's first enquiry to a completed trip. Written for the whole team, with pictures.</p></div>
  <img class="shot" src="img/10-ops-overview.jpg" alt="" style="max-height:105mm;object-fit:cover;object-position:top">
  <div class="meta"><span>Version 1.4 · {today}</span><span>Screenshots show demo data, not real customers</span></div>
</div>
<div class="toc"><h2>Contents</h2><ol>{toc}</ol>
<div class="howto"><h3 style="margin-top:0">How to read this guide</h3>
<p><b>Orange numbered circles</b> on the pictures show where to click, in order. Button names appear like {btn('this')}. Sections 5 to 9 cover everyday work for consultants, managers and finance; sections 11 to 12 are for admins.</p>
<p>All names, numbers and amounts in the pictures are <b>demo data</b> created for testing. They are not real customers or real money.</p></div></div>
{body}
</body></html>'''
(ROOT / 'guide.html').write_text(doc, encoding='utf-8')
print('sections', len(sections), 'figures', fig_no[0])
