/* KCM admin dashboard. Reads live data from the pilot backend (Google Sheet via Apps Script).
   Charts are small hand-built SVGs (no external libraries). */
(() => {
    "use strict";
    window.addEventListener("DOMContentLoaded", () => {
        const K = window.KCM;
        const root = document.querySelector("[data-admin]");
        if (!K || !root) return;
        const $ = (s, c = document) => c.querySelector(s);
        const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
        const esc = K.esc, R = K.fmtR;
        let body = $("[data-adm-body]");
        const tip = $("[data-tip]");
        const fmtDate = s => s ? new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "";
        const fmtWhen = s => s ? new Date(s).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
        const C = { s1: "#a8481f", s2: "#0a7ea4", s3: "#237a2a", s4: "#c98a1b" };
        const STATUS_TONE = { Pending: "info", "In review": "warn", "Needs info": "info", Approved: "good", Rejected: "bad", Uploading: "muted" };
        const STATUS_LABEL = { Pending: "Submitted", Uploading: "Draft" };
        const TIERS = ["Premium", "Premium Plus", "Signature"];
        const PAYOUT_STATUSES = ["Pending", "Approved", "Paid", "On hold"];
        const STATUS_COLOR = { Pending: "#6b736e", "In review": "#c98a1b", "Needs info": "#0a7ea4", Approved: "#237a2a", Rejected: "#b42318", Uploading: "#9aa39e" };
        const BOOKING_STATUSES = ["New", "Contacted", "Confirmed", "Paid", "Completed", "Cancelled"];
        const TITLES = { overview: "Overview", applications: "Partner applications", partners: "Approved partners", bookings: "Booking requests", payouts: "Trips & payouts", ratings: "Guest ratings", messages: "Messages", users: "Users & access", activity: "Activity log" };

        let me = null, sample = false;
        const cache = {};
        /* Permissions come from the server (me.permissions). The UI only hides what you can't use; the backend enforces it. */
        const can = p => !!(me && Array.isArray(me.permissions) && me.permissions.includes(p));
        const ROLE_LABEL = { SUPER_ADMIN: "Super admin", ADMIN: "Admin", MANAGEMENT: "Management", FINANCE: "Finance", OPERATIONS: "Operations", PARTNER: "Partner", CUSTOMER: "Customer" };

        /* ---------- data access (live or sample) ---------- */
        async function get(action, payload) {
            if (sample) return SAMPLE[action]?.(payload);
            return K.call(action, payload);
        }

        /* ---------- boot ---------- */
        async function boot() {
            if (!K.configured) return gate("setup");
            const user = K.session.user();
            if (!user) return gate("signin");
            me = await K.session.refresh(true) || user;
            if (!me || !me.isStaff) return gate("noaccess");
            /* An older backend (before v1.4) sends no permission list. Show the website & partner pages it supports,
               keep the Operations Centre switched off, and say what to update. The backend still enforces access. */
            const legacy = !Array.isArray(me.permissions);
            if (legacy) {
                const view = ["dashboard.view", "partners.view", "payouts.view", "messages.view", "bookings.view"];
                const edit = ["partners.review", "payouts.manage", "ratings.moderate", "bookings.update", "audit.view"];
                const r = String(me.role || "").toLowerCase();
                me.permissions = r === "owner" || r === "admin" ? view.concat(edit, ["users.view", "users.manage"]) : view;
                const note = document.createElement("div");
                note.className = "adm-card adm-legacy";
                note.innerHTML = `<strong>The Operations Centre isn't switched on yet.</strong> Your Google Apps Script is still the previous version. In the Sheet: <em>Extensions → Apps Script</em>, replace everything in <code>Code.gs</code> with <code>backend/apps-script/dist/KCM-Backend.gs</code>, run <code>setup</code>, then <em>Deploy → Manage deployments → Edit → New version</em>. Refresh this page afterwards.`;
                body.before(note);
            }
            if (window.KCMOps && !legacy) { const o = window.KCMOps(opsCtx()); Object.assign(VIEWS, o.views); Object.assign(TITLES, o.titles); o.start?.(); }
            $$("[data-perm]").forEach(a => { a.hidden = !a.dataset.perm.split("|").some(can); });
            $$("[data-nav-group]").forEach(g => { let n = g.nextElementSibling, any = false; while (n && !n.hasAttribute("data-nav-group")) { if (!n.hidden) any = true; n = n.nextElementSibling; } g.hidden = !any; });
            setupNavGroups();
            if (!location.hash || !VIEWS[location.hash.slice(1).split("/")[0]]) location.replace("#" + (can("ops.edit.own") || can("ops.view.all") ? "workspace" : "overview"));
            route();
        }

        /* ---------- collapsible menu groups (remembered per browser) ---------- */
        const NAV_KEY = "kcm-nav-collapsed";
        const groupLinks = g => { const out = []; let n = g.nextElementSibling; while (n && !n.hasAttribute("data-nav-group")) { out.push(n); n = n.nextElementSibling; } return out; };
        const groupName = g => g.textContent.trim();
        function readCollapsed() { try { return JSON.parse(localStorage.getItem(NAV_KEY) || "[]"); } catch { return []; } }
        function setGroup(g, open, remember) {
            g.setAttribute("aria-expanded", open ? "true" : "false");
            groupLinks(g).forEach(a => a.classList.toggle("nav-collapsed", !open));
            if (!remember) return;
            const list = readCollapsed().filter(n => n !== groupName(g));
            if (!open) list.push(groupName(g));
            try { localStorage.setItem(NAV_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
        }
        function setupNavGroups() {
            const collapsed = readCollapsed();
            $$("[data-nav-group]").forEach(g => {
                setGroup(g, !collapsed.includes(groupName(g)), false);
                g.addEventListener("click", () => setGroup(g, g.getAttribute("aria-expanded") !== "true", true));
            });
        }
        /* the page you're on is never hidden inside a collapsed group */
        function openGroupOf(link) {
            if (!link || !link.classList.contains("nav-collapsed")) return;
            let n = link.previousElementSibling;
            while (n && !n.hasAttribute("data-nav-group")) n = n.previousElementSibling;
            if (n) setGroup(n, true, false);
        }

        function gate(kind) {
            if (new URLSearchParams(location.search).has("preview")) { sample = true; me = SAMPLE.me(); $("[data-sample-pill]").hidden = false; return route(); }
            root.classList.add("adm--gate");
            $("[data-adm-title]").textContent = kind === "noaccess" ? "No admin access" : "Admin dashboard";
            const preview = `<button class="btn btn--ghost" type="button" data-sample>Preview with sample data</button>`;
            if (kind === "setup") body.innerHTML = `<div class="adm-card adm-gate"><h2>Connect your Google Sheet</h2>
                <p>The dashboard reads from the pilot database in your Google Drive. It isn't connected yet: deploy the Apps Script backend and add its URL to the site settings (see <code>backend/SETUP.md</code>).</p>
                <div class="btn-row">${preview}</div></div>`;
            if (kind === "signin") {
                body.innerHTML = `<div class="adm-card adm-gate"><h2>Sign in to continue</h2><p>Only members of the KCM team can open the dashboard.</p><div data-mount></div><div class="btn-row" style="margin-top:18px">${preview}</div></div>`;
                K.mountSignin($("[data-mount]", body), () => location.reload());
            }
            if (kind === "noaccess") body.innerHTML = `<div class="adm-card adm-gate"><h2>You don't have admin access</h2><p>You're signed in as <strong>${esc(K.session.user()?.email)}</strong>. Ask a KCM admin to give your email access in Users &amp; access.</p>
                <div class="btn-row"><a class="btn btn--primary" href="${K.base}/account">Go to my account</a>${preview}</div></div>`;
        }

        root.addEventListener("click", e => { if (e.target.closest("[data-sample]")) { sample = true; me = SAMPLE.me(); root.classList.remove("adm--gate"); $("[data-sample-pill]").hidden = false; route(); } });
        $("[data-refresh]").addEventListener("click", () => { Object.keys(cache).forEach(k => delete cache[k]); route(); });
        window.addEventListener("hashchange", route);

        function route() {
            if (!me) return;
            const view = (location.hash.slice(1) || "overview").split("/")[0];
            const fn = VIEWS[view] || VIEWS.overview;
            const navView = VIEWS[view] ? (view === "ticket" || view === "customer" ? "tickets" : view) : "overview";
            $$("[data-view]").forEach(a => a.classList.toggle("is-active", a.dataset.view === navView));
            openGroupOf($("[data-view].is-active"));
            $("[data-adm-title]").textContent = TITLES[view] || TITLES.overview;
            $("[data-adm-eyebrow]").textContent = `${me.name || me.email} · ${ROLE_LABEL[me.role] || me.role}`;
            const fresh = body.cloneNode(false); body.replaceWith(fresh); body = fresh; // drop listeners from the previous view
            body.innerHTML = `<div class="adm-card"><p>Loading…</p></div>`;
            const deep = location.hash.slice(1).split("/")[1]; // e.g. #applications/P-2611-AB12 or #ticket/KCM-2026-000001
            fn(deep ? decodeURIComponent(deep) : undefined).catch(err => { body.innerHTML = `<div class="adm-card"><p class="form-error">${esc(err.message)}</p></div>`; });
            if (view === "applications" && deep && !sample) openApp(decodeURIComponent(deep));
        }

        async function cached(action) { return cache[action] ||= await get(action); }
        function badge(status) { return `<span class="status status--${STATUS_TONE[status] || "muted"}">${esc(STATUS_LABEL[status] || status)}</span>`; }
        function empty(title, text) { return `<div class="adm-empty"><h3>${title}</h3><p>${text}</p></div>`; }

        /* =================== VIEWS =================== */
        const VIEWS = {
            async overview() {
                const d = await get("dashboard");
                cache.dashboard = d;
                setBadges(d.kpis);
                if (d.sheetUrl) $("[data-adm-sheet]").innerHTML = `<a class="adm-sheet-link" href="${esc(d.sheetUrl)}" target="_blank" rel="noopener">Open the Google Sheet ↗</a>`;
                const k = d.kpis;
                body.innerHTML = `
                    <div class="kpis">
                        ${kpi("Waiting for review", k.pending, `${k.inReview || 0} in review${k.needsInfo ? ` · ${k.needsInfo} waiting on partner` : ""}`, "#applications")}
                        ${kpi("Approved partners", k.approved, `of ${k.applications} applications`, "#partners")}
                        ${kpi("Booking requests", k.bookings, `${k.newBookings} new`, "#bookings")}
                        ${kpi("Estimated booking value", R(k.bookingValue), "excl. cancelled", "#bookings")}
                        ${kpi("Payouts to partners", R(k.payoutsPending || 0), `pending · ${k.trips || 0} trips logged`, "#payouts")}
                        ${kpi("Guest rating", k.ratings ? (k.avgRating || 0).toFixed(1) + " ★" : "—", `${k.ratings || 0} ratings · ${k.users} users`, "#ratings")}
                    </div>
                    <div class="adm-grid">
                        <div class="adm-card adm-span-2"><div class="card-head"><h2>Activity per week</h2><p>Partner applications and booking requests, last 12 weeks</p></div><div class="chart" data-chart="weekly"></div></div>
                        <div class="adm-card"><div class="card-head"><h2>Applications by status</h2><p>${k.applications} submitted</p></div><div data-chart="status"></div></div>
                        <div class="adm-card"><div class="card-head"><h2>Partners by type</h2><p>All submitted applications</p></div><div data-chart="type"></div></div>
                        <div class="adm-card"><div class="card-head"><h2>Where partners are</h2><p>Applications by province</p></div><div data-chart="province"></div></div>
                        <div class="adm-card"><div class="card-head"><h2>Booking value by trip</h2><p>Estimated, all statuses</p></div><div data-chart="tour"></div></div>
                        <div class="adm-card"><div class="card-head"><h2>Booking pipeline</h2><p>Requests by status</p></div><div data-chart="pipeline"></div></div>
                        <div class="adm-card adm-span-2"><div class="card-head"><h2>Recent activity</h2><a class="arrow-link" href="#activity">See all</a></div>${feed(d.recent)}</div>
                    </div>`;
                lineChart($("[data-chart=weekly]"), d.weekly.map(w => fmtDate(w.week).replace(/ \d{4}$/, "")), [
                    { name: "Applications", color: C.s1, values: d.weekly.map(w => w.applications) },
                    { name: "Bookings", color: C.s2, values: d.weekly.map(w => w.bookings) },
                ]);
                segBar($("[data-chart=status]"), ["Pending", "In review", "Needs info", "Approved", "Rejected"].map(s => ({ label: STATUS_LABEL[s] || s, value: d.byStatus[s] || 0, color: STATUS_COLOR[s] })));
                hBars($("[data-chart=type]"), toItems(d.byType));
                hBars($("[data-chart=province]"), toItems(d.byProvince));
                hBars($("[data-chart=tour]"), toItems(d.valueByTour).slice(0, 6), { format: R });
                hBars($("[data-chart=pipeline]"), BOOKING_STATUSES.map(s => ({ label: s, value: d.bookingsByStatus[s] || 0 })), { keepOrder: true });
            },

            async applications() {
                const list = await get("listApplications");
                const counts = list.reduce((a, x) => (a[x.status] = (a[x.status] || 0) + 1, a), {});
                const tabs = ["Pending", "In review", "Needs info", "Approved", "Rejected", "All"];
                let tab = sessionStorage.getItem("adm-app-tab") || "Pending";
                let q = "";
                body.innerHTML = `
                    <div class="adm-card">
                        <div class="toolbar">
                            <div class="chips" role="tablist">${tabs.map(t => `<button type="button" class="chip" data-tab="${t}">${STATUS_LABEL[t] || t}${t !== "All" ? ` <b>${counts[t] || 0}</b>` : ""}</button>`).join("")}</div>
                            <input class="search" type="search" placeholder="Search business, email, town…" aria-label="Search applications" data-q>
                        </div>
                        <div data-list></div>
                    </div>`;
                const draw = () => {
                    $$("[data-tab]", body).forEach(b => b.classList.toggle("is-active", b.dataset.tab === tab));
                    const rows = list.filter(a => (tab === "All" ? a.status !== "Uploading" : a.status === tab) && (!q || [a.businessName, a.email, a.city, a.province, a.contactName, a.id].join(" ").toLowerCase().includes(q)));
                    $("[data-list]", body).innerHTML = rows.length ? `<div class="table-wrap"><table class="table">
                        <thead><tr><th>Business</th><th>Type</th><th>Location</th><th>Submitted</th><th>Photos</th><th>Status</th></tr></thead>
                        <tbody>${rows.map(a => `<tr data-open="${esc(a.id)}" tabindex="0"><td><strong>${esc(a.businessName)}</strong><span>${esc(a.contactName)} · ${esc(a.email)}</span></td>
                        <td>${esc(a.partnerTypeLabel)}<span>${esc(a.summary)}</span></td><td>${esc(a.city)}<span>${esc(a.province)}</span></td>
                        <td>${fmtDate(a.created)}</td><td>${a.photoCount}</td><td>${badge(a.status)}</td></tr>`).join("")}</tbody></table></div>`
                        : empty("Nothing here", tab === "Pending" ? "No new applications. Nice work." : "No applications match.");
                };
                body.addEventListener("click", e => { const t = e.target.closest("[data-tab]"); if (t) { tab = t.dataset.tab; sessionStorage.setItem("adm-app-tab", tab); draw(); } });
                $("[data-q]", body).addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); draw(); });
                draw();
            },

            async partners() {
                const list = (await get("listApplications")).filter(a => a.status === "Approved");
                const types = [...new Set(list.map(a => a.partnerTypeLabel))];
                body.innerHTML = `<div class="adm-card">
                    <div class="toolbar"><div class="chips">${["All", ...types].map((t, i) => `<button type="button" class="chip ${i ? "" : "is-active"}" data-ptype="${esc(t)}">${esc(t)}</button>`).join("")}</div><p class="muted">${list.length} approved partner${list.length === 1 ? "" : "s"}</p></div>
                    ${list.length ? `<div class="partner-grid">${list.map(a => `<button type="button" class="partner-card" data-open="${esc(a.id)}" data-ptype-of="${esc(a.partnerTypeLabel)}">
                        <span class="partner-type">${esc(a.partnerTypeLabel)}${a.tier ? ` · <span class="tier">${esc(a.tier)}</span>` : ""}</span><strong>${esc(a.businessName)}</strong><span>${esc(a.summary || a.services)}</span>
                        <span class="muted">${esc(a.city)}, ${esc(a.province)} · approved ${fmtDate(a.reviewedAt)}</span></button>`).join("")}</div>`
                        : empty("No approved partners yet", "Approve applications to build your partner network.")}</div>`;
                body.addEventListener("click", e => {
                    const b = e.target.closest("[data-ptype]"); if (!b) return;
                    $$("[data-ptype]", body).forEach(x => x.classList.toggle("is-active", x === b));
                    $$("[data-ptype-of]", body).forEach(c => { c.hidden = b.dataset.ptype !== "All" && c.dataset.ptypeOf !== b.dataset.ptype; });
                });
            },

            async bookings() {
                const list = await get("listBookings");
                let status = "All", q = "";
                body.innerHTML = `<div class="adm-card">
                    <div class="toolbar"><div class="chips">${["All", ...BOOKING_STATUSES].map(s => `<button type="button" class="chip" data-bstatus="${s}">${s}</button>`).join("")}</div>
                    <div class="toolbar-right"><input class="search" type="search" placeholder="Search name, trip, reference…" aria-label="Search bookings" data-q><button class="btn btn--ghost btn--sm" type="button" data-csv>Download CSV</button></div></div>
                    <div data-list></div></div>`;
                const draw = () => {
                    $$("[data-bstatus]", body).forEach(b => b.classList.toggle("is-active", b.dataset.bstatus === status));
                    const rows = list.filter(b => (status === "All" || b.status === status) && (!q || [b.reference, b.name, b.tour, b.email, b.phone].join(" ").toLowerCase().includes(q)));
                    const total = rows.filter(b => b.status !== "Cancelled").reduce((s, b) => s + b.total, 0);
                    $("[data-list]", body).innerHTML = rows.length ? `<p class="muted">${rows.length} request${rows.length === 1 ? "" : "s"} · ${R(total)} estimated</p><div class="table-wrap"><table class="table">
                        <thead><tr><th>Reference</th><th>Guest</th><th>Trip</th><th>Travel date</th><th>Guests</th><th class="num">Estimate</th><th>Status</th></tr></thead>
                        <tbody>${rows.map(b => `<tr><td><strong>${esc(b.reference)}</strong><span>${fmtWhen(b.created)}</span></td>
                            <td>${esc(b.name)}<span><a href="tel:${esc(b.phone)}">${esc(b.phone)}</a> · <a href="mailto:${esc(b.email)}">${esc(b.email)}</a></span></td>
                            <td>${esc(b.tour)}<span>${b.nights ? b.nights + " nights · " : ""}${esc(b.room || "")}${b.extras ? " · " + esc(b.extras) : ""}</span></td>
                            <td>${fmtDate(b.startDate)}</td><td>${b.travellers}</td><td class="num">${R(b.total)}</td>
                            <td>${can("bookings.update") ? `<select class="status-select" data-booking="${esc(b.reference)}" aria-label="Status for ${esc(b.reference)}">${BOOKING_STATUSES.map(s => `<option ${s === b.status ? "selected" : ""}>${s}</option>`).join("")}</select>` : esc(b.status)}</td></tr>`).join("")}</tbody></table></div>`
                        : empty("No booking requests", "Bookings made on the website appear here.");
                };
                body.addEventListener("click", e => {
                    const b = e.target.closest("[data-bstatus]"); if (b) { status = b.dataset.bstatus; draw(); }
                    if (e.target.closest("[data-csv]")) downloadCsv("kcm-bookings.csv", list, ["reference", "created", "status", "name", "email", "phone", "tour", "startDate", "nights", "travellers", "room", "extras", "payment", "total", "notes"]);
                });
                body.addEventListener("change", async e => {
                    const sel = e.target.closest("[data-booking]"); if (!sel) return;
                    sel.disabled = true;
                    try { await get("updateBooking", { reference: sel.dataset.booking, status: sel.value }); const row = list.find(x => x.reference === sel.dataset.booking); if (row) row.status = sel.value; toast("Booking updated"); }
                    catch (err) { toast(err.message, true); }
                    sel.disabled = false;
                });
                $("[data-q]", body).addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); draw(); });
                draw();
            },

            async payouts() {
                const [jobs, apps] = await Promise.all([get("listJobs"), get("listApplications")]);
                const approved = apps.filter(a => a.status === "Approved");
                let filter = "All";
                const totals = (list, k) => list.reduce((s, j) => s + j[k], 0);
                const byPartner = {};
                jobs.forEach(j => { const p = byPartner[j.partnerId] ||= { name: j.business, trips: 0, gross: 0, payout: 0, pending: 0 }; p.trips++; p.gross += j.gross; p.payout += j.payout; if (j.payoutStatus !== "Paid") p.pending += j.payout; });
                body.innerHTML = `
                    <div class="kpis kpis--4">
                        ${kpi("Trips logged", jobs.length, `${totals(jobs, "guests")} guests`, "#payouts")}
                        ${kpi("Trip value", R(totals(jobs, "gross")), "all partners", "#payouts")}
                        ${kpi("KCM commission", R(totals(jobs, "gross") - totals(jobs, "payout")), "earned on trips", "#payouts")}
                        ${kpi("Owed to partners", R(totals(jobs.filter(j => j.payoutStatus !== "Paid"), "payout")), "not yet paid", "#payouts")}
                    </div>
                    <div class="adm-grid">
                        <div class="adm-card adm-span-2">
                            <div class="toolbar"><div class="chips">${["All", ...PAYOUT_STATUSES].map((s, i) => `<button type="button" class="chip ${i ? "" : "is-active"}" data-pstatus="${s}">${s}</button>`).join("")}</div>
                                <button class="btn btn--ghost btn--sm" type="button" data-csv>Download CSV</button></div>
                            <div data-list></div>
                        </div>
                        <div class="adm-card">
                            <div class="card-head"><h2>Log a trip</h2><p>Payout = trip value − commission</p></div>
                            ${can("payouts.manage") ? (approved.length ? `<form class="invite" data-job novalidate>
                                <div class="field"><label for="jb-p">Partner *</label><select id="jb-p" name="partnerId" required>${approved.map(a => `<option value="${esc(a.id)}">${esc(a.businessName)}</option>`).join("")}</select></div>
                                <div class="field"><label for="jb-s">Service *</label><input id="jb-s" name="service" required placeholder="e.g. KMIA airport transfer"></div>
                                <div class="field-row"><div class="field"><label for="jb-d">Date *</label><input id="jb-d" name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}"></div>
                                <div class="field"><label for="jb-b">Booking ref</label><input id="jb-b" name="bookingRef" placeholder="KCM-…"></div></div>
                                <div class="field-row"><div class="field"><label for="jb-g">Guests</label><input id="jb-g" name="guests" type="number" min="0" value="2"></div>
                                <div class="field"><label for="jb-v">Trip value (R) *</label><input id="jb-v" name="gross" type="number" min="1" required></div></div>
                                <div class="field"><label for="jb-c">KCM commission (%)</label><input id="jb-c" name="commissionPct" type="number" min="0" max="100" value="15"></div>
                                <p class="muted" data-payout-preview></p>
                                <button class="btn btn--primary btn--block" type="submit">Save trip</button>
                            </form>` : `<p class="muted">Approve a partner first.</p>`) : `<p class="muted">Viewers can't log trips.</p>`}
                        </div>
                        <div class="adm-card adm-span-3">
                            <div class="card-head"><h2>By partner</h2><p>What each partner has earned</p></div>
                            ${Object.keys(byPartner).length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Partner</th><th class="num">Trips</th><th class="num">Trip value</th><th class="num">Payout</th><th class="num">Owed</th></tr></thead><tbody>
                                ${Object.values(byPartner).sort((a, b) => b.gross - a.gross).map(p => `<tr><td><strong>${esc(p.name)}</strong></td><td class="num">${p.trips}</td><td class="num">${R(p.gross)}</td><td class="num">${R(p.payout)}</td><td class="num">${R(p.pending)}</td></tr>`).join("")}</tbody></table></div>` : empty("No trips yet", "Log trips as partners complete them.")}
                        </div>
                    </div>`;
                const draw = () => {
                    $$("[data-pstatus]", body).forEach(b => b.classList.toggle("is-active", b.dataset.pstatus === filter));
                    const rows = jobs.filter(j => filter === "All" || j.payoutStatus === filter);
                    $("[data-list]", body).innerHTML = rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Trip</th><th>Partner</th><th class="num">Value</th><th class="num">Payout</th><th>Status</th><th></th></tr></thead><tbody>
                        ${rows.map(j => `<tr><td><strong>${esc(j.service)}</strong><span>${fmtDate(j.date)} · ${esc(j.id)}${j.bookingRef ? " · " + esc(j.bookingRef) : ""} · ${j.guests} guests</span></td><td>${esc(j.business)}</td>
                        <td class="num">${R(j.gross)}<span>${j.commissionPct}%</span></td><td class="num"><strong>${R(j.payout)}</strong></td>
                        <td>${can("payouts.manage") ? `<select class="status-select" data-payout="${esc(j.id)}" aria-label="Payout status">${PAYOUT_STATUSES.map(s => `<option ${s === j.payoutStatus ? "selected" : ""}>${s}</option>`).join("")}</select>` : esc(j.payoutStatus)}${j.paidOn ? `<span>paid ${fmtDate(j.paidOn)}</span>` : ""}</td>
                        <td>${j.bookingRef ? `<button type="button" class="btn btn--ghost btn--sm" data-ratelink="${esc(j.partnerId)}|${esc(j.bookingRef)}">Rating link</button>` : ""}</td></tr>`).join("")}</tbody></table></div>`
                        : empty("No trips", filter === "All" ? "Log the first trip on the right." : "Nothing with this status.");
                };
                const f = $("[data-job]", body);
                const prev = () => { if (!f) return; const g = +f.gross.value || 0, c = +f.commissionPct.value || 0; $("[data-payout-preview]", body).textContent = g ? `Partner receives ${R(Math.round(g * (1 - c / 100)))} · KCM keeps ${R(Math.round(g * c / 100))}` : ""; };
                f?.addEventListener("input", prev);
                f?.addEventListener("submit", async e => {
                    e.preventDefault();
                    if (!f.service.value.trim() || !(+f.gross.value > 0)) { toast("Please add the service and trip value.", true); return; }
                    const btn = f.querySelector("button"); btn.disabled = true;
                    try { const r = await get("saveJob", { job: { partnerId: f.partnerId.value, service: f.service.value.trim(), date: f.date.value, bookingRef: f.bookingRef.value.trim(), guests: +f.guests.value || 0, gross: +f.gross.value, commissionPct: +f.commissionPct.value } }); toast(`Trip saved · partner payout ${R(r.payout)}`); route(); }
                    catch (err) { toast(err.message, true); btn.disabled = false; }
                });
                body.addEventListener("click", async e => {
                    const c = e.target.closest("[data-pstatus]"); if (c) { filter = c.dataset.pstatus; draw(); }
                    if (e.target.closest("[data-csv]")) downloadCsv("kcm-trips-payouts.csv", jobs, ["date", "id", "business", "partnerId", "bookingRef", "service", "guests", "gross", "commissionPct", "payout", "payoutStatus", "paidOn"]);
                    const rl = e.target.closest("[data-ratelink]");
                    if (rl) {
                        const [p, ref] = rl.dataset.ratelink.split("|");
                        const link = `${location.origin}${K.base}/rate?ref=${encodeURIComponent(ref)}&p=${encodeURIComponent(p)}`;
                        try { await navigator.clipboard.writeText(link); toast("Rating link copied. Send it to the guest on WhatsApp."); } catch { prompt("Copy this rating link for the guest:", link); }
                    }
                });
                body.addEventListener("change", async e => {
                    const sel = e.target.closest("[data-payout]"); if (!sel) return;
                    sel.disabled = true;
                    try { await get("setPayoutStatus", { id: sel.dataset.payout, status: sel.value }); const j = jobs.find(x => x.id === sel.dataset.payout); if (j) j.payoutStatus = sel.value; toast(sel.value === "Paid" ? "Marked paid. Partner emailed." : "Payout updated"); }
                    catch (err) { toast(err.message, true); }
                    sel.disabled = false;
                });
                prev(); draw();
            },

            async ratings() {
                const list = await get("listRatings");
                const pub = list.filter(r => r.status !== "Hidden");
                const avg = pub.length ? pub.reduce((s, r) => s + r.stars, 0) / pub.length : 0;
                const per = {};
                pub.forEach(r => { const p = per[r.partnerId] ||= { name: r.business, n: 0, sum: 0 }; p.n++; p.sum += r.stars; });
                const starRow = n => `<span class="stars-row">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.round(n) ? "on" : ""}">★</i>`).join("")}</span>`;
                body.innerHTML = `
                    <div class="adm-grid">
                        <div class="adm-card"><div class="card-head"><h2>Average guest rating</h2><p>${pub.length} published</p></div><p class="rating-big">${pub.length ? avg.toFixed(1) : "—"}</p>${starRow(avg)}
                            <p class="muted" style="margin-top:14px">Guests rate partners through a link you send after each trip (Trips &amp; payouts → Rating link).</p></div>
                        <div class="adm-card adm-span-2"><div class="card-head"><h2>By partner</h2></div>
                            ${Object.keys(per).length ? `<ul class="hbars is-in">${Object.values(per).sort((a, b) => b.sum / b.n - a.sum / a.n).map(p => `<li data-tipv="${esc(p.name)}: ${(p.sum / p.n).toFixed(1)} from ${p.n}"><span class="hbar-label">${esc(p.name)}</span><span class="hbar-track"><span class="hbar-fill" style="width:${p.sum / p.n / 5 * 100}%;background:#c98a1b"></span></span><span class="hbar-val">${(p.sum / p.n).toFixed(1)} ★</span></li>`).join("")}</ul>` : `<p class="chart-empty">No ratings yet</p>`}</div>
                        <div class="adm-card adm-span-3"><div class="card-head"><h2>All ratings</h2><p>Hide anything abusive or unfair: hidden ratings aren't shown to partners or counted.</p></div>
                            ${list.length ? `<ul class="msg-list">${list.map(r => `<li class="${r.status === "Hidden" ? "is-hidden-rating" : ""}"><div>${starRow(r.stars)} <strong>${esc(r.business)}</strong> <span class="muted">· ${esc(r.guest)} · ${fmtDate(r.created)}${r.bookingRef ? " · " + esc(r.bookingRef) : ""}</span></div>
                                <p>${r.comment ? esc(r.comment) : "<span class='muted'>No comment</span>"}</p>
                                ${can("ratings.moderate") ? `<button type="button" class="btn btn--ghost btn--sm" data-rating="${esc(r.id)}" data-to="${r.status === "Hidden" ? "Published" : "Hidden"}">${r.status === "Hidden" ? "Show again" : "Hide"}</button>` : ""}</li>`).join("")}</ul>` : empty("No ratings yet", "Send guests a rating link after their trip.")}</div>
                    </div>`;
                body.addEventListener("click", async e => {
                    const b = e.target.closest("[data-rating]"); if (!b) return;
                    b.disabled = true;
                    try { await get("setRatingStatus", { id: b.dataset.rating, status: b.dataset.to }); toast("Rating updated"); route(); }
                    catch (err) { toast(err.message, true); b.disabled = false; }
                });
            },

            async messages() {
                const list = await get("listMessages");
                body.innerHTML = `<div class="adm-card">${list.length ? `<ul class="msg-list">${list.map(m => `<li><div><strong>${esc(m.name)}</strong> <span class="muted">${fmtWhen(m.created)}</span></div>
                    <p>${esc(m.message)}</p><p class="muted">${m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ""} ${m.phone ? ` · <a href="tel:${esc(m.phone)}">${esc(m.phone)}</a>` : ""}</p></li>`).join("")}</ul>`
                    : empty("No messages yet", "Messages sent from the contact page appear here.")}</div>`;
            },

            async users() {
                const list = await get("listUsers");
                const isStaffRole = r => ["SUPER_ADMIN", "ADMIN", "MANAGEMENT", "FINANCE", "OPERATIONS"].includes(r);
                const staff = list.filter(u => isStaffRole(u.role)), partners = list.filter(u => !isStaffRole(u.role));
                const assignable = me.role === "SUPER_ADMIN" ? ["ADMIN", "MANAGEMENT", "FINANCE", "OPERATIONS", "PARTNER"] : ["MANAGEMENT", "FINANCE", "OPERATIONS", "PARTNER"];
                const roleOpts = r => assignable.map(x => `<option value="${x}" ${x === r ? "selected" : ""}>${ROLE_LABEL[x]}</option>`).join("");
                const mfaRoles = ["SUPER_ADMIN", "ADMIN", "MANAGEMENT", "FINANCE"];
                const row = u => {
                    const locked = u.role === "SUPER_ADMIN" || u.email === me.email || (u.role === "ADMIN" && me.role !== "SUPER_ADMIN") || !can("users.manage");
                    return `<tr><td><strong>${esc(u.name || "—")}</strong><span>${esc(u.email)}</span></td>
                        <td>${locked ? `<span class="role-chip">${esc(ROLE_LABEL[u.role] || u.role)}</span>` : `<select class="status-select" data-role="${esc(u.email)}" aria-label="Role for ${esc(u.email)}">${roleOpts(u.role)}</select>`}</td>
                        <td>${locked ? esc(u.status) : `<select class="status-select" data-ustatus="${esc(u.email)}" aria-label="Status for ${esc(u.email)}"><option ${u.status === "active" ? "selected" : ""}>active</option><option ${u.status === "disabled" ? "selected" : ""}>disabled</option></select>`}</td>
                        <td>${u.mfa ? `<span class="status status--good">On</span>${!locked ? ` <button type="button" class="link-btn" data-mfa-reset="${esc(u.email)}">Reset</button>` : ""}` : mfaRoles.includes(u.role) ? `<span class="status status--warn">Set up at next sign-in</span>` : `<span class="muted">Optional</span>`}</td>
                        <td>${u.lastLogin ? fmtWhen(u.lastLogin) : `<span class="muted">${u.provider === "invited" ? "Invited, not signed in yet" : "—"}</span>`}</td></tr>`;
                };
                body.innerHTML = `
                    <div class="adm-grid">
                        <div class="adm-card adm-span-2">
                            <div class="card-head"><h2>KCM team</h2><p>People who can open this dashboard</p></div>
                            <div class="table-wrap"><table class="table"><thead><tr><th>Person</th><th>Role</th><th>Status</th><th>Two-step</th><th>Last sign-in</th></tr></thead><tbody>${staff.map(row).join("")}</tbody></table></div>
                        </div>
                        <div class="adm-card">
                            <div class="card-head"><h2>Give someone access</h2><p>They'll get an email to set their password.</p></div>
                            ${can("users.manage") ? `<form class="invite" data-invite novalidate>
                                <div class="field"><label for="inv-email">Email *</label><input id="inv-email" name="email" type="email" required placeholder="name@example.com"></div>
                                <div class="field"><label for="inv-name">Name</label><input id="inv-name" name="name"></div>
                                <div class="field"><label for="inv-role">Role</label><select id="inv-role" name="role">${assignable.filter(r => r !== "PARTNER").map(r => `<option value="${r}" ${r === "OPERATIONS" ? "selected" : ""}>${ROLE_LABEL[r]}</option>`).join("")}</select></div>
                                <button class="btn btn--primary btn--block" type="submit">Give access</button>
                            </form>` : `<p class="muted">Only admins can give access.</p>`}
                            <dl class="roles">
                                <div><dt>Super admin</dt><dd>Everything, including adding admins. Two-step sign-in required.</dd></div>
                                <div><dt>Admin</dt><dd>Users, partners, operations and finance approvals. Two-step required.</dd></div>
                                <div><dt>Management</dt><dd>All tickets, assigning work, approving quotations, confirming bookings. Two-step required.</dd></div>
                                <div><dt>Finance</dt><dd>Verifies payments and approves refunds; reads tickets. Two-step required.</dd></div>
                                <div><dt>Operations</dt><dd>Registers enquiries and works on tickets assigned to them. Records payments as unverified.</dd></div>
                                <div><dt>Partner</dt><dd>Only their own listings in the partner portal.</dd></div>
                            </dl>
                        </div>
                        <div class="adm-card adm-span-3">
                            <div class="card-head"><h2>Partner & customer accounts</h2><p>${partners.length} account${partners.length === 1 ? "" : "s"}</p></div>
                            ${partners.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Person</th><th>Role</th><th>Status</th><th>Two-step</th><th>Last sign-in</th></tr></thead><tbody>${partners.map(row).join("")}</tbody></table></div>` : empty("No partner accounts yet", "Partners appear here after they register.")}
                        </div>
                    </div>`;
                const save = async (email, patch) => {
                    const u = list.find(x => x.email === email) || {};
                    try { await get("saveUser", { email, name: u.name, role: patch.role || u.role, status: patch.status || u.status }); Object.assign(u, patch); toast("Access updated. They'll need to sign in again."); }
                    catch (err) { toast(err.message, true); route(); }
                };
                body.addEventListener("change", e => {
                    const r = e.target.closest("[data-role]"); if (r) save(r.dataset.role, { role: r.value });
                    const s = e.target.closest("[data-ustatus]"); if (s) save(s.dataset.ustatus, { status: s.value });
                });
                body.addEventListener("click", async e => {
                    const b = e.target.closest("[data-mfa-reset]"); if (!b) return;
                    if (!confirm(`Reset two-step verification for ${b.dataset.mfaReset}? They'll set it up again at their next sign-in, and are signed out everywhere.`)) return;
                    try { await get("resetUserMfa", { email: b.dataset.mfaReset }); toast("Two-step verification reset"); route(); } catch (err) { toast(err.message, true); }
                });
                $("[data-invite]", body)?.addEventListener("submit", async e => {
                    e.preventDefault();
                    const f = e.target, email = f.email.value.trim().toLowerCase();
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast("Please enter a valid email.", true); return; }
                    const btn = f.querySelector("button"); btn.disabled = true;
                    try { await get("saveUser", { email, name: f.name.value.trim(), role: f.role.value, status: "active" }); toast(`Access given to ${email}`); route(); }
                    catch (err) { toast(err.message, true); btn.disabled = false; }
                });
            },

            async activity() {
                const list = await get("activity");
                body.innerHTML = `<div class="adm-card"><div class="toolbar"><input class="search" type="search" placeholder="Filter by person, action or reference (e.g. KCM-2026-000001)" data-afilter aria-label="Filter activity"><span class="muted">Append-only record. Entries cannot be edited or deleted from the dashboard.</span></div><div data-alist>${list.length ? feed(list) : empty("No activity yet", "Sign-ins, applications and reviews are logged here.")}</div></div>`;
                $("[data-afilter]", body).addEventListener("input", e => { const q = e.target.value.toLowerCase(); const f = list.filter(a => (a.actor + " " + a.action + " " + a.target + " " + a.details).toLowerCase().includes(q)); $("[data-alist]", body).innerHTML = f.length ? feed(f) : empty("Nothing matches", "Try another search."); });
            },
        };

        /* ---------- application drawer ---------- */
        const drawer = $("[data-drawer]"), dbody = $("[data-drawer-body]");
        document.addEventListener("click", e => {
            const open = e.target.closest("[data-open]");
            if (open && root.contains(open)) openApp(open.dataset.open);
            if (e.target.closest("[data-drawer-close]")) closeDrawer();
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Enter" && e.target.matches("tr[data-open]")) openApp(e.target.dataset.open);
            if (e.key === "Escape") { closeDrawer(); closeLightbox(); }
        });
        function closeDrawer() { drawer.hidden = true; document.body.classList.remove("adm-locked"); }

        async function openApp(id) {
            drawer.hidden = false; document.body.classList.add("adm-locked");
            dbody.innerHTML = "<p>Loading…</p>";
            try {
                const a = await get("getApplication", { id });
                const t = K.TYPES[a.partnerType] || { fields: [] };
                const have = new Set(a.photos.map(p => p.label));
                const missing = (a.required || []).filter(l => !have.has(l));
                const detailRows = t.fields.map(f => [f.label, [].concat(a.details?.[f.key] ?? "").join(", ")]).filter(r => r[1]);
                dbody.innerHTML = `
                    <p class="eyebrow">${esc(a.partnerTypeLabel)} · ${esc(a.id)}</p>
                    <h2 id="drawer-title">${esc(a.businessName)}</h2>
                    <p>${badge(a.status)}${a.tier ? ` <span class="tier">${esc(a.tier)}</span>` : ""} <span class="muted">Submitted ${fmtDate(a.created)}${a.reviewedBy ? ` · reviewed by ${esc(a.reviewedBy)} on ${fmtDate(a.reviewedAt)}` : ""}</span></p>
                    ${a.reviewNote ? `<blockquote class="review-note">${esc(a.reviewNote)}</blockquote>` : ""}
                    <h3>Photos ${missing.length ? `<span class="status status--warn">Missing: ${missing.map(esc).join(", ")}</span>` : ""}</h3>
                    <div class="thumb-grid">${a.photos.map(p => `<figure class="thumb" data-file="${esc(p.fileId)}" data-label="${esc(p.label)}"><button type="button" class="thumb-img" aria-label="Enlarge ${esc(p.label)} photo"></button><figcaption>${esc(p.label)}</figcaption></figure>`).join("") || "<p class='muted'>No photos uploaded.</p>"}</div>
                    <h3>Ownership documents ${(a.requiredDocuments || []).filter(l => !(a.documents || []).some(x => x.label === l)).length ? `<span class="status status--warn">Missing: ${(a.requiredDocuments || []).filter(l => !(a.documents || []).some(x => x.label === l)).map(esc).join(", ")}</span>` : ""}</h3>
                    ${(a.documents || []).length ? `<ul class="doc-admin">${a.documents.map(x => `<li><span>📄 ${esc(x.label)}</span><button type="button" class="btn btn--ghost btn--sm" data-open-doc="${esc(x.fileId)}">Open</button></li>`).join("")}</ul>` : "<p class='muted'>No documents uploaded.</p>"}
                    <p class="muted">Check that the name on the documents matches ${esc(a.contactName)}${a.regNumber ? " or the company" : ""}.</p>
                    <h3>Contact</h3>
                    <dl class="kv"><div><dt>Name</dt><dd>${esc(a.contactName)}</dd></div><div><dt>Email</dt><dd><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></dd></div>
                    <div><dt>Phone</dt><dd><a href="tel:${esc(a.phone)}">${esc(a.phone)}</a> · <a href="https://wa.me/${esc(String(a.phone).replace(/\D/g, "").replace(/^0/, "27"))}" target="_blank" rel="noopener">WhatsApp</a></dd></div>
                    <div><dt>Location</dt><dd>${esc(a.city)}, ${esc(a.province)}</dd></div></dl>
                    <h3>Business</h3>
                    <dl class="kv"><div><dt>Services</dt><dd>${esc(a.services)}</dd></div><div><dt>Reg. number</dt><dd>${esc(a.regNumber || "—")}</dd></div>
                    <div><dt>Years</dt><dd>${esc(a.years || "—")}</dd></div><div><dt>Website</dt><dd>${esc(a.website || "—")}</dd></div></dl>
                    <p class="desc">${esc(a.description)}</p>
                    ${detailRows.length ? `<h3>${esc(t.detailsTitle || "Details")}</h3><dl class="kv">${detailRows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
                    ${can("partners.review") && a.status !== "Uploading" ? `<div class="review-box">
                        <h3>Decision</h3>
                        <label class="field"><span class="field-legend">Note to the partner (required for "needs info" and "reject")</span><textarea data-note maxlength="1000" placeholder="e.g. Please add a clearer photo of the rear seats.">${a.status === "Approved" ? "" : ""}</textarea></label>
                        <label class="field"><span class="field-legend">Standard if approved</span><select data-tier class="status-select">${TIERS.map(t => `<option ${t === (a.tier || "Premium") ? "selected" : ""}>${t}</option>`).join("")}</select></label>
                        <div class="btn-row">
                            <button class="btn btn--approve" type="button" data-decide="approve">Approve</button>
                            <button class="btn btn--ghost" type="button" data-decide="needs_info">Ask for more info</button>
                            <button class="btn btn--reject" type="button" data-decide="reject">Reject</button>
                        </div>
                        <p class="muted">The partner gets an email with your decision.</p>
                    </div>` : ""}`;
                $$(".thumb[data-file]", dbody).forEach(loadThumb);
                $$("[data-open-doc]", dbody).forEach(btn => btn.addEventListener("click", async () => {
                    const w = window.open("", "_blank"); btn.disabled = true;
                    try {
                        const r = photoCache[btn.dataset.openDoc] ||= await get("getPhoto", { fileId: btn.dataset.openDoc });
                        const [head, b64] = r.dataUrl.split(","), bin = atob(b64), arr = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
                        const blob = new Blob([arr], { type: head.slice(5).split(";")[0] });
                        const u = URL.createObjectURL(blob);
                        if (w) w.location = u; else location.href = u;
                    } catch (err) { if (w) w.close(); toast(err.message, true); }
                    btn.disabled = false;
                }));
                $$("[data-decide]", dbody).forEach(b => b.addEventListener("click", async () => {
                    const note = $("[data-note]", dbody).value.trim();
                    if (b.dataset.decide !== "approve" && !note) { toast("Please add a note for the partner.", true); $("[data-note]", dbody).focus(); return; }
                    const labels = { approve: "Approve this partner and email them?", needs_info: "Ask the partner for more information?", reject: "Reject this application and email the partner?" };
                    if (!confirm(labels[b.dataset.decide])) return;
                    $$("[data-decide]", dbody).forEach(x => x.disabled = true);
                    try { await get("reviewApplication", { id, decision: b.dataset.decide, note, tier: $("[data-tier]", dbody)?.value }); toast("Decision saved and partner emailed"); delete cache.dashboard; closeDrawer(); route(); }
                    catch (err) { toast(err.message, true); $$("[data-decide]", dbody).forEach(x => x.disabled = false); }
                }));
            } catch (err) { dbody.innerHTML = `<p class="form-error">${esc(err.message)}</p>`; }
        }

        const photoCache = {};
        async function loadThumb(fig) {
            const holder = $(".thumb-img", fig);
            try {
                const r = photoCache[fig.dataset.file] ||= await get("getPhoto", { fileId: fig.dataset.file });
                holder.innerHTML = `<img src="${r.dataUrl}" alt="${esc(fig.dataset.label || "")} photo">`;
                holder.addEventListener("click", () => openLightbox(r.dataUrl, fig.dataset.label));
            } catch { holder.textContent = "Couldn't load"; }
        }
        const lb = $("[data-lightbox]");
        function openLightbox(src, cap) { $("[data-lightbox-img]").src = src; $("[data-lightbox-cap]").textContent = cap || ""; lb.hidden = false; }
        function closeLightbox() { lb.hidden = true; }
        lb.addEventListener("click", e => { if (e.target === lb || e.target.closest("[data-lightbox-close]")) closeLightbox(); });

        /* ---------- small UI helpers ---------- */
        /** Helpers shared with the Operations Centre module (ops.js). */
        function opsCtx() {
            return { get, esc, R, fmtDate, fmtWhen, toast, kpi, empty, hBars, segBar, lineChart, downloadCsv, $, $$, can, ROLE_LABEL, route,
                body: () => body, me: () => me, sample: () => sample, setTitle: t => { $("[data-adm-title]").textContent = t; } };
        }
        function kpi(label, value, sub, href) { return `<a class="kpi" href="${href}"><span class="kpi-label">${label}</span><strong class="kpi-value">${value}</strong><span class="kpi-sub">${sub}</span></a>`; }
        function setBadges(k) { $$("[data-badge]").forEach(b => { const v = k[b.dataset.badge] || 0; b.textContent = v; b.hidden = !v; }); }
        const ACTION_TEXT = {
            sign_in: "signed in", application_started: "started an application", application_submitted: "submitted an application", application_resubmitted: "resubmitted an application",
            application_approve: "approved", application_reject: "rejected", application_needs_info: "asked for more info on", booking_request: "requested a booking", booking_status: "updated booking",
            user_invited: "gave access to", user_updated: "changed access for", setup: "set up the database",
        };
        function feed(items) {
            if (!items?.length) return empty("No activity yet", "Things will show up here as people use the site.");
            return `<ul class="feed">${items.map(a => `<li><span class="feed-dot feed-dot--${(a.action || "").split("_")[0]}"></span><div><p><strong>${esc(a.actor)}</strong> ${esc(ACTION_TEXT[a.action] || a.action)} <strong>${esc(a.action === "sign_in" ? "" : a.target)}</strong>${a.details && !["sign_in"].includes(a.action) ? ` <span class="muted">${esc(a.details)}</span>` : ""}</p><time>${fmtWhen(a.time)}</time></div></li>`).join("")}</ul>`;
        }
        function toItems(obj) { return Object.entries(obj || {}).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value); }
        function toast(msg, bad) {
            const t = document.createElement("div"); t.className = "toast" + (bad ? " toast--bad" : ""); t.setAttribute("role", "status"); t.textContent = msg;
            document.body.appendChild(t); setTimeout(() => t.classList.add("is-in"), 10); setTimeout(() => { t.classList.remove("is-in"); setTimeout(() => t.remove(), 300); }, 3200);
        }
        function downloadCsv(name, rows, cols) {
            const q = v => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
            const csv = [cols.join(","), ...rows.map(r => cols.map(c => q(r[c])).join(","))].join("\n");
            const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }

        /* =================== CHARTS (SVG) =================== */
        function showTip(html, x, y) { tip.innerHTML = html; tip.hidden = false; const w = tip.offsetWidth; tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2)) + "px"; tip.style.top = (y - tip.offsetHeight - 12) + "px"; }
        function hideTip() { tip.hidden = true; }

        function hBars(el, items, opt = {}) {
            if (!items.length || items.every(i => !i.value)) { el.innerHTML = `<p class="chart-empty">No data yet</p>`; return; }
            const max = Math.max(...items.map(i => i.value)) || 1, fmt = opt.format || (v => v);
            el.innerHTML = `<ul class="hbars">${items.map(i => `<li data-tipv="${esc(i.label)}: ${esc(fmt(i.value))}"><span class="hbar-label">${esc(i.label)}</span>
                <span class="hbar-track"><span class="hbar-fill" style="width:${Math.max(i.value ? 2 : 0, (i.value / max) * 100)}%"></span></span><span class="hbar-val">${esc(fmt(i.value))}</span></li>`).join("")}</ul>`;
            requestAnimationFrame(() => el.querySelector(".hbars")?.classList.add("is-in"));
        }

        function segBar(el, items) {
            const total = items.reduce((s, i) => s + i.value, 0);
            if (!total) { el.innerHTML = `<p class="chart-empty">No applications yet</p>`; return; }
            el.innerHTML = `<div class="segbar">${items.filter(i => i.value).map(i => `<span style="flex:${i.value};background:${i.color}" data-tipv="${esc(i.label)}: ${i.fmt ? i.fmt(i.value) : i.value} (${Math.round(i.value / total * 100)}%)"></span>`).join("")}</div>
                <ul class="seg-legend">${items.map(i => `<li><i style="background:${i.color}"></i>${esc(i.label)}<strong>${i.fmt ? i.fmt(i.value) : i.value}</strong></li>`).join("")}</ul>`;
        }

        function lineChart(el, labels, series) {
            const W = 720, H = 240, P = { l: 34, r: 92, t: 14, b: 28 };
            const max = Math.max(1, ...series.flatMap(s => s.values));
            const niceMax = Math.ceil(max / (max > 10 ? 5 : 1)) * (max > 10 ? 5 : 1);
            const x = i => P.l + (i * (W - P.l - P.r)) / Math.max(1, labels.length - 1);
            const y = v => P.t + (H - P.t - P.b) * (1 - v / niceMax);
            const ticks = [0, niceMax / 2, niceMax].map(v => Math.round(v));
            const grid = ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${P.l - 8}" y="${y(v) + 4}" class="axis" text-anchor="end">${v}</text>`).join("");
            const xl = labels.map((l, i) => (i % 2 === 0 || i === labels.length - 1) ? `<text x="${x(i)}" y="${H - 8}" class="axis" text-anchor="middle">${esc(l)}</text>` : "").join("");
            // end labels: keep at least 15px apart so equal values don't overlap
            const last = labels.length - 1;
            const ly = series.map((s, k) => ({ k, y: y(s.values[last]) })).sort((a, b) => a.y - b.y);
            for (let j = 1; j < ly.length; j++) if (ly[j].y - ly[j - 1].y < 15) ly[j].y = ly[j - 1].y + 15;
            const labelY = {}; ly.forEach(o => { labelY[o.k] = o.y; });
            const paths = series.map((s, k) => {
                const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
                return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="line-path"/>
                    <circle cx="${x(last)}" cy="${y(s.values[last])}" r="4" fill="${s.color}" stroke="#fff" stroke-width="2"/>
                    <text x="${x(last) + 10}" y="${labelY[k] + 4}" class="line-label">${esc(s.name)}</text>`;
            }).join("");
            el.innerHTML = `<div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div>
                <svg viewBox="0 0 ${W} ${H}" class="linechart" role="img" aria-label="${esc(series.map(s => s.name + " per week").join(" and "))}">${grid}${xl}${paths}
                <line class="crosshair" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" style="display:none"/><rect class="hit" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}" fill="transparent"/></svg>
                <details class="chart-table"><summary>View as table</summary><table class="table"><thead><tr><th>Week of</th>${series.map(s => `<th class="num">${esc(s.name)}</th>`).join("")}</tr></thead><tbody>${labels.map((l, i) => `<tr><td>${esc(l)}</td>${series.map(s => `<td class="num">${s.values[i]}</td>`).join("")}</tr>`).join("")}</tbody></table></details>`;
            const svg = el.querySelector("svg"), hit = svg.querySelector(".hit"), cross = svg.querySelector(".crosshair");
            hit.addEventListener("mousemove", e => {
                const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) * (W / r.width);
                const i = Math.max(0, Math.min(labels.length - 1, Math.round((sx - P.l) / ((W - P.l - P.r) / Math.max(1, labels.length - 1)))));
                cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.style.display = "";
                showTip(`<strong>Week of ${esc(labels[i])}</strong>${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)} <b>${s.values[i]}</b></span>`).join("")}`, r.left + x(i) * (r.width / W), r.top + window.scrollY - window.scrollY + P.t);
            });
            hit.addEventListener("mouseleave", () => { cross.style.display = "none"; hideTip(); });
        }
        root.addEventListener("mousemove", e => { const t = e.target.closest("[data-tipv]"); if (t) { const r = t.getBoundingClientRect(); showTip(esc(t.dataset.tipv), e.clientX, r.top); } });
        root.addEventListener("mouseout", e => { if (e.target.closest("[data-tipv]")) hideTip(); });

        /* =================== SAMPLE DATA (preview only) =================== */
        const SAMPLE = (() => {
            const now = Date.now(), day = 86400000;
            const ago = n => new Date(now - n * day).toISOString();
            const apps = [
                ["P-2611-7QKD", "Lowveld Executive Transfers", "vehicle", "Mbombela", "Mpumalanga", "Pending", "Toyota · Fortuner 2.8 GD-6 · 2022 · 7 seats · Automatic", 7, 1],
                ["P-2611-M3XA", "Blyde View Guesthouse", "accommodation", "Graskop", "Mpumalanga", "In review", "Guesthouse · 8 rooms · sleeps 18 · 4 stars · from R1450", 6, 2],
                ["P-2611-T8NB", "Sabie River Guides", "guide", "Hazyview", "Mpumalanga", "Approved", "FGASA Level 2 · English, siSwati · Kruger", 3, 6],
                ["P-2611-H2RC", "Venda Heritage Trails", "tour_operator", "Thohoyandou", "Limpopo", "Approved", "4 vehicles · Venda cultural tours", 4, 9],
                ["P-2610-K9PW", "Cape Coastal Shuttles", "vehicle", "Cape Town", "Western Cape", "Needs info", "Mercedes-Benz · V-Class · 2019 · 7 seats", 5, 14],
                ["P-2610-A4LZ", "Marula Lodge", "accommodation", "White River", "Mpumalanga", "Approved", "Lodge · 12 rooms · sleeps 30 · 4 stars", 7, 18],
                ["P-2610-J6YU", "Sky High Balloons", "activity", "Hazyview", "Mpumalanga", "In review", "Sunrise balloon flight · up to 16 people", 3, 3],
                ["P-2610-D7FS", "Quick Rides SA", "vehicle", "Johannesburg", "Gauteng", "Rejected", "Hyundai · i20 · 2011 · 4 seats", 7, 21],
                ["P-2610-E3WQ", "Umhlanga Beach Suites", "accommodation", "Umhlanga", "KwaZulu-Natal", "Approved", "Self-catering · 6 units · sleeps 20", 5, 27],
                ["P-2609-G5TT", "Panorama Photo Tours", "other", "Sabie", "Mpumalanga", "Pending", "Tour photography", 2, 4],
            ].map(([id, b, t, c, p, s, sum, ph, d]) => ({ id, businessName: b, partnerType: t, partnerTypeLabel: K.TYPES[t].label, city: c, province: p, status: s, summary: sum, photoCount: ph, created: ago(d), contactName: "Sample contact", email: "partner@example.com", phone: "082 000 0000", services: K.TYPES[t].services.slice(0, 2).join(", "), reviewedAt: s === "Approved" ? ago(d - 2) : "", reviewedBy: s === "Approved" ? "admin@example.com" : "", tier: s === "Approved" ? ["Premium", "Premium Plus", "Signature"][d % 3] : "", reviewNote: s === "Needs info" ? "Please add a clearer photo of the rear seats." : s === "Rejected" ? "The vehicle doesn't meet our premium standard yet." : "", required: K.TYPES[t].required }));
            const tours = ["Kruger & Panorama Route: 3-Day Classic", "Kruger Full-Day Open-Vehicle Safari", "Greater Kruger Private Lodge: 4-Day Luxury", "Cape Town Highlights: 4 Nights", "Panorama Route & God's Window Day Tour", "Venda Sacred Sites: 3-Day Heritage Route"];
            const bookings = Array.from({ length: 22 }, (_, i) => {
                const t = tours[i % tours.length], adults = 1 + (i % 4), total = [6950, 1650, 18900, 12400, 1250, 4650][i % 6] * adults;
                return { reference: `KCM-2611-${(1000 + i * 37).toString(36).toUpperCase()}`, created: ago(Math.floor(i * 3.7)), tour: t, startDate: ago(-10 - i * 2), nights: [2, 0, 3, 4, 0, 2][i % 6], travellers: adults + (i % 3 === 0 ? 2 : 0), room: "double", extras: i % 4 === 0 ? "Sunset or night game drive" : "", payment: "deposit", total, name: ["Thandi M.", "Sipho N.", "Megan R.", "Lerato K.", "Pieter V."][i % 5], email: "guest@example.com", phone: "082 000 0000", status: BOOKING_STATUSES[i % 6 === 5 ? 5 : i % 5], notes: "" };
            });
            const weekly = Array.from({ length: 12 }, (_, i) => ({ week: ago((11 - i) * 7), applications: [0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6][i], bookings: [1, 2, 2, 3, 2, 4, 5, 4, 6, 7, 6, 9][i] }));
            const count = (l, k) => l.reduce((a, x) => (a[x[k]] = (a[x[k]] || 0) + 1, a), {});
            const users = [
                { email: "owner@example.com", name: "KCM Owner", role: "SUPER_ADMIN", status: "active", lastLogin: ago(0), provider: "google", mfa: true },
                { email: "ops@example.com", name: "Operations", role: "OPERATIONS", status: "active", lastLogin: ago(1), provider: "email" },
                { email: "finance@example.com", name: "Finance", role: "FINANCE", status: "active", lastLogin: "", provider: "invited" },
                ...apps.slice(0, 6).map(a => ({ email: a.businessName.toLowerCase().replace(/\W+/g, ".") + "@example.com", name: a.businessName, role: "PARTNER", status: "active", lastLogin: a.created, provider: "email" })),
            ];
            const recent = [
                { time: ago(0.1), actor: "partner@example.com", action: "application_submitted", target: "P-2611-7QKD", details: "Lowveld Executive Transfers" },
                { time: ago(0.4), actor: "ops@example.com", action: "booking_status", target: "KCM-2611-RS", details: "Confirmed" },
                { time: ago(1), actor: "owner@example.com", action: "application_approve", target: "P-2611-T8NB", details: "" },
                { time: ago(2), actor: "guest@example.com", action: "booking_request", target: "KCM-2611-SJ", details: "Kruger Full-Day Open-Vehicle Safari" },
                { time: ago(3), actor: "owner@example.com", action: "user_invited", target: "finance@example.com", details: "viewer / active" },
            ];
            const jobs = apps.filter(a => a.status === "Approved").flatMap((a, k) => Array.from({ length: 4 + k * 2 }, (_, i) => { const gross = [1100, 3200, 2600, 4800][i % 4] * (k + 1); return { id: `J-2611-${(k * 50 + i).toString(36).toUpperCase().padStart(4, "Q")}`, date: ago(i * 6 + k), partnerId: a.id, business: a.businessName, bookingRef: bookings[(i + k) % bookings.length].reference, service: ["Airport transfer", "Kruger day trip", "Guest stay (2 nights)", "Panorama tour"][i % 4], guests: 2 + (i % 3), gross, commissionPct: 15, payout: Math.round(gross * .85), payoutStatus: PAYOUT_STATUSES[i % 4 === 3 ? 0 : i % 3 === 0 ? 2 : 1], paidOn: i % 3 === 0 ? ago(Math.max(0, i * 6 - 2)) : "" }; }));
            const ratingsS = jobs.slice(0, 12).map((j, i) => ({ id: "R-" + i, created: j.date, partnerId: j.partnerId, business: j.business, bookingRef: j.bookingRef, guest: ["Thandi M.", "Pieter V.", "Megan R.", "Lerato K."][i % 4], stars: [5, 5, 4, 5, 3, 5][i % 6], comment: ["Spotless and on time.", "Felt like VIPs the whole way.", "Comfortable, slightly late pickup.", "Would book again!", "", "Excellent host."][i % 6], status: i === 4 ? "Hidden" : "Published" }));
            const reject = () => Promise.reject(new K.ApiError("This is sample data, so changes aren't saved. Connect the Google Sheet to use the real dashboard."));
            return {
                me: () => ({ email: "owner@example.com", name: "Sample owner", role: "SUPER_ADMIN", isStaff: true, canEdit: true, permissions: ["dashboard.view", "users.view", "users.manage", "audit.view", "partners.view", "partners.review", "payouts.view", "payouts.manage", "ratings.moderate", "messages.view", "bookings.view", "bookings.update"] }),
                dashboard: async () => ({
                    kpis: { inReview: 2, trips: jobs.length, payoutsPending: jobs.filter(j => j.payoutStatus !== "Paid").reduce((s, j) => s + j.payout, 0), avgRating: 4.6, ratings: 11, pending: 4, needsInfo: 1, approved: 4, applications: apps.length, bookings: bookings.length, newBookings: bookings.filter(b => b.status === "New").length, bookingValue: bookings.filter(b => b.status !== "Cancelled").reduce((s, b) => s + b.total, 0), users: users.length, staff: 3 },
                    byStatus: count(apps, "status"), byType: count(apps, "partnerTypeLabel"), byProvince: count(apps, "province"), bookingsByStatus: count(bookings, "status"),
                    valueByTour: bookings.reduce((a, b) => (a[b.tour] = (a[b.tour] || 0) + b.total, a), {}), weekly, recent, sheetUrl: "",
                }),
                listApplications: async () => apps,
                getApplication: async ({ id }) => { const a = apps.find(x => x.id === id); return { ...a, description: "Sample application used to preview the dashboard.", regNumber: "2024/123456/07", years: "3–5 years", website: "", details: {}, photos: [] }; },
                listBookings: async () => bookings,
                listMessages: async () => [{ created: ago(1), name: "Nomsa D.", email: "nomsa@example.com", phone: "071 000 0000", message: "Hi, we're a church group of 45 looking at Kruger in March. Can you quote?" }],
                listUsers: async () => users,
                listJobs: async () => jobs,
                listRatings: async () => ratingsS,
                saveJob: () => reject(), setPayoutStatus: () => reject(), setRatingStatus: () => reject(),
                activity: async () => recent,
                updateBooking: reject, saveUser: reject, reviewApplication: reject, getPhoto: reject,
            };
        })();

        K.session.onChange(u => { if (!sample && (!u || !u.isStaff) && me) location.reload(); });
        boot();
    });
})();
