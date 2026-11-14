// Applies the ?category= filter on load by clicking the matching chip.
(() => {
    const cat = document.currentScript?.dataset.category;
    if (!cat) return;
    window.addEventListener("DOMContentLoaded", () => {
        const chip = document.querySelector(`[data-filter-group="tours"] [data-filter="${CSS.escape(cat)}"]`);
        chip?.click();
    });
})();
