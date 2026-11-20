# KCM Travel & Tours: who does what

How people, roles and access work in the KCM dashboard (backend version 1.5). The server enforces every rule below; the menu only hides what someone can't use.

## Two separate things

| | What it is | Example | Who sets it |
|---|---|---|---|
| **Job role** | What the person *is*. A label on their account. | Travel Consultant, Finance Manager | Administrator or manager |
| **Access profile** | What the person can *see* (menu tabs) and *do* (actions). A person can hold several. | Travel Consultant; Manager + Finance Administrator | Administrator or manager |

Someone's access is everything their profiles allow together. Profiles are built by ticking tabs and actions in **Users & access → Access profiles**.

## The built-in profiles

| Profile | Sees | Does | Two-step sign-in |
|---|---|---|---|
| **Administrator** | Everything | Everything, including staff accounts, profiles and erasing customer data on request (POPIA). Cannot be edited. | Yes |
| **Manager** | All tickets, overview, payments, workload, audit, website and partner pages, users | Assigns and reassigns work, edits any ticket, approves quotations, confirms bookings, **approves refunds and partner payouts**, creates staff accounts and profiles | Yes |
| **Finance Administrator** | Tickets with money (read-only), Payments, Partner trips & payouts | Records and verifies payments, records refunds, records partner trips, marks approved payouts as paid | Yes |
| **Travel Consultant** | My Workspace, own and assigned tickets, Unassigned tickets, website requests, messages | Registers enquiries, picks up unassigned tickets, works own tickets, prepares quotations, records payments (unverified) | No |
| **Website & Partners Officer** | Website overview, requests, messages, partners, ratings | Reviews partner applications, moderates ratings, updates website requests | No |
| **Read-only** | Operations, payments and website pages | Nothing | Yes |

Account types outside profiles: **Super Admin** (the owner; everything; cannot be created or changed from the website) and **Partner** (only their own listings, trips and payouts; never the Operations Centre).

## Who does it, who checks it

| Work | Done by | Checked or approved by |
|---|---|---|
| New enquiry | Website, Kaycee, or anyone who can register enquiries | Managers see it in Incoming and Unassigned |
| Who handles a ticket | Manager assigns, or a consultant picks it up | Employee Workload shows the spread |
| Quotation | Consultant prepares | Manager approves before it goes to the customer |
| Money in (payment) | Consultant or finance records it (unverified) | Finance verifies against the bank, never the person who recorded it |
| Money out: refund | Finance records it | **Manager approves**, never the person who recorded it |
| Money out: partner payout | Finance records the trip | **Manager approves**, then finance marks it Paid |
| Booking confirmed | Manager, only after the deposit is verified | Audit history |
| Staff accounts and profiles | Administrators and managers | Audit history records every change |

## Rules that stop abuse

- Nobody changes their own access.
- Nobody can give a profile, or build one, with access they don't have themselves.
- Only an administrator can change another administrator.
- The Super Admin account cannot be changed from the website.
- Temporary passwords work once and expire after 7 days; the employee must choose their own at first sign-in. The temporary password is never emailed.
- Changing someone's profiles, disabling them or setting a new temporary password signs them out at once.
- Finance sees money, not conversations: no notes, tasks, files or phone numbers on tickets they aren't working on.

## Example team

| Person | Job role | Profiles |
|---|---|---|
| Owner | Owner | Super Admin |
| Thandi | Operations Manager | Manager |
| Sam | Finance Manager | Manager + Finance Administrator |
| Fiona | Finance Administrator | Finance Administrator |
| Nomsa, Sipho, Ayesha | Travel Consultants | Travel Consultant |
