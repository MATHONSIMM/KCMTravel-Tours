/* KCM trip assistant "Kaycee" — guided chat that suggests trips and pre-fills the booking form.
   Demo version: runs fully in the browser on /api/catalog. A real AI model can be connected later
   by replacing `reply()` with a call to a server endpoint. */
(() => {
    "use strict";
    const root = document.querySelector("[data-chat]");
    if (!root) return;

    const panel = root.querySelector(".chat-panel");
    const launcher = root.querySelector(".chat-launcher");
    const log = root.querySelector("[data-chat-log]");
    const choicesEl = root.querySelector("[data-chat-choices]");
    const form = root.querySelector("[data-chat-form]");
    const input = root.querySelector("[data-chat-text]");
    const wa = root.dataset.wa;
    const BASE = document.documentElement.dataset.base || "";
    const fmt = n => "R" + Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ");

    let catalog = null;
    let state = {};
    let step = 0;
    let started = false;

    const loadCatalog = async () => {
        if (catalog) return catalog;
        const res = await fetch(BASE + "/api/catalog.json");
        catalog = await res.json();
        return catalog;
    };

    /* ---------- conversation script ---------- */
    const STEPS = [
        {
            key: "style",
            ask: () => "Hi, I'm Kaycee from KCM Travel & Tours. I'll help you find a trip in about a minute. What kind of trip are you in the mood for?",
            choices: [
                ["Safari & wildlife", "bush"], ["Mountains & views", "mountains"], ["Heritage & culture", "heritage"],
                ["Beach & coast", "beach"], ["Couples getaway", "romance"], ["Surprise me", "any"],
            ],
        },
        {
            key: "region",
            ask: s => s.style === "any" ? "Love it. Is there a province you'd like to explore?" : "Great choice. Where in South Africa would you like to go?",
            choices: [
                ["Mpumalanga", "Mpumalanga"], ["Limpopo", "Limpopo"], ["Western Cape", "Western Cape"],
                ["KwaZulu-Natal", "KwaZulu-Natal"], ["North West", "North West"], ["Anywhere", "any"],
            ],
        },
        {
            key: "date",
            ask: () => "When are you thinking of travelling? Pick a date, or tell me if you're flexible.",
            choices: [["Pick a date", "__date"], ["Next month", "next-month"], ["December holidays", "december"], ["I'm flexible", "flexible"]],
        },
        {
            key: "party",
            ask: () => "How many people are travelling?",
            choices: [["Just me", "1"], ["Two of us", "2"], ["Family with kids", "family"], ["Friends (3–8)", "4"], ["Big group (20+)", "20"]],
        },
        {
            key: "children", when: s => s.party === "family",
            ask: () => "Lovely! How many children aged 3–11? (Under-3s travel free.)",
            choices: [["1 child", "1"], ["2 children", "2"], ["3 children", "3"], ["4+ children", "4"]],
        },
        {
            key: "nights",
            ask: () => "How long would you like to go for?",
            choices: [["A day trip", "0"], ["A weekend (2 nights)", "2"], ["3–4 nights", "3"], ["5 nights or more", "5"]],
        },
        {
            key: "budget",
            ask: () => "Last question: roughly what budget per person are you working with?",
            choices: [["Under R3 000", "3000"], ["R3 000 – R8 000", "8000"], ["R8 000 – R15 000", "15000"], ["R15 000+", "99999"], ["Show me everything", "99999"]],
        },
    ];

    /* ---------- rendering ---------- */
    const scroll = () => { log.scrollTop = log.scrollHeight; };
    const addMsg = (text, who = "bot") => {
        const el = document.createElement("div");
        el.className = "msg msg--" + who;
        el.textContent = text;
        log.appendChild(el);
        scroll();
        return el;
    };
    const typing = async (ms = 650) => {
        const t = document.createElement("div");
        t.className = "msg msg--bot msg--typing";
        t.innerHTML = "<i></i><i></i><i></i>";
        log.appendChild(t); scroll();
        await new Promise(r => setTimeout(r, ms));
        t.remove();
    };
    const setChoices = (choices) => {
        choicesEl.innerHTML = "";
        choices.forEach(([label, value]) => {
            if (value === "__date") {
                const wrap = document.createElement("label");
                wrap.className = "chat-choice";
                const min = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
                wrap.innerHTML = `<span class="visually-hidden">Travel date</span><input type="date" min="${min}" aria-label="Travel date">`;
                wrap.querySelector("input").addEventListener("change", e => {
                    const v = e.target.value;
                    if (v) answer(new Date(v).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }), v);
                });
                choicesEl.appendChild(wrap);
                return;
            }
            const b = document.createElement("button");
            b.type = "button"; b.className = "chat-choice"; b.textContent = label;
            b.addEventListener("click", () => answer(label, value));
            choicesEl.appendChild(b);
        });
    };

    const currentStep = () => STEPS[step];

    const askNext = async () => {
        while (step < STEPS.length && STEPS[step].when && !STEPS[step].when(state)) step++;
        if (step >= STEPS.length) return recommend();
        const s = currentStep();
        await typing();
        addMsg(s.ask(state));
        setChoices(s.choices);
        save();
    };

    const answer = async (label, value) => {
        addMsg(label, "user");
        choicesEl.innerHTML = "";
        const s = currentStep();
        if (s) state[s.key] = value;
        step++;
        if (s?.key === "style" && value === "romance") { state.party = state.party || "2"; }
        await askNext();
    };

    /* ---------- matching ---------- */
    const travelDate = () => {
        const d = state.date;
        if (!d || d === "flexible") return "";
        const now = new Date();
        if (d === "next-month") return new Date(now.getFullYear(), now.getMonth() + 1, 7).toISOString().slice(0, 10);
        if (d === "december") return new Date(now.getMonth() === 11 && now.getDate() > 10 ? now.getFullYear() + 1 : now.getFullYear(), 11, 15).toISOString().slice(0, 10);
        return d;
    };
    const party = () => {
        const p = state.party;
        if (p === "family") return { adults: 2, children: parseInt(state.children || "1", 10) };
        return { adults: parseInt(p || "2", 10), children: 0 };
    };

    const recommend = async () => {
        await typing(900);
        let data;
        try { data = await loadCatalog(); } catch { addMsg("Sorry, I couldn't load our trips just now. Please try again, or message us on WhatsApp."); return offerWhatsApp(); }

        const { adults, children } = party();
        const nights = parseInt(state.nights ?? "2", 10);
        const budget = parseInt(state.budget ?? "99999", 10);
        const scored = data.tours.map(t => {
            let score = 0;
            if (state.style && state.style !== "any") score += t.tags.includes(state.style) ? 5 : (t.category.toLowerCase().includes(state.style) ? 3 : -2);
            if (state.region && state.region !== "any") score += t.regions.includes(state.region) ? 6 : -4;
            score -= Math.abs(t.nights - nights) * 0.8;
            if (t.price <= budget) score += 3; else score -= (t.price - budget) / 2000;
            if (adults >= 15) score += t.groupFriendly ? 4 : -6;
            else if (t.slug.startsWith("group-")) score -= 8;
            if (children > 0) score += t.tags.includes("family") ? 2 : 0;
            const total = adults * t.price + children * t.price * data.rules.childRate;
            return { t, score, total };
        }).sort((a, b) => b.score - a.score).slice(0, 3);

        const people = adults + children;
        addMsg(`Here are my top picks for ${people} traveller${people > 1 ? "s" : ""}. The estimates include everyone in your party:`);

        const wrap = document.createElement("div");
        wrap.className = "chat-cards";
        const date = travelDate();
        scored.forEach(({ t, total }) => {
            const q = new URLSearchParams({ tour: t.slug, adults, children, nights: Math.max(t.nights, nights) });
            if (date) q.set("date", date);
            const a = document.createElement("div");
            a.className = "chat-card";
            a.innerHTML = `<img src="${t.image}" alt="" loading="lazy"><div><strong></strong><span></span><em></em>
                <div class="chat-card-actions"><a href="${BASE}/book?${q}">Book this →</a><a href="${BASE}/tours/${t.slug}">Details</a></div></div>`;
            a.querySelector("strong").textContent = t.title;
            a.querySelector("span").textContent = `${t.nightsLabel} · from ${fmt(t.price)} pp`;
            a.querySelector("em").textContent = `≈ ${fmt(total)} for your group`;
            a.querySelector("img").addEventListener("error", e => { e.target.style.visibility = "hidden"; });
            wrap.appendChild(a);
        });
        log.appendChild(wrap); scroll();
        state.picks = scored.map(s => s.t.title);
        save();
        await typing(500);
        addMsg("Tap 'Book this' to choose dates and extras. The form is already filled in for you. Or I can pass this to a consultant on WhatsApp.");
        offerWhatsApp();
    };

    const offerWhatsApp = () => {
        choicesEl.innerHTML = "";
        const summary = `Hi KCM Travel & Tours! Kaycee helped me plan a trip:\n• Style: ${state.style || "-"}\n• Region: ${state.region || "-"}\n• When: ${state.date || "-"}\n• Travellers: ${state.party || "-"}${state.children ? " (+" + state.children + " kids)" : ""}\n• Nights: ${state.nights ?? "-"}\n• Budget pp: ${state.budget || "-"}\n• Liked: ${(state.picks || []).join(", ")}`;
        const link = document.createElement("a");
        link.className = "chat-choice"; link.target = "_blank"; link.rel = "noopener";
        link.href = `https://wa.me/${wa}?text=${encodeURIComponent(summary)}`;
        link.textContent = "Send to a consultant on WhatsApp";
        const again = document.createElement("button");
        again.type = "button"; again.className = "chat-choice"; again.textContent = "Start over";
        again.addEventListener("click", restart);
        choicesEl.append(link, again);
    };

    /* ---------- free text ---------- */
    const KEYWORDS = [
        [/kruger|safari|big ?five|game|lion|elephant/i, { style: "bush", region: "Mpumalanga" }],
        [/panorama|god'?s window|blyde|canyon|graskop|waterfall/i, { style: "mountains", region: "Mpumalanga" }],
        [/sudwala|cave|pilgrim/i, { style: "heritage", region: "Mpumalanga" }],
        [/venda|fundudzi|vondo|mapungubwe|baobab|limpopo/i, { style: "heritage", region: "Limpopo" }],
        [/cape town|table mountain|robben|winelands|wine|stellenbosch|franschhoek|garden route|knysna/i, { region: "Western Cape" }],
        [/durban|beach|sea|ocean|umhlanga|ballito/i, { style: "beach", region: "KwaZulu-Natal" }],
        [/drakensberg|berg|hike|hiking/i, { style: "mountains", region: "KwaZulu-Natal" }],
        [/sun city|pilanesberg/i, { style: "bush", region: "North West" }],
        [/honeymoon|anniversary|romantic|couple/i, { style: "romance", party: "2" }],
        [/school|church|stokvel|group|youth|company|corporate/i, { party: "20" }],
    ];

    const handleText = async (text) => {
        addMsg(text, "user");
        choicesEl.innerHTML = "";
        let matched = false;
        KEYWORDS.forEach(([re, patch]) => { if (re.test(text)) { Object.entries(patch).forEach(([k, v]) => { if (!state[k]) state[k] = v; }); matched = true; } });
        const num = text.match(/\b(\d{1,3})\b/);
        const s = currentStep();
        if (s && !matched) {
            const hit = s.choices.find(([label]) => label.toLowerCase().includes(text.toLowerCase()) || text.toLowerCase().includes(label.toLowerCase().split(" ")[0]));
            if (hit) { state[s.key] = hit[1]; matched = true; }
            else if (num && ["party", "children", "nights"].includes(s.key)) { state[s.key] = num[1]; matched = true; }
            else if (num && s.key === "budget") { state.budget = num[1].length <= 2 ? num[1] * 1000 : num[1]; matched = true; }
        }
        if (!matched) {
            await typing();
            addMsg("I'm still learning, so I may not understand everything yet. Tap one of the options, or message a consultant on WhatsApp and a real person will help.");
            if (s) setChoices(s.choices); else offerWhatsApp();
            return;
        }
        // skip any steps already answered by keywords
        while (step < STEPS.length && state[STEPS[step].key] !== undefined) step++;
        await typing(400);
        addMsg("Got it 👍");
        await askNext();
    };

    /* ---------- persistence (best effort) ---------- */
    const save = () => { try { sessionStorage.setItem("kcm-chat-v2", JSON.stringify({ state, step, html: log.innerHTML })); } catch { /* storage unavailable */ } };
    const restore = () => {
        try {
            const raw = sessionStorage.getItem("kcm-chat-v2");
            if (!raw) return false;
            const saved = JSON.parse(raw);
            state = saved.state || {}; step = saved.step || 0; log.innerHTML = saved.html || "";
            if (step < STEPS.length) setChoices(STEPS[step].choices); else offerWhatsApp();
            scroll();
            return log.children.length > 0;
        } catch { return false; }
    };

    const restart = () => {
        state = {}; step = 0; log.innerHTML = ""; choicesEl.innerHTML = "";
        try { sessionStorage.removeItem("kcm-chat-v2"); } catch { }
        askNext();
    };

    /* ---------- open / close ---------- */
    const open = () => {
        panel.hidden = false;
        root.classList.add("is-open");
        launcher.setAttribute("aria-expanded", "true");
        if (!started) { started = true; if (!restore()) askNext(); loadCatalog().catch(() => { }); }
        setTimeout(() => input.focus({ preventScroll: true }), 300);
    };
    const close = () => {
        panel.hidden = true;
        root.classList.remove("is-open");
        launcher.setAttribute("aria-expanded", "false");
        launcher.focus();
    };

    document.addEventListener("click", e => { if (e.target.closest("[data-chat-open]")) { e.preventDefault(); open(); } });
    root.querySelector("[data-chat-close]").addEventListener("click", close);
    root.querySelector("[data-chat-restart]").addEventListener("click", restart);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) close(); });
    form.addEventListener("submit", e => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        handleText(text);
    });
})();
