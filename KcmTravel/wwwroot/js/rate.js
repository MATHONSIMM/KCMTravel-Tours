/* Guest rating page: /rate?ref=<booking>&p=<partner id> */
(() => {
    "use strict";
    window.addEventListener("DOMContentLoaded", async () => {
        const K = window.KCM, root = document.querySelector("[data-rate-root]");
        if (!K || !root) return;
        const q = new URLSearchParams(location.search);
        const preview = q.has("preview");
        const bookingRef = q.get("ref") || "", partnerId = q.get("p") || "";
        const esc = K.esc;
        const fail = m => { root.innerHTML = `<p class="eyebrow">Rate your trip</p><h1 class="rate-title">Sorry</h1><p>${esc(m)}</p><a class="btn btn--primary" href="${K.base}/">Back to KCM Travel &amp; Tours</a>`; };
        let info;
        try {
            if (preview) info = { business: "Lowveld Executive Transfers", type: "Vehicle owner", service: "KMIA airport transfer", alreadyRated: false };
            else if (!K.configured) return fail("Ratings open soon.");
            else info = await K.call("ratingInfo", { bookingRef, partnerId });
        } catch (e) { return fail(e.message); }
        if (info.alreadyRated) return fail("Thank you! We've already received a rating for this trip.");
        let stars = 0;
        root.innerHTML = `
            <img class="modal-logo" src="${K.base}/images/brand/kcm-logo.svg" alt="" width="64" height="48">
            <p class="eyebrow">Rate your trip${preview ? " · preview" : ""}</p>
            <h1 class="rate-title">How was ${esc(info.business)}?</h1>
            <p class="muted">${esc(info.service || info.type)}${bookingRef ? " · booking " + esc(bookingRef) : ""}</p>
            <form data-rate-form novalidate>
                <div class="star-pick" role="radiogroup" aria-label="Your rating">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? "s" : ""}" data-star="${n}">★</button>`).join("")}</div>
                <p class="star-word" data-star-word>Tap a star</p>
                <div class="field"><label for="rt-comment">Tell other travellers about it (optional)</label><textarea id="rt-comment" name="comment" maxlength="800" placeholder="What stood out? Punctuality, comfort, friendliness…"></textarea></div>
                <div class="field"><label for="rt-name">Your first name</label><input id="rt-name" name="name" maxlength="60" autocomplete="given-name"></div>
                <div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>
                <button class="btn btn--primary btn--block btn--lg" type="submit">Send rating</button>
                <p class="form-error" role="alert" data-err hidden></p>
            </form>`;
        const words = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];
        const paint = n => root.querySelectorAll("[data-star]").forEach(b => { const on = +b.dataset.star <= n; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(+b.dataset.star === n)); });
        root.addEventListener("click", e => { const b = e.target.closest("[data-star]"); if (b) { stars = +b.dataset.star; paint(stars); root.querySelector("[data-star-word]").textContent = words[stars]; } });
        root.querySelector("[data-rate-form]").addEventListener("submit", async e => {
            e.preventDefault();
            const f = e.target, err = root.querySelector("[data-err]");
            if (!stars) { err.textContent = "Please choose 1 to 5 stars."; err.hidden = false; return; }
            const btn = f.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Sending…";
            try {
                if (!preview) await K.call("submitRating", { bookingRef, partnerId, stars, comment: f.comment.value.trim(), name: f.name.value.trim(), website: f.website.value });
                root.innerHTML = `<div class="reg-done"><div class="confirm-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="white" stroke-width="3"/></svg></div>
                    <h1 class="rate-title">Thank you!</h1><p>Your rating helps us keep every KCM partner at a premium standard.</p><a class="btn btn--primary" href="${K.base}/tours">Plan your next trip</a></div>`;
            } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; btn.textContent = "Send rating"; }
        });
    });
})();
