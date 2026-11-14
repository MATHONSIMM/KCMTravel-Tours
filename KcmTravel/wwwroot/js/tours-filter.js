// Applies URL filters on /tours (?category=&style=&destination=&adults=) in the browser.
// The server also filters; this makes the same links work on static hosting (GitHub Pages).
(() => {
    window.addEventListener("DOMContentLoaded", () => {
        const p = new URLSearchParams(location.search);
        const cat = p.get("category"), style = p.get("style"), dest = p.get("destination");
        const adults = parseInt(p.get("adults") || "0", 10);
        let regions = {};
        try { regions = JSON.parse(document.getElementById("dest-regions")?.textContent || "{}"); } catch { }
        const destRegion = dest ? regions[dest] : null;
        let shown = 0;
        document.querySelectorAll(".tour-card").forEach(card => {
            const tags = (card.dataset.tags || "").split(" ");
            const dests = (card.dataset.dests || "").split(" ");
            const regs = (card.dataset.regions || "").split(" ");
            let ok = true;
            if (style && !tags.includes(style)) ok = false;
            if (dest && !dests.includes(dest) && !(destRegion && regs.includes(destRegion))) ok = false;
            if (adults >= 15 && card.dataset.group !== "1") ok = false;
            card.classList.toggle("is-param-hidden", !ok);
            if (ok) shown++;
        });
        const count = document.querySelector("[data-filter-count]");
        if (count && (style || dest || adults >= 15)) count.textContent = shown;
        if (cat) document.querySelector(`[data-filter-group="tours"] [data-filter="${CSS.escape(cat)}"]`)?.click();
    });
})();
