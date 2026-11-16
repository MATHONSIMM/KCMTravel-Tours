/* Sign in, account menu and partner registration wizard. Depends on kcm-api.js (window.KCM). */
(() => {
    "use strict";
    const K = window.KCM;
    if (!K) return;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const url = p => K.base + p;
    const ICONS = {
        car: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14a2 2 0 0 1 2 2v4h-2m-14 0H3v-4a2 2 0 0 1 2-2m0 6v2m14-2v2M7 15h.01M17 15h.01"/>',
        bed: '<path d="M3 18V7m0 8h18m0 3v-6a3 3 0 0 0-3-3h-7v6M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
        map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14"/>',
        user: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0"/>',
        spark: '<path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
    };

    /* ---------------- Dialog helpers ---------------- */
    const dialogs = { signin: $("#signin-dialog"), register: $("#register-dialog") };
    function open(name) {
        const d = dialogs[name];
        if (!d) return;
        Object.values(dialogs).forEach(x => { if (x && x !== d && x.open) x.close(); });
        document.body.classList.remove("nav-open");
        if (!d.open) d.showModal();
        if (name === "signin") prepareSignin();
        if (name === "register") reg.start();
    }
    document.addEventListener("click", e => {
        if (e.target.closest("[data-open-signin]")) { e.preventDefault(); open("signin"); }
        if (e.target.closest("[data-open-register]")) { e.preventDefault(); open("register"); }
        const close = e.target.closest("[data-close]");
        if (close) close.closest("dialog")?.close();
    });
    Object.values(dialogs).forEach(d => d?.addEventListener("click", e => { if (e.target === d) d.close(); })); // backdrop
    $$("[data-api-missing]").forEach(el => { el.hidden = K.configured; });

    /* ---------------- Sign-in component (email + password; code to set/reset a password) ---------------- */
    document.addEventListener("click", e => {
        const t = e.target.closest("[data-pw-toggle]"); if (!t) return;
        const input = t.parentElement.querySelector("input"); const show = input.type === "password";
        input.type = show ? "text" : "password"; t.textContent = show ? "Hide" : "Show"; t.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
    function mountSignin(container, onDone) {
        const tpl = $("#tpl-signin");
        if (!tpl || !container) return;
        container.innerHTML = "";
        const node = tpl.content.firstElementChild.cloneNode(true);
        container.appendChild(node);
        const pwForm = $("[data-step-password]", node), emailForm = $("[data-step-email]", node), codeForm = $("[data-step-code]", node);
        const err = $("[data-error]", node);
        const showErr = m => { err.textContent = m || ""; err.hidden = !m; err.classList.toggle("form-error--info", false); };
        const info = m => { showErr(m); err.classList.add("form-error--info"); };
        let email = "";
        const busy = (form, on, label) => { const b = $("button[type=submit]", form); b.disabled = on; if (label) b.textContent = label; };
        const step = f => { [pwForm, emailForm, codeForm].forEach(x => { x.hidden = x !== f; }); showErr(""); };
        const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        const done = r => { K.session.set(r.token, r.user); onDone?.(r.user); };

        // Not connected to the Google Sheet backend yet: let people type, explain on submit instead of freezing the form.
        const notReady = () => { if (K.configured) return false; info("Sign-in isn't switched on yet: the website still has to be connected to the KCM Google Sheet. Please try again soon."); return true; };

        pwForm.addEventListener("submit", async e => {
            e.preventDefault(); showErr("");
            if (notReady()) return;
            email = pwForm.email.value.trim().toLowerCase();
            if (!validEmail(email)) { showErr("Please enter a valid email address."); pwForm.email.focus(); return; }
            if (!pwForm.password.value) { showErr("Please enter your password."); pwForm.password.focus(); return; }
            busy(pwForm, true, "Signing in…");
            try { done(await K.call("signIn", { email, password: pwForm.password.value })); }
            catch (ex) { ex.code === "pending" ? info(ex.message) : showErr(ex.message); }
            busy(pwForm, false, "Sign in");
        });
        $("[data-forgot]", node).addEventListener("click", () => { emailForm.email.value = pwForm.email.value; step(emailForm); emailForm.email.focus(); });
        $("[data-back-password]", node).addEventListener("click", () => step(pwForm));
        emailForm.addEventListener("submit", async e => {
            e.preventDefault(); showErr("");
            if (notReady()) return;
            email = emailForm.email.value.trim().toLowerCase();
            if (!validEmail(email)) { showErr("Please enter a valid email address."); emailForm.email.focus(); return; }
            busy(emailForm, true, "Sending…");
            try {
                await K.call("requestCode", { email });
                $("[data-sent-to]", node).textContent = email;
                step(codeForm); codeForm.code.value = ""; codeForm.code.focus();
            } catch (ex) { showErr(ex.message); }
            busy(emailForm, false, "Email me a code");
        });
        codeForm.addEventListener("submit", async e => {
            e.preventDefault(); showErr("");
            if (notReady()) return;
            const code = codeForm.code.value.replace(/\D/g, "");
            if (code.length !== 6) { showErr("Enter the 6-digit code from the email."); return; }
            const pw = codeForm.password.value;
            if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) { showErr("Your new password needs at least 8 characters, with letters and a number."); codeForm.password.focus(); return; }
            busy(codeForm, true, "Saving…");
            try { done(await K.call("resetPassword", { email, code, password: pw })); }
            catch (ex) { ex.code === "pending" ? info("Your password is saved. " + ex.message) : showErr(ex.message); }
            busy(codeForm, false, "Save password & sign in");
        });
        $("[data-change-email]", node).addEventListener("click", () => { step(emailForm); emailForm.email.focus(); });
        $("[data-resend]", node).addEventListener("click", async () => {
            try { await K.call("requestCode", { email }); info("A new code is on its way."); } catch (ex) { showErr(ex.message); }
        });

        if (K.googleClientId && K.configured) {
            const wrap = $("[data-google-wrap]", node);
            K.loadGoogle().then(google => {
                google.accounts.id.initialize({
                    client_id: K.googleClientId,
                    callback: async resp => {
                        showErr("");
                        try { done(await K.call("googleSignIn", { credential: resp.credential })); }
                        catch (ex) { ex.code === "pending" ? info(ex.message) : showErr(ex.message); }
                    },
                });
                google.accounts.id.renderButton($("[data-google-btn]", node), { theme: "outline", size: "large", shape: "pill", text: "signin_with", width: Math.min(360, Math.max(240, container.clientWidth || 320)) });
                wrap.hidden = false;
            }).catch(() => { wrap.hidden = true; });
        }
    }

    function afterSignin(user) {
        dialogs.signin?.close();
        if (user.isStaff) location.href = url("/admin");
        else location.href = url("/account");
    }
    function prepareSignin() {
        const mount = $("[data-signin-mount]", dialogs.signin);
        const u = K.session.user();
        if (u) {
            mount.innerHTML = `<p class="signin-sent">You're signed in as <strong>${K.esc(u.email)}</strong>.</p>
                <a class="btn btn--primary btn--block" href="${url(u.isStaff ? "/admin" : "/account")}">${u.isStaff ? "Open admin dashboard" : "Go to my account"}</a>`;
            return;
        }
        mountSignin(mount, afterSignin);
    }

    /* ---------------- Header account state ---------------- */
    function initials(u) {
        const src = (u.name || u.email || "?").trim();
        const parts = src.split(/[\s@.]+/).filter(Boolean);
        return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
    }
    function renderHeader(user) {
        const slot = $("[data-auth-slot]");
        const mobile = $("[data-auth-mobile]");
        if (!slot) return;
        if (!user) {
            slot.innerHTML = `<button class="auth-link" type="button" data-open-signin><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg><span>Sign in</span></button>
                <button class="btn btn--outline btn--sm" type="button" data-open-register>Register</button>`;
            if (mobile) mobile.innerHTML = `<button class="btn btn--ghost-light" type="button" data-open-signin>Sign in</button><button class="btn btn--ghost-light" type="button" data-open-register>Register</button>`;
            return;
        }
        const avatar = user.picture ? `<img src="${K.esc(user.picture)}" alt="" referrerpolicy="no-referrer">` : `<span>${K.esc(initials(user))}</span>`;
        slot.innerHTML = `
            <div class="account-menu">
                <button class="account-btn" type="button" aria-haspopup="true" aria-expanded="false" data-account-btn aria-label="Account menu for ${K.esc(user.email)}">
                    <span class="avatar">${avatar}</span><span class="account-name">${K.esc(user.name ? user.name.split(" ")[0] : user.email.split("@")[0])}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                </button>
                <div class="account-pop" role="menu" hidden data-account-pop>
                    <p class="account-who"><strong>${K.esc(user.name || "Signed in")}</strong><span>${K.esc(user.email)}</span><em>${K.esc(user.role)}</em></p>
                    ${user.isStaff ? `<a role="menuitem" href="${url("/admin")}">Admin dashboard</a>` : ""}
                    <a role="menuitem" href="${url("/account")}">My account</a>
                    <button role="menuitem" type="button" data-signout>Sign out</button>
                </div>
            </div>`;
        if (mobile) mobile.innerHTML = `${user.isStaff ? `<a class="btn btn--ghost-light" href="${url("/admin")}">Admin</a>` : ""}<a class="btn btn--ghost-light" href="${url("/account")}">My account</a><button class="btn btn--ghost-light" type="button" data-signout>Sign out</button>`;
    }
    document.addEventListener("click", async e => {
        const btn = e.target.closest("[data-account-btn]");
        const pop = $("[data-account-pop]");
        if (btn && pop) {
            const openNow = pop.hidden;
            pop.hidden = !openNow; btn.setAttribute("aria-expanded", String(openNow));
            return;
        }
        if (pop && !pop.hidden && !e.target.closest(".account-menu")) { pop.hidden = true; $("[data-account-btn]")?.setAttribute("aria-expanded", "false"); }
        if (e.target.closest("[data-signout]")) {
            await K.session.signOut();
            if (/\/(admin|account)\/?$/.test(location.pathname)) location.href = url("/");
        }
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { const p = $("[data-account-pop]"); if (p) p.hidden = true; } });

    K.session.onChange(renderHeader);
    renderHeader(K.session.user());
    K.session.refresh();

    /* ---------------- Registration wizard ----------------
       Steps: 0 type · 1 business · 2 details · 3 photos · 4 documents · 5 account & submit · 6 done.
       Everything stays on the device until Submit; then the account + application are created, files uploaded,
       and the application is submitted (which alerts the KCM team on WhatsApp and by email). */
    const reg = (() => {
        const d = dialogs.register;
        if (!d) return { start() { } };
        const form = $("[data-reg-form]", d);
        const steps = $$("[data-rstep]", d);
        const progress = $$("[data-reg-progress] li", d);
        const nav = $("[data-reg-nav]", d);
        const errEl = $("[data-reg-error]", d);
        const LAST = 5, DONE = 6;
        let step = 0, type = "", photos = {}, docs = {}, appId = null, uploaded = {}, submitting = false, regToken = null;

        const showErr = m => { errEl.textContent = m || ""; errEl.hidden = !m; if (m) errEl.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
        const signedIn = () => !!K.session.user();

        function show(n) {
            step = n;
            steps.forEach(s => { s.hidden = +s.dataset.rstep !== n; });
            progress.forEach((li, i) => { li.classList.toggle("is-current", i === n); li.classList.toggle("is-done", i < n); });
            $("[data-reg-progress]", d).hidden = n === DONE;
            nav.hidden = n === DONE;
            const next = $("[data-reg-next]", nav);
            next.textContent = n === LAST ? "Submit application" : "Next";
            next.disabled = n === LAST && !K.configured;
            $("[data-reg-back]", nav).hidden = n === 0;
            showErr(n === LAST && !K.configured ? "Online registration is being switched on. Please try again shortly." : "");
            if (n === 2) renderDetails();
            if (n === 3) renderPhotos();
            if (n === 4) renderDocs();
            if (n === LAST) renderAccount();
            $(".modal-inner", d).scrollTop = 0;
        }

        function renderTypes() {
            const grid = $("[data-type-grid]", d);
            grid.innerHTML = Object.entries(K.TYPES).map(([k, t]) => `
                <label class="type-card">
                    <input type="radio" name="partnerType" value="${k}" ${type === k ? "checked" : ""}>
                    <span class="type-card-inner">
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[t.icon]}</svg>
                        <strong>${t.label}</strong><span>${t.blurb}</span>
                    </span>
                </label>`).join("");
            grid.addEventListener("change", e => {
                if (e.target.name !== "partnerType") return;
                if (type && type !== e.target.value) { photos = {}; docs = {}; uploaded = {}; }
                type = e.target.value; renderServices();
            });
        }

        function renderServices() {
            const t = K.TYPES[type]; if (!t) return;
            const box = $("[data-services]", d);
            const prev = new Set($$("input[name=services]:checked", box).map(x => x.value));
            box.innerHTML = t.services.map(s => `<label class="check-pill"><input type="checkbox" name="services" value="${K.esc(s)}" ${prev.has(s) ? "checked" : ""}><span>${K.esc(s)}</span></label>`).join("");
        }

        function renderDetails() {
            const t = K.TYPES[type];
            $("[data-details-title]", d).textContent = t.detailsTitle;
            const box = $("[data-details]", d);
            if (box.dataset.type === type) return;
            box.dataset.type = type;
            box.innerHTML = t.fields.map(f => {
                const id = "rd-" + f.key, star = f.req ? " *" : "";
                if (f.multi) return `<fieldset class="field field--full"><legend class="field-legend">${f.label}</legend><div class="check-grid">${f.multi.map(o => `<label class="check-pill"><input type="checkbox" name="d_${f.key}" value="${K.esc(o)}"><span>${K.esc(o)}</span></label>`).join("")}</div></fieldset>`;
                if (f.opts) return `<div class="field"><label for="${id}">${f.label}${star}</label><select id="${id}" name="d_${f.key}" ${f.req ? "required" : ""}><option value="">Choose…</option>${f.opts.map(o => `<option>${K.esc(o)}</option>`).join("")}</select></div>`;
                return `<div class="field"><label for="${id}">${f.label}${star}</label><input id="${id}" name="d_${f.key}" type="${f.type || "text"}" ${f.min !== undefined ? `min="${f.min}"` : ""} ${f.max !== undefined ? `max="${f.max}"` : ""} ${f.ph ? `placeholder="${K.esc(f.ph)}"` : ""} ${f.req ? "required" : ""} ${f.type === "number" ? 'inputmode="numeric"' : ""}></div>`;
            }).join("") + (t.hint ? `<p class="notice notice--soft field--full">${K.esc(t.hint)}</p>` : "");
        }

        function renderPhotos() {
            const t = K.TYPES[type];
            const grid = $("[data-photo-grid]", d);
            const slots = [...t.required.map(l => ({ l, req: true })), ...t.optional.map(l => ({ l, req: false }))];
            $("[data-photo-lead]", d).textContent = type === "vehicle"
                ? "Show the vehicle from every angle: outside front, rear and both sides, plus the interior and boot. Clear, recent photos in daylight. Photos are private and only seen by the KCM review team."
                : type === "accommodation" ? "Show the outside of the property and the rooms guests will use. Clear, recent photos in good light. Photos are private and only seen by the KCM review team."
                : "Clear, recent photos in good light. Photos are private and only seen by the KCM review team.";
            grid.innerHTML = slots.map(({ l, req }) => `
                <div class="photo-slot ${photos[l] ? "has-photo" : ""}" data-slot="${K.esc(l)}">
                    <label class="photo-drop">
                        <input type="file" accept="image/jpeg,image/png,image/webp" data-photo-input="${K.esc(l)}">
                        ${photos[l] ? `<img src="${photos[l]}" alt="${K.esc(l)} photo preview">` : `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`}
                        <span class="photo-label">${K.esc(l)}${req ? ' <em>required</em>' : ''}</span>
                        <span class="photo-action">${photos[l] ? "Replace" : "Add photo"}</span>
                    </label>
                    ${photos[l] && !req ? `<button type="button" class="photo-remove" data-photo-remove="${K.esc(l)}" aria-label="Remove ${K.esc(l)} photo">×</button>` : ""}
                </div>`).join("");
        }
        $("[data-photo-grid]", d)?.addEventListener("change", async e => {
            const input = e.target.closest("[data-photo-input]");
            if (!input || !input.files[0]) return;
            const label = input.dataset.photoInput;
            showErr("");
            const slot = input.closest(".photo-slot"); slot.classList.add("is-busy");
            try { photos[label] = await K.resizeImage(input.files[0]); delete uploaded["p:" + label]; renderPhotos(); }
            catch (ex) { showErr(ex.message); slot.classList.remove("is-busy"); }
        });
        $("[data-photo-grid]", d)?.addEventListener("click", e => {
            const rm = e.target.closest("[data-photo-remove]");
            if (rm) { delete photos[rm.dataset.photoRemove]; renderPhotos(); }
        });

        function renderDocs() {
            const t = K.TYPES[type];
            const all = [...t.documents.map(x => ({ ...x, req: true })), ...(t.optionalDocs || []).map(x => ({ ...x, req: false }))];
            $("[data-doc-list]", d).innerHTML = all.map(x => {
                const f = docs[x.label];
                return `<div class="doc-row ${f ? "has-doc" : ""}">
                    <span class="doc-icon" aria-hidden="true">${f ? "✓" : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>`}</span>
                    <div class="doc-text"><strong>${K.esc(x.label)}${x.req ? ' <em>required</em>' : ' <span class="muted">optional</span>'}</strong>
                        <span>${f ? `${K.esc(f.name)} · ${f.size}` : K.esc(x.hint)}</span></div>
                    <label class="btn btn--outline btn--sm doc-btn">${f ? "Replace" : "Upload"}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" data-doc-input="${K.esc(x.label)}" hidden></label>
                    ${f && !x.req ? `<button type="button" class="photo-remove doc-remove" data-doc-remove="${K.esc(x.label)}" aria-label="Remove ${K.esc(x.label)}">×</button>` : ""}
                </div>`;
            }).join("");
        }
        $("[data-doc-list]", d)?.addEventListener("change", async e => {
            const input = e.target.closest("[data-doc-input]");
            if (!input || !input.files[0]) return;
            const label = input.dataset.docInput, file = input.files[0];
            showErr("");
            input.closest(".doc-row").classList.add("is-busy");
            try {
                const dataUrl = await K.readDocument(file);
                const kb = Math.round(file.size / 1024);
                docs[label] = { dataUrl, name: file.name.slice(0, 40), size: kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : Math.max(1, kb) + " KB" };
                delete uploaded["d:" + label];
            } catch (ex) { showErr(ex.message); }
            renderDocs();
        });
        $("[data-doc-list]", d)?.addEventListener("click", e => {
            const rm = e.target.closest("[data-doc-remove]");
            if (rm) { delete docs[rm.dataset.docRemove]; renderDocs(); }
        });

        function renderAccount() {
            const u = K.session.user();
            $("[data-reg-account]", d).hidden = !!u;
            $("[data-reg-signed]", d).hidden = !u;
            if (u) $("[data-reg-email]", d).textContent = u.email;
            renderReview();
        }

        function collect() {
            const f = form.elements, t = K.TYPES[type];
            const details = {};
            t.fields.forEach(fd => {
                if (fd.multi) details[fd.key] = $$(`input[name=d_${fd.key}]:checked`, form).map(x => x.value);
                else details[fd.key] = (f["d_" + fd.key]?.value || "").trim();
            });
            return {
                partnerType: type,
                contactName: f.contactName.value.trim(), phone: f.phone.value.trim(), businessName: f.businessName.value.trim(),
                regNumber: f.regNumber.value.trim(), province: f.province.value, city: f.city.value.trim(), years: f.years.value,
                website: f.website.value.trim(), description: f.description.value.trim(),
                services: $$("input[name=services]:checked", form).map(x => x.value), details,
            };
        }

        function renderReview() {
            const a = collect(), t = K.TYPES[type];
            const count = Object.keys(photos).length, dcount = Object.keys(docs).length;
            const rows = [
                ["Partner type", t.label], ["Business", a.businessName], ["Contact", `${a.contactName} · ${a.phone}`],
                ["Location", `${a.city}, ${a.province}`], ["Services", a.services.join(", ")],
                ["Details", t.fields.filter(fd => a.details[fd.key] && (!Array.isArray(a.details[fd.key]) || a.details[fd.key].length)).slice(0, 6).map(fd => `${fd.label}: ${[].concat(a.details[fd.key]).join(", ")}`).join(" · ")],
                ["Photos", `${count} photo${count === 1 ? "" : "s"}`], ["Documents", Object.keys(docs).join(", ") || `${dcount}`],
            ];
            $("[data-reg-review]", d).innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${K.esc(v || "-")}</dd></div>`).join("");
        }

        function validate(n) {
            const f = form.elements;
            if (n === 0 && !type) return "Please choose what you'd like to offer.";
            if (n === 1) {
                for (const k of ["contactName", "phone", "businessName", "province", "city", "description"]) {
                    if (!String(f[k].value).trim()) { f[k].focus(); return "Please fill in all the fields marked *."; }
                }
                if (!/^[0-9 +()-]{9,20}$/.test(f.phone.value.trim())) { f.phone.focus(); return "Please enter a valid cell number."; }
                if (!$$("input[name=services]:checked", form).length) return "Please choose at least one service.";
                if (f.description.value.trim().length < 30) { f.description.focus(); return "Please tell us a bit more about your business (at least a sentence or two)."; }
            }
            if (n === 2) {
                for (const fd of K.TYPES[type].fields) {
                    const el = f["d_" + fd.key];
                    if (fd.req && el && !String(el.value).trim()) { el.focus(); return "Please fill in all the fields marked *."; }
                    if (el && fd.type === "number" && el.value !== "" && (+el.value < (fd.min ?? -Infinity) || +el.value > (fd.max ?? Infinity))) { el.focus(); return `Please check "${fd.label}".`; }
                }
            }
            if (n === 3) {
                const missing = K.TYPES[type].required.filter(l => !photos[l]);
                if (missing.length) return "Please add these photos: " + missing.join(", ") + ".";
            }
            if (n === 4) {
                const missing = K.TYPES[type].documents.map(x => x.label).filter(l => !docs[l]);
                if (missing.length) return "Please upload: " + missing.join(", ") + ".";
            }
            if (n === LAST) {
                if (!signedIn()) {
                    const email = f.email.value.trim();
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { f.email.focus(); return "Please enter a valid email address."; }
                    const pw = f.password.value;
                    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) { f.password.focus(); return "Your password needs at least 8 characters, with letters and a number."; }
                    if (pw !== f.password2.value) { f.password2.focus(); return "The two passwords don't match."; }
                }
                if (!f.accurate.checked || !f.consent.checked) return "Please tick both boxes to continue.";
            }
            return "";
        }

        async function submit() {
            if (submitting) return;
            submitting = true;
            const next = $("[data-reg-next]", nav), back = $("[data-reg-back]", nav);
            next.disabled = back.disabled = true;
            const prog = $("[data-upload-progress]", d), bar = $("[data-upload-bar]", d), txt = $("[data-upload-text]", d);
            prog.hidden = false;
            const f = form.elements;
            // a brand-new partner uses a temporary registration token; a signed-in partner uses their own session
            const tok = () => (regToken ? { token: regToken } : {});
            try {
                if (!appId) {
                    txt.textContent = "Saving your details…";
                    if (signedIn()) {
                        appId = (await K.call("submitApplication", { application: collect() })).id;
                    } else {
                        const r = await K.call("registerPartner", { account: { email: f.email.value.trim().toLowerCase(), password: f.password.value, name: f.contactName.value.trim() }, application: collect(), website: f.hpWebsite.value });
                        appId = r.id; regToken = r.token;
                    }
                }
                const files = [...Object.entries(photos).map(([l, u]) => ({ key: "p:" + l, label: l, dataUrl: u, kind: "photo" })),
                    ...Object.entries(docs).map(([l, x]) => ({ key: "d:" + l, label: l, dataUrl: x.dataUrl, kind: "document" }))];
                for (let i = 0; i < files.length; i++) {
                    const x = files[i];
                    bar.style.width = Math.round((i / (files.length + 1)) * 100) + "%";
                    txt.textContent = `Uploading ${i + 1} of ${files.length}: ${x.label}`;
                    if (!uploaded[x.key]) { await K.call("uploadPhoto", { ...tok(), id: appId, label: x.label, dataUrl: x.dataUrl, kind: x.kind }); uploaded[x.key] = true; }
                }
                txt.textContent = "Submitting your application…"; bar.style.width = "95%";
                await K.call("finalizeApplication", { ...tok(), id: appId });
                bar.style.width = "100%";
                $("[data-reg-ref]", d).textContent = appId;
                if (regToken) { try { await K.call("signOut", { token: regToken }); } catch { } }
                show(DONE);
                appId = null; regToken = null; photos = {}; docs = {}; uploaded = {}; type = ""; form.reset();
                $("[data-details]", d).dataset.type = "";
            } catch (ex) {
                const retry = appId ? " Your details are saved. Press Submit again to retry." : "";
                if (ex.code === "exists") showErr(ex.message);
                else showErr(ex.message + retry);
            } finally {
                submitting = false; next.disabled = back.disabled = false; prog.hidden = true;
            }
        }

        nav.addEventListener("click", e => {
            if (e.target.closest("[data-reg-back]")) show(Math.max(0, step - 1));
            if (e.target.closest("[data-reg-next]")) {
                const m = validate(step);
                if (m) { showErr(m); return; }
                if (step === LAST) submit(); else show(step + 1);
            }
        });
        renderTypes();

        return {
            start() {
                $$("[data-api-missing]", d).forEach(el => { el.hidden = K.configured; });
                if (step === DONE) show(0); else show(step);
            },
        };
    })();

    K.openSignin = () => open("signin");
    K.openRegister = () => open("register");
    K.mountSignin = mountSignin;
    if (location.hash === "#register") open("register");
    if (location.hash === "#signin") open("signin");
})();
