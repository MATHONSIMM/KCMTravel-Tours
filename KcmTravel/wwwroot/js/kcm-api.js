/* KCM client for the pilot backend (Google Apps Script web app).
   Exposes window.KCM: api calls, session, partner-type config and image resizing. */
(() => {
    "use strict";
    const html = document.documentElement;
    const API = (html.dataset.api || "").trim();
    const GCID = (html.dataset.gcid || "").trim();
    const BASE = html.dataset.base || "";
    const KEY = "kcm-session";
    const listeners = [];

    const store = {
        get() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } },
        set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } },
        clear() { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY + "-checked"); } catch { } },
    };

    class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code || "error"; } }

    async function call(action, payload = {}) {
        if (!API) throw new ApiError("Accounts are not connected yet.", "not_configured");
        const s = store.get();
        const body = JSON.stringify({ action, token: s?.token, ...payload });
        let res;
        try {
            // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
            res = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, redirect: "follow" });
        } catch {
            throw new ApiError("We couldn't reach the server. Check your connection and try again.", "network");
        }
        let data;
        try { data = await res.json(); } catch { throw new ApiError("The server sent an unexpected reply. Please try again.", "bad_response"); }
        if (!data.ok) {
            if (data.code === "auth") { store.clear(); emit(); }
            throw new ApiError(data.error || "Something went wrong.", data.code);
        }
        return data.data;
    }

    /** Fire-and-forget (used for bookings/messages so a slow server never blocks the visitor). */
    function beacon(action, payload = {}) {
        if (!API) return;
        try {
            fetch(API, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...payload }) });
        } catch { /* ignore */ }
    }

    function emit() { const u = store.get()?.user || null; listeners.forEach(fn => { try { fn(u); } catch (e) { console.error(e); } }); }

    const session = {
        user: () => store.get()?.user || null,
        token: () => store.get()?.token || null,
        set(token, user) { store.set({ token, user }); emit(); },
        async refresh(force = false) {
            const s = store.get();
            if (!s?.token || !API) return null;
            try {
                if (!force && sessionStorage.getItem(KEY + "-checked") === s.token) return s.user;
            } catch { }
            try {
                const user = await call("me");
                store.set({ token: s.token, user });
                try { sessionStorage.setItem(KEY + "-checked", s.token); } catch { }
                emit();
                return user;
            } catch (e) {
                if (e.code === "auth") return null;
                return s.user; // offline: keep showing the cached user
            }
        },
        async signOut() {
            try { await call("signOut"); } catch { }
            store.clear(); emit();
        },
        onChange(fn) { listeners.push(fn); },
    };

    /* ---------- Partner types (mirrors backend/apps-script/Code.gs) ---------- */
    const TYPES = {
        vehicle: {
            label: "Vehicle owner", blurb: "Cars, SUVs, minibuses or coaches for transfers, tours and hire.", icon: "car",
            services: ["Airport transfers", "Chauffeur-driven trips", "Self-drive hire", "Tours & day trips", "Group shuttles", "Weddings & events"],
            required: ["Front", "Rear", "Left side", "Right side", "Dashboard & front seats", "Rear seats", "Boot"],
            optional: ["Odometer", "Engine", "Extra photo"],
            detailsTitle: "About the vehicle",
            fields: [
                { key: "make", label: "Make", req: 1, ph: "e.g. Toyota" },
                { key: "model", label: "Model", req: 1, ph: "e.g. Fortuner 2.8 GD-6" },
                { key: "year", label: "Year", req: 1, type: "number", min: 2005, max: 2027 },
                { key: "seats", label: "Passenger seats", req: 1, type: "number", min: 1, max: 70 },
                { key: "transmission", label: "Transmission", req: 1, opts: ["Automatic", "Manual"] },
                { key: "fuel", label: "Fuel", opts: ["Diesel", "Petrol", "Hybrid", "Electric"] },
                { key: "colour", label: "Colour" },
                { key: "plate", label: "Registration number", req: 1, ph: "e.g. ABC 123 MP" },
                { key: "mileage", label: "Mileage (km)", req: 1, type: "number", min: 0 },
                { key: "aircon", label: "Air-conditioning", req: 1, opts: ["Yes", "No"] },
                { key: "insurance", label: "Insurance", req: 1, opts: ["Comprehensive", "Third party", "None yet"] },
                { key: "driver", label: "Driver", req: 1, opts: ["I supply a driver with a PrDP", "Self-drive only", "Both"] },
                { key: "count", label: "How many vehicles like this?", type: "number", min: 1, max: 50 },
            ],
            hint: "Premium standard: clean, well maintained, roadworthy and free of visible damage, inside and out.",
        },
        accommodation: {
            label: "Accommodation", blurb: "Hotels, lodges, B&Bs, guesthouses and self-catering stays.", icon: "bed",
            services: ["Bed & breakfast", "Self-catering", "Dinner / full board", "Conference venue", "Wedding venue", "Game drives"],
            required: ["Exterior", "Bedroom", "Bathroom", "Lounge or common area"],
            optional: ["Pool or garden", "View", "Breakfast", "Extra photo"],
            detailsTitle: "About the property",
            fields: [
                { key: "propertyType", label: "Property type", req: 1, opts: ["Hotel", "Lodge", "B&B", "Guesthouse", "Self-catering", "Tented camp"] },
                { key: "rooms", label: "Number of rooms / units", req: 1, type: "number", min: 1, max: 500 },
                { key: "sleeps", label: "Sleeps (total guests)", req: 1, type: "number", min: 1, max: 2000 },
                { key: "grading", label: "TGCSA star grading", opts: ["Not graded", "1 star", "2 stars", "3 stars", "4 stars", "5 stars"] },
                { key: "rateFrom", label: "Rates from (R per night)", req: 1, type: "number", min: 0 },
                { key: "amenities", label: "Amenities", multi: ["Wi-Fi", "Pool", "Breakfast", "Secure parking", "Air-conditioning", "Backup power", "Wheelchair access", "Pet friendly"] },
            ],
            hint: "Premium standard: spotless rooms, quality linen, reliable water and power, and friendly service.",
        },
        tour_operator: {
            label: "Tour operator or agency", blurb: "Small agencies and operators who run tours, safaris or trips.", icon: "map",
            services: ["Day tours", "Multi-day packages", "Safaris", "School & church groups", "Corporate travel", "International trips"],
            required: ["Logo", "Vehicle or fleet"],
            optional: ["Team or office", "Tour photo", "Extra photo"],
            detailsTitle: "About your operation",
            fields: [
                { key: "tourTypes", label: "Main tours you run", req: 1, ph: "e.g. Kruger day safaris, Panorama Route" },
                { key: "areas", label: "Areas you cover", req: 1, ph: "e.g. Mpumalanga, Limpopo" },
                { key: "fleetSize", label: "Vehicles in your fleet", type: "number", min: 0, max: 500 },
                { key: "satsa", label: "SATSA / ASATA membership no.", ph: "Optional" },
                { key: "licence", label: "Operator licence / permit no.", ph: "Optional" },
            ],
            hint: "Tell us about licences, permits and memberships. These help your application.",
        },
        guide: {
            label: "Tour guide", blurb: "Registered field, culture and site guides.", icon: "user",
            services: ["Game drives", "Walking safaris", "Cultural tours", "City tours", "Birding", "Hiking"],
            required: ["Profile photo", "Guide certificate"],
            optional: ["On tour", "Extra photo"],
            detailsTitle: "About you as a guide",
            fields: [
                { key: "guideLevel", label: "Qualification", req: 1, opts: ["FGASA Level 1", "FGASA Level 2", "FGASA Level 3", "Culture / site guide", "Provincial registration", "Other"] },
                { key: "registrationNo", label: "Guide registration number", req: 1 },
                { key: "languages", label: "Languages", req: 1, ph: "e.g. English, siSwati, isiZulu" },
                { key: "regions", label: "Areas you guide in", req: 1, ph: "e.g. Kruger, Panorama Route" },
                { key: "experienceYears", label: "Years guiding", type: "number", min: 0, max: 60 },
            ],
            hint: "Please upload a clear photo of your registration certificate.",
        },
        activity: {
            label: "Activity provider", blurb: "Balloon flights, adventure, water, cultural or wellness experiences.", icon: "spark",
            services: ["Adventure", "Water activities", "Air activities", "Cultural experiences", "Kids activities", "Wellness"],
            required: ["Activity photo", "Safety equipment"],
            optional: ["Venue", "Extra photo"],
            detailsTitle: "About the activity",
            fields: [
                { key: "activityType", label: "Activity", req: 1, ph: "e.g. Sunrise hot-air balloon flight" },
                { key: "capacity", label: "Max people per session", req: 1, type: "number", min: 1, max: 1000 },
                { key: "priceFrom", label: "Price from (R per person)", req: 1, type: "number", min: 0 },
                { key: "minAge", label: "Minimum age", type: "number", min: 0, max: 99 },
                { key: "safetyCert", label: "Safety certification / insurance", req: 1, opts: ["Yes", "In progress", "No"] },
            ],
            hint: "Safety first: tell us about certification, equipment and public liability cover.",
        },
        other: {
            label: "Other service", blurb: "Catering, photography, events or something else for travellers.", icon: "plus",
            services: ["Catering", "Photography", "Event planning", "Translation", "Other"],
            required: ["Photo of your service"],
            optional: ["Extra photo", "Extra photo 2"],
            detailsTitle: "About the service",
            fields: [
                { key: "serviceType", label: "What do you offer?", req: 1 },
                { key: "priceFrom", label: "Price from (R)", type: "number", min: 0 },
            ],
            hint: "",
        },
    };

    /** Resize an image file on the device (max 1600px, JPEG) and return a data URL. */
    function resizeImage(file, max = 1600, quality = 0.82) {
        return new Promise((resolve, reject) => {
            if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
                reject(new ApiError("Please choose a JPG, PNG or WebP photo.")); return;
            }
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, max / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
                const c = document.createElement("canvas");
                c.width = w; c.height = h;
                c.getContext("2d").drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(url);
                resolve(c.toDataURL("image/jpeg", quality));
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new ApiError("That photo couldn't be read. Try a JPG or PNG.")); };
            img.src = url;
        });
    }

    let googlePromise = null;
    function loadGoogle() {
        if (!GCID) return Promise.reject(new Error("no client id"));
        if (window.google?.accounts?.id) return Promise.resolve(window.google);
        googlePromise ||= new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.defer = true;
            s.onload = () => resolve(window.google);
            s.onerror = () => { googlePromise = null; reject(new Error("Google sign-in failed to load")); };
            document.head.appendChild(s);
        });
        return googlePromise;
    }

    const fmtR = n => "R" + Math.round(Number(n) || 0).toLocaleString("en-ZA").replace(/[, ]/g, " ");
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    window.KCM = { configured: !!API, googleClientId: GCID, base: BASE, call, beacon, session, TYPES, resizeImage, loadGoogle, fmtR, esc, ApiError };
})();
