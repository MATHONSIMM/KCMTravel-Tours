/* Partner portal (/account): statuses, trips & payouts, statements and ratings.
   Partners only ever receive their own data from the backend (partnerDashboard). */
(() => {
    "use strict";
    window.addEventListener("DOMContentLoaded", () => {
        const K = window.KCM;
        const root = document.querySelector("[data-account-root]");
        if (!K || !root) return;
        const esc = K.esc, R = K.fmtR;
        const $ = (s, c = root) => c.querySelector(s);
        const $$ = (s, c = root) => Array.from(c.querySelectorAll(s));
        const fmtDate = s => s ? new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "";
        const monthName = m => new Date(m + "-01").toLocaleDateString("en-ZA", { month: "short" });
        const preview = new URLSearchParams(location.search).has("preview");
        const STATUS = {
            Uploading: ["Draft", "muted", "Not submitted yet. Add the missing photos and submit it."],
            Pending: ["Submitted", "info", "Received. It's in the queue for our review team."],
            "In review": ["In review", "warn", "A KCM reviewer is checking your details and photos now."],
            "Needs info": ["Action needed", "warn", "We need a bit more from you. See the note, add what's missing and resubmit."],
            Approved: ["Approved", "good", "You're a KCM partner. Trips, payouts and ratings appear below."],
            Rejected: ["Rejected", "bad", "This application wasn't approved. See the note from our team."],
        };
        const STEP = { Uploading: 0, Pending: 1, "In review": 2, "Needs info": 2, Approved: 3, Rejected: 3 };
        let data = null, tab = (location.hash.slice(1) || "overview");

        const call = (action, payload) => preview ? SAMPLE[action](payload) : K.call(action, payload);

        async function render() {
            if (!preview && !K.configured) {
                root.innerHTML = `<div class="step-card"><h2>Coming soon</h2><p>Partner accounts are being set up. Please contact us on WhatsApp in the meantime.</p>
                    <p><a class="btn btn--ghost btn--sm" href="?preview=1">Preview the partner portal with sample data</a></p></div>`;
                return;
            }
            const user = preview ? SAMPLE.me() : K.session.user();
            if (!user) {
                root.innerHTML = `<div class="step-card account-signin"><h2>Sign in to your partner portal</h2><p>Use the email address you registered with.</p><div data-mount></div>
                    <p class="modal-foot">New partner? <button type="button" class="link-btn" data-open-register>Register your business</button></p></div>`;
                K.mountSignin($("[data-mount]"), () => render());
                return;
            }
            root.innerHTML = `
                ${preview ? `<p class="sample-banner">Sample data: this is a preview of what a partner sees.</p>` : ""}
                <div class="portal-head">
                    <div class="portal-who"><span class="avatar avatar--lg">${user.picture ? `<img src="${esc(user.picture)}" alt="" referrerpolicy="no-referrer">` : esc(((user.name || user.email)[0] || "?").toUpperCase())}</span>
                        <div><h2>${esc(user.name || user.email)}</h2><p>${esc(user.email)} · <span class="role-chip">${esc(user.role)}</span></p></div></div>
                    <div class="btn-row">${user.isStaff ? `<a class="btn btn--dark btn--sm" href="${K.base}/admin">Admin dashboard</a>` : ""}
                        <button class="btn btn--primary btn--sm" type="button" data-open-register>Add a business</button>
                        ${preview ? "" : `<button class="btn btn--ghost btn--sm" type="button" data-signout>Sign out</button>`}</div>
                </div>
                <nav class="portal-tabs" role="tablist">
                    ${[["overview", "Overview"], ["listings", "My businesses"], ["payouts", "Trips & payouts"], ["ratings", "Ratings"]].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}">${l}</button>`).join("")}
                </nav>
                <div data-panel><div class="step-card"><p>Loading…</p></div></div>`;
            try {
                data = await call("partnerDashboard");
                showTab(tab);
            } catch (e) { $("[data-panel]").innerHTML = `<div class="step-card"><p class="form-error">${esc(e.message)}</p></div>`; }
        }

        function showTab(t) {
            tab = ["overview", "listings", "payouts", "ratings"].includes(t) ? t : "overview";
            $$("[data-tab]").forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on)); });
            history.replaceState(null, "", (preview ? "?preview=1" : location.pathname + location.search) + "#" + tab);
            const panel = $("[data-panel]");
            if (!data.listings.length && tab !== "overview") { panel.innerHTML = noListings(); return; }
            panel.innerHTML = PANELS[tab]();
            if (tab === "overview") monthChart($("[data-chart]"));
            if (tab === "listings") $$("[data-file]").forEach(loadThumb);
        }

        const noListings = () => `<div class="step-card empty-state"><h2>No businesses yet</h2><p>Register your vehicle, property or service to become a KCM partner.</p><button class="btn btn--primary" type="button" data-open-register>Start an application</button></div>`;
        const stars = n => `<span class="stars-row" aria-label="${n} out of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.round(n) ? "on" : ""}">★</i>`).join("")}</span>`;
        const badge = s => { const [l, tone] = STATUS[s] || [s, "muted"]; return `<span class="status status--${tone}">${esc(l)}</span>`; };

        const PANELS = {
            overview() {
                const t = data.totals, L = data.listings;
                const approved = L.filter(l => l.status === "Approved").length, waiting = L.filter(l => ["Pending", "In review"].includes(l.status)).length, action = L.filter(l => ["Needs info", "Uploading"].includes(l.status)).length;
                if (!L.length) return noListings();
                return `
                    ${action ? `<div class="notice notice--warn">You have ${action} application${action > 1 ? "s" : ""} that need${action > 1 ? "" : "s"} your attention. <button class="link-btn" type="button" data-goto="listings">Open my businesses</button></div>` : ""}
                    <div class="portal-kpis">
                        <div class="pkpi"><span>Businesses</span><strong>${L.length}</strong><em>${approved} approved · ${waiting} waiting</em></div>
                        <div class="pkpi"><span>Trips completed</span><strong>${t.trips}</strong><em>${t.guests} guests served</em></div>
                        <div class="pkpi"><span>Paid to you</span><strong>${R(t.paid)}</strong><em>all time</em></div>
                        <div class="pkpi"><span>Payout pending</span><strong>${R(t.pending)}</strong><em>being processed</em></div>
                        <div class="pkpi"><span>Guest rating</span><strong>${t.ratingCount ? t.rating.toFixed(1) : "—"}</strong><em>${t.ratingCount ? stars(t.rating) + ` ${t.ratingCount} review${t.ratingCount > 1 ? "s" : ""}` : "no ratings yet"}</em></div>
                    </div>
                    <div class="portal-grid">
                        <div class="step-card"><div class="card-head"><h3>Your earnings, last 6 months</h3><button class="link-btn" type="button" data-goto="payouts">Statement</button></div><div data-chart></div></div>
                        <div class="step-card"><div class="card-head"><h3>Your businesses</h3><button class="link-btn" type="button" data-goto="listings">All</button></div>
                            <ul class="mini-list">${L.map(l => `<li><div><strong>${esc(l.businessName)}</strong><span>${esc(l.partnerTypeLabel)}${l.tier ? " · " + esc(l.tier) : ""}</span></div>${badge(l.status)}</li>`).join("")}</ul></div>
                    </div>`;
            },

            listings() {
                return data.listings.map(l => {
                    const [label, , text] = STATUS[l.status] || [l.status, "", ""];
                    const step = STEP[l.status] ?? 1;
                    const steps = ["Submitted", "In review", l.status === "Rejected" ? "Rejected" : "Approved"];
                    const canEdit = ["Needs info", "Uploading"].includes(l.status);
                    return `<article class="step-card app-card" data-app="${esc(l.id)}">
                        <div class="app-card-head">
                            <div><p class="eyebrow">${esc(l.partnerTypeLabel)} · ${esc(l.id)}</p><h3>${esc(l.businessName)}</h3><p class="muted">${esc(l.summary || "")}</p><p class="muted">${esc(l.city)}, ${esc(l.province)} · submitted ${fmtDate(l.created)}</p></div>
                            <div class="app-badges">${badge(l.status)}${l.tier ? `<span class="tier">${esc(l.tier)}</span>` : ""}</div>
                        </div>
                        <ol class="timeline timeline--4">${steps.map((s, i) => `<li class="${i + 1 < step ? "is-done" : i + 1 === step ? "is-current" : ""} ${l.status === "Rejected" && i === 2 ? "is-bad" : ""}">${s}</li>`).join("")}</ol>
                        <p>${esc(text)}</p>
                        ${l.reviewNote ? `<blockquote class="review-note"><strong>Note from KCM:</strong> ${esc(l.reviewNote)}</blockquote>` : ""}
                        ${l.status === "Approved" ? `<div class="listing-stats"><div><strong>${l.trips}</strong><span>trips</span></div><div><strong>${R(l.earned)}</strong><span>earned</span></div><div><strong>${l.ratingCount ? l.rating.toFixed(1) + " ★" : "—"}</strong><span>${l.ratingCount} rating${l.ratingCount === 1 ? "" : "s"}</span></div></div>` : ""}
                        <div class="standard"><p class="field-legend">KCM premium standard</p><ul>
                            <li class="${l.photoCount >= (l.required || []).length + (l.requiredDocuments || []).length ? "ok" : ""}">Photos and ownership documents uploaded</li>
                            <li class="${["In review", "Needs info", "Approved", "Rejected"].includes(l.status) ? "ok" : ""}">Reviewed by the KCM team</li>
                            <li class="${l.status === "Approved" ? "ok" : ""}">Meets the premium standard${l.tier ? ` (${esc(l.tier)})` : ""}</li>
                            <li class="${l.ratingCount && l.rating >= 4 ? "ok" : ""}">Guest rating of 4★ or higher</li>
                        </ul></div>
                        <div class="btn-row"><button class="btn btn--ghost btn--sm" type="button" data-details="${esc(l.id)}">Photos &amp; details</button>
                        ${canEdit ? `<button class="btn btn--primary btn--sm" type="button" data-resubmit="${esc(l.id)}">${l.status === "Uploading" ? "Submit application" : "Resubmit for review"}</button>` : ""}</div>
                        <div class="app-detail" data-detail hidden></div>
                    </article>`;
                }).join("");
            },

            payouts() {
                const t = data.totals, months = [...new Set(data.jobs.map(j => j.date.slice(0, 7)))];
                return `
                    <div class="portal-kpis portal-kpis--3">
                        <div class="pkpi"><span>Trips</span><strong>${t.trips}</strong><em>${R(t.gross)} total trip value</em></div>
                        <div class="pkpi"><span>Paid to you</span><strong>${R(t.paid)}</strong><em>all time</em></div>
                        <div class="pkpi"><span>Pending</span><strong>${R(t.pending)}</strong><em>usually paid within 7 days of the trip</em></div>
                    </div>
                    <div class="step-card">
                        <div class="toolbar">
                            <label class="inline-field">Period <select data-period><option value="">All time</option>${months.map(m => `<option value="${m}">${new Date(m + "-01").toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</option>`).join("")}</select></label>
                            <div class="btn-row"><button class="btn btn--ghost btn--sm" type="button" data-csv>Download CSV</button><button class="btn btn--dark btn--sm" type="button" data-print>Download statement (PDF)</button></div>
                        </div>
                        <div data-jobs>${jobsTable(data.jobs)}</div>
                        <p class="field-hint">KCM's commission is deducted from the trip value. Your payout is what you receive. Questions about a payout? WhatsApp us with the trip number.</p>
                    </div>`;
            },

            ratings() {
                const t = data.totals, total = data.stars.reduce((a, b) => a + b, 0) || 1;
                return `
                    <div class="portal-grid">
                        <div class="step-card rating-summary">
                            <p class="rating-big">${t.ratingCount ? t.rating.toFixed(1) : "—"}</p>${stars(t.rating)}<p class="muted">${t.ratingCount} guest rating${t.ratingCount === 1 ? "" : "s"}</p>
                            <ul class="star-bars">${[5, 4, 3, 2, 1].map(n => `<li><span>${n}★</span><span class="hbar-track"><span class="hbar-fill" style="width:${data.stars[n - 1] / total * 100}%"></span></span><span>${data.stars[n - 1]}</span></li>`).join("")}</ul>
                        </div>
                        <div class="step-card">
                            <div class="card-head"><h3>What guests say</h3></div>
                            ${data.ratings.length ? `<ul class="review-list">${data.ratings.map(r => `<li>${stars(r.stars)}<p>${r.comment ? "“" + esc(r.comment) + "”" : "<span class='muted'>No comment</span>"}</p><span class="muted">${esc(r.guest)} · ${esc(r.business)} · ${fmtDate(r.created)}</span></li>`).join("")}</ul>`
                                : `<p class="muted">No ratings yet. After each trip, KCM sends your guests a short rating link.</p>`}
                        </div>
                    </div>`;
            },
        };

        function jobsTable(jobs) {
            if (!jobs.length) return `<p class="muted" style="padding:20px 0">No trips yet. Once KCM sends you guests, every trip and payout is listed here.</p>`;
            const sum = k => jobs.reduce((s, j) => s + j[k], 0);
            return `<div class="table-wrap"><table class="ptable"><thead><tr><th>Date</th><th>Trip</th><th>Business</th><th class="num">Guests</th><th class="num">Trip value</th><th class="num">Payout</th><th>Status</th></tr></thead>
                <tbody>${jobs.map(j => `<tr><td>${fmtDate(j.date)}<span>${esc(j.id)}</span></td><td>${esc(j.service)}<span>${esc(j.bookingRef || "")}</span></td><td>${esc(j.business)}</td><td class="num">${j.guests}</td><td class="num">${R(j.gross)}</td><td class="num"><strong>${R(j.payout)}</strong><span>${j.commissionPct}% commission</span></td>
                <td><span class="status status--${j.payoutStatus === "Paid" ? "good" : j.payoutStatus === "On hold" ? "bad" : "warn"}">${esc(j.payoutStatus)}</span>${j.paidOn ? `<span>${fmtDate(j.paidOn)}</span>` : ""}</td></tr>`).join("")}</tbody>
                <tfoot><tr><td colspan="3"><strong>Total</strong></td><td class="num">${sum("guests")}</td><td class="num">${R(sum("gross"))}</td><td class="num"><strong>${R(sum("payout"))}</strong></td><td></td></tr></tfoot></table></div>`;
        }

        const periodJobs = () => { const p = $("[data-period]")?.value || ""; return data.jobs.filter(j => !p || j.date.startsWith(p)); };

        function printStatement() {
            const jobs = periodJobs(), p = $("[data-period]").value, user = preview ? SAMPLE.me() : K.session.user();
            const label = p ? new Date(p + "-01").toLocaleDateString("en-ZA", { month: "long", year: "numeric" }) : "All time";
            let el = document.getElementById("print-statement");
            if (!el) { el = document.createElement("div"); el.id = "print-statement"; document.body.appendChild(el); }
            el.innerHTML = `<div class="ps-head"><img src="${K.base}/images/brand/kcm-logo.svg" alt="" width="80"><div><h1>Partner statement</h1><p>KCM Travel Tours (Pty) Ltd · Mbombela, Mpumalanga</p></div></div>
                <dl class="ps-meta"><div><dt>Partner</dt><dd>${esc(user.name || user.email)}<br>${esc(user.email)}</dd></div><div><dt>Period</dt><dd>${esc(label)}</dd></div><div><dt>Issued</dt><dd>${fmtDate(new Date().toISOString())}</dd></div></dl>
                ${jobsTable(jobs)}
                <p class="ps-foot">Payout = trip value less KCM commission. Please keep this statement for your records and tax purposes.</p>`;
            window.print();
        }

        function downloadCsv() {
            const cols = ["date", "id", "bookingRef", "business", "service", "guests", "gross", "commissionPct", "payout", "payoutStatus", "paidOn"];
            const q = v => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
            const csv = [cols.join(","), ...periodJobs().map(j => cols.map(c => q(c === "date" || c === "paidOn" ? (j[c] || "").slice(0, 10) : j[c])).join(","))].join("\n");
            const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `kcm-statement-${$("[data-period]").value || "all"}.csv`; a.click();
        }

        function monthChart(el) {
            if (!el) return;
            const m = data.months, max = Math.max(1, ...m.map(x => x.payout));
            el.innerHTML = `<div class="vbars">${m.map(x => `<div class="vbar" title="${monthName(x.month)}: ${R(x.payout)} · ${x.trips} trips"><span class="vbar-val">${x.payout ? R(x.payout).replace(" 000", "k") : ""}</span><span class="vbar-col"><span style="height:${x.payout / max * 100}%"></span></span><span class="vbar-label">${monthName(x.month)}</span></div>`).join("")}</div>`;
        }

        async function loadDetail(card, id) {
            const box = $("[data-detail]", card);
            box.hidden = !box.hidden;
            if (box.hidden || box.dataset.loaded) return;
            box.innerHTML = "<p>Loading…</p>";
            try {
                const a = await call("getApplication", { id });
                const t = K.TYPES[a.partnerType] || { required: [], optional: [] };
                const canEdit = ["Needs info", "Uploading"].includes(a.status);
                const have = new Set(a.photos.map(p => p.label));
                const missing = (a.required || []).filter(l => !have.has(l));
                const docs = a.documents || [], haveDocs = new Set(docs.map(x => x.label));
                const missingDocs = (a.requiredDocuments || []).filter(l => !haveDocs.has(l));
                const docLabels = [...new Set([...missingDocs, ...(t.documents || []).map(x => x.label), ...(t.optionalDocs || []).map(x => x.label)])];
                box.dataset.loaded = "1";
                box.innerHTML = `${missing.length ? `<p class="notice notice--soft">Missing required photos: <strong>${missing.map(esc).join(", ")}</strong></p>` : ""}
                    ${missingDocs.length ? `<p class="notice notice--soft">Missing documents: <strong>${missingDocs.map(esc).join(", ")}</strong></p>` : ""}
                    <div class="thumb-grid">${a.photos.map(p => `<figure class="thumb" data-file="${esc(p.fileId)}"><div class="thumb-img"></div><figcaption>${esc(p.label)}</figcaption></figure>`).join("") || "<p class='muted'>No photos yet.</p>"}</div>
                    <p class="field-legend" style="margin-top:14px">Documents (private)</p>
                    <ul class="doc-mini">${docs.map(x => `<li>✓ ${esc(x.label)}</li>`).join("") || "<li class='muted'>No documents yet.</li>"}</ul>
                    ${canEdit ? `<div class="add-photo"><label class="field"><span class="field-legend">Add a document</span><select data-add-doc-label>${docLabels.map(l => `<option>${esc(l)}</option>`).join("")}</select></label>
                        <label class="btn btn--outline btn--sm file-btn">Choose PDF or photo<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" data-add-doc hidden></label><span class="muted" data-add-doc-status></span></div>` : ""}
                    ${canEdit ? `<div class="add-photo"><label class="field"><span class="field-legend">Add a photo</span><select data-add-label>${[...new Set([...missing, ...(t.required || []), ...(t.optional || []), "Extra photo"])].map(l => `<option>${esc(l)}</option>`).join("")}</select></label>
                        <label class="btn btn--outline btn--sm file-btn">Choose photo<input type="file" accept="image/jpeg,image/png,image/webp" data-add-file hidden></label><span class="muted" data-add-status></span></div>` : ""}`;
                $$("[data-file]", box).forEach(loadThumb);
            } catch (e) { box.innerHTML = `<p class="form-error">${esc(e.message)}</p>`; }
        }
        async function loadThumb(fig) {
            try { const r = await call("getPhoto", { fileId: fig.dataset.file }); $(".thumb-img", fig).innerHTML = `<img src="${r.dataUrl}" alt="">`; }
            catch { $(".thumb-img", fig).textContent = "—"; }
        }

        root.addEventListener("click", async e => {
            const t = e.target.closest("[data-tab],[data-goto]"); if (t) showTab(t.dataset.tab || t.dataset.goto);
            const det = e.target.closest("[data-details]"); if (det) loadDetail(det.closest("[data-app]"), det.dataset.details);
            if (e.target.closest("[data-print]")) printStatement();
            if (e.target.closest("[data-csv]")) downloadCsv();
            const re = e.target.closest("[data-resubmit]");
            if (re) {
                if (preview) return alert("This is a preview with sample data.");
                re.disabled = true; re.textContent = "Submitting…";
                try { await K.call("finalizeApplication", { id: re.dataset.resubmit }); render(); }
                catch (ex) { re.disabled = false; re.textContent = "Resubmit for review"; alert(ex.message); }
            }
        });
        root.addEventListener("change", async e => {
            if (e.target.closest("[data-period]")) { $("[data-jobs]").innerHTML = jobsTable(periodJobs()); return; }
            const dinput = e.target.closest("[data-add-doc]");
            if (dinput && dinput.files[0]) {
                const card = dinput.closest("[data-app]"), st = $("[data-add-doc-status]", card);
                if (preview) { st.textContent = "Preview only"; return; }
                st.textContent = "Uploading…";
                try {
                    const dataUrl = await K.readDocument(dinput.files[0]);
                    await K.call("uploadPhoto", { id: card.dataset.app, label: $("[data-add-doc-label]", card).value, dataUrl, kind: "document" });
                    st.textContent = "Uploaded ✓";
                    const box = $("[data-detail]", card); delete box.dataset.loaded; box.hidden = true; loadDetail(card, card.dataset.app);
                } catch (ex) { st.textContent = ex.message; }
                dinput.value = ""; return;
            }
            const input = e.target.closest("[data-add-file]");
            if (!input || !input.files[0]) return;
            const card = input.closest("[data-app]"), status = $("[data-add-status]", card);
            if (preview) { status.textContent = "Preview only"; return; }
            status.textContent = "Uploading…";
            try {
                const dataUrl = await K.resizeImage(input.files[0]);
                await K.call("uploadPhoto", { id: card.dataset.app, label: $("[data-add-label]", card).value, dataUrl });
                status.textContent = "Uploaded ✓";
                const box = $("[data-detail]", card); delete box.dataset.loaded; box.hidden = true; loadDetail(card, card.dataset.app);
            } catch (ex) { status.textContent = ex.message; }
            input.value = "";
        });

        /* ---------- sample data for ?preview=1 ---------- */
        const SAMPLE = (() => {
            const day = 86400000, ago = n => new Date(Date.now() - n * day).toISOString();
            const listings = [
                { id: "P-2610-A4LZ", businessName: "Lowveld Executive Transfers", partnerType: "vehicle", partnerTypeLabel: "Vehicle owner", summary: "Toyota · Fortuner 2.8 GD-6 · 2022 · 7 seats · Automatic", city: "Mbombela", province: "Mpumalanga", status: "Approved", tier: "Premium Plus", created: ago(60), photoCount: 8, required: K.TYPES.vehicle.required, reviewNote: "", trips: 14, earned: 23290, rating: 4.8, ratingCount: 9 },
                { id: "P-2611-M3XA", businessName: "Lowveld Executive Transfers (Quantum)", partnerType: "vehicle", partnerTypeLabel: "Vehicle owner", summary: "Toyota · Quantum 2.8 · 2021 · 14 seats · Manual", city: "Mbombela", province: "Mpumalanga", status: "In review", tier: "", created: ago(3), photoCount: 7, required: K.TYPES.vehicle.required, reviewNote: "", trips: 0, earned: 0, rating: 0, ratingCount: 0 },
                { id: "P-2611-K9PW", businessName: "Blyde View Guesthouse", partnerType: "accommodation", partnerTypeLabel: "Accommodation", summary: "Guesthouse · 8 rooms · sleeps 18 · 4 stars", city: "Graskop", province: "Mpumalanga", status: "Needs info", tier: "", created: ago(9), photoCount: 3, required: K.TYPES.accommodation.required, reviewNote: "Please add a photo of the bathroom and the lounge.", trips: 0, earned: 0, rating: 0, ratingCount: 0 },
                { id: "P-2611-T8NB", businessName: "Sabie Shuttle Sedan", partnerType: "vehicle", partnerTypeLabel: "Vehicle owner", summary: "Hyundai · i20 · 2012 · 4 seats", city: "Sabie", province: "Mpumalanga", status: "Rejected", tier: "", created: ago(30), photoCount: 7, required: K.TYPES.vehicle.required, reviewNote: "The vehicle doesn't meet our premium standard yet (age and interior condition).", trips: 0, earned: 0, rating: 0, ratingCount: 0 },
            ];
            const services = ["KMIA airport transfer", "Kruger day safari transport", "Panorama Route day tour", "Hazyview lodge transfer", "Wedding guest shuttle"];
            const jobs = Array.from({ length: 14 }, (_, i) => { const gross = [1100, 3200, 2600, 950, 4800][i % 5]; const paid = i > 2; return { id: `J-26${String(11 - Math.floor(i / 3)).padStart(2, "0")}-${(4000 + i * 91).toString(36).toUpperCase()}`, date: ago(i * 11 + 2), partnerId: "P-2610-A4LZ", business: "Lowveld Executive Transfers", bookingRef: `KCM-26${String(11 - Math.floor(i / 3)).padStart(2, "0")}-${(900 + i * 53).toString(36).toUpperCase()}`, service: services[i % 5], guests: 2 + (i % 5), gross, commissionPct: 15, payout: Math.round(gross * .85), payoutStatus: paid ? "Paid" : (i === 0 ? "Pending" : "Approved"), paidOn: paid ? ago(i * 11 - 3) : "" }; });
            const months = Array.from({ length: 6 }, (_, k) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - k)); const key = d.toISOString().slice(0, 7); const mj = jobs.filter(j => j.date.startsWith(key)); return { month: key, trips: mj.length, payout: mj.reduce((s, j) => s + j.payout, 0) }; });
            const ratings = [["Thandi M.", 5, "Spotless car and Sipho was right on time at KMIA. Felt like VIPs."], ["Pieter V.", 5, "Smooth drive to Skukuza, cold water in the car, great conversation."], ["Megan R.", 4, "Very comfortable. Pickup was 10 minutes late but they let us know."], ["Lerato K.", 5, "Booked again for our anniversary. Highly recommend."], ["Sam O.", 5, ""]].map(([g, s, c], i) => ({ created: ago(i * 9 + 1), partnerId: "P-2610-A4LZ", business: "Lowveld Executive Transfers", guest: g, stars: s, comment: c }));
            const t = { trips: jobs.length, guests: jobs.reduce((s, j) => s + j.guests, 0), gross: jobs.reduce((s, j) => s + j.gross, 0), paid: jobs.filter(j => j.payoutStatus === "Paid").reduce((s, j) => s + j.payout, 0), pending: jobs.filter(j => j.payoutStatus !== "Paid").reduce((s, j) => s + j.payout, 0), rating: 4.8, ratingCount: 9 };
            return {
                me: () => ({ email: "thabo@example.com", name: "Thabo Nkosi", role: "partner", isStaff: false }),
                partnerDashboard: async () => ({ listings, totals: t, months, stars: [0, 0, 0, 2, 7], jobs, ratings }),
                getApplication: async ({ id }) => ({ ...listings.find(l => l.id === id), photos: [], documents: [], requiredDocuments: K.TYPES[listings.find(l => l.id === id).partnerType].documents.map(x => x.label) }),
                getPhoto: async () => { throw new Error("preview"); },
            };
        })();

        if (!preview) K.session.onChange(() => render());
        render();
    });
})();
