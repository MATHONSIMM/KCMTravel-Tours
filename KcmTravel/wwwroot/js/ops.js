/* KCM OPERATIONS CENTRE: screens for the admin dashboard (registered into admin.js via window.KCMOps).
   Everything here is display and input. The backend (Ops.gs) checks permissions, validates, calculates money
   and decides what each person may see. Hiding a button here is a convenience, never the security control. */
(() => {
    "use strict";
    window.KCMOps = function (ctx) {
        const { get, esc, fmtDate, fmtWhen, toast, kpi, empty, hBars, segBar, lineChart, downloadCsv, $, $$, can, ROLE_LABEL } = ctx;
        const body = () => ctx.body();
        const me = () => ctx.me();
        let cfg = null;
        const config = async force => (cfg && !force ? cfg : (cfg = await get("opsConfig")));
        /* R12 345 or R6 727.50: space between thousands, point before cents (same on every browser) */
        const money = n => { const v = Math.round((Number(n) || 0) * 100) / 100, neg = v < 0, [i, d] = Math.abs(v).toFixed(2).split("."); return (neg ? "-R" : "R") + i.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (d !== "00" ? "." + d : ""); };
        const staffName = e => { if (!e) return "—"; const s = (cfg?.staff || []).find(x => x.email === e); return s ? s.name : e; };
        const today = () => new Date().toISOString().slice(0, 10);
        const dInput = s => (s ? String(s).slice(0, 10) : "");
        const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
        const nl = s => esc(s).replace(/\n/g, "<br>");

        const OP_TONE = { "NEW ENQUIRY": "info", "AWAITING REVIEW": "info", UNASSIGNED: "warn", ASSIGNED: "muted", "REQUIREMENTS UNDER REVIEW": "muted", "SUPPLIER RESEARCH": "muted",
            "QUOTATION IN PREPARATION": "muted", "QUOTATION SENT": "warn", "AWAITING CUSTOMER RESPONSE": "warn", "ACCEPTED BY CUSTOMER": "info", "AWAITING DEPOSIT": "info",
            "PAYMENT VERIFICATION": "info", "SUPPLIER CONFIRMATION": "info", "BOOKING CONFIRMED": "good", "TRIP PREPARATION": "good", "IN PROGRESS / TRAVELLING": "good",
            COMPLETED: "good", CANCELLED: "bad", "LOST / DECLINED": "bad", "ON HOLD": "muted" };
        const PAY_TONE = { "Not invoiced": "muted", "Awaiting payment": "warn", "Deposit pending": "warn", "Deposit received": "info", "Partially paid": "info", "Fully paid": "good", Overdue: "bad", "Refund pending": "warn", Refunded: "muted" };
        const PRI_TONE = { Urgent: "bad", High: "warn", Normal: "muted", Low: "muted" };
        const opBadge = s => `<span class="status status--${OP_TONE[s] || "muted"}">${esc(s || "—")}</span>`;
        const payBadge = s => `<span class="status status--${PAY_TONE[s] || "muted"}" title="Payment status (from verified payments)">${esc(s || "Not invoiced")}</span>`;
        const priBadge = s => `<span class="pri pri--${(PRI_TONE[s] || "muted")}">${esc(s || "Normal")}</span>`;
        const respBadge = s => s ? `<span class="status status--${s === "Accepted" ? "good" : s === "Declined" || s === "No response" ? "bad" : "warn"}">${esc(s)}</span>` : "";
        const ticketLink = ref => `<a class="ref" href="#ticket/${encodeURIComponent(ref)}">${esc(ref)}</a>`;
        const opt = (list, v, blank) => (blank !== undefined ? `<option value="">${esc(blank)}</option>` : "") + list.map(x => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}" ${String(val) === String(v ?? "") ? "selected" : ""}>${esc(lab)}</option>`; }).join("");
        const errBox = e => `<div class="adm-card"><p class="form-error">${esc(e.message || e)}</p></div>`;
        /* <input type=datetime-local> has no timezone; send it as an exact instant from the employee's own clock */
        const isoLocal = v => (v ? new Date(v).toISOString() : "");

        /* ---------- modal ---------- */
        const dlg = $("[data-ops-modal]");
        dlg?.querySelector("[data-ops-modal-close]")?.addEventListener("click", () => dlg.close());
        function modal(title, inner, onSubmit, opts = {}) {
            const box = dlg.querySelector("[data-ops-modal-body]");
            dlg.classList.toggle("modal--wide", !!opts.wide);
            box.innerHTML = `<h2 class="ops-modal-title" id="ops-modal-title">${esc(title)}</h2>${opts.lead ? `<p class="modal-lead">${opts.lead}</p>` : ""}
                <form data-mform novalidate>${inner}<p class="form-error" data-merr hidden></p>
                ${onSubmit ? `<div class="btn-row ops-modal-actions"><button class="btn btn--primary" type="submit">${esc(opts.submit || "Save")}</button><button class="btn btn--ghost" type="button" data-mcancel>Cancel</button></div>` : ""}</form>`;
            const form = box.querySelector("[data-mform]"), err = box.querySelector("[data-merr]");
            box.querySelector("[data-mcancel]")?.addEventListener("click", () => dlg.close());
            form.addEventListener("submit", async e => {
                e.preventDefault(); err.hidden = true;
                const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
                try { const keep = await onSubmit(form); if (keep !== true) dlg.close(); }
                catch (ex) { err.textContent = ex.message; err.hidden = false; }
                btn.disabled = false;
            });
            opts.onOpen?.(form);
            if (!dlg.open) dlg.showModal();
            return form;
        }

        /* ---------- notifications bell + nav badges ---------- */
        async function refreshBell() {
            try {
                const n = await get("listNotifications");
                const c = $("[data-notif-count]"); c.textContent = n.unread > 99 ? "99+" : n.unread; c.hidden = !n.unread;
                $("[data-notif-panel]").innerHTML = `<div class="notif-head"><strong>Notifications</strong>${n.unread ? `<button type="button" class="link-btn" data-notif-all>Mark all read</button>` : ""}</div>
                    ${n.items.length ? `<ul class="notif-list">${n.items.slice(0, 30).map(i => `<li class="${i.read ? "" : "is-unread"}"><a href="${i.ref ? "#ticket/" + encodeURIComponent(i.ref) : "#workspace"}" data-notif-id="${esc(i.id)}"><span>${esc(i.message)}</span><time>${fmtWhen(i.created)}</time></a></li>`).join("")}</ul>` : `<p class="muted notif-empty">You're all caught up.</p>`}
                    <p class="notif-foot muted">Internal notifications. Nothing here is sent to customers.</p>`;
            } catch { /* signed out or offline */ }
        }
        async function refreshBadges() {
            const set = (k, v) => $$(`[data-badge="${k}"]`).forEach(b => { b.textContent = v; b.hidden = !v; });
            try {
                if (can("ops.view.all")) { const o = await get("opsOverview", { range: "month" }); set("incoming", o.kpis.awaitingReview); set("unassigned", o.kpis.unassigned); set("overdueTasks", o.kpis.overdueTasks); }
                if (can("quote.approve")) set("quoteApprovals", (await get("listQuotes", { status: "Awaiting approval" })).length);
                if (can("pay.verify")) { const p = await get("listPayments", {}); set("paymentsToVerify", p.payments.filter(x => x.verification === "Unverified" || x.approvalStatus === "Pending approval").length); }
            } catch { /* non-critical */ }
        }
        function start() {
            if (ctx.sample()) return;
            const wrap = $("[data-notif]"); if (!wrap) return;
            wrap.hidden = false;
            const btn = $("[data-notif-btn]"), panel = $("[data-notif-panel]");
            btn.addEventListener("click", () => { panel.hidden = !panel.hidden; btn.setAttribute("aria-expanded", String(!panel.hidden)); if (!panel.hidden) refreshBell(); });
            document.addEventListener("click", e => { if (!e.target.closest("[data-notif]")) { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
            panel.addEventListener("click", async e => {
                if (e.target.closest("[data-notif-all]")) { await get("markNotificationsRead", {}); refreshBell(); return; }
                const a = e.target.closest("[data-notif-id]"); if (a) { panel.hidden = true; get("markNotificationsRead", { ids: [a.dataset.notifId] }).then(refreshBell); }
            });
            refreshBell(); refreshBadges(); config().catch(() => {});
            setInterval(() => { if (!document.hidden) { refreshBell(); refreshBadges(); } }, 90000);
        }

        /* =================== TICKET REGISTER (shared by several sections) =================== */
        const filters = {};
        async function register(view, opts = {}) {
            const c = await config();
            const f = filters[view] ||= { q: "", status: "", priority: "", assignee: "", source: "", paymentStatus: "", destination: "", from: "", to: "", overdue: false, sort: opts.sort || "updated" };
            const b = body();
            const intro = typeof opts.intro === "function" ? opts.intro() : opts.intro;
            b.innerHTML = `${intro ? `<p class="ops-intro">${intro}</p>` : ""}
                <div class="adm-card">
                    <form class="ops-filters" data-filters>
                        <input class="search" type="search" name="q" value="${esc(f.q)}" placeholder="Search ticket, customer, phone, email, destination…" aria-label="Search tickets">
                        ${opts.fixedStatus ? "" : `<select name="status" aria-label="Status">${opt(c.statuses, f.status, "Any status")}</select>`}
                        <select name="priority" aria-label="Priority">${opt(c.priorities, f.priority, "Any priority")}</select>
                        ${can("ops.view.all") && !opts.hideAssignee ? `<select name="assignee" aria-label="Employee">${opt([["(none)", "Unassigned"]].concat(c.staff.map(s => [s.email, s.name])), f.assignee, "Any employee")}</select>` : ""}
                        <select name="source" aria-label="Source">${opt(c.sources, f.source, "Any source")}</select>
                        <select name="paymentStatus" aria-label="Payment status">${opt(c.paymentStatuses, f.paymentStatus, "Any payment status")}</select>
                        <input name="destination" value="${esc(f.destination)}" placeholder="Destination" aria-label="Destination">
                        <label class="inline-field">From <input type="date" name="from" value="${esc(f.from)}"></label>
                        <label class="inline-field">To <input type="date" name="to" value="${esc(f.to)}"></label>
                        <label class="check-inline"><input type="checkbox" name="overdue" ${f.overdue ? "checked" : ""}> Overdue only</label>
                        <select name="sort" aria-label="Sort">${opt([["updated", "Recently active"], ["created", "Newest"], ["due", "Next action due"], ["priority", "Priority"]], f.sort)}</select>
                        <button type="button" class="btn btn--ghost btn--sm" data-clear>Clear</button>
                        <button type="button" class="btn btn--ghost btn--sm" data-csv>CSV</button>
                    </form>
                    ${can("ops.assign") ? `<div class="bulk-bar" data-bulk hidden><strong data-bulk-n></strong><label class="inline-field">Assign to <select data-bulk-to aria-label="Assign selected tickets to"></select></label><button type="button" class="btn btn--primary btn--sm" data-bulk-go>Assign</button><button type="button" class="link-btn" data-bulk-clear>Clear selection</button></div>` : ""}
                    <div data-results><p class="muted">Loading…</p></div>
                </div>`;
            let timer = null, last = [];
            if (can("ops.assign")) wireAssign(b, () => last, () => load());
            else if (can("ops.claim")) b.addEventListener("click", async e => {
                const btn = e.target.closest("[data-claim]"); if (!btn) return;
                btn.disabled = true; btn.textContent = "Picking up…";
                try { await get("claimTicket", { ref: btn.dataset.claim }); toast(`${btn.dataset.claim} is now yours. It's in My Assigned Tickets.`); load(); }
                catch (err) { toast(err.message, true); load(); }
            });
            const load = async () => {
                const payload = Object.assign({ view: opts.apiView || "all" }, f, { overdue: f.overdue || undefined });
                try {
                    const r = await get("listTickets", payload);
                    last = r.tickets;
                    $("[data-results]", b).innerHTML = r.tickets.length ? `<p class="muted ops-count">${r.total} ticket${r.total === 1 ? "" : "s"}${r.total > r.tickets.length ? ` (showing ${r.tickets.length})` : ""}</p>${ticketTable(r.tickets, { assign: true })}`
                        : empty(opts.emptyTitle || "No tickets", opts.emptyText || "Nothing matches these filters.");
                } catch (e) { $("[data-results]", b).innerHTML = `<p class="form-error">${esc(e.message)}</p>`; }
            };
            const form = $("[data-filters]", b);
            form.addEventListener("input", e => {
                const el = e.target; if (!el.name) return;
                f[el.name] = el.type === "checkbox" ? el.checked : el.value;
                clearTimeout(timer); timer = setTimeout(load, el.name === "q" || el.name === "destination" ? 350 : 0);
            });
            form.addEventListener("submit", e => e.preventDefault());
            $("[data-clear]", b).addEventListener("click", () => { filters[view] = null; register(view, opts); });
            $("[data-csv]", b).addEventListener("click", () => downloadCsv(`kcm-${view}-${today()}.csv`, last, ["ref", "created", "customerName", "customerPhone", "source", "opStatus", "paymentStatus", "responseStatus", "priority", "assignedTo", "package", "destination", "departDate", "travellers", "nextAction", "nextActionDue"]));
            load();
        }
        /* ---------- quick assign from any ticket list (management) ---------- */
        function wireAssign(b, rows, reload) {
            const card = $(".adm-card", b);
            let counts = {};
            const people = () => cfg.staff.filter(s => s.canOwn !== false); // only people whose profile lets them own tickets
            const loadCounts = async () => { if (!can("ops.workload")) return; try { (await get("workload")).forEach(w => { counts[w.email] = w.activeTickets; }); } catch { /* counts are a nice-to-have */ } };
            loadCounts();
            const label = s => `${s.name}${counts[s.email] !== undefined ? ` · ${counts[s.email]} active` : ""}`;
            const assign = async (t, to) => {
                const supporters = String(t.supportBy || "").split(",").map(x => x.trim()).filter(x => x && x !== to);
                await get("assignTicket", { ref: t.ref, assignee: to, supporters });
            };
            const closeMenu = () => { $$(".assign-menu").forEach(m => m.remove()); };
            document.addEventListener("click", e => { if (!e.target.closest(".assign-menu, [data-qa]")) closeMenu(); });
            document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
            card.addEventListener("click", async e => {
                const chip = e.target.closest("[data-qa]");
                if (!chip) return;
                e.preventDefault();
                const open = document.querySelector(".assign-menu");
                closeMenu();
                if (open && open.dataset.ref === chip.dataset.qa) return;
                const t = rows().find(x => x.ref === chip.dataset.qa); if (!t) return;
                const m = document.createElement("div");
                m.className = "assign-menu"; m.dataset.ref = t.ref; m.setAttribute("role", "menu");
                m.innerHTML = `<p class="assign-menu-head">${t.assignedTo ? "Reassign" : "Assign"} ${esc(t.ref)} to…</p>
                    ${people().map(s => `<button type="button" role="menuitem" data-to="${esc(s.email)}" class="${s.email === t.assignedTo ? "is-current" : ""}"><span>${esc(s.name)}</span><small>${esc(s.jobTitle || ROLE_LABEL[s.role] || s.role)}${counts[s.email] !== undefined ? ` · ${counts[s.email]} active` : ""}</small></button>`).join("")}
                    ${t.assignedTo ? `<button type="button" role="menuitem" data-to="" class="assign-menu-unassign"><span>Unassign</span><small>back to Unassigned Tickets</small></button>` : ""}
                    <button type="button" role="menuitem" data-more class="assign-menu-more">More options: handover note, supporters, deadline…</button>`;
                document.body.append(m);
                const r = chip.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
                m.style.left = Math.max(8, Math.min(window.innerWidth - mw - 8, r.left)) + "px";
                m.style.top = (r.bottom + mh + 8 > window.innerHeight ? Math.max(8, r.top - mh - 6) : r.bottom + 6) + "px";
                m.querySelector("button")?.focus();
                m.addEventListener("click", async ev => {
                    const more = ev.target.closest("[data-more]"), pickBtn = ev.target.closest("[data-to]");
                    if (more) { closeMenu(); try { const full = await get("getTicket", { ref: t.ref }); ACT.assign(full, reload); } catch (err) { toast(err.message, true); } return; }
                    if (!pickBtn) return;
                    const to = pickBtn.dataset.to;
                    if (to === (t.assignedTo || "")) { closeMenu(); return; }
                    closeMenu(); chip.disabled = true; chip.classList.add("is-busy");
                    try {
                        await assign(t, to);
                        const who = to ? (cfg.staff.find(x => x.email === to) || {}).name || to : "";
                        toast(to ? `${t.ref} ${t.assignedTo ? "reassigned" : "assigned"} to ${who}` : `${t.ref} is unassigned`);
                        if (t.assignedTo && counts[t.assignedTo]) counts[t.assignedTo]--; if (to) counts[to] = (counts[to] || 0) + 1;
                        reload();
                    } catch (err) { toast(err.message, true); chip.disabled = false; chip.classList.remove("is-busy"); }
                });
            });
            // ---- select several tickets and move them to one person ----
            const bar = $("[data-bulk]", card);
            const selected = () => $$("[data-sel]:checked", card).map(x => x.dataset.sel);
            const refresh = () => {
                const n = selected().length;
                bar.hidden = !n;
                $("[data-bulk-n]", bar).textContent = `${n} ticket${n === 1 ? "" : "s"} selected`;
                const sel = $("[data-bulk-to]", bar);
                if (!sel.options.length || sel.dataset.stale) { sel.innerHTML = `<option value="">Choose an employee…</option>` + people().map(s => `<option value="${esc(s.email)}">${esc(label(s))}</option>`).join("") + `<option value="__none">Unassign</option>`; delete sel.dataset.stale; }
            };
            card.addEventListener("change", e => {
                if (e.target.matches("[data-selall]")) $$("[data-sel]", card).forEach(x => { x.checked = e.target.checked; });
                if (e.target.matches("[data-sel], [data-selall]")) refresh();
            });
            $("[data-bulk-clear]", bar).addEventListener("click", () => { $$("[data-sel], [data-selall]", card).forEach(x => { x.checked = false; }); refresh(); });
            $("[data-bulk-go]", bar).addEventListener("click", async () => {
                const sel = $("[data-bulk-to]", bar), v = sel.value;
                if (!v) { toast("Choose who should get the selected tickets.", true); sel.focus(); return; }
                const to = v === "__none" ? "" : v, refs = selected(), btn = $("[data-bulk-go]", bar);
                btn.disabled = true; let ok = 0; const failed = [];
                for (const ref of refs) {
                    btn.textContent = `Assigning ${ok + failed.length + 1} of ${refs.length}…`;
                    const t = rows().find(x => x.ref === ref);
                    if (!t || (t.assignedTo || "") === to) { ok++; continue; }
                    try { await assign(t, to); ok++; } catch (err) { failed.push(`${ref}: ${err.message}`); }
                }
                btn.disabled = false; btn.textContent = "Assign";
                const who = to ? (cfg.staff.find(x => x.email === to) || {}).name || to : "nobody";
                toast(failed.length ? `${ok} done, ${failed.length} not changed. ${failed[0]}` : `${ok} ticket${ok === 1 ? "" : "s"} now assigned to ${who}`, !!failed.length);
                sel.dataset.stale = "1"; await loadCounts(); reload(); bar.hidden = true;
            });
        }
        function ticketTable(list, o = {}) {
            const pick = !!o.assign && can("ops.assign"); // registers only: tick-boxes + click-to-assign
            const claim = !pick && can("ops.claim"); // consultants pick up unassigned tickets themselves
            return `<div class="table-wrap"><table class="table ops-table"><thead><tr>${pick ? `<th class="sel-col"><input type="checkbox" data-selall aria-label="Select all tickets"></th>` : ""}<th>Ticket</th><th>Customer</th><th>Trip</th><th>Status</th><th>Payment</th><th>Assigned</th><th>Next action</th></tr></thead><tbody>
                ${list.map(t => `<tr class="${t.overdue ? "is-overdue" : ""}">
                    ${pick ? `<td class="sel-col"><input type="checkbox" data-sel="${esc(t.ref)}" aria-label="Select ${esc(t.ref)}"></td>` : ""}<td>${ticketLink(t.ref)} ${priBadge(t.priority)}<span>${esc(t.source)} · ${fmtDate(t.created)}</span></td>
                    <td><strong>${esc(t.customerName || t.customerRef)}</strong><span>${esc(t.customerPhone || t.customerEmail || "")}</span></td>
                    <td>${esc(t.package || t.destination || "—")}<span>${t.departDate ? fmtDate(t.departDate) : "Dates TBC"}${t.travellers ? " · " + t.travellers + " pax" : ""}</span></td>
                    <td>${opBadge(t.opStatus)}${respBadge(t.responseStatus)}</td>
                    <td>${payBadge(t.paymentStatus)}</td>
                    <td>${pick ? `<button type="button" class="assign-chip ${t.assignedTo ? "" : "is-none"}" data-qa="${esc(t.ref)}" aria-haspopup="menu" title="${t.assignedTo ? "Reassign" : "Assign"} ${esc(t.ref)}">${t.assignedTo ? esc(staffName(t.assignedTo)) : "Unassigned"}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>` : t.assignedTo ? esc(staffName(t.assignedTo)) : claim && t.open !== false ? `<button type="button" class="btn btn--primary btn--sm" data-claim="${esc(t.ref)}">Pick up</button>` : `<span class="status status--warn">Unassigned</span>`}${t.openTasks ? `<span>${t.openTasks} open task${t.openTasks > 1 ? "s" : ""}${t.overdueTasks ? `, <b class="overdue-txt">${t.overdueTasks} overdue</b>` : ""}</span>` : ""}</td>
                    <td>${esc(t.nextAction || "—")}<span class="${t.overdue ? "overdue-txt" : ""}">${t.nextActionDue ? (t.overdue ? "Overdue · " : "Due ") + fmtWhen(t.nextActionDue) : ""}</span></td></tr>`).join("")}
                </tbody></table></div>`;
        }

        /* =================== MY WORKSPACE =================== */
        /* "Good afternoon, Thandi" in South African time, with a one-line summary of the day */
        function greeting(w) {
            const h = Number(new Intl.DateTimeFormat("en-ZA", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Johannesburg" }).format(new Date()));
            const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
            const u = me() || {};
            const first = String(u.name || "").replace(/\(.*?\)/g, "").trim().split(/\s+/)[0] || String(u.email || "").split("@")[0].split(/[._-]/)[0].replace(/^./, c => c.toUpperCase());
            const today = new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Johannesburg" }).format(new Date());
            const open = w.tickets.length, od = w.overdue.length, due = w.upcoming.length;
            const line = od ? `You have <b>${od} overdue task${od === 1 ? "" : "s"}</b>; start there.` : open ? `You have ${open} open ticket${open === 1 ? "" : "s"}${due ? ` and ${due} thing${due === 1 ? "" : "s"} due this week` : ""}.` : "Nothing is assigned to you yet.";
            return `<div class="ws-greeting"><h2>${part}, ${esc(first)}.</h2><p>${esc(today)} · ${line}</p></div>`;
        }

        async function workspace() {
            await config();
            const w = await get("myWorkspace");
            const b = body();
            const taskRow = k => `<li class="task ${k.overdue ? "is-overdue" : ""}" data-task="${esc(k.id)}">
                <div><strong>${esc(k.title)}</strong><span>${ticketLink(k.ref)}${k.due ? ` · ${k.overdue ? "<b class='overdue-txt'>overdue</b> · " : "due "}${fmtDate(k.due)}` : ""}${k.priority && k.priority !== "Normal" ? " · " + priBadge(k.priority) : ""}</span></div>
                ${k.id ? `<div class="task-actions"><select class="status-select" data-task-status="${esc(k.id)}" aria-label="Task status">${opt(cfg.taskStatuses, k.status)}</select><button type="button" class="btn btn--ghost btn--sm" data-task-done="${esc(k.id)}">Done</button></div>` : ""}</li>`;
            b.innerHTML = `
                ${greeting(w)}
                <div class="kpis kpis--4">
                    ${kpi("My open tickets", w.tickets.length, "assigned or supporting", "#mine")}
                    ${kpi("Overdue tasks", w.overdue.length, w.overdue.length ? "needs attention now" : "nothing overdue", "#tasks")}
                    ${kpi("Due this week", w.upcoming.length, "tasks and next actions", "#tasks")}
                    ${kpi("Done (30 days)", w.completed.length, "completed tasks", "#tasks")}
                </div>
                ${w.overdue.length ? `<div class="adm-card ops-alert"><div class="card-head"><h2>Overdue</h2><p>Do these first</p></div><ul class="task-list">${w.overdue.map(taskRow).join("")}</ul></div>` : ""}
                <div class="adm-grid">
                    <div class="adm-card adm-span-3"><div class="card-head"><h2>My tickets</h2><a class="link-btn" href="#mine">All my tickets</a></div>${w.tickets.length ? ticketTable(w.tickets.slice(0, 12)) : empty("No tickets assigned to you", "When management assigns you a ticket it appears here, with a notification.")}</div>
                    <div class="adm-card"><div class="card-head"><h2>My tasks</h2></div>${w.pending.length ? `<ul class="task-list">${w.pending.slice(0, 12).map(taskRow).join("")}</ul>` : `<p class="muted">No pending tasks.</p>`}</div>
                    <div class="adm-card"><div class="card-head"><h2>Upcoming deadlines</h2><p>Next 7 days</p></div>${w.upcoming.length ? `<ul class="task-list">${w.upcoming.slice(0, 10).map(taskRow).join("")}</ul>` : `<p class="muted">Nothing due this week.</p>`}</div>
                    <div class="adm-card"><div class="card-head"><h2>Recently completed</h2></div>${w.completed.length ? `<ul class="task-list done">${w.completed.slice(0, 8).map(k => `<li class="task"><div><strong>${esc(k.title)}</strong><span>${ticketLink(k.ref)} · ${fmtDate(k.completedAt)}</span></div></li>`).join("")}</ul>` : `<p class="muted">No completed tasks yet.</p>`}</div>
                    <div class="adm-card"><div class="card-head"><h2>My recent activity</h2></div>${w.activity.length ? `<ul class="mini-feed">${w.activity.slice(0, 10).map(a => `<li><span>${esc(actionLabel(a.action))}</span> ${a.target && /^KCM-/.test(a.target) ? ticketLink(a.target) : esc(a.target)}<time>${fmtWhen(a.time)}</time></li>`).join("")}</ul>` : `<p class="muted">No activity yet.</p>`}</div>
                </div>`;
            taskHandlers(b, workspace);
        }
        function taskHandlers(b, reload) {
            b.addEventListener("change", async e => {
                const s = e.target.closest("[data-task-status]"); if (!s) return;
                s.disabled = true;
                try { await get("updateTask", { id: s.dataset.taskStatus, status: s.value }); toast("Task updated"); reload(); } catch (err) { toast(err.message, true); s.disabled = false; }
            });
            b.addEventListener("click", e => {
                const d = e.target.closest("[data-task-done]"); if (!d) return;
                modal("Complete task", `<div class="field"><label>Completion notes (optional)</label><textarea name="notes" maxlength="1000" placeholder="What was done?"></textarea></div>`,
                    async form => { await get("updateTask", { id: d.dataset.taskDone, status: "COMPLETED", completionNotes: form.notes.value }); toast("Task completed"); reload(); }, { submit: "Mark complete" });
            });
        }

        /* =================== OPERATIONS OVERVIEW =================== */
        let range = { range: "month", from: "", to: "" };
        async function overview() {
            const o = await get("opsOverview", range);
            const k = o.kpis, b = body();
            b.innerHTML = `
                <div class="adm-card ops-range"><div class="chips">${[["today", "Today"], ["week", "This week"], ["month", "This month"], ["year", "This year"], ["custom", "Custom"]].map(([v, l]) => `<button type="button" class="chip ${range.range === v ? "is-active" : ""}" data-range="${v}">${l}</button>`).join("")}</div>
                    <div class="ops-custom" ${range.range === "custom" ? "" : "hidden"}><input type="date" data-rfrom value="${esc(range.from)}" aria-label="From"> to <input type="date" data-rto value="${esc(range.to)}" aria-label="To"> <button class="btn btn--ghost btn--sm" type="button" data-rapply>Apply</button></div>
                    <span class="muted">${fmtDate(o.range.from)} – ${fmtDate(o.range.to)} · live figures from the records</span></div>
                <div class="kpis ops-kpis">
                    ${kpi("Enquiries received", k.enquiries, "in this period", "#tickets")}
                    ${kpi("Awaiting review", k.awaitingReview, "new enquiries", "#incoming")}
                    ${kpi("Unassigned", k.unassigned, "open tickets", "#unassigned")}
                    ${kpi("In progress", k.inProgress, "assigned, not yet confirmed", "#tickets")}
                    ${kpi("Quotes in preparation", k.quotesPreparing, "drafts & approvals", "#quotes")}
                    ${kpi("Quotes awaiting customer", k.quotesAwaiting, "sent", "#quotes")}
                    ${kpi("Confirmed bookings", k.confirmed, "in this period", "#opsbookings")}
                    ${kpi("Outstanding payments", money(k.outstandingPayments), "on accepted quotes", "#payments")}
                    ${kpi("Overdue tasks", k.overdueTasks, "across the team", "#tasks")}
                    ${kpi("Completed", k.completed, "in this period", "#completed")}
                    ${kpi("Cancelled", k.cancelled, "in this period", "#tickets")}
                    ${kpi("Quote conversion", o.quoteConversion.rate + "%", `${o.quoteConversion.accepted} of ${o.quoteConversion.sent} sent`, "#quotes")}
                </div>
                <div class="adm-grid">
                    <div class="adm-card adm-span-2"><div class="card-head"><h2>Enquiries over time</h2><p>per ${o.range.bucket}</p></div><div data-c="time"></div></div>
                    <div class="adm-card"><div class="card-head"><h2>Booking conversion</h2><p>enquiries → confirmed</p></div>
                        <p class="ops-big">${o.bookingConversion.rate}%</p><p class="muted">${o.bookingConversion.confirmed} of ${o.bookingConversion.enquiries} enquiries in this period are confirmed bookings.</p>
                        <div class="card-head" style="margin-top:18px"><h2>Payment progress</h2><p>accepted quotes</p></div><div data-c="pay"></div></div>
                    <div class="adm-card"><div class="card-head"><h2>Enquiries by source</h2></div><div data-c="source"></div></div>
                    <div class="adm-card"><div class="card-head"><h2>Open tickets by status</h2></div><div data-c="status"></div></div>
                    <div class="adm-card"><div class="card-head"><h2>Bookings by destination</h2></div><div data-c="dest"></div></div>
                    <div class="adm-card adm-span-3"><div class="card-head"><h2>Employee workload</h2><a class="link-btn" href="#workload">Details</a></div><div data-c="work"></div></div>
                </div>`;
            const items = obj => Object.entries(obj || {}).map(([label, value]) => ({ label, value })).sort((a, c) => c.value - a.value);
            const ch = n => $(`[data-c="${n}"]`, b);
            if (o.enquiriesOverTime.some(x => x.value)) lineChart(ch("time"), o.enquiriesOverTime.map(x => x.label.slice(5) || x.label), [{ name: "Enquiries", color: "#a8481f", values: o.enquiriesOverTime.map(x => x.value) }]);
            else ch("time").innerHTML = `<p class="chart-empty">No enquiries in this period yet</p>`;
            const bar = (n, list) => (list.length ? hBars(ch(n), list) : (ch(n).innerHTML = `<p class="chart-empty">Nothing yet</p>`));
            bar("source", items(o.bySource)); bar("status", items(o.byStatus)); bar("dest", items(o.byDestination));
            bar("work", o.workload.map(w => ({ label: w.name + (w.overdue ? ` (${w.overdue} overdue)` : ""), value: w.active })));
            const pp = o.paymentProgress;
            if (pp.due) segBar(ch("pay"), [{ label: "Received (verified)", value: pp.received, color: "#237a2a", fmt: money }, { label: "Outstanding", value: Math.max(0, pp.due - pp.received), color: "#c98a1b", fmt: money }]);
            else ch("pay").innerHTML = `<p class="chart-empty">No accepted quotes yet</p>`;
            b.addEventListener("click", e => {
                const r = e.target.closest("[data-range]"); if (r) { range.range = r.dataset.range; if (range.range !== "custom") overview(); else $(".ops-custom", b).hidden = false; }
                if (e.target.closest("[data-rapply]")) { range.from = $("[data-rfrom]", b).value; range.to = $("[data-rto]", b).value; overview(); }
            });
        }

        /* =================== TICKET WORKSPACE =================== */
        const ticketTab = {};
        async function ticket(ref) {
            if (!ref) { location.hash = "#tickets"; return; }
            await config();
            const t = await get("getTicket", { ref });
            ctx.setTitle(t.ref);
            const b = body(), A = t.allowed;
            const tab = t.limited && !["quotes", "pay", "hist"].includes(ticketTab[ref]) ? "pay" : ticketTab[ref] || "summary";
            const doneCount = t.checklist.filter(c => c.done).length, applicable = t.checklist.filter(c => c.applicable).length;
            const openTasks = t.tasks.filter(k => !["COMPLETED", "CANCELLED"].includes(k.status));
            const c = t.customer || {};
            b.innerHTML = `
                <div class="adm-card tk-head">
                    <div class="tk-title">
                        <div><p class="eyebrow">${esc(t.source)} · received ${fmtWhen(t.received || t.created)}</p>
                            <h2>${esc(c.name || t.customerRef)} <a class="tk-cust" href="#customer/${encodeURIComponent(t.customerRef)}">${esc(t.customerRef)}</a></h2>
                            <p class="muted">${esc(t.package || t.destination || t.enquiryType || "Trip enquiry")}${t.departDate ? " · " + fmtDate(t.departDate) : ""}${t.travellers ? " · " + t.travellers + " travellers" : ""}</p></div>
                        <div class="tk-actions">
                            ${A.claim ? `<button class="btn btn--primary btn--sm" type="button" data-act="claim">Pick up this ticket</button>` : ""}
                            ${A.edit ? `<button class="btn btn--primary btn--sm" type="button" data-act="status">Change status</button>` : ""}
                            ${A.assign ? `<button class="btn btn--ghost btn--sm" type="button" data-act="assign">${t.assignedTo ? "Reassign / hand over" : "Assign"}</button>` : ""}
                            ${A.edit ? `<button class="btn btn--ghost btn--sm" type="button" data-act="note">Add note</button><button class="btn btn--ghost btn--sm" type="button" data-act="task">Add task</button>` : ""}
                        </div>
                    </div>
                    <dl class="tk-facts">
                        <div><dt>Operational</dt><dd>${opBadge(t.opStatus)}</dd></div>
                        <div><dt>Payment</dt><dd>${payBadge(t.paymentStatus)}</dd></div>
                        <div><dt>Customer response</dt><dd>${A.edit ? `<select class="status-select" data-resp aria-label="Customer response">${opt(cfg.responseStatuses.filter(s => s !== "Accepted" || t.responseStatus === "Accepted"), t.responseStatus, "—")}</select>` : respBadge(t.responseStatus) || "—"}</dd></div>
                        <div><dt>Priority</dt><dd>${priBadge(t.priority)}</dd></div>
                        <div><dt>Assigned</dt><dd>${t.assignedTo ? esc(staffName(t.assignedTo)) : `<span class="status status--warn">Unassigned</span>`}${t.supportBy ? `<span class="muted"> + ${esc(t.supportBy.split(",").map(s => staffName(s.trim())).join(", "))}</span>` : ""}</dd></div>
                        <div><dt>Next action</dt><dd class="${t.overdue ? "overdue-txt" : ""}">${esc(t.nextAction || "—")}${t.nextActionDue ? `<span>${t.overdue ? "Overdue · " : "Due "}${fmtWhen(t.nextActionDue)}</span>` : ""}${A.edit ? ` <button type="button" class="link-btn" data-act="next">Edit</button>` : ""}</dd></div>
                        ${t.deadline ? `<div><dt>Deadline</dt><dd>${fmtDate(t.deadline)}</dd></div>` : ""}
                    </dl>
                    ${t.limited ? `<p class="muted tk-ro">Finance view: money only (quotations and payments). Notes, tasks, files and contact details stay with the people working on the ticket.</p>`
                        : A.claim ? `<p class="muted tk-ro">Nobody owns this ticket yet. Pick it up to start working on it.</p>`
                        : !A.edit ? `<p class="muted tk-ro">You can view this ticket. Changes are made by the assigned employee or management.</p>` : ""}
                </div>
                <nav class="tk-tabs" role="tablist">${(t.limited ? [["quotes", `Quotations (${t.quotes.length})`], ["pay", "Payments"], ["hist", "History"]] : [["summary", "Summary"], ["req", "Requirements"], ["tasks", `Tasks (${openTasks.length})`], ["check", `Checklist ${doneCount}/${applicable}`], ["notes", `Notes (${t.notes.length})`], ["quotes", `Quotations (${t.quotes.length})`], ["pay", "Payments"], ["supp", `Suppliers (${t.supplierQuotes.length})`], ["files", `Files (${t.files.length})`], ["hist", "History"]])
                    .map(([k, l]) => `<button type="button" role="tab" class="${tab === k ? "is-active" : ""}" aria-selected="${tab === k}" data-tab="${k}">${l}</button>`).join("")}</nav>
                <div data-tabbody></div>`;
            const reload = () => ticket(ref);
            const tb = $("[data-tabbody]", b);
            const show = k => { ticketTab[ref] = k; $$("[data-tab]", b).forEach(x => { x.classList.toggle("is-active", x.dataset.tab === k); x.setAttribute("aria-selected", String(x.dataset.tab === k)); }); TABS[k](tb, t, reload); };
            b.querySelector(".tk-tabs").addEventListener("click", e => { const x = e.target.closest("[data-tab]"); if (x) show(x.dataset.tab); });
            b.querySelector(".tk-head").addEventListener("click", e => { const a = e.target.closest("[data-act]"); if (a) ACT[a.dataset.act](t, reload); });
            $("[data-resp]", b)?.addEventListener("change", async e => {
                try { await get("setResponseStatus", { ref, status: e.target.value }); toast("Customer response updated"); reload(); } catch (err) { toast(err.message, true); reload(); }
            });
            show(tab);
        }

        const ACT = {
            async claim(t, reload) {
                try { await get("claimTicket", { ref: t.ref, version: t.version }); toast(`${t.ref} is now yours`); reload(); } catch (e) { toast(e.message, true); reload(); }
            },
            status(t, reload) {
                const list = cfg.statuses.filter(s => s !== t.opStatus);
                modal(`Change status of ${t.ref}`, `<p class="muted">Current: ${opBadge(t.opStatus)}. Some changes need earlier steps first (for example, a booking is confirmed only after finance verifies the deposit). The system will tell you what's missing.</p>
                    <div class="field"><label>New status</label><select name="status" required>${opt(list, "", "Choose…")}</select></div>
                    <div class="field"><label>Note (required for cancelled, lost and on hold)</label><textarea name="note" maxlength="1500"></textarea></div>`,
                async form => { if (!form.status.value) throw new Error("Choose a status."); await get("setTicketStatus", { ref: t.ref, status: form.status.value, note: form.note.value, version: t.version }); toast("Status updated"); reload(); }, { submit: "Change status" });
            },
            async assign(t, reload) {
                await config(true); // pick up employees added since the page loaded
                const staff = cfg.staff;
                modal(t.assignedTo ? `Reassign ${t.ref}` : `Assign ${t.ref}`, `
                    <div class="field"><label>Assigned employee</label><select name="assignee">${opt(staff.map(s => [s.email, `${s.name} (${s.jobTitle || ROLE_LABEL[s.role] || s.role})`]), t.assignedTo, "Unassigned")}</select></div>
                    <fieldset class="field"><legend class="field-legend">Supporting employees</legend><div class="check-grid">${staff.map(s => `<label class="check-pill"><input type="checkbox" name="sup" value="${esc(s.email)}" ${String(t.supportBy || "").includes(s.email) ? "checked" : ""}><span>${esc(s.name)}</span></label>`).join("")}</div></fieldset>
                    <div class="field-row"><div class="field"><label>Priority</label><select name="priority">${opt(cfg.priorities, t.priority)}</select></div>
                    <div class="field"><label>Processing deadline</label><input type="date" name="deadline" value="${dInput(t.deadline)}"></div></div>
                    ${t.assignedTo ? `<div class="field"><label>Handover summary for the new employee</label><textarea name="handover" maxlength="2000" placeholder="Where things stand, what's outstanding, anything the customer asked for…"></textarea></div>
                    <label class="check field"><input type="checkbox" name="moveTasks" checked><span>Move ${esc(staffName(t.assignedTo))}'s open tasks to the new employee</span></label>
                    <p class="muted">All previous notes, tasks, checklist progress and history stay on the ticket.</p>` : ""}`,
                async form => {
                    await get("assignTicket", { ref: t.ref, assignee: form.assignee.value, supporters: $$("input[name=sup]:checked", form).map(x => x.value), priority: form.priority.value,
                        deadline: form.deadline.value, handoverSummary: form.handover?.value || "", moveTasks: form.moveTasks ? form.moveTasks.checked : true, version: t.version });
                    toast(t.assignedTo ? "Ticket handed over" : "Ticket assigned"); reload();
                }, { submit: t.assignedTo ? "Save assignment" : "Assign" });
            },
            note(t, reload) { noteModal(t, reload); },
            task(t, reload) { taskModal(t, reload); },
            next(t, reload) {
                modal("Next action", `<div class="field"><label>What happens next?</label><input name="nextAction" maxlength="200" value="${esc(t.nextAction || "")}"></div>
                    <div class="field-row"><div class="field"><label>Due</label><input type="datetime-local" name="due" value="${t.nextActionDue ? new Date(new Date(t.nextActionDue).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}"></div>
                    <div class="field"><label>Follow-up date</label><input type="date" name="followUp" value="${dInput(t.fields.FollowUp)}"></div></div>`,
                async form => { await get("updateTicket", { ref: t.ref, version: t.version, fields: { nextAction: form.nextAction.value, nextActionDue: isoLocal(form.due.value), followUp: form.followUp.value } }); toast("Saved"); reload(); });
            },
        };
        function noteModal(t, reload) {
            modal(`Add a note to ${t.ref}`, `
                <div class="field-row"><div class="field"><label>Type</label><select name="kind">${opt([["internal", "Internal note (KCM staff only)"], ["customer", "Customer communication record"], ["supplier", "Supplier contact"], ["decision", "Decision"], ["problem", "Problem"]], "internal")}</select></div>
                <div class="field"><label>Channel</label><select name="channel">${opt(["WhatsApp", "Phone call", "Email", "SMS", "In person", "Other"], "", "—")}</select></div></div>
                <div class="field"><label>Note</label><textarea name="content" required maxlength="4000" placeholder="Who you spoke to, what was agreed, quotes received, problems, next steps…"></textarea></div>
                <details class="field"><summary>Create a follow-up task from this note</summary>
                    <div class="field-row"><div class="field"><label>Task</label><input name="fTitle" maxlength="140" placeholder="e.g. Call the lodge back"></div><div class="field"><label>Due</label><input type="date" name="fDue"></div></div>
                    ${can("ops.assign") ? `<div class="field"><label>For</label><select name="fFor">${opt(cfg.staff.map(s => [s.email, s.name]), me().email)}</select></div>` : ""}</details>
                <p class="muted">Notes can't be edited or deleted later. Add a new note to correct one.</p>`,
            async form => {
                if (!form.content.value.trim()) throw new Error("Write the note first.");
                await get("addNote", { ref: t.ref, kind: form.kind.value, channel: form.channel.value, content: form.content.value,
                    followUp: form.fTitle.value.trim() ? { title: form.fTitle.value, due: form.fDue.value, assignTo: form.fFor?.value } : null });
                toast("Note added"); ticketTab[t.ref] = "notes"; reload();
            }, { submit: "Add note" });
        }
        function taskModal(t, reload) {
            modal(`New task on ${t.ref}`, `
                <div class="field"><label>Task</label><input name="title" required maxlength="140"></div>
                <div class="field"><label>Details</label><textarea name="description" maxlength="1000"></textarea></div>
                <div class="field-row"><div class="field"><label>Due</label><input type="date" name="due" value="${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}"></div>
                <div class="field"><label>Priority</label><select name="priority">${opt(cfg.priorities, "Normal")}</select></div></div>
                ${can("ops.assign") ? `<div class="field"><label>Assigned to</label><select name="assignedTo">${opt(cfg.staff.map(s => [s.email, s.name]), t.assignedTo || me().email)}</select></div>` : `<p class="muted">The task will be assigned to you.</p>`}`,
            async form => { await get("createTask", { ref: t.ref, title: form.title.value, description: form.description.value, due: form.due.value, priority: form.priority.value, assignedTo: form.assignedTo?.value || me().email }); toast("Task created"); ticketTab[t.ref] = "tasks"; reload(); }, { submit: "Create task" });
        }

        /* plain values are always escaped; markup built by this file is passed as H(...) */
        const H = html => ({ html });
        const fact = (k, v) => (v || v === 0) && v !== "" ? `<div><dt>${esc(k)}</dt><dd>${v && v.html !== undefined ? v.html : nl(String(v))}</dd></div>` : "";
        const TABS = {
            summary(el, t) {
                const F = t.fields, c = t.customer || {}, m = t.money;
                const open = t.tasks.filter(k => !["COMPLETED", "CANCELLED"].includes(k.status));
                const handover = t.notes.find(n => n.kind === "handover");
                const wa = (c.whatsapp || c.phone || "").replace(/\D/g, "").replace(/^0/, "27");
                const done = t.checklist.filter(x => x.done).length, appl = t.checklist.filter(x => x.applicable).length;
                el.innerHTML = `
                    ${handover ? `<div class="adm-card ops-handover"><p class="eyebrow">Latest handover · ${fmtWhen(handover.created)}</p><p>${nl(handover.content)}</p></div>` : ""}
                    <div class="adm-grid">
                        <div class="adm-card"><div class="card-head"><h2>Original enquiry</h2></div><dl class="kv">${fact("Source", t.source)}${fact("Type", t.enquiryType)}${fact("Received", fmtWhen(t.received || t.created))}${fact("Created by", t.createdBy)}${fact("Enquiry", F.Description)}${fact("Intake notes", F.IntakeNotes)}${F.WebsiteEstimate ? fact("Website estimate", money(F.WebsiteEstimate) + " (server-calculated, not a quote)") : ""}${t.legacyRef ? fact("Earlier reference", t.legacyRef) : ""}</dl></div>
                        <div class="adm-card"><div class="card-head"><h2>Customer</h2><a class="link-btn" href="#customer/${encodeURIComponent(t.customerRef)}">Profile</a></div><dl class="kv">
                            ${fact("Name", c.name)}${c.phone ? fact("Phone", H(`<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`)) : ""}${wa.length >= 10 ? fact("WhatsApp", H(`<a href="https://wa.me/${esc(wa)}?text=${encodeURIComponent(`Hi ${(c.name || "").split(" ")[0]}, this is KCM Travel & Tours about your enquiry ${t.ref}.`)}" target="_blank" rel="noopener">Open chat</a> <span class="muted">(opens WhatsApp; not logged automatically)</span>`)) : ""}
                            ${c.email ? fact("Email", H(`<a href="mailto:${esc(c.email)}?subject=${encodeURIComponent("KCM Travel & Tours: " + t.ref)}">${esc(c.email)}</a>`)) : ""}${fact("Prefers", c.preferredComms)}${fact("Type", c.type)}${fact("Location", c.location)}${c.consentAt ? fact("POPIA consent", fmtDate(c.consentAt) + " · " + (c.consentSource || "")) : fact("POPIA consent", H("<span class='status status--warn'>Not recorded</span>"))}</dl></div>
                        <div class="adm-card"><div class="card-head"><h2>Travel requirements</h2></div><dl class="kv">
                            ${fact("Package", F.Package)}${fact("Destination", F.Destination)}${fact("Other destinations", F.Destinations)}${F.CustomTrip === "Yes" ? fact("Custom trip", "Yes") : ""}${fact("Dates", (F.DepartDate ? fmtDate(F.DepartDate) : "TBC") + (F.ReturnDate ? " – " + fmtDate(F.ReturnDate) : ""))}${fact("Nights", F.Nights)}
                            ${fact("Travellers", [F.Adults && F.Adults + " adults", F.Children && F.Children + " children", F.Infants && F.Infants + " infants", F.Pensioners && F.Pensioners + " pensioners"].filter(Boolean).join(", "))}
                            ${fact("Accommodation", F.Accommodation)}${fact("Rooms", F.Rooms)}${fact("Transport", F.Transport)}${fact("Activities", F.Activities)}
                            ${fact("Extras", [F.AirportTransfer === "Yes" && "Airport transfer", F.CarHire === "Yes" && "Car hire", F.Insurance === "Yes" && "Travel insurance"].filter(Boolean).join(", "))}
                            ${fact("Meals", F.Meals)}${fact("Special requests", F.SpecialRequests)}${fact("Accessibility", F.Accessibility)}${fact("Budget", F.Budget)}${fact("Payment preference", F.PaymentPref)}</dl></div>
                        <div class="adm-card"><div class="card-head"><h2>Progress</h2></div>
                            <div class="progress"><span style="width:${appl ? Math.round(done / appl * 100) : 0}%"></span></div><p class="muted">${done} of ${appl} checklist items done</p>
                            <dl class="kv">${fact("Open tasks", H(open.length + (open.filter(k => k.overdue).length ? ` <b class="overdue-txt">(${open.filter(k => k.overdue).length} overdue)</b>` : "")))}${fact("Outstanding", F.Outstanding)}${fact("Last activity", fmtWhen(t.lastActivity))}${fact("Last updated by", t.updatedBy)}</dl>
                            ${open.length ? `<ul class="task-list compact">${open.slice(0, 5).map(k => `<li class="task ${k.overdue ? "is-overdue" : ""}"><div><strong>${esc(k.title)}</strong><span>${esc(staffName(k.assignedTo))}${k.due ? " · " + fmtDate(k.due) : ""}</span></div></li>`).join("")}</ul>` : ""}</div>
                        <div class="adm-card"><div class="card-head"><h2>Money</h2><p>${payBadge(t.paymentStatus)}</p></div>
                            ${m.final ? `<dl class="kv">${fact("Accepted quotation", money(m.final))}${fact("Deposit required", money(m.deposit))}${fact("Paid (verified)", money(m.paid))}${m.unverified ? fact("Recorded, awaiting verification", money(m.unverified)) : ""}${m.refunded ? fact("Refunded", money(m.refunded)) : ""}${fact("Outstanding balance", H(`<strong>${money(m.outstanding)}</strong>`))}</dl>` : `<p class="muted">No accepted quotation yet.</p>`}</div>
                        <div class="adm-card"><div class="card-head"><h2>Latest notes</h2></div>${t.notes.length ? `<ul class="timeline-list compact">${t.notes.slice(0, 3).map(noteItem).join("")}</ul>` : `<p class="muted">No notes yet.</p>`}</div>
                    </div>`;
            },
            req(el, t, reload) {
                const F = t.fields, A = t.allowed, ro = A.edit ? "" : "disabled";
                const yes = v => (v === "Yes" ? "checked" : "");
                el.innerHTML = `<form class="adm-card ops-form" data-req novalidate>
                    <fieldset ${ro}><legend>A. Enquiry</legend><div class="form-grid">
                        <div class="field"><label>Source</label><select name="source">${opt(cfg.sources, F.Source)}</select></div>
                        <div class="field"><label>Enquiry type</label><select name="enquiryType">${opt(cfg.enquiryTypes, F.EnquiryType, "—")}</select></div>
                        <div class="field"><label>Received</label><input type="datetime-local" name="received" value="${F.Received ? new Date(new Date(F.Received).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}"></div>
                        ${A.assign ? `<div class="field"><label>Priority</label><select name="priority">${opt(cfg.priorities, F.Priority)}</select></div>` : ""}
                        <div class="field field--full"><label>Enquiry description</label><textarea name="description" maxlength="2000">${esc(F.Description)}</textarea></div>
                        <div class="field field--full"><label>Internal intake notes</label><textarea name="intakeNotes" maxlength="2000">${esc(F.IntakeNotes)}</textarea></div></div></fieldset>
                    <fieldset ${ro}><legend>C. Travel requirements</legend><div class="form-grid">
                        <div class="field"><label>Preferred destination</label><input name="destination" maxlength="120" value="${esc(F.Destination)}"></div>
                        <div class="field"><label>Other destinations</label><input name="destinations" maxlength="300" value="${esc(F.Destinations)}" placeholder="Multi-stop trips"></div>
                        <div class="field"><label>Travel package</label><input name="package" list="pkg-list" maxlength="140" value="${esc(F.Package)}"><datalist id="pkg-list">${cfg.packages.map(p => `<option value="${esc(p.title)}">`).join("")}</datalist></div>
                        <label class="check field"><input type="checkbox" name="customTrip" ${yes(F.CustomTrip)}><span>Custom trip</span></label>
                        <div class="field"><label>Departure</label><input type="date" name="departDate" value="${dInput(F.DepartDate)}"></div>
                        <div class="field"><label>Return</label><input type="date" name="returnDate" value="${dInput(F.ReturnDate)}"></div>
                        <div class="field"><label>Nights</label><input type="number" min="0" name="nights" value="${esc(F.Nights)}"></div>
                        <div class="field"><label>Adults</label><input type="number" min="0" name="adults" value="${esc(F.Adults)}"></div>
                        <div class="field"><label>Children</label><input type="number" min="0" name="children" value="${esc(F.Children)}"></div>
                        <div class="field"><label>Infants</label><input type="number" min="0" name="infants" value="${esc(F.Infants)}"></div>
                        <div class="field"><label>Pensioners</label><input type="number" min="0" name="pensioners" value="${esc(F.Pensioners)}"></div>
                        <div class="field"><label>Accommodation type</label><input name="accommodation" maxlength="120" value="${esc(F.Accommodation)}"></div>
                        <div class="field"><label>Room configuration</label><input name="rooms" maxlength="200" value="${esc(F.Rooms)}"></div>
                        <div class="field"><label>Transport</label><input name="transport" maxlength="300" value="${esc(F.Transport)}"></div>
                        <div class="field"><label>Activities & experiences</label><input name="activities" maxlength="400" value="${esc(F.Activities)}"></div>
                        <div class="field"><label>Meals</label><input name="meals" maxlength="200" value="${esc(F.Meals)}"></div>
                        <div class="field"><label>Budget</label><input name="budget" maxlength="60" value="${esc(F.Budget)}"></div>
                        <div class="field"><label>Payment arrangement</label><input name="paymentPref" maxlength="60" value="${esc(F.PaymentPref)}"></div>
                        <div class="check-row field--full"><label class="check"><input type="checkbox" name="airportTransfer" ${yes(F.AirportTransfer)}><span>Airport transfers</span></label><label class="check"><input type="checkbox" name="carHire" ${yes(F.CarHire)}><span>Car hire</span></label><label class="check"><input type="checkbox" name="insurance" ${yes(F.Insurance)}><span>Travel insurance</span></label></div>
                        <div class="field field--full"><label>Special requests</label><textarea name="specialRequests" maxlength="1000">${esc(F.SpecialRequests)}</textarea></div>
                        <div class="field field--full"><label>Accessibility requirements</label><textarea name="accessibility" maxlength="500">${esc(F.Accessibility)}</textarea></div></div></fieldset>
                    <fieldset ${ro}><legend>E. Internal processing</legend><div class="form-grid">
                        <div class="field"><label>Next action</label><input name="nextAction" maxlength="200" value="${esc(F.NextAction)}"></div>
                        <div class="field"><label>Follow-up date</label><input type="date" name="followUp" value="${dInput(F.FollowUp)}"></div>
                        ${A.assign ? `<div class="field"><label>Processing deadline</label><input type="date" name="deadline" value="${dInput(F.Deadline)}"></div>` : ""}
                        <div class="field field--full"><label>Outstanding requirements</label><textarea name="outstanding" maxlength="1000">${esc(F.Outstanding)}</textarea></div>
                        <div class="field field--full"><label>Customer communication notes</label><textarea name="commsNotes" maxlength="2000">${esc(F.CommsNotes)}</textarea></div></div></fieldset>
                    ${A.edit ? `<div class="btn-row"><button class="btn btn--primary" type="submit">Save requirements</button><span class="muted">Saving checks that nobody else changed the ticket in the meantime.</span></div>` : ""}
                </form>`;
                $("[data-req]", el).addEventListener("submit", async e => {
                    e.preventDefault();
                    const f = e.target, fields = {};
                    $$("input,select,textarea", f).forEach(x => { if (!x.name) return; fields[x.name] = x.type === "checkbox" ? (x.checked ? "Yes" : "No") : x.type === "datetime-local" ? isoLocal(x.value) : x.value; });
                    try { await get("updateTicket", { ref: t.ref, version: t.version, fields }); toast("Requirements saved"); reload(); }
                    catch (err) { toast(err.message, true); if (/someone else/i.test(err.message)) setTimeout(reload, 1500); }
                });
            },
            tasks(el, t, reload) {
                const A = t.allowed;
                el.innerHTML = `<div class="adm-card"><div class="card-head"><h2>Tasks</h2>${A.edit ? `<button class="btn btn--primary btn--sm" type="button" data-newtask>New task</button>` : ""}</div>
                    ${t.tasks.length ? `<ul class="task-list">${t.tasks.slice().sort((a, b) => (a.status === "COMPLETED") - (b.status === "COMPLETED") || (a.due || "9").localeCompare(b.due || "9")).map(k => `
                        <li class="task ${k.overdue ? "is-overdue" : ""} ${k.status === "COMPLETED" ? "is-done" : ""}">
                            <div><strong>${esc(k.title)}</strong><span>${esc(staffName(k.assignedTo))}${k.due ? ` · ${k.overdue ? "<b class='overdue-txt'>overdue</b> " : "due "}${fmtDate(k.due)}` : ""} · ${priBadge(k.priority)}${k.source && k.source !== "manual" ? " · <em>" + esc(k.source.startsWith("note:") ? "from a note" : "automatic") + "</em>" : ""}</span>
                            ${k.description ? `<p>${nl(k.description)}</p>` : ""}${k.status === "COMPLETED" ? `<p class="muted">Done by ${esc(staffName(k.completedBy))} ${fmtWhen(k.completedAt)}${k.completionNotes ? ": " + esc(k.completionNotes) : ""}</p>` : ""}</div>
                            ${A.edit || k.assignedTo === me().email ? `<div class="task-actions"><select class="status-select" data-task-status="${esc(k.id)}" aria-label="Task status">${opt(cfg.taskStatuses, k.status)}</select>${k.status !== "COMPLETED" ? `<button type="button" class="btn btn--ghost btn--sm" data-task-done="${esc(k.id)}">Done</button>` : ""}</div>` : ""}
                        </li>`).join("")}</ul>` : empty("No tasks", "Add tasks for anything that needs doing, with a due date and an owner.")}</div>`;
                $("[data-newtask]", el)?.addEventListener("click", () => taskModal(t, reload));
                taskHandlers(el, reload);
            },
            check(el, t, reload) {
                const A = t.allowed, groups = {};
                t.checklist.forEach(c => { (groups[c.section] ||= []).push(c); });
                el.innerHTML = `<div class="adm-card"><div class="card-head"><h2>Processing checklist</h2>
                    ${A.edit ? `<div class="toolbar-right"><select data-tpl aria-label="Apply template">${opt(cfg.templates.map(x => [x.id, x.name]), "", "Add items from a template…")}</select><button type="button" class="btn btn--ghost btn--sm" data-additem>Add item</button></div>` : ""}</div>
                    ${Object.keys(groups).length ? Object.entries(groups).map(([sec, items]) => `<section class="ck-group"><h3>${esc(sec)} <span class="muted">${items.filter(i => i.done).length}/${items.filter(i => i.applicable).length}</span></h3><ul class="ck-list">${items.map(i => `
                        <li class="${i.done ? "is-done" : ""} ${i.applicable ? "" : "is-na"}">
                            <label class="check"><input type="checkbox" data-ck="${esc(i.id)}" ${i.done ? "checked" : ""} ${A.edit && i.applicable ? "" : "disabled"}><span>${esc(i.label)}</span></label>
                            <span class="ck-meta">${i.done ? `${esc(staffName(i.doneBy.replace(" (auto)", "")))}${i.doneBy.includes("(auto)") ? " (auto)" : ""} · ${fmtWhen(i.doneAt)}` : i.assignedTo ? "For " + esc(staffName(i.assignedTo)) : ""}${i.notes ? ` · <em>${esc(i.notes)}</em>` : ""}</span>
                            ${A.edit ? `<span class="ck-actions"><button type="button" class="link-btn" data-cknote="${esc(i.id)}">Note</button><button type="button" class="link-btn" data-ckna="${esc(i.id)}" data-v="${i.applicable ? "0" : "1"}">${i.applicable ? "Not needed" : "Needed"}</button></span>` : ""}</li>`).join("")}</ul></section>`).join("") : empty("No checklist", "Add items from a template.")}</div>`;
                const upd = async (payload, msg) => { try { await get("updateChecklistItem", payload); if (msg) toast(msg); reload(); } catch (err) { toast(err.message, true); reload(); } };
                el.addEventListener("change", e => {
                    const c = e.target.closest("[data-ck]"); if (c) upd({ id: c.dataset.ck, done: c.checked });
                    const tp = e.target.closest("[data-tpl]"); if (tp && tp.value) get("applyChecklistTemplate", { ref: t.ref, templateId: tp.value }).then(() => { toast("Items added"); reload(); }).catch(err => toast(err.message, true));
                });
                el.addEventListener("click", e => {
                    const n = e.target.closest("[data-cknote]");
                    if (n) { const item = t.checklist.find(i => i.id === n.dataset.cknote); modal("Checklist note", `<div class="field"><label>${esc(item.label)}</label><textarea name="notes" maxlength="500">${esc(item.notes || "")}</textarea></div>`, async f => upd({ id: item.id, notes: f.notes.value }, "Saved")); }
                    const na = e.target.closest("[data-ckna]"); if (na) upd({ id: na.dataset.ckna, applicable: na.dataset.v === "1" });
                    if (e.target.closest("[data-additem]")) modal("Add checklist item", `<div class="field"><label>Section</label><input name="section" list="sec-list" value="Other"><datalist id="sec-list">${Object.keys(groups).map(s => `<option value="${esc(s)}">`).join("")}</datalist></div><div class="field"><label>Item</label><input name="label" required maxlength="140"></div>`,
                        async f => { await get("addChecklistItem", { ref: t.ref, section: f.section.value, label: f.label.value }); toast("Item added"); reload(); });
                });
            },
            notes(el, t, reload) {
                el.innerHTML = `<div class="adm-card"><div class="card-head"><h2>Notes & timeline</h2>${t.allowed.edit ? `<button class="btn btn--primary btn--sm" type="button" data-newnote>Add note</button>` : ""}</div>
                    <p class="muted">Internal notes are only visible to KCM staff who can open this ticket. Customer communication records describe what was said to the customer; they are not sent anywhere.</p>
                    ${t.notes.length ? `<ul class="timeline-list">${t.notes.map(noteItem).join("")}</ul>` : empty("No notes yet", "Record suppliers contacted, people spoken to, quotes received, decisions and problems so anyone can pick this up.")}</div>`;
                $("[data-newnote]", el)?.addEventListener("click", () => noteModal(t, reload));
            },
            quotes(el, t, reload) { quotesTab(el, t, reload); },
            pay(el, t, reload) { paymentsTab(el, t, reload); },
            supp(el, t, reload) {
                el.innerHTML = `<div class="adm-card"><div class="card-head"><h2>Supplier quotations</h2>${t.allowed.edit ? `<button class="btn btn--primary btn--sm" type="button" data-newsq>Record supplier quote</button>` : ""}</div>
                    ${t.supplierQuotes.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Supplier</th><th>Service</th><th class="num">Amount</th><th>Valid until</th><th>Status</th></tr></thead><tbody>${t.supplierQuotes.map(s => `<tr><td><strong>${esc(s.supplier)}</strong><span>${esc(staffName(s.recordedBy))} · ${fmtDate(s.recordedAt)}</span></td><td>${esc(s.service)}${s.notes ? `<span>${esc(s.notes)}</span>` : ""}</td><td class="num">${money(s.amount)}</td><td>${s.validUntil ? fmtDate(s.validUntil) : "—"}</td><td>${t.allowed.edit ? `<select class="status-select" data-sqs="${esc(s.id)}">${opt(["Requested", "Received", "Accepted", "Declined"], s.status)}</select>` : esc(s.status)}</td></tr>`).join("")}</tbody></table></div>` : empty("No supplier quotes yet", "Record availability checks and prices from lodges, transport and activity providers.")}</div>`;
                el.addEventListener("change", async e => { const s = e.target.closest("[data-sqs]"); if (s) { try { await get("updateSupplierQuote", { id: s.dataset.sqs, status: s.value }); toast("Updated"); reload(); } catch (err) { toast(err.message, true); } } });
                $("[data-newsq]", el)?.addEventListener("click", async () => {
                    const sups = await get("listSuppliers");
                    modal("Record supplier quote", `
                        <div class="field"><label>Supplier</label><select name="supplierId">${opt(sups.map(s => [s.id, s.name + (s.type ? " · " + s.type : "")]), "", "Type a new supplier below…")}</select></div>
                        <div class="field"><label>…or new supplier name</label><input name="supplierName" maxlength="100"></div>
                        <div class="field"><label>Service</label><input name="service" required maxlength="140" placeholder="e.g. Accommodation: 2 nights, 2 rooms"></div>
                        <div class="field-row"><div class="field"><label>Amount (R)</label><input type="number" min="0" step="0.01" name="amount"></div><div class="field"><label>Valid until</label><input type="date" name="validUntil"></div></div>
                        <div class="field"><label>Status</label><select name="status">${opt(["Requested", "Received", "Accepted", "Declined"], "Received")}</select></div>
                        <div class="field"><label>Notes (who you spoke to, conditions)</label><textarea name="notes" maxlength="500"></textarea></div>`,
                    async f => { await get("addSupplierQuote", { ref: t.ref, supplierQuote: { supplierId: f.supplierId.value, supplierName: f.supplierName.value, service: f.service.value, amount: f.amount.value, validUntil: f.validUntil.value, status: f.status.value, notes: f.notes.value } }); toast("Supplier quote recorded"); reload(); });
                });
            },
            files(el, t, reload) {
                el.innerHTML = `<div class="adm-card"><div class="card-head"><h2>Files</h2>${t.allowed.edit ? `<label class="btn btn--primary btn--sm file-btn">Upload file<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" data-up hidden></label>` : ""}</div>
                    <p class="muted">PDF or images, up to 6 MB. Stored privately in KCM's Google Drive; only staff who can open this ticket can download them.</p>
                    ${t.files.length ? `<ul class="file-list">${t.files.map(f => `<li><span>📄 <strong>${esc(f.name)}</strong> <span class="muted">${Math.round(f.size / 1024)} KB · ${esc(staffName(f.uploadedBy))} · ${fmtDate(f.uploadedAt)}</span></span><button type="button" class="btn btn--ghost btn--sm" data-dl="${esc(f.id)}">Open</button></li>`).join("")}</ul>` : `<p class="muted">No files yet.</p>`}</div>`;
                $("[data-up]", el)?.addEventListener("change", async e => {
                    const file = e.target.files[0]; if (!file) return;
                    try { const dataUrl = await window.KCM.readDocument(file); await get("uploadTicketFile", { ref: t.ref, name: file.name, dataUrl }); toast("File uploaded"); reload(); } catch (err) { toast(err.message, true); }
                });
                el.addEventListener("click", async e => {
                    const d = e.target.closest("[data-dl]"); if (!d) return;
                    const w = window.open("", "_blank");
                    try {
                        const r = await get("getTicketFile", { id: d.dataset.dl });
                        const [head, b64] = r.dataUrl.split(","), bin = atob(b64), arr = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
                        const u = URL.createObjectURL(new Blob([arr], { type: head.slice(5).split(";")[0] }));
                        if (w) w.location = u; else location.href = u;
                    } catch (err) { w?.close(); toast(err.message, true); }
                });
            },
            hist(el, t) {
                el.innerHTML = `<div class="adm-card"><div class="card-head"><h2>Activity & audit history</h2><p>Append-only: who did what, when</p></div>
                    ${t.history.length ? `<ul class="hist-list">${t.history.map(h => `<li><time>${fmtWhen(h.time)}</time><strong>${esc(staffName(h.actor))}</strong> <span>${esc(actionLabel(h.action))}</span>${h.details ? `<code>${esc(prettyDetails(h.details))}</code>` : ""}</li>`).join("")}</ul>` : `<p class="muted">No history yet.</p>`}</div>`;
            },
        };
        const KIND = { internal: ["Internal", "muted"], customer: ["Customer communication", "info"], supplier: ["Supplier", "warn"], handover: ["Handover", "good"], decision: ["Decision", "info"], problem: ["Problem", "bad"] };
        const noteItem = n => `<li class="tl tl--${esc(n.kind)}"><div class="tl-head"><span class="status status--${(KIND[n.kind] || KIND.internal)[1]}">${(KIND[n.kind] || KIND.internal)[0]}</span>${n.channel ? `<span class="muted">${esc(n.channel)}</span>` : ""}<strong>${esc(staffName(n.author))}</strong><time>${fmtWhen(n.created)}</time></div><p>${nl(n.content)}</p></li>`;
        const ACTION_LABELS = { ticket_created: "created the ticket", ticket_updated: "updated details", status_changed: "changed status", response_status: "updated customer response", ticket_assigned: "assigned", ticket_reassigned: "reassigned (handover)",
            note_added: "added a note", task_created: "created a task", task_updated: "updated a task", tasks_moved: "moved open tasks", checklist_updated: "updated the checklist", checklist_item_added: "added a checklist item", checklist_template_applied: "applied a checklist template",
            quote_version_created: "created a quotation version", quote_draft_updated: "edited a draft quotation", quote_submit: "submitted a quotation for approval", quote_approve: "approved a quotation", quote_send: "sent a quotation", quote_accept: "recorded acceptance", quote_decline: "recorded a decline", quote_reopen: "returned a quotation to draft",
            payment_recorded: "recorded a payment (unverified)", payment_verified: "verified a payment", payment_rejected: "rejected a payment", payment_voided: "voided a payment record", refund_requested: "requested a refund", refund_approved: "approved a refund", refund_rejected: "rejected a refund", payment_status: "payment status changed",
            supplier_quote_added: "recorded a supplier quote", supplier_quote_updated: "updated a supplier quote", file_uploaded: "uploaded a file", customer_updated: "updated the customer", sign_in: "signed in" };
        const actionLabel = a => ACTION_LABELS[a] || String(a || "").replace(/_/g, " ");
        const prettyDetails = d => { try { const o = JSON.parse(d); return Object.entries(o).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" → ") : typeof v === "object" ? JSON.stringify(v) : v}`).join(" · "); } catch { return d; } };

        /* ---------- quotations tab ---------- */
        function quotesTab(el, t, reload) {
            const A = t.allowed, latest = t.quotes[0];
            const card = q => {
                const btn = (step, label, cls = "btn--ghost") => `<button type="button" class="btn ${cls} btn--sm" data-qstep="${step}" data-q="${esc(q.id)}">${label}</button>`;
                const acts = [];
                if (q.status === "Draft" && A.quotePrepare) { acts.push(`<button type="button" class="btn btn--ghost btn--sm" data-qedit="${esc(q.id)}">Edit</button>`); acts.push(A.quoteApprove ? btn("approve", "Approve", "btn--primary") : btn("submit", "Submit for approval", "btn--primary")); }
                if (q.status === "Awaiting approval" && A.quoteApprove) { acts.push(btn("approve", "Approve", "btn--primary")); acts.push(btn("reopen", "Send back")); }
                if (q.status === "Approved" && A.edit) acts.push(`<button type="button" class="btn btn--primary btn--sm" data-qsend="${esc(q.id)}">Send to customer</button>`);
                if (["Sent", "Expired"].includes(q.status) && A.edit) { acts.push(btn("accept", "Customer accepted", "btn--primary")); acts.push(btn("decline", "Customer declined")); }
                return `<article class="q-card q--${esc(q.status.toLowerCase().replace(/\s/g, "-"))}">
                    <header><h3>Version ${q.version}</h3><span class="status status--${q.status === "Accepted" ? "good" : ["Declined", "Expired"].includes(q.status) ? "bad" : q.status === "Superseded" ? "muted" : "warn"}">${esc(q.status)}</span></header>
                    <dl class="q-sum"><div><dt>Total</dt><dd>${money(q.final)}</dd></div><div><dt>Deposit</dt><dd>${money(q.deposit)} (${q.depositPct}%)</dd></div>${q.vat ? `<div><dt>VAT (${q.vatMode})</dt><dd>${money(q.vat)}</dd></div>` : ""}${q.cost ? `<div><dt>Supplier costs</dt><dd>${money(q.cost)}</dd></div><div><dt>Margin</dt><dd>${money(q.margin)}</dd></div>` : ""}${q.validUntil ? `<div><dt>Valid until</dt><dd>${fmtDate(q.validUntil)}</dd></div>` : ""}</dl>
                    ${q.lines.length ? `<details><summary>Cost lines (${q.lines.length})</summary><table class="table"><tbody>${q.lines.map(l => `<tr><td>${esc(l.category)}</td><td>${esc(l.description)}${l.supplier ? `<span>${esc(l.supplier)}</span>` : ""}</td><td class="num">${money(l.cost)}</td></tr>`).join("")}</tbody></table></details>` : ""}
                    <p class="muted q-trail">Prepared by ${esc(staffName(q.preparedBy))} ${fmtWhen(q.preparedAt)}${q.approvedBy ? ` · approved by ${esc(staffName(q.approvedBy))} ${fmtWhen(q.approvedAt)}` : ""}${q.sentAt ? ` · sent ${fmtWhen(q.sentAt)}` : ""}${q.acceptedAt ? ` · accepted ${fmtWhen(q.acceptedAt)}` : ""}${q.declinedAt ? ` · declined ${fmtWhen(q.declinedAt)}` : ""}</p>
                    ${q.notes ? `<p>${nl(q.notes)}</p>` : ""}
                    ${acts.length ? `<div class="btn-row">${acts.join("")}</div>` : ""}</article>`;
            };
            el.innerHTML = `<div class="adm-card"><div class="card-head"><h2>Quotations</h2>${A.quotePrepare ? `<button class="btn btn--primary btn--sm" type="button" data-qnew>${latest ? "New version" : "Prepare quotation"}</button>` : ""}</div>
                <p class="muted">Every saved revision is kept. Amounts (VAT, total, deposit, margin) are calculated by the server. A quotation must be approved by management before it is sent.</p>
                ${t.quotes.length ? t.quotes.map(card).join("") : empty("No quotation yet", "Compile supplier costs, set the selling price and deposit, then send it for approval.")}</div>`;
            el.addEventListener("click", e => {
                if (e.target.closest("[data-qnew]")) quoteEditor(t, latest && latest.status === "Draft" ? latest : null, latest, reload);
                const ed = e.target.closest("[data-qedit]"); if (ed) quoteEditor(t, t.quotes.find(q => q.id === ed.dataset.qedit), null, reload);
                const st = e.target.closest("[data-qstep]");
                if (st) {
                    const step = st.dataset.qstep, labels = { submit: "Submit for approval", approve: "Approve quotation", reopen: "Send back to draft", accept: "Record customer acceptance", decline: "Record customer decline" };
                    modal(labels[step], `<div class="field"><label>Note (optional)</label><textarea name="note" maxlength="1000" placeholder="${step === "accept" ? "How did the customer accept? (e.g. WhatsApp message 14:05)" : ""}"></textarea></div>`,
                        async f => { await get("quoteAction", { quoteId: st.dataset.q, step, note: f.note.value }); toast("Quotation updated"); reload(); }, { submit: labels[step] });
                }
                const sd = e.target.closest("[data-qsend]");
                if (sd) {
                    const q = t.quotes.find(x => x.id === sd.dataset.qsend), c = t.customer || {};
                    const wa = (c.whatsapp || c.phone || "").replace(/\D/g, "").replace(/^0/, "27");
                    const msg = `Hi ${(c.name || "").split(" ")[0]}, here is your KCM Travel & Tours quotation ${t.ref} (v${q.version}): total ${money(q.final)}, deposit to secure ${money(q.deposit)}${q.validUntil ? ", valid until " + fmtDate(q.validUntil) : ""}. Reply here to accept.`;
                    modal(`Send quotation v${q.version}`, `
                        ${c.email ? `<label class="check field"><input type="checkbox" name="email" checked><span>Email the quotation to ${esc(c.email)} (sent by the KCM system)</span></label>` : `<p class="muted">No email address on file.</p>`}
                        <div class="field"><label>Also shared via</label><select name="channel">${opt(["", "WhatsApp", "Phone call", "SMS", "In person"], "")}</select></div>
                        ${wa.length >= 10 ? `<p><a class="btn btn--ghost btn--sm" href="https://wa.me/${esc(wa)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Open WhatsApp with this message</a></p><p class="muted">WhatsApp opens on your device; you press send. The system records that you shared it but can't see the WhatsApp conversation.</p>` : ""}`,
                    async f => { await get("quoteAction", { quoteId: q.id, step: "send", emailCustomer: !!f.email?.checked, channel: f.channel.value }); toast("Quotation marked as sent"); reload(); }, { submit: "Mark as sent" });
                }
            });
        }
        function quoteEditor(t, draft, base, reload) {
            const src = draft || base || { lines: [], depositPct: cfg.depositPct, vatMode: "none" };
            const lines = (src.lines && src.lines.length ? src.lines : t.supplierQuotes.filter(s => s.status !== "Declined").map(s => ({ category: /accommodation|lodge|hotel|room|guest/i.test(s.service) ? "Accommodation" : /transport|vehicle|transfer|car|shuttle/i.test(s.service) ? "Transport" : "Other", description: s.service, supplier: s.supplier, cost: s.amount }))).concat([{}]);
            const lineRow = (l, i) => `<tr data-line><td><select name="cat">${opt(cfg.quoteCategories, l.category || "Accommodation")}</select></td><td><input name="desc" value="${esc(l.description || "")}" placeholder="Description"></td><td><input name="sup" value="${esc(l.supplier || "")}" placeholder="Supplier"></td><td><input name="cost" type="number" min="0" step="0.01" value="${l.cost ?? ""}" placeholder="0"></td><td><button type="button" class="link-btn" data-rm>Remove</button></td></tr>`;
            modal(draft ? `Edit draft v${draft.version}` : base ? `New version (v${base.version + 1})` : "Prepare quotation", `
                <table class="table q-lines"><thead><tr><th>Category</th><th>Description</th><th>Supplier</th><th>Cost (R)</th><th></th></tr></thead><tbody data-lines>${lines.map(lineRow).join("")}</tbody></table>
                <button type="button" class="btn btn--ghost btn--sm" data-addline>Add line</button>
                <div class="form-grid" style="margin-top:14px">
                    <div class="field"><label>Selling price (R)</label><input type="number" min="0" step="0.01" name="selling" value="${src.selling || ""}"></div>
                    <div class="field"><label>…or markup on cost (%)</label><input type="number" min="0" max="500" name="markup" placeholder="e.g. 25"></div>
                    <div class="field"><label>Discount (R)</label><input type="number" min="0" step="0.01" name="discount" value="${src.discount || ""}"></div>
                    <div class="field"><label>VAT treatment</label><select name="vat">${opt([["none", "Not VAT registered / no VAT"], ["inclusive", "Price includes 15% VAT"], ["exclusive", "Add 15% VAT"]], src.vatMode || "none")}</select></div>
                    <div class="field"><label>Deposit (%)</label><input type="number" min="0" max="100" name="dep" value="${src.depositPct ?? cfg.depositPct}"></div>
                    <div class="field"><label>Valid until</label><input type="date" name="valid" value="${dInput(draft?.validUntil) || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)}"></div>
                    <div class="field field--full"><label>Notes for the quotation</label><textarea name="notes" maxlength="1000">${esc(src.notes || "")}</textarea></div>
                </div>
                <p class="q-preview" data-preview></p>`,
            async f => {
                const ls = $$("[data-line]", f).map(r => ({ category: r.querySelector("[name=cat]").value, description: r.querySelector("[name=desc]").value, supplier: r.querySelector("[name=sup]").value, cost: r.querySelector("[name=cost]").value })).filter(l => l.description || l.cost);
                const r = await get("saveQuote", { ref: t.ref, quoteId: draft ? draft.id : undefined, quote: { lines: ls, sellingPrice: f.selling.value, markupPct: f.markup.value, discount: f.discount.value, vatMode: f.vat.value, depositPct: f.dep.value, validUntil: f.valid.value, notes: f.notes.value } });
                toast(`Saved: total ${money(r.calc.final)}, deposit ${money(r.calc.deposit)}`); ticketTab[t.ref] = "quotes"; reload();
            }, { wide: true, submit: "Save quotation", onOpen: f => {
                const preview = () => {
                    const cost = $$("[data-line] [name=cost]", f).reduce((s, x) => s + (Number(x.value) || 0), 0);
                    let sell = Number(f.selling.value) || (f.markup.value ? cost * (1 + Number(f.markup.value) / 100) : 0);
                    const sub = Math.max(0, sell - (Number(f.discount.value) || 0)), vat = f.vat.value === "exclusive" ? sub * 0.15 : f.vat.value === "inclusive" ? sub * 0.15 / 1.15 : 0;
                    const fin = f.vat.value === "exclusive" ? sub + vat : sub;
                    $("[data-preview]", f).textContent = sell ? `Preview: costs ${money(cost)} · total ${money(fin)}${vat ? ` (VAT ${money(vat)})` : ""} · deposit ${money(fin * (Number(f.dep.value) || 0) / 100)} · margin ${money((f.vat.value === "none" ? fin : fin - vat) - cost)}. The server recalculates when you save.` : "Enter a selling price or markup to see the total.";
                };
                f.addEventListener("input", preview);
                f.addEventListener("click", e => {
                    if (e.target.closest("[data-addline]")) { $("[data-lines]", f).insertAdjacentHTML("beforeend", lineRow({}, 0)); }
                    if (e.target.closest("[data-rm]")) { e.target.closest("[data-line]").remove(); preview(); }
                });
                preview();
            } });
        }

        /* ---------- payments tab ---------- */
        function paymentsTab(el, t, reload) {
            const A = t.allowed, m = t.money;
            const vTone = { Verified: "good", Unverified: "warn", Rejected: "bad", Voided: "muted" };
            el.innerHTML = `<div class="adm-card"><div class="card-head"><h2>Payments</h2>${A.payRecord && m.final ? `<button class="btn btn--primary btn--sm" type="button" data-newpay>Record payment</button>` : ""}</div>
                ${m.final ? `<dl class="q-sum pay-sum"><div><dt>Quotation total</dt><dd>${money(m.final)}</dd></div><div><dt>Deposit required</dt><dd>${money(m.deposit)}</dd></div><div><dt>Paid (verified)</dt><dd>${money(m.paid)}</dd></div><div><dt>Awaiting verification</dt><dd>${money(m.unverified)}</dd></div><div><dt>Outstanding</dt><dd><strong>${money(m.outstanding)}</strong></dd></div><div><dt>Status</dt><dd>${payBadge(t.paymentStatus)}</dd></div></dl>`
                    : `<p class="muted">Payments can be recorded once the customer has accepted a quotation.</p>`}
                <p class="muted">Recorded payments stay <strong>unverified</strong> until someone in finance (not the person who recorded it) checks the bank statement or payment gateway. A screenshot from a customer is not proof of payment. Refunds are recorded by finance and approved by a manager, never by the person who recorded them.</p>
                ${t.payments.length ? `<ul class="pay-list">${t.payments.map(p => `<li class="${p.verification === "Voided" ? "is-void" : ""}">
                    <div><strong>${esc(p.type[0].toUpperCase() + p.type.slice(1))} · ${money(p.amount)}</strong> <span class="status status--${vTone[p.verification] || "muted"}">${esc(p.verification)}</span>${p.approvalStatus ? ` <span class="status status--${p.approvalStatus === "Approved" ? "good" : p.approvalStatus === "Rejected" ? "bad" : "warn"}">${esc(p.approvalStatus)}</span>` : ""}
                    <span>${esc(p.method)}${p.reference ? " · ref " + esc(p.reference) : ""} · paid ${fmtDate(p.paidOn)} · recorded by ${esc(staffName(p.recordedBy))}${p.verifiedBy ? ` · ${p.verification.toLowerCase()} by ${esc(staffName(p.verifiedBy))} ${fmtWhen(p.verifiedAt)}` : ""}${p.verificationSource ? " (" + esc(p.verificationSource) + ")" : ""}${p.voidReason ? " · void: " + esc(p.voidReason) : ""}</span></div>
                    <div class="btn-row">${A.payVerify && p.verification === "Unverified" && p.type !== "refund" ? `<button type="button" class="btn btn--primary btn--sm" data-verify="${esc(p.id)}">Verify</button><button type="button" class="btn btn--ghost btn--sm" data-reject="${esc(p.id)}">Reject</button>` : ""}
                    ${A.refundApprove && p.approvalStatus === "Pending approval" ? `<button type="button" class="btn btn--primary btn--sm" data-refund="${esc(p.id)}">Approve refund</button><button type="button" class="btn btn--ghost btn--sm" data-refundno="${esc(p.id)}">Reject</button>` : ""}
                    ${A.payVerify && p.verification !== "Voided" ? `<button type="button" class="link-btn" data-void="${esc(p.id)}">Void record</button>` : ""}</div></li>`).join("")}</ul>` : ""}</div>`;
            paymentHandlers(el, reload, t);
        }
        function paymentHandlers(el, reload, t) {
            el.addEventListener("click", e => {
                if (e.target.closest("[data-newpay]")) {
                    const key = uuid();
                    modal(`Record a payment on ${t.ref}`, `
                        <div class="field-row"><div class="field"><label>Type</label><select name="type">${opt([["deposit", "Deposit"], ["instalment", "Instalment"], ["balance", "Balance"]].concat(t.allowed.payVerify ? [["refund", "Refund (a manager approves it)"]] : []), t.money.paid ? "balance" : "deposit")}</select></div>
                        <div class="field"><label>Amount (R)</label><input type="number" min="0.01" step="0.01" name="amount" value="${t.money.paid ? t.money.outstanding : t.money.deposit}" required></div></div>
                        <div class="field-row"><div class="field"><label>Method</label><select name="method">${opt(cfg.paymentMethods, "EFT")}</select></div>
                        <div class="field"><label>Payment reference</label><input name="reference" maxlength="60" placeholder="Bank / gateway reference"></div></div>
                        <div class="field"><label>Date paid</label><input type="date" name="paidOn" value="${today()}" max="${today()}"></div>
                        <div class="field"><label>Notes</label><textarea name="notes" maxlength="500"></textarea></div>`,
                    async f => { const r = await get("recordPayment", { ref: t.ref, idempotencyKey: key, payment: { type: f.type.value, amount: f.amount.value, method: f.method.value, reference: f.reference.value, paidOn: f.paidOn.value, notes: f.notes.value } }); toast(r.duplicate ? "Already recorded" : "Payment recorded (unverified)"); reload(); }, { submit: "Record payment" });
                }
                const v = e.target.closest("[data-verify],[data-reject]");
                if (v) {
                    const id = v.dataset.verify || v.dataset.reject, ok = !!v.dataset.verify;
                    modal(ok ? "Verify payment" : "Reject payment", `<div class="field"><label>${ok ? "How did you verify it? *" : "Reason"}</label><input name="source" maxlength="120" placeholder="${ok ? "e.g. FNB statement 19 Nov, line 14" : "e.g. not on bank statement"}" ${ok ? "required" : ""}></div><div class="field"><label>Notes</label><textarea name="notes" maxlength="300"></textarea></div>`,
                        async f => { const r = await get("verifyPayment", { id, decision: ok ? "verify" : "reject", source: f.source.value, notes: f.notes.value }); toast(`Payment ${ok ? "verified" : "rejected"} · ${r.paymentStatus}`); reload(); }, { submit: ok ? "Verify" : "Reject" });
                }
                const rf = e.target.closest("[data-refund],[data-refundno]");
                if (rf) { const id = rf.dataset.refund || rf.dataset.refundno, ok = !!rf.dataset.refund; get("approveRefund", { id, decision: ok ? "approve" : "reject" }).then(r => { toast(`Refund ${ok ? "approved" : "rejected"} · ${r.paymentStatus}`); reload(); }).catch(err => toast(err.message, true)); }
                const vd = e.target.closest("[data-void]");
                if (vd) modal("Void payment record", `<p class="muted">The record stays visible, marked as void. Use this for entries recorded in error.</p><div class="field"><label>Reason *</label><input name="reason" required maxlength="300"></div>`,
                    async f => { await get("voidPayment", { id: vd.dataset.void, reason: f.reason.value }); toast("Payment record voided"); reload(); }, { submit: "Void record" });
            });
        }

        /* =================== INTAKE FORM =================== */
        async function intake() {
            const c = await config(true);
            const mgr = can("ops.assign");
            const b = body();
            let linked = null;
            b.innerHTML = `<form class="adm-card ops-form ops-intake" data-intake novalidate>
                <p class="ops-intro">Register an enquiry that came in by WhatsApp, phone, email, walk-in or social media. You can save it with only the basics and complete the rest later. A ticket number is created when you save.</p>
                <fieldset><legend>A. Enquiry information</legend><div class="form-grid">
                    <div class="field"><label>Enquiry source *</label><select name="source" required>${opt(c.sources, "WhatsApp", "Choose…")}</select></div>
                    <div class="field"><label>Date & time received</label><input type="datetime-local" name="received" value="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}"></div>
                    <div class="field"><label>Enquiry type</label><select name="enquiryType">${opt(c.enquiryTypes, "Package tour")}</select></div>
                    <div class="field"><label>Existing ticket reference</label><input name="existingRef" maxlength="20" placeholder="KCM-2026-000123"></div>
                    ${mgr ? `<div class="field"><label>Priority</label><select name="priority">${opt(c.priorities, "Normal")}</select></div>
                    <div class="field"><label>Assign to</label><select name="assignTo">${opt(c.staff.map(s => [s.email, s.name]), "", "Leave unassigned")}</select></div>` : `<p class="muted field--full">The ticket will be assigned to you.</p>`}
                    <div class="field field--full"><label>Initial enquiry description</label><textarea name="description" maxlength="2000" placeholder="What did the customer ask for, in their words?"></textarea></div>
                    <div class="field field--full"><label>Internal intake notes</label><textarea name="intakeNotes" maxlength="2000"></textarea></div></div></fieldset>
                <fieldset><legend>B. Customer</legend>
                    <div class="field cust-search"><label>Existing customer? Search by name, phone, email or CUS- number</label><input data-csearch autocomplete="off" placeholder="Start typing…"><ul class="cust-results" data-cresults hidden></ul></div>
                    <p class="cust-linked" data-clinked hidden></p>
                    <div class="form-grid" data-cfields>
                        <div class="field"><label>Full name</label><input name="name" maxlength="80"></div>
                        <div class="field"><label>Email</label><input type="email" name="email" maxlength="120"></div>
                        <div class="field"><label>Primary contact number</label><input type="tel" name="phone" maxlength="30"></div>
                        <div class="field"><label>WhatsApp number</label><input type="tel" name="whatsapp" maxlength="30"></div>
                        <div class="field"><label>Alternative number</label><input type="tel" name="altPhone" maxlength="30"></div>
                        <div class="field"><label>Preferred communication</label><select name="preferredComms">${opt(c.comms, "WhatsApp", "—")}</select></div>
                        <div class="field"><label>Location</label><input name="location" maxlength="80"></div>
                        <div class="field"><label>Customer type</label><select name="type">${opt(c.customerTypes, "Individual")}</select></div>
                        <label class="check field field--full"><input type="checkbox" name="consent"><span>The customer agreed that KCM may store and use their details to handle this enquiry (POPIA).</span></label>
                    </div></fieldset>
                <fieldset><legend>C. Travel requirements</legend><div class="form-grid">
                    <div class="field"><label>Preferred destination</label><input name="destination" maxlength="120"></div>
                    <div class="field"><label>More destinations</label><input name="destinations" maxlength="300" placeholder="For multi-stop trips"></div>
                    <div class="field"><label>Travel package</label><input name="package" list="pkg-list2" maxlength="140" placeholder="Choose or type"><datalist id="pkg-list2">${c.packages.map(p => `<option value="${esc(p.title)}">`).join("")}</datalist></div>
                    <label class="check field"><input type="checkbox" name="customTrip"><span>Custom trip</span></label>
                    <div class="field"><label>Departure date</label><input type="date" name="departDate"></div>
                    <div class="field"><label>Return date</label><input type="date" name="returnDate"></div>
                    <div class="field"><label>Nights</label><input type="number" min="0" name="nights"></div>
                    <div class="field"><label>Adults</label><input type="number" min="0" name="adults"></div>
                    <div class="field"><label>Children</label><input type="number" min="0" name="children"></div>
                    <div class="field"><label>Infants</label><input type="number" min="0" name="infants"></div>
                    <div class="field"><label>Pensioners</label><input type="number" min="0" name="pensioners"></div>
                    <p class="field muted" data-total>Total travellers: 0</p>
                    <div class="field"><label>Accommodation type</label><input name="accommodation" maxlength="120" placeholder="Lodge, B&B, self-catering…"></div>
                    <div class="field"><label>Room configuration</label><input name="rooms" maxlength="200" placeholder="e.g. 2 doubles, 1 family room"></div>
                    <div class="field"><label>Transport</label><input name="transport" maxlength="300"></div>
                    <div class="field"><label>Activities & experiences</label><input name="activities" maxlength="400"></div>
                    <div class="field"><label>Meals</label><input name="meals" maxlength="200"></div>
                    <div class="field"><label>Customer budget</label><input name="budget" maxlength="60"></div>
                    <div class="field"><label>Preferred payment arrangement</label><input name="paymentPref" maxlength="60" placeholder="Deposit + balance, full payment…"></div>
                    <div class="check-row field--full"><label class="check"><input type="checkbox" name="airportTransfer"><span>Airport transfers</span></label><label class="check"><input type="checkbox" name="carHire"><span>Car hire</span></label><label class="check"><input type="checkbox" name="insurance"><span>Travel insurance</span></label></div>
                    <div class="field field--full"><label>Special requests</label><textarea name="specialRequests" maxlength="1000"></textarea></div>
                    <div class="field field--full"><label>Accessibility requirements</label><textarea name="accessibility" maxlength="500"></textarea></div></div></fieldset>
                <fieldset><legend>D. Quotation (optional, can be done later)</legend>
                    <p class="muted">Add estimated supplier costs and a selling price to create a draft quotation. VAT, total, deposit and balance are calculated by the server.</p>
                    <div class="form-grid">
                        ${c.quoteCategories.map(cat => `<div class="field"><label>${esc(cat)} costs (R)</label><input type="number" min="0" step="0.01" name="cost_${esc(cat)}"></div>`).join("")}
                        <div class="field"><label>Selling price (R)</label><input type="number" min="0" step="0.01" name="selling"></div>
                        <div class="field"><label>Discount (R)</label><input type="number" min="0" step="0.01" name="discount"></div>
                        <div class="field"><label>VAT treatment</label><select name="vat">${opt([["none", "No VAT"], ["inclusive", "Includes 15% VAT"], ["exclusive", "Add 15% VAT"]], "none")}</select></div>
                        <div class="field"><label>Deposit (%)</label><input type="number" min="0" max="100" name="dep" value="${c.depositPct}"></div>
                        <div class="field"><label>Valid until</label><input type="date" name="valid"></div>
                    </div></fieldset>
                <fieldset><legend>E. Internal processing</legend><div class="form-grid">
                    <div class="field"><label>Next action</label><input name="nextAction" maxlength="200" placeholder="e.g. Check lodge availability"></div>
                    <div class="field"><label>Follow-up date</label><input type="date" name="followUp"></div>
                    ${mgr ? `<div class="field"><label>Processing deadline</label><input type="date" name="deadline"></div>` : ""}
                    <div class="field field--full"><label>Outstanding requirements</label><textarea name="outstanding" maxlength="1000"></textarea></div>
                    <div class="field field--full"><label>Customer communication notes</label><textarea name="commsNotes" maxlength="2000"></textarea></div></div></fieldset>
                <p class="form-error" data-ierr hidden></p>
                <div class="btn-row"><button class="btn btn--primary" type="submit">Save enquiry</button><span class="muted">Only the source and a customer name or number are needed to save.</span></div>
            </form>`;
            const f = $("[data-intake]", b);
            const tot = () => { $("[data-total]", f).textContent = "Total travellers: " + ["adults", "children", "infants", "pensioners"].reduce((s, k) => s + (Number(f[k].value) || 0), 0); };
            f.addEventListener("input", e => { if (["adults", "children", "infants", "pensioners"].includes(e.target.name)) tot(); });
            let st = null;
            $("[data-csearch]", f).addEventListener("input", e => {
                clearTimeout(st); const q = e.target.value.trim(), box = $("[data-cresults]", f);
                if (q.length < 2) { box.hidden = true; return; }
                st = setTimeout(async () => {
                    const list = await get("listCustomers", { q }).catch(() => []);
                    box.innerHTML = list.length ? list.map(x => `<li><button type="button" data-pick="${esc(x.ref)}"><strong>${esc(x.name)}</strong> <span>${esc(x.ref)} · ${esc(x.phone || "")} ${esc(x.email || "")}</span></button></li>`).join("") : `<li class="muted">No match: fill in a new customer below.</li>`;
                    box.hidden = false; box._list = list;
                }, 300);
            });
            f.addEventListener("click", e => {
                const p = e.target.closest("[data-pick]");
                if (p) { linked = $("[data-cresults]", f)._list.find(x => x.ref === p.dataset.pick); $("[data-cresults]", f).hidden = true; $("[data-cfields]", f).hidden = true;
                    $("[data-clinked]", f).innerHTML = `Linked to <strong>${esc(linked.name)}</strong> (${esc(linked.ref)}). <button type="button" class="link-btn" data-unlink>Use a different customer</button>`; $("[data-clinked]", f).hidden = false; }
                if (e.target.closest("[data-unlink]")) { linked = null; $("[data-clinked]", f).hidden = true; $("[data-cfields]", f).hidden = false; }
            });
            f.addEventListener("submit", async e => {
                e.preventDefault();
                const err = $("[data-ierr]", f); err.hidden = true;
                const v = n => f[n] ? (f[n].type === "checkbox" ? (f[n].checked ? "Yes" : "") : f[n].type === "datetime-local" ? isoLocal(f[n].value) : f[n].value) : undefined;
                const fields = {}; ["source", "received", "enquiryType", "description", "intakeNotes", "destination", "destinations", "package", "customTrip", "departDate", "returnDate", "nights", "adults", "children", "infants", "pensioners", "accommodation", "rooms", "transport", "activities", "meals", "budget", "paymentPref", "airportTransfer", "carHire", "insurance", "specialRequests", "accessibility", "nextAction", "followUp", "outstanding", "commsNotes"].forEach(k => { const x = v(k); if (x !== undefined && x !== "") fields[k] = x; });
                if (mgr) { fields.priority = v("priority"); if (v("deadline")) fields.deadline = v("deadline"); }
                const customer = linked ? { customerRef: linked.ref } : { name: v("name"), email: v("email"), phone: v("phone"), whatsapp: v("whatsapp"), altPhone: v("altPhone"), preferredComms: v("preferredComms"), location: v("location"), type: v("type"), consent: f.consent.checked };
                const btn = f.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Saving…";
                try {
                    const r = await get("createTicket", { customer, fields, assignTo: mgr ? v("assignTo") : undefined, existingRef: v("existingRef") });
                    const lines = c.quoteCategories.map(cat => ({ category: cat, description: cat, cost: f["cost_" + cat].value })).filter(l => Number(l.cost) > 0);
                    if (Number(f.selling.value) > 0) {
                        try { await get("saveQuote", { ref: r.ref, quote: { lines, sellingPrice: f.selling.value, discount: f.discount.value, vatMode: f.vat.value, depositPct: f.dep.value, validUntil: f.valid.value } }); }
                        catch (qe) { toast("Ticket saved, but the draft quotation wasn't: " + qe.message, true); }
                    }
                    toast(`Ticket ${r.ref} created${r.existingCustomer ? " (linked to the existing customer)" : ""}`);
                    location.hash = "#ticket/" + encodeURIComponent(r.ref);
                } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; btn.textContent = "Save enquiry"; }
            });
        }

        /* =================== TASKS =================== */
        let taskMode = "mine";
        async function tasks() {
            await config();
            const modes = [["mine", "My open tasks"]].concat(can("ops.view.all") ? [["all", "All open tasks"]] : []).concat([["overdue", "Overdue"], ["done", "Completed"]]);
            const payload = { mine: taskMode === "mine" || !can("ops.view.all") ? true : undefined, open: taskMode !== "done" ? true : undefined };
            let list = await get("listTasks", payload);
            if (taskMode === "overdue") list = list.filter(k => k.overdue);
            if (taskMode === "done") list = list.filter(k => k.status === "COMPLETED").reverse();
            const b = body();
            b.innerHTML = `<div class="adm-card"><div class="toolbar"><div class="chips">${modes.map(([k, l]) => `<button type="button" class="chip ${taskMode === k ? "is-active" : ""}" data-tmode="${k}">${l}</button>`).join("")}</div></div>
                ${list.length ? `<ul class="task-list">${list.map(k => `<li class="task ${k.overdue ? "is-overdue" : ""}"><div><strong>${esc(k.title)}</strong><span>${ticketLink(k.ref)} · ${esc(k.package || "")} · ${esc(staffName(k.assignedTo))}${k.due ? ` · ${k.overdue ? "<b class='overdue-txt'>overdue</b> " : "due "}${fmtDate(k.due)}` : ""} · ${priBadge(k.priority)}</span></div>
                    ${k.status !== "COMPLETED" ? `<div class="task-actions"><select class="status-select" data-task-status="${esc(k.id)}" aria-label="Task status">${opt(cfg.taskStatuses, k.status)}</select><button type="button" class="btn btn--ghost btn--sm" data-task-done="${esc(k.id)}">Done</button></div>` : `<span class="muted">${fmtDate(k.completedAt)}</span>`}</li>`).join("")}</ul>` : empty("No tasks here", taskMode === "overdue" ? "Nothing overdue. Nice work." : "Tasks appear here when they're created on tickets.")}</div>`;
            b.addEventListener("click", e => { const m = e.target.closest("[data-tmode]"); if (m) { taskMode = m.dataset.tmode; tasks(); } });
            taskHandlers(b, tasks);
        }

        /* =================== QUOTATIONS =================== */
        let quoteFilter = "";
        async function quotes() {
            await config();
            const list = await get("listQuotes", quoteFilter ? { status: quoteFilter } : {});
            const b = body();
            const statuses = ["", "Draft", "Awaiting approval", "Approved", "Sent", "Accepted", "Declined", "Expired", "Superseded"];
            b.innerHTML = `<div class="adm-card"><div class="toolbar"><div class="chips">${statuses.map(s => `<button type="button" class="chip ${quoteFilter === s ? "is-active" : ""}" data-qf="${esc(s)}">${s || "All"}</button>`).join("")}</div></div>
                ${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Ticket</th><th>Version</th><th>Status</th><th class="num">Total</th><th class="num">Deposit</th><th>Prepared</th><th>Assigned</th></tr></thead><tbody>${list.map(q => `<tr><td>${ticketLink(q.ref)}<span>${esc(q.package || "")}</span></td><td>v${q.version}</td><td><span class="status status--${q.status === "Accepted" ? "good" : ["Declined", "Expired"].includes(q.status) ? "bad" : q.status === "Superseded" ? "muted" : "warn"}">${esc(q.status)}</span></td><td class="num">${money(q.final)}</td><td class="num">${money(q.deposit)}</td><td>${esc(staffName(q.preparedBy))}<span>${fmtDate(q.preparedAt)}</span></td><td>${esc(staffName(q.assignedTo))}</td></tr>`).join("")}</tbody></table></div>` : empty("No quotations", quoteFilter === "Awaiting approval" ? "Nothing waiting for approval." : "Quotations are prepared inside each ticket.")}</div>`;
            b.addEventListener("click", e => { const x = e.target.closest("[data-qf]"); if (x) { quoteFilter = x.dataset.qf; quotes(); } });
        }

        /* =================== PAYMENTS (finance) =================== */
        let payMode = "verify";
        async function payments() {
            await config();
            const d = await get("listPayments", {});
            const b = body();
            const toVerify = d.payments.filter(p => p.verification === "Unverified" && p.type !== "refund"), refunds = d.payments.filter(p => p.approvalStatus === "Pending approval");
            const modes = [["verify", `Needs verification (${toVerify.length})`], ["refunds", `Refunds to approve (${refunds.length})`], ["balances", "Balances"], ["all", "All payments"]];
            const list = payMode === "verify" ? toVerify : payMode === "refunds" ? refunds : d.payments;
            b.innerHTML = `<div class="adm-card"><div class="toolbar"><div class="chips">${modes.map(([k, l]) => `<button type="button" class="chip ${payMode === k ? "is-active" : ""}" data-pmode="${k}">${l}</button>`).join("")}</div><button type="button" class="btn btn--ghost btn--sm" data-pcsv>CSV</button></div>
                ${payMode === "balances" ? (d.tickets.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Ticket</th><th>Payment status</th><th class="num">Total</th><th class="num">Deposit</th><th class="num">Paid (verified)</th><th class="num">Unverified</th><th class="num">Outstanding</th></tr></thead><tbody>${d.tickets.map(x => `<tr><td>${ticketLink(x.ref)}<span>${esc(x.package || "")} · ${esc(x.opStatus)}</span></td><td>${payBadge(x.status)}</td><td class="num">${money(x.final)}</td><td class="num">${money(x.deposit)}</td><td class="num">${money(x.paid)}</td><td class="num">${money(x.unverified)}</td><td class="num"><strong>${money(x.outstanding)}</strong></td></tr>`).join("")}</tbody></table></div>` : empty("No accepted quotations yet", "Balances appear once customers accept quotations."))
                    : list.length ? `<ul class="pay-list">${list.map(p => `<li class="${p.verification === "Voided" ? "is-void" : ""}"><div><strong>${ticketLink(p.ref)} · ${esc(p.type)} · ${money(p.amount)}</strong> <span class="status status--${p.verification === "Verified" ? "good" : p.verification === "Unverified" ? "warn" : p.verification === "Rejected" ? "bad" : "muted"}">${esc(p.verification)}</span>${p.approvalStatus ? ` <span class="status status--warn">${esc(p.approvalStatus)}</span>` : ""}
                        <span>${esc(p.method)}${p.reference ? " · ref " + esc(p.reference) : ""} · paid ${fmtDate(p.paidOn)} · recorded by ${esc(staffName(p.recordedBy))} ${fmtWhen(p.recordedAt)}${p.notes ? " · " + esc(p.notes) : ""}${p.verificationSource ? " · " + esc(p.verificationSource) : ""}</span></div>
                        <div class="btn-row">${p.verification === "Unverified" && p.type !== "refund" && can("pay.verify") ? (p.recordedBy === me().email && me().role !== "SUPER_ADMIN" ? `<span class="muted">Recorded by you: someone else must verify</span>` : `<button type="button" class="btn btn--primary btn--sm" data-verify="${esc(p.id)}">Verify</button><button type="button" class="btn btn--ghost btn--sm" data-reject="${esc(p.id)}">Reject</button>`) : ""}
                        ${p.approvalStatus === "Pending approval" && can("pay.refund.approve") ? (p.recordedBy === me().email ? `<span class="muted">Requested by you: needs another approver</span>` : `<button type="button" class="btn btn--primary btn--sm" data-refund="${esc(p.id)}">Approve refund</button><button type="button" class="btn btn--ghost btn--sm" data-refundno="${esc(p.id)}">Reject</button>`) : ""}</div></li>`).join("")}</ul>`
                        : empty("Nothing here", payMode === "verify" ? "No payments are waiting for verification." : "No payments yet.")}</div>`;
            b.addEventListener("click", e => {
                const m = e.target.closest("[data-pmode]"); if (m) { payMode = m.dataset.pmode; payments(); }
                if (e.target.closest("[data-pcsv]")) downloadCsv(`kcm-payments-${today()}.csv`, d.payments, ["ref", "type", "amount", "method", "reference", "paidOn", "recordedBy", "recordedAt", "verification", "verifiedBy", "verifiedAt", "verificationSource", "approvalStatus", "notes"]);
            });
            paymentHandlers(b, payments, { ref: "", money: {}, allowed: {} });
        }

        /* =================== WORKLOAD =================== */
        async function workload() {
            await config();
            const list = await get("workload");
            const b = body();
            b.innerHTML = `<div class="adm-grid"><div class="adm-card adm-span-3"><div class="card-head"><h2>Active tickets per employee</h2><p>overdue in brackets</p></div><div data-wl></div></div>
                <div class="adm-card adm-span-3"><div class="table-wrap"><table class="table"><thead><tr><th>Employee</th><th class="num">Active</th><th class="num">Overdue tickets</th><th class="num">Supporting</th><th class="num">Open tasks</th><th class="num">Overdue tasks</th><th class="num">Completed (month)</th><th>Last activity</th></tr></thead><tbody>
                ${list.map(w => `<tr class="${w.overdueTickets || w.overdueTasks ? "is-overdue" : ""}"><td><strong>${esc(w.name)}</strong><span>${esc((cfg.staff.find(s => s.email === w.email) || {}).jobTitle || ROLE_LABEL[w.role] || w.role)}</span></td><td class="num"><a href="#tickets" data-emp="${esc(w.email)}">${w.activeTickets}</a></td><td class="num">${w.overdueTickets}</td><td class="num">${w.supporting}</td><td class="num">${w.openTasks}</td><td class="num">${w.overdueTasks}</td><td class="num">${w.completedThisMonth} <span>${w.tasksDoneThisMonth} tasks</span></td><td>${w.lastActivity ? fmtWhen(w.lastActivity) : "—"}</td></tr>`).join("")}</tbody></table></div></div></div>`;
            if (list.length) hBars($("[data-wl]", b), list.map(w => ({ label: `${w.name}${w.overdueTickets + w.overdueTasks ? ` (${w.overdueTickets + w.overdueTasks})` : ""}`, value: w.activeTickets })));
            b.addEventListener("click", e => { const a = e.target.closest("[data-emp]"); if (a) { (filters.tickets ||= { sort: "updated" }).assignee = a.dataset.emp; } });
        }

        /* =================== SETTINGS: checklist templates & custom statuses =================== */
        async function settings() {
            const c = await config(true);
            const tpls = await get("listTemplates");
            const b = body();
            b.innerHTML = `<div class="adm-grid">
                <div class="adm-card adm-span-2"><div class="card-head"><h2>Checklist templates</h2><button type="button" class="btn btn--primary btn--sm" data-newtpl>New template</button></div>
                    <p class="muted">New tickets get the template that matches their enquiry type. A day tour, for example, skips the accommodation steps.</p>
                    ${tpls.map(t => `<details class="tpl"><summary><strong>${esc(t.name)}</strong> <span class="muted">${t.items.length} items · ${esc(t.appliesTo || "")}</span></summary>
                        <form data-tpl="${esc(t.id)}" class="ops-form"><div class="field"><label>Name</label><input name="name" value="${esc(t.name)}" maxlength="80"></div><div class="field"><label>Used for enquiry types (comma separated)</label><input name="appliesTo" value="${esc(t.appliesTo || "")}"></div>
                        <div class="field"><label>Items: one per line, as <em>Section: item</em></label><textarea name="items" rows="12">${esc(t.items.map(i => i.section + ": " + i.label).join("\n"))}</textarea></div><button class="btn btn--primary btn--sm" type="submit">Save template</button></form></details>`).join("")}</div>
                <div class="adm-card"><div class="card-head"><h2>Extra statuses</h2></div>
                    <p class="muted">The 20 standard statuses and their safeguards can't be removed. Extra statuses sit before "Booking confirmed" and have no special rules.</p>
                    <ul class="mini-list">${c.custom.map(s => `<li><span>${esc(s)}</span><button type="button" class="link-btn" data-rmstatus="${esc(s)}">Remove</button></li>`).join("") || `<li class="muted">None yet.</li>`}</ul>
                    <form data-addstatus class="ops-form"><div class="field"><label>New status</label><input name="name" maxlength="40" placeholder="e.g. VISA PROCESSING"></div><button class="btn btn--ghost btn--sm" type="submit">Add status</button></form></div></div>`;
            b.addEventListener("submit", async e => {
                e.preventDefault();
                const f = e.target;
                try {
                    if (f.matches("[data-tpl]")) { await get("saveTemplate", { id: f.dataset.tpl, name: f.name.value, appliesTo: f.appliesTo.value, items: f.items.value }); toast("Template saved"); }
                    if (f.matches("[data-addstatus]")) { await get("saveCustomStatus", { name: f.name.value }); toast("Status added"); }
                    cfg = null; settings();
                } catch (err) { toast(err.message, true); }
            });
            b.addEventListener("click", async e => {
                const r = e.target.closest("[data-rmstatus]"); if (r) { try { await get("saveCustomStatus", { name: r.dataset.rmstatus, remove: true }); cfg = null; settings(); } catch (err) { toast(err.message, true); } }
                if (e.target.closest("[data-newtpl]")) modal("New checklist template", `<div class="field"><label>Name</label><input name="name" required maxlength="80"></div><div class="field"><label>Used for enquiry types</label><input name="appliesTo" placeholder="e.g. Corporate travel"></div><div class="field"><label>Items (Section: item, one per line)</label><textarea name="items" rows="10" placeholder="Customer requirements: Customer details verified"></textarea></div>`,
                    async f => { await get("saveTemplate", { name: f.name.value, appliesTo: f.appliesTo.value, items: f.items.value }); toast("Template created"); cfg = null; settings(); });
            });
        }

        /* =================== CUSTOMER PROFILE =================== */
        async function customer(ref) {
            await config();
            const d = await get("getCustomer", { ref });
            const c = d.customer, b = body();
            ctx.setTitle(c.name + " · " + c.ref);
            b.innerHTML = `<div class="adm-grid"><form class="adm-card ops-form" data-cust novalidate><div class="card-head"><h2>Customer details</h2><p>${esc(c.ref)} · since ${fmtDate(c.created)}</p></div>
                ${c.status === "erased" ? `<p class="status status--muted">Personal details erased (POPIA)</p>` : `<div class="form-grid">
                <div class="field"><label>Full name</label><input name="name" value="${esc(c.name)}" maxlength="80"></div><div class="field"><label>Email</label><input name="email" type="email" value="${esc(c.email)}"></div>
                <div class="field"><label>Phone</label><input name="phone" value="${esc(c.phone)}"></div><div class="field"><label>WhatsApp</label><input name="whatsapp" value="${esc(c.whatsapp)}"></div>
                <div class="field"><label>Alternative number</label><input name="altPhone" value="${esc(c.altPhone)}"></div><div class="field"><label>Preferred communication</label><select name="preferredComms">${opt(cfg.comms, c.preferredComms, "—")}</select></div>
                <div class="field"><label>Location</label><input name="location" value="${esc(c.location)}"></div><div class="field"><label>Type</label><select name="type">${opt(cfg.customerTypes, c.type)}</select></div></div>
                <p class="muted">POPIA consent: ${c.consentAt ? fmtDate(c.consentAt) + " · " + esc(c.consentSource) : "not recorded"}</p>
                <div class="btn-row"><button class="btn btn--primary btn--sm" type="submit">Save corrections</button>${can("customers.erase") ? `<button type="button" class="btn btn--ghost btn--sm" data-erase>Erase personal data…</button>` : ""}</div>`}</form>
                <div class="adm-card adm-span-2"><div class="card-head"><h2>Enquiries & bookings</h2><p>${d.tickets.length}</p></div>${d.tickets.length ? ticketTable(d.tickets) : `<p class="muted">No tickets you can see.</p>`}</div></div>`;
            $("[data-cust]", b).addEventListener("submit", async e => {
                e.preventDefault(); const f = e.target;
                try { await get("updateCustomer", { ref, customer: { name: f.name.value, email: f.email.value, phone: f.phone.value, whatsapp: f.whatsapp.value, altPhone: f.altPhone.value, preferredComms: f.preferredComms.value, location: f.location.value, type: f.type.value } }); toast("Customer updated"); customer(ref); }
                catch (err) { toast(err.message, true); }
            });
            $("[data-erase]", b)?.addEventListener("click", () => modal("Erase personal data", `<p>This anonymises <strong>${esc(c.name)}</strong>'s personal details across customers, website requests and messages. Booking and financial records are kept for legal retention but no longer identify the person. It cannot be undone.</p><div class="field"><label>Reason / request reference *</label><input name="reason" required maxlength="300" placeholder="e.g. Email request received 19 Nov 2026"></div>`,
                async f => { await get("eraseCustomer", { ref, reason: f.reason.value }); toast("Personal data erased"); customer(ref); }, { submit: "Erase permanently" }));
        }

        /* =================== registry =================== */
        const reg = (view, o) => () => register(view, o);
        return {
            start,
            titles: { workspace: "My Workspace", ops: "Operations Overview", incoming: "Incoming Enquiries", unassigned: "Unassigned Tickets", tickets: "All Tickets", mine: "My Assigned Tickets",
                tasks: "Tasks & Follow-ups", quotes: "Quotations", opsbookings: "Bookings", payments: "Payments", completed: "Completed Orders", workload: "Employee Workload",
                intake: "Register an enquiry", ticket: "Ticket", customer: "Customer", opssettings: "Checklists & statuses" },
            views: {
                workspace, ops: overview, ticket, intake, tasks, quotes, payments, workload, opssettings: settings, customer,
                incoming: reg("incoming", { apiView: "incoming", intro: "New enquiries from Kaycee, the website and staff intake that nobody has reviewed yet.", emptyTitle: "No new enquiries", emptyText: "New website, Kaycee and staff-registered enquiries appear here." }),
                unassigned: reg("unassigned", { apiView: "unassigned", hideAssignee: true, sort: "created", intro: () => can("ops.assign") ? "Open tickets without an owner. Click <b>Unassigned</b> in a row to choose who handles it, or tick several tickets and assign them together." : "Open tickets without an owner. Click <b>Pick up</b> to take one; it moves to My Assigned Tickets and you become responsible for it.", emptyTitle: "Everything is assigned", emptyText: "Every open ticket has an accountable employee." }),
                tickets: reg("tickets", { apiView: "all" }),
                mine: reg("mine", { apiView: "mine", hideAssignee: true, sort: "due", emptyTitle: "No tickets assigned to you" }),
                opsbookings: reg("opsbookings", { apiView: "bookings", intro: "Confirmed bookings (deposit verified and confirmed by management) through to completion.", emptyTitle: "No confirmed bookings yet" }),
                completed: reg("completed", { apiView: "completed", fixedStatus: true, emptyTitle: "No completed orders yet" }),
            },
        };
    };
})();
