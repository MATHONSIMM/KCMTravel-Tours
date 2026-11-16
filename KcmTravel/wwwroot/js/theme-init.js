/* Theme: light (default) or dark. Runs before the CSS paints to avoid a flash.
   ?theme=dark / ?theme=light in the URL sets and remembers the choice (handy for sharing a preview). */
(function () {
    var root = document.documentElement, KEY = "kcm-theme";
    function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function apply(t) {
        if (t === "dark") root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
        var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", t === "dark" ? "#0d1210" : "#0e1512");
    }
    try {
        var q = new URLSearchParams(location.search).get("theme");
        if (q === "dark" || q === "light") localStorage.setItem(KEY, q);
    } catch (e) { }
    apply(get());
    document.addEventListener("DOMContentLoaded", function () {
        apply(get());
        var sync = function () {
            var dark = root.getAttribute("data-theme") === "dark";
            document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
                b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
                b.setAttribute("aria-pressed", String(dark));
            });
        };
        sync();
        document.addEventListener("click", function (e) {
            if (!e.target.closest("[data-theme-toggle]")) return;
            var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            try { localStorage.setItem(KEY, next); } catch (er) { }
            root.classList.add("theme-switching");
            apply(next); sync();
            setTimeout(function () { root.classList.remove("theme-switching"); }, 400);
        });
    });
})();
