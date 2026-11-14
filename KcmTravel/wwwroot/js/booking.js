/* Multi-step booking form with live pricing.
   Mirrors Data/PricingService.cs — the server recalculates the final price on submit. */
(() => {
    "use strict";
    const form = document.querySelector("[data-booking]");
    const dataEl = document.getElementById("booking-data");
    if (!form || !dataEl) return;
    const data = JSON.parse(dataEl.textContent);
    const $ = (s, c = form) => c.querySelector(s);
    const $$ = (s, c = form) => Array.from(c.querySelectorAll(s));
    const fmt = n => "R" + Math.round(n).toLocaleString("en-ZA").replace(/[, ]/g, " ");
    const num = name => Math.max(0, parseInt(form.elements[name]?.value || "0", 10) || 0);

    /* ---------- steps ---------- */
    const steps = $$("[data-step]");
    const progress = $$("[data-progress] li", document);
    let current = 1;

    const show = (n, focus = true) => {
        current = Math.min(Math.max(n, 1), steps.length);
        steps.forEach(s => { s.hidden = +s.dataset.step !== current; });
        progress.forEach((li, i) => {
            li.classList.toggle("is-current", i + 1 === current);
            li.classList.toggle("is-done", i + 1 < current);
        });
        if (current === 5) buildReview();
        if (focus) {
            const card = steps[current - 1];
            card.querySelector("h2")?.setAttribute("tabindex", "-1");
            card.querySelector("h2")?.focus({ preventScroll: true });
            window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 110, behavior: "smooth" });
        }
    };

    const error = (field, msg) => {
        let span = form.querySelector(`[data-valmsg-for="${field}"]`);
        if (!span) {
            const el = form.elements[field];
            const anchor = el instanceof RadioNodeList ? el[0]?.closest(".tour-options, .option-grid") : el?.closest(".field, .stepper");
            span = document.createElement("span");
            span.className = "field-validation-error";
            span.dataset.valmsgFor = field;
            anchor?.after(span);
        }
        span.textContent = msg || "";
        const el = form.elements[field];
        if (el && !(el instanceof RadioNodeList)) el.classList.toggle("input-validation-error", !!msg);
        return !msg;
    };

    const validate = (n) => {
        let ok = true;
        if (n === 1) {
            ok = error("TourSlug", form.elements.TourSlug.value ? "" : "Please choose a trip.") && ok;
            const d = form.elements.StartDate.value;
            const tomorrow = new Date(); tomorrow.setHours(0, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1);
            ok = error("StartDate", !d ? "Please choose a start date." : (new Date(d) < tomorrow ? "Please choose a date from tomorrow onwards." : "")) && ok;
        }
        if (n === 2) ok = error("Adults", num("Adults") + num("Pensioners") < 1 ? "At least one adult or pensioner must travel." : "");
        if (n === 4) {
            const name = form.elements.FullName.value.trim();
            const email = form.elements.Email.value.trim();
            const phone = form.elements.Phone.value.trim();
            ok = error("FullName", name.length < 2 ? "Please tell us your name." : "") && ok;
            ok = error("Email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Please enter a valid email address." : "") && ok;
            ok = error("Phone", !/^[0-9 +()-]{9,20}$/.test(phone) ? "Please enter a valid cell number." : "") && ok;
        }
        if (n === 5) ok = error("Consent", form.querySelector("input[type=checkbox][name=Consent]").checked ? "" : "Please accept the privacy notice so we can contact you.");
        if (!ok) steps[n - 1].querySelector(".input-validation-error, .field-validation-error:not(:empty)")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return ok;
    };

    form.addEventListener("click", e => {
        if (e.target.closest("[data-next-step]")) { if (validate(current)) show(current + 1); }
        if (e.target.closest("[data-prev-step]")) show(current - 1);
        const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
        if (inc || dec) {
            const input = form.elements[(inc || dec).dataset.inc || (inc || dec).dataset.dec];
            const min = parseInt(input.min || "0", 10), max = parseInt(input.max || "60", 10);
            input.value = Math.min(max, Math.max(min, (parseInt(input.value, 10) || 0) + (inc ? 1 : -1)));
            update();
        }
    });

    form.addEventListener("submit", e => {
        for (let i = 1; i <= 5; i++) {
            if (!validate(i)) { e.preventDefault(); show(i); return; }
        }
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true; btn.textContent = "Sending…";
    });

    /* ---------- pricing ---------- */
    const quote = () => {
        const slug = form.elements.TourSlug.value;
        const t = data.tours[slug];
        if (!t) return null;
        const nightsInput = form.elements.Nights;
        let nights = parseInt(nightsInput.value || "0", 10);
        if (isNaN(nights) || nights < t.nights) nights = t.nights;
        const extraNights = nights - t.nights;
        const room = form.elements.Room.value || "double";
        const factor = data.rooms[room] ?? 1;
        const perAdult = (t.price + extraNights * t.extraNight) * factor;
        const adults = num("Adults"), kids = num("Children"), infants = num("Infants"), pens = num("Pensioners");
        const lines = [];
        if (adults) lines.push([`${adults} adult${adults > 1 ? "s" : ""} × ${fmt(perAdult)}`, adults * perAdult]);
        if (pens) lines.push([`${pens} pensioner${pens > 1 ? "s" : ""} × ${fmt(perAdult * (1 - data.pensionerDiscount))}`, pens * perAdult * (1 - data.pensionerDiscount)]);
        if (kids) lines.push([`${kids} child${kids > 1 ? "ren" : ""} × ${fmt(perAdult * data.childRate)}`, kids * perAdult * data.childRate]);
        if (infants) lines.push([`${infants} infant${infants > 1 ? "s" : ""} (free)`, 0]);
        const paying = adults + kids + pens, billNights = Math.max(nights, 1);
        $$("input[name=Extras]:checked").forEach(cb => {
            const x = data.extras[cb.value];
            if (!x) return;
            const amt = x.basis === "person" ? x.price * paying
                : x.basis === "person-night" ? x.price * paying * billNights
                : x.basis === "night" ? x.price * (billNights + 1)
                : x.price;
            lines.push([x.name, amt]);
        });
        const total = Math.round(lines.reduce((s, l) => s + l[1], 0));
        const pay = form.elements.Payment.value;
        const deposit = pay === "full" ? total : Math.round(total * data.depositRate);
        return { t, nights, lines, total, deposit, pay, travellers: paying + infants };
    };

    let lastImg = "";
    const update = () => {
        const q = quote();
        const slug = form.elements.TourSlug.value;
        const t = data.tours[slug];
        const hint = $("[data-nights-hint]");
        if (t) {
            const n = form.elements.Nights;
            n.min = t.nights;
            if ((parseInt(n.value, 10) || 0) < t.nights) n.value = t.nights;
            hint.textContent = t.nights === 0 ? "Day trip. Add nights if you want to stay over." : `The trip includes ${t.nights} night${t.nights > 1 ? "s" : ""}. Extra nights are ${fmt(t.extraNight)} per adult.`;
        }
        const title = document.querySelector("[data-sum-title]");
        const meta = document.querySelector("[data-sum-meta]");
        const list = document.querySelector("[data-sum-lines]");
        const img = document.querySelector("[data-sum-img]");
        if (!q) { list.innerHTML = ""; return; }
        title.textContent = q.t.title;
        const d = form.elements.StartDate.value;
        meta.textContent = `${q.nights === 0 ? "Day trip" : q.nights + " night" + (q.nights > 1 ? "s" : "")} · ${q.travellers} traveller${q.travellers === 1 ? "" : "s"}${d ? " · " + new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : ""}`;
        if (lastImg !== q.t.image) { img.style.opacity = "1"; img.src = q.t.image; lastImg = q.t.image; }
        list.innerHTML = "";
        q.lines.forEach(([label, amt]) => {
            const li = document.createElement("li");
            const a = document.createElement("span"); a.textContent = label;
            const b = document.createElement("span"); b.textContent = fmt(amt);
            li.append(a, b); list.appendChild(li);
        });
        animateNumber(document.querySelector("[data-sum-total]"), q.total);
        document.querySelector("[data-sum-dep]").textContent = fmt(q.deposit);
        document.querySelector("[data-sum-dep-label]").textContent =
            q.pay === "full" ? "Due on confirmation" : q.pay === "layby" ? "Lay-by first payment (30%)" : "30% deposit on confirmation";
    };

    const animateNumber = (el, to) => {
        const from = parseInt((el.textContent || "0").replace(/\D/g, ""), 10) || 0;
        if (from === to) return;
        const t0 = performance.now(), dur = 450;
        const step = (t) => {
            const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(from + (to - from) * e);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const buildReview = () => {
        const q = quote();
        const dl = $("[data-review]");
        if (!q) return;
        const rows = [
            ["Trip", q.t.title],
            ["Start date", form.elements.StartDate.value ? new Date(form.elements.StartDate.value).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "-"],
            ["Nights", q.nights === 0 ? "Day trip" : String(q.nights)],
            ["Travellers", String(q.travellers)],
            ["Name", form.elements.FullName.value],
            ["Contact", `${form.elements.Phone.value} · ${form.elements.Email.value}`],
            ["Estimated total", fmt(q.total)],
        ];
        dl.innerHTML = "";
        rows.forEach(([k, v]) => {
            const div = document.createElement("div");
            const dt = document.createElement("dt"); dt.textContent = k;
            const dd = document.createElement("dd"); dd.textContent = v;
            div.append(dt, dd); dl.appendChild(div);
        });
    };

    form.addEventListener("input", update);
    form.addEventListener("change", update);

    // Start on the first step with a server-side error, otherwise step 1
    const firstErr = form.querySelector(".input-validation-error, .field-validation-error:not(:empty)");
    const errStep = firstErr?.closest("[data-step]")?.dataset.step;
    show(errStep ? +errStep : 1, !!errStep);
    update();
})();
