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

    /* ---------------- Sign-in component ---------------- */
    function mountSignin(container, onDone) {
        const tpl = $("#tpl-signin");
        if (!tpl || !container) return;
        container.innerHTML = "";
        const node = tpl.content.firstElementChild.cloneNode(true);
        container.appendChild(node);
        const emailForm = $("[data-step-email]", node), codeForm = $("[data-step-code]", node);
        const err = $("[data-error]", node);
        const showErr = m => { err.textContent = m || ""; err.hidden = !m; };
        let email = "";
        const busy = (form, on, label) => { const b = $("button[type=submit]", form); b.disabled = on; if (label) b.textContent = label; };

        if (!K.configured) { $$("input,button", node).forEach(x => x.disabled = true); }

        emailForm.addEventListener("submit", async e => {
            e.preventDefault(); showErr("");
            email = emailForm.email.value.trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showErr("Please enter a valid email address."); emailForm.email.focus(); return; }
            busy(emailForm, true, "Sending…");
            try {
                await K.call("requestCode", { email });
                $("[data-sent-to]", node).textContent = email;
                emailForm.hidden = true; codeForm.hidden = false; codeForm.code.value = ""; codeForm.code.focus();
            } catch (ex) { showErr(ex.message); }
            busy(emailForm, false, "Email me a sign-in code");
        });
        codeForm.addEventListener("submit", async e => {
            e.preventDefault(); showErr("");
            const code = codeForm.code.value.replace(/\D/g, "");
            if (code.length !== 6) { showErr("Enter the 6-digit code from the email."); return; }
            busy(codeForm, true, "Checking…");
            try {
                const r = await K.call("verifyCode", { email, code });
                K.session.set(r.token, r.user);
                onDone?.(r.user);
            } catch (ex) { showErr(ex.message); }
            busy(codeForm, false, "Verify & continue");
        });
        codeForm.code.addEventListener("input", () => { if (codeForm.code.value.replace(/\D/g, "").length === 6) codeForm.requestSubmit(); });
        $("[data-change-email]", node).addEventListener("click", () => { codeForm.hidden = true; emailForm.hidden = false; showErr(""); emailForm.email.focus(); });
        $("[data-resend]", node).addEventListener("click", async () => {
            showErr("");
            try { await K.call("requestCode", { email }); showErr("A new code is on its way."); } catch (ex) { showErr(ex.message); }
        });

        if (K.googleClientId && K.configured) {
            const wrap = $("[data-google-wrap]", node);
            K.loadGoogle().then(google => {
                google.accounts.id.initialize({
                    client_id: K.googleClientId,
                    callback: async resp => {
                        showErr("");
                        try {
                            const r = await K.call("googleSignIn", { credential: resp.credential });
                            K.session.set(r.token, r.user);
                            onDone?.(r.user);
                        } catch (ex) { showErr(ex.message); }
                    },
                });
                const btn = $("[data-google-btn]", node);
                google.accounts.id.renderButton(btn, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: Math.min(360, Math.max(240, container.clientWidth || 320)) });
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

    /* ---------------- Registration wizard ---------------- */
    const reg = (() => {
        const d = dialogs.register;
        if (!d) return { start() { } };
        const form = $("[data-reg-form]", d);
        const steps = $$("[data-rstep]", d);
        const progress = $$("[data-reg-progress] li", d);
        const nav = $("[data-reg-nav]", d);
        const errEl = $("[data-reg-error]", d);
        const STATE_KEY = "kcm-reg-draft";
        let step = 0, type = "", photos = {}, appId = null, uploaded = {}, submitting = false;

        const showErr = m => { errEl.textContent = m || ""; errEl.hidden = !m; if (m) errEl.scrollIntoView({ block: "nearest", behavior: "smooth" }); };

        function show(n) {
            step = n;
            steps.forEach(s => { s.hidden = +s.dataset.rstep !== n; });
            progress.forEach((li, i) => { li.classList.toggle("is-current", i === n); li.classList.toggle("is-done", i < n); });
            nav.hidden = n === 0 || n === 6;
            const next = $("[data-reg-next]", nav);
            next.textContent = n === 5 ? "Submit application" : "Next";
            $("[data-reg-back]", nav).hidden = n <= 1;
            showErr("");
            if (n === 3) renderDetails();
            if (n === 4) renderPhotos();
            if (n === 5) renderReview();
            $(".modal-inner", d).scrollTop = 0;
            steps[n]?.querySelector("input, select, textarea, button")?.focus({ preventScroll: true });
        }

        function renderAccount() {
            const u = K.session.user();
            const signed = $("[data-reg-signed]", d);
            const mount = $("[data-reg-signin]", d);
            if (u) { signed.hidden = false; mount.innerHTML = ""; $("[data-reg-email]", d).textContent = u.email; }
            else { signed.hidden = true; mountSignin(mount, () => { renderAccount(); show(1); }); }
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
                if (type && type !== e.target.value) { photos = {}; uploaded = {}; }
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
            try { photos[label] = await K.resizeImage(input.files[0]); delete uploaded[label]; renderPhotos(); }
            catch (ex) { showErr(ex.message); slot.classList.remove("is-busy"); }
        });
        $("[data-photo-grid]", d)?.addEventListener("click", e => {
            const rm = e.target.closest("[data-photo-remove]");
            if (rm) { delete photos[rm.dataset.photoRemove]; renderPhotos(); }
        });

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
            const count = Object.keys(photos).length;
            const rows = [
                ["Partner type", t.label], ["Business", a.businessName], ["Contact", `${a.contactName} · ${a.phone}`],
                ["Location", `${a.city}, ${a.province}`], ["Services", a.services.join(", ")],
                ["Details", t.fields.filter(fd => a.details[fd.key] && (!Array.isArray(a.details[fd.key]) || a.details[fd.key].length)).slice(0, 6).map(fd => `${fd.label}: ${[].concat(a.details[fd.key]).join(", ")}`).join(" · ")],
                ["Photos", `${count} photo${count === 1 ? "" : "s"} ready`],
            ];
            $("[data-reg-review]", d).innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${K.esc(v || "-")}</dd></div>`).join("");
        }

        function validate(n) {
            const f = form.elements;
            if (n === 1 && !type) return "Please choose what you'd like to offer.";
            if (n === 2) {
                for (const k of ["contactName", "phone", "businessName", "province", "city", "description"]) {
                    if (!String(f[k].value).trim()) { f[k].focus(); return "Please fill in all the fields marked *."; }
                }
                if (!/^[0-9 +()-]{9,20}$/.test(f.phone.value.trim())) { f.phone.focus(); return "Please enter a valid cell number."; }
                if (!$$("input[name=services]:checked", form).length) return "Please choose at least one service.";
                if (f.description.value.trim().length < 30) { f.description.focus(); return "Please tell us a bit more about your business (at least a sentence or two)."; }
            }
            if (n === 3) {
                for (const fd of K.TYPES[type].fields) {
                    const el = f["d_" + fd.key];
                    if (fd.req && el && !String(el.value).trim()) { el.focus(); return "Please fill in all the fields marked *."; }
                    if (el && fd.type === "number" && el.value !== "" && (+el.value < (fd.min ?? -Infinity) || +el.value > (fd.max ?? Infinity))) { el.focus(); return `Please check "${fd.label}".`; }
                }
            }
            if (n === 4) {
                const missing = K.TYPES[type].required.filter(l => !photos[l]);
                if (missing.length) return "Please add these photos: " + missing.join(", ") + ".";
            }
            if (n === 5 && (!f.accurate.checked || !f.consent.checked)) return "Please tick both boxes to continue.";
            return "";
        }

        async function submit() {
            if (submitting) return;
            submitting = true;
            const next = $("[data-reg-next]", nav), back = $("[data-reg-back]", nav);
            next.disabled = back.disabled = true;
            const prog = $("[data-upload-progress]", d), bar = $("[data-upload-bar]", d), txt = $("[data-upload-text]", d);
            prog.hidden = false;
            try {
                if (!appId) {
                    txt.textContent = "Saving your details…";
                    const r = await K.call("submitApplication", { application: collect() });
                    appId = r.id;
                    try { sessionStorage.setItem(STATE_KEY, appId); } catch { }
                }
                const labels = Object.keys(photos);
                for (let i = 0; i < labels.length; i++) {
                    const l = labels[i];
                    bar.style.width = Math.round((i / (labels.length + 1)) * 100) + "%";
                    txt.textContent = `Uploading photo ${i + 1} of ${labels.length}: ${l}`;
                    if (!uploaded[l]) { await K.call("uploadPhoto", { id: appId, label: l, dataUrl: photos[l] }); uploaded[l] = true; }
                }
                txt.textContent = "Finishing up…"; bar.style.width = "95%";
                await K.call("finalizeApplication", { id: appId });
                bar.style.width = "100%";
                $("[data-reg-ref]", d).textContent = appId;
                try { sessionStorage.removeItem(STATE_KEY); } catch { }
                show(6);
                appId = null; photos = {}; uploaded = {}; type = ""; form.reset();
                $("[data-details]", d).dataset.type = "";
            } catch (ex) {
                showErr(ex.message + (appId ? " Your details are saved. Press Submit again to retry." : ""));
            } finally {
                submitting = false; next.disabled = back.disabled = false; prog.hidden = true;
            }
        }

        nav.addEventListener("click", e => {
            if (e.target.closest("[data-reg-back]")) show(Math.max(1, step - 1));
            if (e.target.closest("[data-reg-next]")) {
                const m = validate(step);
                if (m) { showErr(m); return; }
                if (step === 5) submit(); else show(step + 1);
            }
        });
        $("[data-reg-signed] [data-reg-next]", d)?.addEventListener("click", () => show(1));
        renderTypes();

        return {
            start() {
                $$("[data-api-missing]", d).forEach(el => { el.hidden = K.configured; });
                form.hidden = !K.configured;
                $("[data-reg-progress]", d).hidden = !K.configured;
                if (!K.configured) return;
                if (step === 6) show(0);
                renderAccount();
                show(K.session.user() ? Math.max(step, 1) : 0);
            },
        };
    })();

    K.openSignin = () => open("signin");
    K.openRegister = () => open("register");
    K.mountSignin = mountSignin;
    if (location.hash === "#register") open("register");
    if (location.hash === "#signin") open("signin");
})();
