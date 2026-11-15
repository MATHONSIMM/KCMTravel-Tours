/* Partner account page: application status, photos and resubmission. */
(() => {
    "use strict";
    window.addEventListener("DOMContentLoaded", () => {
        const K = window.KCM;
        const root = document.querySelector("[data-account-root]");
        if (!K || !root) return;
        const esc = K.esc;
        const fmtDate = s => s ? new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "";
        const STATUS = {
            Uploading: ["Not submitted", "warn", "You started this application but it wasn't submitted. Add the missing photos and submit it."],
            Pending: ["In review", "info", "Our team is reviewing your application. We usually reply within 3 working days."],
            "Needs info": ["Action needed", "warn", "We need a bit more from you. See the note below, add what's missing and resubmit."],
            Approved: ["Approved", "good", "Welcome aboard! Our team will contact you about next steps and banking details."],
            Rejected: ["Not approved", "bad", "Unfortunately this application wasn't approved. You're welcome to apply again in future."],
        };

        if (!K.configured) {
            root.innerHTML = `<div class="step-card"><h2>Coming soon</h2><p>Partner accounts are being set up. Please contact us on WhatsApp in the meantime.</p></div>`;
            return;
        }

        async function render() {
            const user = K.session.user();
            if (!user) {
                root.innerHTML = `<div class="step-card account-signin"><h2>Sign in to your account</h2><p>Use the email address you registered with.</p><div data-mount></div>
                    <p class="modal-foot">New partner? <button type="button" class="link-btn" data-open-register>Register your business</button></p></div>`;
                K.mountSignin(root.querySelector("[data-mount]"), () => render());
                return;
            }
            root.innerHTML = `
                <div class="account-head step-card">
                    <div><p class="eyebrow">Signed in</p><h2>${esc(user.name || user.email)}</h2><p>${esc(user.email)} · <span class="role-chip">${esc(user.role)}</span></p></div>
                    <div class="btn-row">${user.isStaff ? `<a class="btn btn--dark" href="${K.base}/admin">Admin dashboard</a>` : ""}
                    <button class="btn btn--ghost" type="button" data-open-register>Register another business</button>
                    <button class="btn btn--ghost" type="button" data-signout>Sign out</button></div>
                </div>
                <div data-apps><div class="step-card"><p>Loading your applications…</p></div></div>`;
            try {
                const apps = await K.call("myApplications");
                const box = root.querySelector("[data-apps]");
                if (!apps.length) {
                    box.innerHTML = `<div class="step-card empty-state"><h2>No applications yet</h2><p>Register your vehicle, property or service to become a KCM partner.</p><button class="btn btn--primary" type="button" data-open-register>Start an application</button></div>`;
                    return;
                }
                box.innerHTML = apps.map(appCard).join("");
            } catch (e) {
                root.querySelector("[data-apps]").innerHTML = `<div class="step-card"><p class="form-error">${esc(e.message)}</p></div>`;
            }
        }

        function appCard(a) {
            const [label, tone, text] = STATUS[a.status] || [a.status, "info", ""];
            const stepIdx = { Uploading: 0, Pending: 1, "Needs info": 1, Approved: 2, Rejected: 2 }[a.status] ?? 1;
            const canEdit = a.status === "Needs info" || a.status === "Uploading";
            return `<article class="step-card app-card" data-app="${esc(a.id)}">
                <div class="app-card-head">
                    <div><p class="eyebrow">${esc(a.partnerTypeLabel)} · ${esc(a.id)}</p><h3>${esc(a.businessName)}</h3><p class="muted">${esc(a.city)}, ${esc(a.province)} · applied ${fmtDate(a.created)}</p></div>
                    <span class="status status--${tone}">${esc(label)}</span>
                </div>
                <ol class="timeline">${["Submitted", "In review", a.status === "Rejected" ? "Not approved" : "Approved"].map((s, i) => `<li class="${i < stepIdx ? "is-done" : i === stepIdx ? "is-current" : ""}">${s}</li>`).join("")}</ol>
                <p>${esc(text)}</p>
                ${a.reviewNote ? `<blockquote class="review-note"><strong>Note from KCM:</strong> ${esc(a.reviewNote)}</blockquote>` : ""}
                <div class="btn-row"><button class="btn btn--ghost btn--sm" type="button" data-details="${esc(a.id)}">View photos &amp; details</button>
                ${canEdit ? `<button class="btn btn--primary btn--sm" type="button" data-resubmit="${esc(a.id)}">${a.status === "Uploading" ? "Submit application" : "Resubmit for review"}</button>` : ""}</div>
                <div class="app-detail" data-detail hidden></div>
            </article>`;
        }

        async function loadDetail(card, id) {
            const box = card.querySelector("[data-detail]");
            box.hidden = !box.hidden;
            if (box.hidden || box.dataset.loaded) return;
            box.innerHTML = "<p>Loading…</p>";
            try {
                const a = await K.call("getApplication", { id });
                const t = K.TYPES[a.partnerType] || { required: [], optional: [] };
                const canEdit = a.status === "Needs info" || a.status === "Uploading";
                const have = new Set(a.photos.map(p => p.label));
                const missing = (a.required || []).filter(l => !have.has(l));
                box.dataset.loaded = "1";
                box.innerHTML = `
                    ${missing.length ? `<p class="notice notice--soft">Missing required photos: <strong>${missing.map(esc).join(", ")}</strong></p>` : ""}
                    <div class="thumb-grid">${a.photos.map(p => `<figure class="thumb" data-file="${esc(p.fileId)}"><div class="thumb-img"></div><figcaption>${esc(p.label)}</figcaption></figure>`).join("") || "<p class='muted'>No photos yet.</p>"}</div>
                    ${canEdit ? `<div class="add-photo">
                        <label class="field"><span class="field-legend">Add a photo</span>
                        <select data-add-label>${[...new Set([...missing, ...(t.required || []), ...(t.optional || []), "Extra photo"])].map(l => `<option>${esc(l)}</option>`).join("")}</select></label>
                        <label class="btn btn--outline btn--sm file-btn">Choose photo<input type="file" accept="image/jpeg,image/png,image/webp" data-add-file hidden></label>
                        <span class="muted" data-add-status></span></div>` : ""}`;
                box.querySelectorAll("[data-file]").forEach(loadThumb);
            } catch (e) { box.innerHTML = `<p class="form-error">${esc(e.message)}</p>`; }
        }

        async function loadThumb(fig) {
            try {
                const r = await K.call("getPhoto", { fileId: fig.dataset.file });
                fig.querySelector(".thumb-img").innerHTML = `<img src="${r.dataUrl}" alt="">`;
            } catch { fig.querySelector(".thumb-img").textContent = "!"; }
        }

        root.addEventListener("click", async e => {
            const det = e.target.closest("[data-details]");
            if (det) loadDetail(det.closest("[data-app]"), det.dataset.details);
            const re = e.target.closest("[data-resubmit]");
            if (re) {
                re.disabled = true; const old = re.textContent; re.textContent = "Submitting…";
                try { await K.call("finalizeApplication", { id: re.dataset.resubmit }); render(); }
                catch (ex) { re.disabled = false; re.textContent = old; alertIn(re.closest("[data-app]"), ex.message); }
            }
        });
        root.addEventListener("change", async e => {
            const input = e.target.closest("[data-add-file]");
            if (!input || !input.files[0]) return;
            const card = input.closest("[data-app]"), status = card.querySelector("[data-add-status]");
            const label = card.querySelector("[data-add-label]").value;
            status.textContent = "Uploading…";
            try {
                const dataUrl = await K.resizeImage(input.files[0]);
                await K.call("uploadPhoto", { id: card.dataset.app, label, dataUrl });
                status.textContent = "Uploaded ✓";
                const box = card.querySelector("[data-detail]"); delete box.dataset.loaded; box.hidden = true;
                loadDetail(card, card.dataset.app);
            } catch (ex) { status.textContent = ex.message; }
            input.value = "";
        });
        function alertIn(card, msg) {
            let p = card.querySelector(".form-error");
            if (!p) { p = document.createElement("p"); p.className = "form-error"; p.setAttribute("role", "alert"); card.appendChild(p); }
            p.textContent = msg;
        }

        K.session.onChange(() => render());
        render();
    });
})();
