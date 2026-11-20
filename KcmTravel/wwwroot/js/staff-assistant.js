/* Kaycee (dashboard assistant): the staff assistant in the dashboard.
   Answers "how do I…" questions about the KCM Operations Centre in plain language, however they are phrased.
   How it understands paraphrases (no AI service, no running cost, works offline):
     1. phrases and synonyms are mapped to one meaning ("give a ticket to", "allocate", "hand over" → assign)
     2. words are reduced to their stem ("assigning", "assigned" → assign) and stop words are ignored
     3. small typos are corrected against the known vocabulary ("pament" → payment)
     4. every help article is scored with BM25 (the ranking method search engines use) over its title,
        example questions, keywords and answer; the best match is shown with related suggestions
   It also answers live questions ("what's on my plate today?", a ticket number) from the system itself,
   and tells people when their role can't do something and who can. */
(() => {
    "use strict";
    const KCM = window.KCM;
    if (!KCM || !document.querySelector("[data-adm-body]")) return;

    /* ------------------------------------------------------------------ knowledge base */
    // q = example questions (any wording), k = extra keywords, go = [hash, button label], perm = permission needed, who = who can do it
    const KB = [
        { id: "assign", t: "Assign or reassign a ticket", perm: "ops.assign", who: "Management and admins",
          q: ["how do i assign a ticket", "give a ticket to someone", "allocate an enquiry to an employee", "reassign a ticket to another person", "move a ticket to a colleague", "change who owns a ticket", "who should handle this enquiry", "pass a ticket over to someone", "hand a ticket over to a colleague"],
          k: "assign reassign owner allocate unassigned employee consultant",
          a: `<ol><li>Open <b>Unassigned Tickets</b> (or any ticket list).</li><li>Click <b>Unassigned</b>, or the person's name, in the <b>Assigned</b> column.</li><li>Pick the employee. The list shows how many active tickets each person has.</li></ol><p>Inside a ticket you can also click <b>Assign</b> / <b>Reassign / hand over</b> for a handover note, supporters and a deadline.</p>`,
          go: ["#unassigned", "Open Unassigned Tickets"] },
        { id: "bulk", t: "Assign several tickets at once", perm: "ops.assign", who: "Management and admins",
          q: ["assign many tickets at once", "bulk assign", "move several tickets to one person", "select multiple tickets and give them to someone"],
          k: "bulk bulk several multiple many select tick checkbox",
          a: `<ol><li>In a ticket list, tick the box at the start of each row (the header box ticks all).</li><li>In the bar that appears, choose the employee under <b>Assign to</b>.</li><li>Click <b>Assign</b>.</li></ol>`, go: ["#tickets", "Open All Tickets"] },
        { id: "handover", t: "Hand over work when someone is on leave", perm: "ops.assign", who: "Management and admins",
          q: ["someone is on leave who takes their tickets", "handover tickets", "colleague is sick", "transfer all work from one employee to another"],
          k: "leave sick handover absent holiday",
          a: `<p>Open each ticket and click <b>Reassign / hand over</b>, choose the new person and write a short handover summary (what was promised, what is pending). Open tasks move with the ticket and nothing is lost. To move many at once, filter <b>All Tickets</b> by the employee, tick the rows and use <b>Assign to</b>.</p>`, go: ["#tickets", "Open All Tickets"] },
        { id: "status", t: "Change a ticket's status", q: ["how do i change the status", "move a ticket to the next stage", "update the progress of a booking", "mark ticket as supplier research", "set status"],
          k: "status stage progress update next lifecycle",
          a: `<ol><li>Open the ticket and click <b>Change status</b>.</li><li>Choose the new status. Cancelled, Lost and On hold need a reason.</li><li>Click <b>Change status</b>.</li></ol><p>If something is missing the system says what, in red, and nothing changes.</p>`, go: ["#mine", "Open my tickets"] },
        { id: "statuses", t: "What the statuses mean", q: ["what do the statuses mean", "explain the ticket stages", "list of statuses", "what is the lifecycle of a ticket", "what does payment verification mean"],
          k: "statuses meaning lifecycle stages journey explain",
          a: `<p>The usual journey: <b>New enquiry → Assigned → Requirements under review → Supplier research → Quotation in preparation → Quotation sent → Accepted → Awaiting deposit → Payment verification → Booking confirmed → Trip preparation → In progress / travelling → Completed</b>. Side exits: <b>Cancelled</b>, <b>Lost / declined</b>, <b>On hold</b> (each needs a reason).</p><p>Payment status (Not invoiced, Deposit pending, Partially paid, Fully paid…) is calculated from verified payments; nobody types it in.</p>` },
        { id: "confirm", t: "Confirm a booking", perm: "ops.confirm", who: "Management and admins",
          q: ["how do i confirm a booking", "why can't i confirm", "confirm the trip", "mark booking as confirmed", "booking confirmed is refused"],
          k: "confirm confirmed booking refused refused",
          a: `<p>Only management can set <b>BOOKING CONFIRMED</b>, and only when a quotation was accepted <b>and</b> finance has verified the deposit. Open the ticket → <b>Change status</b> → <b>BOOKING CONFIRMED</b>.</p>`, go: ["#opsbookings", "Open Bookings"] },
        { id: "complete", t: "Complete a trip", q: ["how do i complete a trip", "mark ticket as done", "close a ticket", "finish a booking", "why can't i complete this ticket"],
          k: "complete completed done close finish closed",
          a: `<p>When the trip is over: <b>Change status → COMPLETED</b>. The booking must be confirmed first. If a balance is still unpaid, completion is blocked unless management adds a note explaining why.</p>`, go: ["#completed", "Open Completed Orders"] },
        { id: "cancel", t: "Cancel, lose or pause a ticket", q: ["how do i cancel a booking", "customer cancelled", "customer went with another company", "put a ticket on hold", "pause an enquiry"],
          k: "cancel cancelled lost lost declined hold pause",
          a: `<p><b>Change status</b> and choose <b>CANCELLED</b>, <b>LOST / DECLINED</b> or <b>ON HOLD</b>. Each needs a reason. A confirmed booking can only be cancelled by management.</p>` },
        { id: "intake", t: "Register a WhatsApp, phone or walk-in enquiry", q: ["customer messaged on whatsapp how do i capture it", "log a phone call enquiry", "add a new enquiry manually", "create a ticket", "walk in customer", "register enquiry"],
          k: "register register new enquiry whatsapp whatsapp phone call walkin email capture create intake manual",
          a: `<ol><li>Click <b>+ Register enquiry</b> at the top of the page.</li><li>Fill in A. Customer (tick POPIA consent once they agree), B. Enquiry (choose the source, e.g. WhatsApp), C. Travel, D. Budget, E. Next action.</li><li>Click <b>Save enquiry</b>. As Operations staff, the ticket is assigned to you.</li></ol><p>WhatsApp chats are not imported automatically; summarise them in a note.</p>`, go: ["#intake", "Register an enquiry"] },
        { id: "note", t: "Add a note or record a customer conversation", q: ["how do i add a note", "record what the customer said", "log a call", "write internal comment", "can i edit a note", "delete a note"],
          k: "note notes comment conversation record log internal",
          a: `<p>Open the ticket → <b>Add note</b>. Choose the type (internal, customer communication, supplier, decision, problem) and the channel (WhatsApp, phone, email). You can create a follow-up task from the same note.</p><p>Notes can't be edited or deleted, so the history stays honest. Add a new note to correct one.</p>` },
        { id: "task", t: "Create a task or follow-up", q: ["create a reminder", "add a follow up", "remind me to call the customer", "how do tasks work", "mark task as done"],
          k: "task tasks follow reminder remind due due todo",
          a: `<p>Open the ticket → <b>Add task</b>: title, due date, priority and who is responsible. Your tasks show in <b>My Workspace</b>; click <b>Done</b> when finished. Overdue tasks turn red and the bell reminds you.</p>`, go: ["#tasks", "Open Tasks & Follow-ups"] },
        { id: "checklist", t: "Use the checklist", q: ["what is the checklist", "tick off items", "steps to complete a booking", "checklist template"],
          k: "checklist tick items template steps",
          a: `<p>Each ticket gets a checklist for its trip type. Open the <b>Checklist</b> tab and tick items as you do them; the system records who and when. Management edits the templates in <b>Checklists & statuses</b>.</p>` },
        { id: "quote", t: "Prepare a quotation", q: ["how do i make a quote", "create a quotation", "price a trip for the customer", "add costs and markup", "how is vat calculated on a quote", "quote the client"],
          k: "quote quotation price pricing cost markup vat margin deposit prepare",
          a: `<ol><li>Open the ticket → <b>Quotations</b> tab → <b>Prepare quotation</b>.</li><li>Add cost lines, then the selling price or a markup %, any discount, VAT treatment, deposit % and valid-until date.</li><li>Check the preview (total, VAT, deposit, margin) and <b>Save quotation</b>.</li><li>Click <b>Submit for approval</b>.</li></ol>` },
        { id: "quote-approve", t: "Approve a quotation", perm: "quote.approve", who: "Management and admins",
          q: ["approve a quote", "quotation waiting for approval", "check quotes before they go out", "why can't i send the quote"],
          k: "approve approval quotation waiting",
          a: `<p>Open <b>Quotations</b>, filter for those awaiting approval, open one, check the figures and click <b>Approve</b>. A quotation can't be sent until it is approved.</p>`, go: ["#quotes", "Open Quotations"] },
        { id: "quote-send", t: "Send a quotation and record the answer", q: ["send the quote to the customer", "customer accepted the quote", "customer declined", "record acceptance", "change a quote that was already sent", "new version of quotation"],
          k: "send accepted declined accept accept decline decline version revise superseded",
          a: `<p>After approval click <b>Send to customer</b> (email it, or mark it as sent on WhatsApp). When they reply click <b>Customer accepted</b> or <b>Customer declined</b>. To change a sent quote click <b>New version</b>; the old one is kept as superseded.</p>` },
        { id: "pay-record", t: "Record a payment", perm: "pay.record", who: "Operations, management, finance and admins",
          q: ["customer paid how do i record it", "capture a deposit", "add a payment", "log an eft", "customer sent proof of payment"],
          k: "payment pay paid deposit eft record capture proof balance instalment",
          a: `<ol><li>Open the ticket → <b>Payments</b> tab → <b>Record payment</b>.</li><li>Choose deposit, instalment or balance; amount, method, bank reference and date.</li><li>Save. It shows as <b>Unverified</b> until finance checks the bank.</li></ol><p>Attach the proof of payment in the <b>Files</b> tab.</p>` },
        { id: "pay-verify", t: "Verify a payment", perm: "pay.verify", who: "Finance and admins",
          q: ["verify a payment", "check if money arrived", "approve a deposit", "payment shows unverified", "why is the payment not counted"],
          k: "verify verified unverified bank check arrived finance",
          a: `<ol><li>Open <b>Payments</b> → <b>Needs verification</b>.</li><li>Check the bank, click <b>Verify</b>, say how you checked and confirm. If it didn't arrive, click <b>Reject</b> with a reason.</li></ol><p>The person who recorded a payment can't verify it.</p>`, go: ["#payments", "Open Payments"] },
        { id: "refund", t: "Refunds", perm: "pay.refund.approve", who: "Finance and admins (a different person from whoever recorded it)",
          q: ["how do i refund a customer", "approve a refund", "give money back", "customer wants their money back"],
          k: "refund money back return reimburse",
          a: `<p>Finance records the refund on the ticket's <b>Payments</b> tab. A <b>different</b> finance person or an admin approves it under <b>Payments → Refunds to approve</b>.</p>`, go: ["#payments", "Open Payments"] },
        { id: "balances", t: "See who still owes money", perm: "pay.view", who: "Finance, management and admins",
          q: ["who still owes us", "outstanding balances", "unpaid bookings", "how much money is outstanding"],
          k: "balance outstanding owe owes unpaid debtors",
          a: `<p><b>Payments → Balances</b> lists what each ticket still owes. The <b>Operations Overview</b> shows the total outstanding.</p>`, go: ["#payments", "Open Payments"] },
        { id: "supplier", t: "Suppliers and supplier quotes", q: ["add a supplier", "record a lodge quote", "transport quote from supplier", "where do i put supplier prices"],
          k: "supplier suppliers lodge transport vendor accommodation price rate cost",
          a: `<p>On a ticket open the <b>Suppliers</b> tab → add the supplier's quote (service, amount, status). New suppliers are added in the same form. Recording a supplier quote moves the ticket to Supplier research.</p>` },
        { id: "files", t: "Attach a file", q: ["upload a document", "attach proof of payment", "add an itinerary pdf", "where are the files"],
          k: "file files upload attach document pdf image itinerary",
          a: `<p>Open the ticket → <b>Files</b> tab → upload (PDF or image). Files are stored privately and only staff who can see the ticket can open them.</p>` },
        { id: "search", t: "Find a ticket or customer", q: ["how do i find a ticket", "search for a customer", "filter tickets", "find enquiries by destination", "export tickets to excel"],
          k: "find search filter look export csv excel",
          a: `<p>In <b>All Tickets</b> use the search box (name, phone, email, ticket number) and the filters (status, priority, employee, source, payment, destination, dates, overdue). <b>CSV</b> downloads the list for Excel. You can also type a ticket number here and I'll look it up.</p>`, go: ["#tickets", "Open All Tickets"] },
        { id: "customer", t: "Customer profile and history", q: ["see all trips for a customer", "customer history", "customer profile", "returning customer"],
          k: "customer profile history client returning",
          a: `<p>Open any ticket and click <b>Profile</b> next to the customer's name. You'll see their details, POPIA consent and every ticket they've had.</p>` },
        { id: "erase", t: "Delete a customer's personal data (POPIA)", perm: "customers.erase", who: "Admins",
          q: ["customer wants their data deleted", "popia request", "remove personal information", "erase customer"],
          k: "popia erase delete personal data privacy remove",
          a: `<p>Admins open the customer's <b>Profile</b> and choose <b>Erase customer</b> with the reason. Names and contact details are removed; amounts and ticket numbers stay for accounting. It's blocked while the customer has open tickets.</p>` },
        { id: "workspace", t: "My Workspace", q: ["what is my workspace", "where are my tickets", "where do i see my work"],
          k: "workspace my tickets dashboard home",
          a: `<p><b>My Workspace</b> shows only your work: your open tickets, overdue tasks, what's due this week and what you finished recently. Ask me "what's on my plate?" for a quick summary.</p>`, go: ["#workspace", "Open My Workspace"] },
        { id: "overview", t: "Operations Overview and reports", perm: "ops.view.all", who: "Management, finance and admins",
          q: ["show me the numbers", "how many enquiries this month", "conversion rate", "reports", "dashboard figures"],
          k: "overview report reports numbers figures stats conversion chart month",
          a: `<p><b>Operations Overview</b> shows live figures: enquiries, unassigned work, quotations, confirmed bookings, outstanding payments, overdue tasks, conversion, sources and destinations. Choose Today, This week, This month, This year or Custom dates.</p>`, go: ["#ops", "Open Operations Overview"] },
        { id: "workload", t: "Employee workload", perm: "ops.workload", who: "Management and admins",
          q: ["who is busy", "how many tickets does each person have", "workload per employee", "who has capacity"],
          k: "workload busy capacity employee per person",
          a: `<p><b>Employee Workload</b> shows each person's active tickets, overdue tasks and recent work, so you can spread new enquiries fairly.</p>`, go: ["#workload", "Open Employee Workload"] },
        { id: "access", t: "Add an employee", perm: "users.manage", who: "Administrators and Managers",
          q: ["add a new employee", "give someone access to the system", "create a user", "new staff member login", "invite a colleague", "set a temporary password"],
          k: "access user users employee staff invite add new login account create temporary password username",
          a: `<ol><li>Open <b>Users & access</b> and click <b>+ Add employee</b>.</li><li>Enter their <b>full name</b>, a <b>username</b>, their <b>email</b> and <b>job role</b>.</li><li>Tick one or more <b>access profiles</b> (what they can see and do). The box below shows the menu tabs they'll get.</li><li>Click <b>Generate</b> for a temporary password, then <b>Create account</b>.</li><li>Give them the username and temporary password in person or by phone. It works once: at first sign-in they choose their own password.</li></ol>`, go: ["#users", "Open Users & access"] },
        { id: "revoke", t: "Disable someone or change their access", perm: "users.manage", who: "Administrators and Managers",
          q: ["remove access", "employee left the company", "disable a user", "block someone", "change someone's role", "make someone a manager", "give someone finance access too", "forgot their password reset an employee"],
          k: "revoke remove disable block left role promote demote profile profiles reset employee password",
          a: `<p>In <b>Users & access</b> click <b>Edit</b> next to the person. Tick or untick <b>access profiles</b> (a person can hold several, e.g. Manager and Finance Administrator), set <b>Account</b> to <b>Disabled</b> if they left, or set a new <b>temporary password</b> if they forgot theirs. They're signed out at once. Nobody can change their own access, and you can't give more access than you have.</p>`, go: ["#users", "Open Users & access"] },
        { id: "profiles", t: "Access profiles", perm: "profiles.manage", who: "Administrators and Managers",
          q: ["create a new role", "build an access profile", "choose which tabs someone sees", "custom permissions", "what is an access profile"],
          k: "profile profiles role roles permission permissions tabs build custom create",
          a: `<p>An access profile is a set of <b>menu tabs</b> and <b>actions</b>. Open <b>Users & access → Access profiles</b>, click <b>+ New profile</b> (or <b>Edit</b> on one), tick what people with it should see and do, and save. Changes apply straight away to everyone who has it. The Administrator profile is fixed. <b>Who does what</b> shows all profiles side by side.</p>`, go: ["#users/profiles", "Open Access profiles"] },
        { id: "roles", t: "Who can do what", q: ["what can my role do", "why can't i see payments", "what roles are there", "permissions", "why is a page missing from my menu"],
          k: "role roles permission permissions access see missing menu",
          a: `<p>What you see comes from your <b>access profiles</b>. <b>Travel Consultant</b>: own and assigned tickets, can see and pick up unassigned ones. <b>Manager</b>: all tickets, assigning, approving quotations, refunds and payouts, staff accounts. <b>Finance Administrator</b>: payments, balances, refunds and partner payouts, and a read-only view of tickets that have money on them. <b>Website & Partners Officer</b>: website requests, messages, partners. A tab that's missing isn't in your profiles; ask an administrator or manager.</p>`, go: ["#users/matrix", "See who does what"] },
        { id: "pickup", t: "Pick up an unassigned ticket", perm: "ops.claim",
          q: ["take a ticket", "pick up a ticket", "claim a ticket", "assign a ticket to myself", "work on an unassigned ticket"],
          k: "pick up claim take unassigned myself self assign",
          a: `<p>Open <b>Unassigned Tickets</b> and click <b>Pick up</b> on the row (or open the ticket and click <b>Pick up this ticket</b>). It moves to <b>My Assigned Tickets</b> with a task to contact the customer within 24 hours.</p>`, go: ["#unassigned", "Open Unassigned Tickets"] },
        { id: "password", t: "Password and sign-in", q: ["forgot my password", "reset password", "change my password", "can't sign in", "how do i log in", "temporary password", "sign in with username"],
          k: "password forgot reset login sign in signin locked change username temporary",
          a: `<p>Sign in with your <b>email or username</b>. First time? Use the temporary password your manager gave you; you'll be asked to choose your own. To change it later click <b>My password</b> at the top of the dashboard. Forgot it? Click <b>Forgot or set password?</b> on the sign-in screen for an email code, or ask a manager for a new temporary password.</p>` },
        { id: "mfa", t: "Authenticator app and recovery codes", q: ["lost my phone authenticator", "two step verification", "recovery codes", "reset someone's two step", "qr code at sign in"],
          k: "authenticator mfa two step 2fa recovery code qr phone lost",
          a: `<p>Super Admin, Admin, Management and Finance sign in with an authenticator app code. Lost your phone? Use one of your 8 recovery codes, or ask an admin to click <b>Reset</b> next to your name in <b>Users & access</b>.</p>` },
        { id: "notifications", t: "Notifications", q: ["what is the bell", "where are my notifications", "mark notifications as read"],
          k: "notification notifications bell alert alerts unread",
          a: `<p>The <b>bell</b> at the top shows new assignments, approvals waiting, payments to verify and overdue work. Click it to open the list; opening marks them read.</p>` },
        { id: "applications", t: "Review partner applications", perm: "partners.review", who: "Management and admins",
          q: ["approve a partner", "review a lodge application", "new partner registered", "reject an application", "ask partner for more information"],
          k: "partner application applications approve reject lodge driver vehicle review",
          a: `<p>Open <b>Partner applications</b>, click one, check photos and ownership documents, then <b>Approve</b> (pick a tier), <b>Ask for more info</b> or <b>Reject</b>. More info and reject need a note; the partner is emailed.</p>`, go: ["#applications", "Open Partner applications"] },
        { id: "payouts", t: "Partner trips and payouts", perm: "payouts.view", who: "Finance and admins",
          q: ["pay a partner", "record a partner trip", "partner commission", "mark payout as paid"],
          k: "payout payouts partner commission trip paid",
          a: `<p><b>Partner trips & payouts</b>: record each trip a partner did, the commission and the payout; set Approved, Paid or On hold. Partners are emailed when a payout is Paid.</p>`, go: ["#payouts", "Open Partner trips & payouts"] },
        { id: "careers", t: "Job applications from the website", perm: "messages.view", who: "Admins and management",
          q: ["where do job applications go", "careers applications", "someone applied for a job", "cv submissions"],
          k: "careers job jobs application cv apply talent",
          a: `<p>Applications from the <b>Careers</b> page arrive in <b>Messages</b>, starting with <b>[CAREERS]</b> and the role. Keep them no longer than 12 months (POPIA).</p>`, go: ["#messages", "Open Messages"] },
        { id: "website", t: "Website requests and messages", q: ["where are bookings from the website", "messages from the contact page", "kaycee requests"],
          k: "website requests messages contact kaycee online form",
          a: `<p>Every website form and Kaycee request becomes a ticket in <b>Incoming Enquiries</b>. The original submissions are also listed in <b>Website requests</b>; contact-page notes are in <b>Messages</b>.</p>`, go: ["#incoming", "Open Incoming Enquiries"] },
        { id: "conflict", t: "\"Someone else updated this ticket\"", q: ["someone else updated this ticket", "my change was not saved", "error when saving ticket"],
          k: "conflict updated someone else version saved error",
          a: `<p>Two people edited the same ticket. Click <b>Refresh</b> to see their change, then make yours again. Nothing was overwritten.</p>` },
        { id: "connection", t: "\"We couldn't reach the server\"", q: ["couldn't reach the server", "nothing loads", "the dashboard is empty", "system is not working"],
          k: "server reach connection error loading empty broken down",
          a: `<p>Check your internet, then refresh with <b>Ctrl+F5</b>. If it keeps happening, tell an admin: the Google backend deployment may need <b>Who has access: Anyone</b> or a new version.</p>` },
    ];

    /* ------------------------------------------------------------------ language helpers */
    const PHRASES = [ // multi-word ideas first, mapped to one canonical token
        [/give (?:someone |a person |an employee |people )?access|add (?:a )?(?:new )?(?:user|employee|staff member|colleague)|new staff|invite/g, " access "],
        [/remove access|revoke|take away access|block (?:a )?(?:user|someone)|left the company|disable/g, " revoke "],
        [/hand ?over|on leave|is sick|going away/g, " handover "],
        [/give (?:a |the |this )?(?:ticket|enquiry|job|work)|hand (?:a |the )?ticket|allocate|delegate|pass (?:the |a )?ticket|move (?:a |the )?ticket to/g, " assign "],
        [/money back|pay back|reimburs\w*/g, " refund "],
        [/in one go|all at once|at once|at the same time|in bulk|several tickets|multiple tickets|lots of tickets|a bunch of tickets/g, " bulk "],
        [/how many|each person|per person|everyone'?s|each employee|each consultant/g, " workload "],
        [/give (?:\w+ )?(?:tickets?|enquir\w+|work)|hand (?:them |it |tickets? )?out|share out/g, " assign "],
        [/sign off|signs off|okay the|ok the|check (?:the )?figures/g, " approv "],
        [/set (?:them|him|her) up|new (?:hire|consultant|employee|starter)|starts (?:on )?\w+day|onboard\w*/g, " access "],
        [/(?:actually )?(?:reach|arrive|reflect|came in|come in|land)\w* (?:in )?(?:our |the )?(?:account|bank)?/g, " verify "],
        [/cheaper|better price|better deal/g, " lost "],
        [/said yes|agreed|accepted|go ahead|went ahead/g, " accept "],
        [/said no|rejected|turned (?:it )?down|not interested/g, " decline "],
        [/won'?t let me|doesn'?t let me|does not let me|not allowed|unable to|can'?t|cannot|blocked|greyed out/g, " refused "],
        [/with someone else|another company|another operator|a competitor|elsewhere|somewhere else/g, " lost "],
        [/sent me a (?:whatsapp|message|text|sms)|messaged me|texted me|dm'?d me|phoned (?:in|us|me)?|called (?:in|us|me)|rang/g, " register whatsapp "],
        [/tomorrow|next week|later today|this afternoon|on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|by (?:monday|tuesday|wednesday|thursday|friday)/g, " task due "],
        [/proof of payment|pop\b/g, " payment proof "],
        [/what(?:'s| is) on my plate|what should i do|what do i have|my day|to ?do list|what(?:'s| is) next for me|anything due/g, " mytoday "],
        [/two[- ]?step|2fa|mfa|google authenticator|microsoft authenticator/g, " authenticator "],
        [/log ?in|sign ?in|signin|logon/g, " login "],
        [/whats ?app|wa\b/g, " whatsapp "],
        [/walk[- ]?in/g, " walkin "],
        [/e[- ]?mail/g, " email "],
    ];
    const SYN = {
        allocate: "assign", delegate: "assign", owner: "assign", reassign: "assign", transfer: "assign",
        quotation: "quote", quotes: "quote", estimate: "quote", pricing: "quote", invoice: "quote",
        pay: "payment", paid: "payment", money: "payment", eft: "payment", deposit: "payment", cash: "payment",
        confirmed: "confirm", confirmation: "confirm", approve: "approv", approval: "approv", approved: "approv",
        done: "complet", finish: "complet", finished: "complet", close: "complet", closed: "complet",
        client: "customer", guest: "customer", traveller: "customer", traveler: "customer",
        booking: "ticket", bookings: "ticket", enquiry: "ticket", enquiries: "ticket", inquiry: "ticket", request: "ticket", job: "ticket",
        reminder: "task", remind: "task", followup: "task", todo: "task",
        comment: "note", remark: "note", stage: "status", progress: "status", step: "status",
        staff: "employee", colleague: "employee", consultant: "employee", agent: "employee", person: "employee", someone: "employee", user: "employee",
        delete: "erase", remove: "erase", popi: "popia", privacy: "popia",
        password: "password", pin: "password", upload: "file", document: "file", attachment: "file", pdf: "file",
        cancelled: "cancel", canceled: "cancel", pause: "hold", vendor: "supplier", lodge: "supplier",
        figures: "report", numbers: "report", stats: "report", statistics: "report", busy: "workload", capacity: "workload",
        cv: "careers", vacancy: "careers", recruit: "careers",
        responsible: "assign", team: "employee", yes: "accept", agree: "accept", reject: "decline", resign: "revoke", resigned: "revoke", fired: "revoke",
        messaged: "whatsapp", texted: "whatsapp", sms: "whatsapp", inbox: "whatsapp", sent: "send", rate: "price", rates: "price", cost: "price", costs: "price",
    };
    const STOP = new Set("a an the i me my we our you your it its is are was be been do does did can could should would will how what where when why which who whom to of in on at for from with by and or but if then so this that these those there here please just about into up out get got make have has had any some am im ive id".split(" "));
    const stem = w => {
        if (w.length > 5 && w.endsWith("ies")) return w.slice(0, -3) + "y";
        if (w.length > 6 && w.endsWith("ing")) return w.slice(0, -3);
        if (w.length > 5 && w.endsWith("ed")) return w.slice(0, -2);
        if (w.length > 5 && w.endsWith("es") && !w.endsWith("ses")) return w.slice(0, -2);
        if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
        return w;
    };
    const norm = s => {
        let t = " " + String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'") + " ";
        for (const [re, rep] of PHRASES) t = t.replace(re, rep);
        return t.replace(/[^a-z0-9' ]+/g, " ").replace(/'/g, "");
    };
    const tokens = s => norm(s).split(/\s+/).filter(w => w && !STOP.has(w)).map(w => SYN[w] || w).map(stem).map(w => SYN[w] || w);
    function lev(a, b, max) {
        if (Math.abs(a.length - b.length) > max) return max + 1;
        let prev = Array.from({ length: b.length + 1 }, (_, i) => i), pp = prev;
        for (let i = 1; i <= a.length; i++) {
            const cur = [i]; let best = i;
            for (let j = 1; j <= b.length; j++) {
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
                if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1); // swapped letters
                best = Math.min(best, cur[j]);
            }
            if (best > max) return max + 1;
            pp = prev; prev = cur;
        }
        return prev[b.length];
    }

    /* ------------------------------------------------------------------ index (BM25) */
    const strip = h => h.replace(/<[^>]+>/g, " ");
    const DOCS = KB.map(d => {
        const tf = new Map(), add = (text, w) => tokens(text).forEach(x => tf.set(x, (tf.get(x) || 0) + w));
        add(d.t, 3); d.q.forEach(q => add(q, 2)); add(d.k || "", 2); add(strip(d.a), 1);
        const len = [...tf.values()].reduce((a, b) => a + b, 0);
        const bigrams = new Set(); [d.t, ...d.q].forEach(q => { const t = tokens(q); for (let i = 1; i < t.length; i++) bigrams.add(t[i - 1] + " " + t[i]); });
        return { d, tf, len, bigrams };
    });
    const avgLen = DOCS.reduce((a, x) => a + x.len, 0) / DOCS.length;
    const df = new Map(); DOCS.forEach(x => x.tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1)));
    const VOCAB = [...df.keys()];
    const fix = t => {
        if (df.has(t) || t.length < 4 || /\d/.test(t)) return t;
        const max = t.length >= 7 ? 2 : 1; let best = null, bd = max + 1;
        for (const v of VOCAB) { const d = lev(t, v, max); if (d < bd) { bd = d; best = v; } }
        return best || t;
    };
    function rank(q) {
        const qt = [...new Set(tokens(q).map(fix))];
        if (!qt.length) return [];
        const qb = []; for (let i = 1; i < qt.length; i++) qb.push(qt[i - 1] + " " + qt[i]);
        const k1 = 1.4, b = 0.7, N = DOCS.length;
        return DOCS.map(x => {
            let s = 0, hits = 0;
            for (const t of qt) {
                const f = x.tf.get(t); if (!f) continue;
                hits++;
                const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5));
                s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * x.len / avgLen));
            }
            qb.forEach(bg => { if (x.bigrams.has(bg)) s += 1.2; });
            s *= 0.6 + 0.4 * (hits / qt.length); // reward covering more of the question
            return { d: x.d, s };
        }).filter(r => r.s > 0).sort((a, b) => b.s - a.s);
    }
    window.KCAssistRank = rank; // used by the automated paraphrase test

    /* ------------------------------------------------------------------ UI */
    const esc = KCM.esc;
    const BASE = KCM.base || "";
    const user = () => KCM.session.user() || {};
    const can = p => !p || (Array.isArray(user().permissions) && user().permissions.includes(p));
    const firstName = () => String(user().name || "").replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || String(user().email || "").split("@")[0].split(/[._-]/)[0];

    document.body.classList.add("staff-mode");
    const root = document.createElement("div");
    root.className = "kca";
    root.innerHTML = `
        <button type="button" class="kca-launch" aria-expanded="false" aria-controls="kca-panel">
            <img src="${BASE}/images/brand/kcm-logo.svg" alt="" width="40" height="40"><span><strong>Ask Kaycee</strong><small>Your dashboard assistant</small></span>
        </button>
        <div class="kca-teaser" hidden>
            <button type="button" class="kca-teaser-msg"><span class="kca-teaser-hi"></span><span>How can I assist you today?</span><span class="kca-teaser-cta">Ask Kaycee →</span></button>
            <button type="button" class="kca-teaser-x" aria-label="Hide this message">×</button>
        </div>
        <section class="kca-panel" id="kca-panel" role="dialog" aria-label="Kaycee, dashboard assistant" hidden>
            <header><img src="${BASE}/images/brand/kcm-logo.svg" alt="" width="34" height="34"><div><strong>Kaycee</strong><small>Dashboard assistant · ask in your own words</small></div><button type="button" class="kca-x" aria-label="Close">×</button></header>
            <div class="kca-log" aria-live="polite"></div>
            <form class="kca-form"><input name="q" autocomplete="off" placeholder="e.g. how do I give a ticket to Sipho?" aria-label="Your question"><button type="submit" aria-label="Ask">Ask</button></form>
        </section>`;
    document.body.append(root);
    const panel = root.querySelector(".kca-panel"), log = root.querySelector(".kca-log"), launch = root.querySelector(".kca-launch"), input = root.querySelector("input");
    const add = (html, who = "bot") => { const m = document.createElement("div"); m.className = "kca-msg kca-" + who; m.innerHTML = html; log.append(m); log.scrollTop = log.scrollHeight; return m; };
    const chips = list => `<div class="kca-chips">${list.map(t => `<button type="button" data-ask="${esc(t)}">${esc(t)}</button>`).join("")}</div>`;
    const starters = () => {
        const s = ["How many tickets are on my name?", "How do I register a WhatsApp enquiry?", "How do I prepare a quotation?", "How do I record a payment?"];
        if (can("ops.assign")) s.splice(1, 0, "How do I assign a ticket?");
        if (can("pay.verify")) s.splice(1, 0, "How do I verify a payment?");
        if (can("users.manage")) s.push("How do I give someone access?");
        return s.slice(0, 5);
    };
    let greeted = false;
    const open = () => {
        panel.hidden = false; launch.setAttribute("aria-expanded", "true"); launch.hidden = true;
        if (!greeted) { greeted = true; add(`<p>Hi, ${esc(firstName() || "there")}. I'm Kaycee. How can I assist you today on the dashboard?</p><p class="kca-sub">Ask in your own words, for example "how many tickets are on my name?", or type a ticket number.</p>${chips(starters())}`); }
        setTimeout(() => input.focus(), 50);
    };
    const close = () => { panel.hidden = true; launch.hidden = false; launch.setAttribute("aria-expanded", "false"); launch.focus(); };
    launch.addEventListener("click", open);
    const teaser = root.querySelector(".kca-teaser");
    const teaserOff = () => { try { return sessionStorage.getItem("kca-teaser") === "off"; } catch { return false; } };
    const hideTeaser = (instant) => { teaser.classList.remove("is-in"); if (instant === true) teaser.hidden = true; else setTimeout(() => { teaser.hidden = true; }, 300); try { sessionStorage.setItem("kca-teaser", "off"); } catch { /* storage unavailable */ } };
    if (!teaserOff()) setTimeout(() => {
        if (!panel.hidden) return;
        teaser.querySelector(".kca-teaser-hi").textContent = `Hi, ${firstName() || "there"}`;
        teaser.hidden = false; requestAnimationFrame(() => teaser.classList.add("is-in"));
    }, 2500);
    teaser.querySelector(".kca-teaser-msg").addEventListener("click", () => { hideTeaser(true); open(); });
    teaser.querySelector(".kca-teaser-x").addEventListener("click", hideTeaser);
    launch.addEventListener("click", () => { if (!teaser.hidden) hideTeaser(true); });
    root.querySelector(".kca-x").addEventListener("click", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) close(); });

    const goBtn = go => go ? `<p><a class="kca-go" href="${go[0]}">${esc(go[1])} →</a></p>` : "";
    function answer(d) {
        let html = `<h4>${esc(d.t)}</h4>`;
        if (!can(d.perm)) html += `<p class="kca-note">Your role can't do this. ${esc(d.who || "Ask a manager")} can. Here's how it works:</p>`;
        html += d.a + (can(d.perm) ? goBtn(d.go) : "");
        return html;
    }
    /* "how many tickets are on my name?", "what's assigned to me", "do I have overdue tasks": answered from live data.
       "how do I add a task to my ticket?" stays a how-to question. */
    const WORK = /\b(tickets?|tasks?|work|jobs?|enquir\w*|bookings?|overdue|due|assigned|follow[- ]?ups?|deadlines?|plate|load)\b/i;
    const HOWTO = /\b(how (?:do|can|to|should|would)|where (?:do|can)|what (?:is|does|are the steps)|explain|steps to)\b/i;
    const SELF = /\b(my|me|mine|i have|i'?ve got|do i|have i|on my name|under my name|assigned to me|for me)\b/i;
    const ACTION = /\b(pass|give|assign|reassign|allocate|move|hand|transfer|send|share|delegate|add|create|change|delete|remove|record|approve|verify|cancel|complete|close)\b/i; // doing something = a how-to question
    const isMyWork = q => WORK.test(q) && SELF.test(q) && !HOWTO.test(q) && !ACTION.test(q);
    let wl = null, wlAt = 0;
    const workload = async () => { if (!wl || Date.now() - wlAt > 60000) { wl = await KCM.call("workload"); wlAt = Date.now(); } return wl; };
    async function colleagueWork(q) {
        if (!can("ops.workload") || !WORK.test(q) || HOWTO.test(q) || ACTION.test(q)) return null;
        const words = norm(q).split(/\s+/).filter(w => w.length > 2);
        const list = await workload();
        const hit = list.find(p => { const first = String(p.name || "").replace(/\(.*?\)/g, "").trim().split(/\s+/)[0].toLowerCase(); return first.length > 2 && words.includes(first); });
        if (!hit) return null;
        const nm = String(hit.name).replace(/\s*\(.*?\)/g, "");
        return `<h4>${esc(nm)}'s work</h4><p><b>${hit.activeTickets}</b> active ticket${hit.activeTickets === 1 ? "" : "s"}${hit.supporting ? ` (plus ${hit.supporting} supporting)` : ""}, <b>${hit.openTasks || 0}</b> open task${hit.openTasks === 1 ? "" : "s"}${hit.overdueTasks ? `, <b class="kca-bad">${hit.overdueTasks} overdue</b>` : ""}${hit.overdueTickets ? ` and ${hit.overdueTickets} ticket${hit.overdueTickets === 1 ? "" : "s"} past their next-action date` : ""}.</p>${goBtn(["#workload", "Open Employee Workload"])}`;
    }
    async function liveToday() {
        const w = await KCM.call("myWorkspace");
        const od = w.overdue || [], up = w.upcoming || [], tk = w.tickets || [];
        const item = k => `<li>${esc(k.title || k.nextAction || "")} <a href="#ticket/${esc(k.ref)}">${esc(k.ref)}</a></li>`;
        let h = `<h4>Your work right now</h4><p>You have <b>${tk.length}</b> open ticket${tk.length === 1 ? "" : "s"} on your name, <b>${od.length}</b> overdue task${od.length === 1 ? "" : "s"} and <b>${up.length}</b> thing${up.length === 1 ? "" : "s"} due this week.</p>`;
        if (tk.length) h += `<p><b>Your tickets:</b></p><ul>${tk.slice(0, 6).map(t => `<li><a href="#ticket/${esc(t.ref)}">${esc(t.ref)}</a> · ${esc(t.opStatus)}${t.overdue ? ' · <b class="kca-bad">overdue</b>' : ""}</li>`).join("")}${tk.length > 6 ? `<li>and ${tk.length - 6} more</li>` : ""}</ul>`;
        if (od.length) h += `<p><b>Do these first:</b></p><ul>${od.slice(0, 5).map(item).join("")}</ul>`;
        else if (up.length) h += `<p><b>Coming up:</b></p><ul>${up.slice(0, 5).map(item).join("")}</ul>`;
        else if (!tk.length) h += `<p>Nothing is assigned to you yet.${can("ops.assign") ? " Check <a href=\"#unassigned\">Unassigned Tickets</a>." : ""}</p>`;
        return h + goBtn(["#workspace", "Open My Workspace"]);
    }
    async function liveTicket(ref) {
        const t = await KCM.call("getTicket", { ref });
        const staff = t.assignedToName || t.assignedTo || "nobody yet";
        return `<h4>${esc(t.ref)} · ${esc(t.customer?.name || "")}</h4><p>Status <b>${esc(t.opStatus)}</b> · payment <b>${esc(t.paymentStatus || "")}</b> · assigned to ${esc(staff)}.</p>${t.nextAction ? `<p>Next action: ${esc(t.nextAction)}</p>` : ""}${goBtn(["#ticket/" + t.ref, "Open the ticket"])}`;
    }
    /* AI mode: the backend asks Claude using the most relevant articles. Falls back to the built-in matcher
       when no API key is set, the backend is older, or the AI service can't be reached. */
    let aiState = "unknown"; // unknown | on | off
    const toHtml = t => {
        const lines = esc(t).split(/\n+/).map(x => x.trim()).filter(Boolean);
        let html = "", list = [];
        const flush = () => { if (list.length) { html += `<ol>${list.map(x => `<li>${x}</li>`).join("")}</ol>`; list = []; } };
        lines.forEach(l => { const m = /^(?:\d+[.)]|[-•*])\s+(.*)$/.exec(l); if (m) list.push(m[1]); else { flush(); html += `<p>${l}</p>`; } });
        flush(); return html;
    };
    async function askAi(q, r) {
        if (aiState === "off") return null;
        const pick = (r.length ? r : rank("ticket status assign quote payment")).slice(0, 6).map(x => x.d);
        try {
            const res = await KCM.call("assistantAsk", { question: q, titles: KB.map(d => d.t), articles: pick.map(d => ({ id: d.id, title: d.t, who: d.perm ? d.who : "", text: strip(d.a).replace(/\s+/g, " ").trim() })) });
            if (!res || res.mode !== "ai") { if (!res || !res.reason) aiState = "off"; return null; }
            aiState = "on";
            const d = KB.find(x => x.id === res.article);
            let html = toHtml(res.answer);
            if (d) html += can(d.perm) ? goBtn(d.go) : "";
            return html + `<p class="kca-src">Answered by AI from the KCM staff guide${d ? `: ${esc(d.t)}` : ""}.</p>`;
        } catch (e) {
            if (/unknown action/i.test(e.message || "")) aiState = "off";
            if (e.code === "rate") return `<p>${esc(e.message)}</p>`;
            return null;
        }
    }
    async function ask(q) {
        q = String(q || "").trim(); if (!q) return;
        add(`<p>${esc(q)}</p>`, "me");
        const thinking = add(`<p class="kca-typing"><span></span><span></span><span></span></p>`);
        try {
            const ref = (q.match(/kcm-\d{4}-\d{6}/i) || [])[0];
            if (ref) { thinking.innerHTML = await liveTicket(ref.toUpperCase()); return; }
            if (/\b(?:hi|hello|hey|sawubona|molo|dumela|good (?:morning|afternoon|evening))\b/i.test(q) && q.split(/\s+/).length <= 4) { thinking.innerHTML = `<p>Hello ${esc(firstName())}! What can I help you with?</p>${chips(starters())}`; return; }
            if (/\b(?:thank|thanks|ngiyabonga|dankie|enkosi)\b/i.test(q)) { thinking.innerHTML = `<p>You're welcome. Ask me anything else about the system.</p>`; return; }
            if (tokens(q).includes("mytoday") || isMyWork(q)) { thinking.innerHTML = await liveToday(); return; }
            const col = await colleagueWork(q); if (col) { thinking.innerHTML = col; return; }
            const r = rank(q);
            const ai = await askAi(q, r);
            if (ai) { thinking.innerHTML = ai; return; }
            if (!r.length || r[0].s < 1.2) {
                const sug = r.slice(0, 3).map(x => x.d.t);
                thinking.innerHTML = `<p>I'm not sure I understood. ${sug.length ? "Did you mean one of these?" : "Try asking about tickets, assigning, quotations, payments, tasks or access."}</p>${chips(sug.length ? sug : starters())}`;
                return;
            }
            const top = r[0].d, rel = r.slice(1, 4).filter(x => x.s > r[0].s * 0.45).map(x => x.d.t);
            thinking.innerHTML = answer(top) + (rel.length ? `<p class="kca-rel">Related:</p>${chips(rel)}` : "");
        } catch (e) {
            thinking.innerHTML = `<p>I couldn't load that from the system: ${esc(e.message || e)}</p>`;
        }
    }
    root.querySelector(".kca-form").addEventListener("submit", e => { e.preventDefault(); const q = input.value; input.value = ""; ask(q); });
    log.addEventListener("click", e => {
        const c = e.target.closest("[data-ask]");
        if (c) { const d = KB.find(x => x.t === c.dataset.ask); d ? (add(`<p>${esc(d.t)}</p>`, "me"), add(answer(d))) : ask(c.dataset.ask); }
        if (e.target.closest("a.kca-go, a[href^='#']") && window.innerWidth < 760) close();
    });
})();
