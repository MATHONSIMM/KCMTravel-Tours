/* KCM Travel & Tours — interactions & motion (no dependencies) */
(() => {
    "use strict";
    const doc = document.documentElement;
    doc.classList.add("js");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    /* ---------- Broken image fallback (keeps layout tidy offline) ---------- */
    $$("img").forEach(img => img.addEventListener("error", () => { img.style.opacity = "0"; }, { once: true }));

    /* ---------- Header: solid on scroll, hide on scroll down ---------- */
    const header = $("[data-header]");
    if (header) {
        let lastY = window.scrollY;
        const onScroll = () => {
            const y = window.scrollY;
            header.classList.toggle("is-scrolled", y > 40);
            if (!document.body.classList.contains("nav-open")) {
                header.classList.toggle("is-hidden", y > 400 && y > lastY + 4);
                if (y < lastY - 4) header.classList.remove("is-hidden");
            }
            lastY = y;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Mobile nav ---------- */
    const toggle = $("[data-nav-toggle]");
    if (toggle) {
        const close = () => { document.body.classList.remove("nav-open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Open menu"); };
        toggle.addEventListener("click", () => {
            const open = document.body.classList.toggle("nav-open");
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        });
        $$("[data-nav] a").forEach(a => a.addEventListener("click", close));
        document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    }

    /* ---------- Hero slideshow ---------- */
    const hero = $("[data-hero]");
    if (hero) {
        const slides = $$("[data-slide]", hero);
        const dots = $$("[data-dot]", hero);
        const DURATION = 7000;
        hero.style.setProperty("--slide-ms", DURATION + "ms");
        let index = 0, timer = null, paused = false;

        const go = (n) => {
            const next = (n + slides.length) % slides.length;
            if (next === index) return;
            slides[index].classList.remove("is-active");
            slides[index].setAttribute("aria-hidden", "true");
            $$("a", slides[index]).forEach(a => a.tabIndex = -1);
            dots[index].classList.remove("is-active");
            dots[index].setAttribute("aria-selected", "false");
            index = next;
            const img = $("img", slides[index]);
            if (img && img.loading === "lazy") img.loading = "eager";
            slides[index].classList.add("is-active");
            slides[index].removeAttribute("aria-hidden");
            $$("a", slides[index]).forEach(a => a.tabIndex = 0);
            // restart progress bar animation
            const bar = $(".hero-dot-bar span", dots[index]);
            if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
            dots[index].classList.add("is-active");
            dots[index].setAttribute("aria-selected", "true");
            schedule();
        };
        const schedule = () => {
            clearTimeout(timer);
            if (!paused && !reduceMotion) timer = setTimeout(() => go(index + 1), DURATION);
        };
        const setPaused = (p) => { paused = p; hero.classList.toggle("is-paused", p); schedule(); };

        dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
        $("[data-next]", hero)?.addEventListener("click", () => go(index + 1));
        $("[data-prev]", hero)?.addEventListener("click", () => go(index - 1));
        hero.addEventListener("mouseenter", () => setPaused(true));
        hero.addEventListener("mouseleave", () => setPaused(false));
        hero.addEventListener("focusin", () => setPaused(true));
        hero.addEventListener("focusout", () => setPaused(false));
        document.addEventListener("visibilitychange", () => setPaused(document.hidden));
        hero.addEventListener("keydown", e => {
            if (e.key === "ArrowRight") go(index + 1);
            if (e.key === "ArrowLeft") go(index - 1);
        });
        // swipe
        let sx = 0, sy = 0;
        hero.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        hero.addEventListener("touchend", e => {
            const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
        });
        // warm up the next images after first paint
        window.addEventListener("load", () => setTimeout(() => $$("img[loading=lazy]", hero).forEach(i => { i.loading = "eager"; }), 1500));
        schedule();
    }

    /* ---------- Reveal on scroll (with sibling stagger) ---------- */
    const reveals = $$(".reveal");
    if ("IntersectionObserver" in window && !reduceMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const siblings = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.classList.contains("reveal")) : [];
                const i = Math.max(0, siblings.indexOf(el));
                el.style.setProperty("--d", Math.min(i * 0.08, 0.5) + "s");
                el.classList.add("is-in");
                io.unobserve(el);
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
        reveals.forEach(el => io.observe(el));
    } else {
        reveals.forEach(el => el.classList.add("is-in"));
    }

    /* ---------- Parallax ---------- */
    const parallax = $$("[data-parallax]");
    if (parallax.length && !reduceMotion) {
        let ticking = false;
        const update = () => {
            const vh = window.innerHeight;
            parallax.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.bottom < -200 || r.top > vh + 200) return;
                const speed = parseFloat(el.dataset.parallaxSpeed || "0.12");
                const offset = (r.top + r.height / 2 - vh / 2) * -speed;
                const target = el.querySelector("img") || el;
                target.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.08)`;
            });
            ticking = false;
        };
        window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
        window.addEventListener("resize", update);
        update();
    }

    /* ---------- Counters ---------- */
    const counters = $$("[data-count]");
    if (counters.length) {
        const run = (el) => {
            const end = parseInt(el.dataset.count, 10), suffix = el.dataset.suffix || "";
            if (reduceMotion) { el.textContent = end + suffix; return; }
            const t0 = performance.now(), dur = 1600;
            const tick = (t) => {
                const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(end * eased) + suffix;
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } }), { threshold: 0.6 });
        counters.forEach(c => co.observe(c));
    }

    /* ---------- Draggable rail ---------- */
    $$("[data-rail]").forEach(rail => {
        const section = rail.closest("section");
        const step = () => (rail.querySelector(".dest-card")?.offsetWidth || 320) + 22;
        $("[data-rail-next]", section)?.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
        $("[data-rail-prev]", section)?.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
        let down = false, startX = 0, startLeft = 0, moved = 0;
        rail.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = 0; startX = e.clientX; startLeft = rail.scrollLeft; });
        window.addEventListener("pointermove", e => {
            if (!down) return;
            const dx = e.clientX - startX; moved = Math.abs(dx);
            if (moved > 5) rail.classList.add("is-dragging");
            rail.scrollLeft = startLeft - dx;
        });
        window.addEventListener("pointerup", () => { down = false; setTimeout(() => rail.classList.remove("is-dragging"), 0); });
        rail.addEventListener("click", e => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); } }, true);
    });

    /* ---------- Chip filters ---------- */
    $$("[data-filter-group]").forEach(group => {
        const target = $(`[data-filter-target="${group.dataset.filterGroup}"]`);
        if (!target) return;
        group.addEventListener("click", e => {
            const chip = e.target.closest("[data-filter]");
            if (!chip) return;
            $$("[data-filter]", group).forEach(c => c.classList.toggle("is-active", c === chip));
            const f = chip.dataset.filter;
            const attr = group.dataset.filterAttr || "category";
            let shown = 0;
            $$("[data-" + attr + "]", target).forEach(card => {
                const values = (card.dataset[attr] || "").split(" ");
                const show = f === "all" || values.includes(f);
                card.classList.toggle("is-filtered", !show);
                if (show) { card.classList.add("is-in"); if (!card.classList.contains("is-param-hidden")) shown++; }
            });
            const count = $("[data-filter-count]");
            if (count) count.textContent = shown;
        });
    });

    /* ---------- Server hosting: copy contact messages to the pilot backend too ---------- */
    if (!doc.dataset.static) {
        $$("form[action$='/contact']").forEach(f => f.addEventListener("submit", () => {
            if (!f.elements.Website?.value) window.KCM?.beacon("submitMessage", { message: { name: f.elements.Name.value, email: f.elements.Email.value, phone: f.elements.Phone.value, message: f.elements.Message.value } });
        }));
    }

    /* ---------- Static hosting: contact form goes to WhatsApp ---------- */
    if (doc.dataset.static) {
        $$("form[action$='/contact']").forEach(f => f.addEventListener("submit", e => {
            e.preventDefault();
            const name = f.elements.Name.value.trim(), msg = f.elements.Message.value.trim();
            if (!name || !msg) { (name ? f.elements.Message : f.elements.Name).focus(); return; }
            window.KCM?.beacon("submitMessage", { message: { name, email: f.elements.Email.value, phone: f.elements.Phone.value, message: msg } });
            const wa = $("[data-chat]")?.dataset.wa || "";
            const text = `Hi KCM Travel & Tours, this is ${name}${f.elements.Email.value ? " (" + f.elements.Email.value + ")" : ""}.\n\n${msg}`;
            window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        }));
    }

    /* ---------- Season planner ---------- */
    const season = $("[data-season]");
    if (season) {
        season.addEventListener("click", e => {
            const btn = e.target.closest("[data-month]");
            if (!btn) return;
            $$("[data-month]", season).forEach(b => { const on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", String(on)); });
            $$("[data-month-panel]", season).forEach(p => { p.hidden = p.dataset.monthPanel !== btn.dataset.month; });
        });
    }
})();
