using KcmTravel.Models;

namespace KcmTravel.Data;

/// <summary>
/// Calculates a demo quote. The same rules are mirrored in wwwroot/js/booking.js for the live total;
/// the server always recalculates so the stored price can't be tampered with.
/// </summary>
public static class PricingService
{
    public static PriceQuote Quote(BookingRequest r)
    {
        var tour = Catalog.FindTour(r.TourSlug) ?? throw new ArgumentException("Unknown tour");
        var lines = new List<PriceLine>();

        var nights = Math.Max(tour.Nights, r.Nights);
        var extraNights = nights - tour.Nights;
        var roomFactor = Catalog.Rooms.TryGetValue(r.Room, out var room) ? room.Factor : 1m;

        decimal perAdult = (tour.PricePerPersonSharing + extraNights * tour.ExtraNightPerPerson) * roomFactor;

        if (r.Adults > 0) lines.Add(new($"{r.Adults} adult{(r.Adults > 1 ? "s" : "")} × {Fmt(perAdult)}", r.Adults * perAdult));
        if (r.Pensioners > 0)
        {
            var p = perAdult * (1 - Catalog.PensionerDiscount);
            lines.Add(new($"{r.Pensioners} pensioner{(r.Pensioners > 1 ? "s" : "")} (60+) × {Fmt(p)}", r.Pensioners * p));
        }
        if (r.Children > 0)
        {
            var c = perAdult * Catalog.ChildRate;
            lines.Add(new($"{r.Children} child{(r.Children > 1 ? "ren" : "")} (3–11) × {Fmt(c)}", r.Children * c));
        }
        if (r.Infants > 0) lines.Add(new($"{r.Infants} infant{(r.Infants > 1 ? "s" : "")} (under 3)", 0m));

        int payingPeople = r.Adults + r.Pensioners + r.Children;
        int allPeople = payingPeople + r.Infants;
        int billableNights = Math.Max(nights, 1);

        foreach (var code in r.Extras.Distinct())
        {
            var x = Catalog.Extras.FirstOrDefault(e => e.Code == code);
            if (x is null) continue;
            decimal amount = x.Basis switch
            {
                "person" => x.Price * payingPeople,
                "person-night" => x.Price * payingPeople * billableNights,
                "night" => x.Price * (billableNights + 1),
                _ => x.Price,
            };
            lines.Add(new(x.Name, amount));
        }

        var total = Math.Round(lines.Sum(l => l.Amount), 0);
        var deposit = r.Payment == "full" ? total : Math.Round(total * Catalog.DepositRate, 0);
        return new PriceQuote(lines, total, deposit, allPeople, nights);
    }

    public static string Fmt(decimal v) => "R" + v.ToString("#,##0", System.Globalization.CultureInfo.InvariantCulture).Replace(",", " ");
}
