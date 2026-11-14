using System.ComponentModel.DataAnnotations;

namespace KcmTravel.Models;

public class BookingRequest
{
    [Required(ErrorMessage = "Please choose a trip.")]
    public string TourSlug { get; set; } = "";

    [Required(ErrorMessage = "Please choose a start date.")]
    [DataType(DataType.Date)]
    public DateTime? StartDate { get; set; }

    [Range(0, 30, ErrorMessage = "Nights must be between 0 and 30.")]
    public int Nights { get; set; }

    [Range(1, 60, ErrorMessage = "At least one adult must travel.")]
    public int Adults { get; set; } = 2;

    [Range(0, 40)] public int Children { get; set; }      // 3–11
    [Range(0, 20)] public int Infants { get; set; }       // under 3, free
    [Range(0, 40)] public int Pensioners { get; set; }    // 60+

    public string Room { get; set; } = "double";
    public List<string> Extras { get; set; } = new();

    [Required(ErrorMessage = "Please tell us your name.")]
    [StringLength(80)]
    public string FullName { get; set; } = "";

    [Required(ErrorMessage = "We need an email to send your quote.")]
    [EmailAddress(ErrorMessage = "That email doesn't look right.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Please add a cell number for WhatsApp updates.")]
    [RegularExpression(@"^[0-9 +()-]{9,20}$", ErrorMessage = "Please enter a valid cell number.")]
    public string Phone { get; set; } = "";

    [StringLength(600)]
    public string? Notes { get; set; }

    public string Payment { get; set; } = "deposit"; // deposit | full | layby

    [Range(typeof(bool), "true", "true", ErrorMessage = "Please accept the privacy notice so we can contact you.")]
    public bool Consent { get; set; }

    /// <summary>Honeypot field — must stay empty (spam protection).</summary>
    public string? Website { get; set; }
}

public record PriceLine(string Label, decimal Amount);

public record PriceQuote(IReadOnlyList<PriceLine> Lines, decimal Total, decimal Deposit, int Travellers, int Nights)
{
    public decimal VatIncluded => Math.Round(Total - Total / 1.15m, 2);
}

public record StoredBooking(string Reference, DateTime CreatedUtc, BookingRequest Request, PriceQuote Quote, string Status, string Token = "")
{
    public string MaskedPhone => Request.Phone.Length > 4 ? new string('•', Request.Phone.Length - 4) + Request.Phone[^4..] : Request.Phone;
}

public class ContactMessage
{
    [Required, StringLength(80)] public string Name { get; set; } = "";
    [Required, EmailAddress] public string Email { get; set; } = "";
    [StringLength(20)] public string? Phone { get; set; }
    [Required, StringLength(1500)] public string Message { get; set; } = "";
    public string? Website { get; set; }
}
