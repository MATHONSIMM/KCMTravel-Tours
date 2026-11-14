using KcmTravel.Data;
using KcmTravel.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KcmTravel.Controllers;

[Route("book")]
public class BookingController : Controller
{
    private readonly IBookingStore _store;
    public BookingController(IBookingStore store) => _store = store;

    [HttpGet("")]
    public IActionResult Index(string? tour, DateTime? date, int? adults, int? children, int? nights)
    {
        var t = tour is null ? null : Catalog.FindTour(tour);
        var model = new BookingRequest
        {
            TourSlug = t?.Slug ?? "",
            StartDate = date is { } d && d.Date > DateTime.Today ? d.Date : null,
            Adults = Math.Clamp(adults ?? 2, 1, 60),
            Children = Math.Clamp(children ?? 0, 0, 40),
            Nights = nights ?? t?.Nights ?? 2,
        };
        return View(model);
    }

    [HttpPost(""), ValidateAntiForgeryToken, EnableRateLimiting("forms")]
    public async Task<IActionResult> Index(BookingRequest model)
    {
        if (!string.IsNullOrEmpty(model.Website)) return RedirectToAction(nameof(Index)); // bot

        var tour = Catalog.FindTour(model.TourSlug);
        if (tour is null) ModelState.AddModelError(nameof(model.TourSlug), "Please choose a trip.");
        if (model.StartDate is { } d && d.Date <= DateTime.Today)
            ModelState.AddModelError(nameof(model.StartDate), "Please choose a date from tomorrow onwards.");
        if (tour is not null && model.Nights < tour.Nights) model.Nights = tour.Nights;

        if (!ModelState.IsValid) return View(model);

        var quote = PricingService.Quote(model);
        var booking = await _store.SaveAsync(model, quote);
        return RedirectToAction(nameof(Confirmation), new { reference = booking.Reference, t = booking.Token });
    }

    [HttpGet("confirmation/{reference}"), EnableRateLimiting("forms")]
    public async Task<IActionResult> Confirmation(string reference, string? t)
    {
        var booking = await _store.FindAsync(reference, t ?? "");
        return booking is null ? NotFound() : View(booking);
    }
}
