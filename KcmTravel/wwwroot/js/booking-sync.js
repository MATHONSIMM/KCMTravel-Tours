// Copies a confirmed server-side booking to the pilot backend (Google Sheet) once.
(() => {
    window.addEventListener("DOMContentLoaded", () => {
        const el = document.getElementById("booking-sync");
        if (!el || !window.KCM?.configured) return;
        const booking = JSON.parse(el.textContent);
        const key = "kcm-synced-" + booking.reference;
        try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { }
        window.KCM.beacon("submitBooking", { booking });
    });
})();
