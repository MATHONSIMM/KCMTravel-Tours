namespace KcmTravel.Models;

/// <summary>A photo used on the site. Remote photos are hot-linked from Unsplash (free licence);
/// local photos live in wwwroot/images/places.</summary>
public record Photo(string Url, string Alt, string? Credit = null)
{
    public string Sized(int width) =>
        Url.StartsWith("https://images.unsplash.com", StringComparison.Ordinal)
            ? $"{Url}?auto=format&fit=crop&w={width}&q=70"
            : Url;

    public string SrcSet(params int[] widths) =>
        Url.StartsWith("https://images.unsplash.com", StringComparison.Ordinal)
            ? string.Join(", ", widths.Select(w => $"{Sized(w)} {w}w"))
            : $"{Url} 1x";
}

public record Destination(
    string Slug,
    string Name,
    string Province,
    string Region,           // grouping used for filters: Mpumalanga, Limpopo, Western Cape, KwaZulu-Natal, North West
    string Tagline,
    string Summary,
    string Story,
    string BestTime,
    string DriveFromJhb,
    string[] Highlights,
    Photo Hero,
    Photo[] Gallery,
    string[] Tags);          // bush, mountains, beach, city, heritage, family, romance, adventure

public record ItineraryDay(int Day, string Title, string Detail);

public record TourPackage(
    string Slug,
    string Title,
    string Summary,
    string Category,         // Safari, Scenic, Heritage, Beach, City, Adventure
    string[] DestinationSlugs,
    int Nights,
    decimal PricePerPersonSharing,   // whole package, per adult, sharing, VAT incl.
    decimal ExtraNightPerPerson,
    string Accommodation,
    string Departure,
    string[] Includes,
    string[] Excludes,
    ItineraryDay[] Itinerary,
    Photo Hero,
    string? Badge,
    bool GroupFriendly,
    string[] Tags)
{
    public string NightsLabel => Nights == 0 ? "Day trip" : $"{Nights} night{(Nights == 1 ? "" : "s")}";
    public string DaysLabel => $"{Nights + 1} day{(Nights + 1 == 1 ? "" : "s")}";
}

public record Extra(string Code, string Name, string Description, decimal Price, string Basis); // Basis: "person", "booking", "person-night"

public record Testimonial(string Name, string From, string Trip, string Quote);

public record TripStyle(string Key, string Title, string Line, Photo Photo);
