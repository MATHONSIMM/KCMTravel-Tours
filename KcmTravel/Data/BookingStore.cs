using System.Text.Json;
using KcmTravel.Models;

namespace KcmTravel.Data;

public interface IBookingStore
{
    Task<StoredBooking> SaveAsync(BookingRequest request, PriceQuote quote);
    Task SaveMessageAsync(ContactMessage message);
    Task<StoredBooking?> FindAsync(string reference, string token);
}

/// <summary>
/// Demo storage: writes bookings to App_Data/bookings.json.
/// To go live, implement IBookingStore with SQL Server (EF Core) and send an email in SaveAsync,
/// then swap the registration in Program.cs. Nothing in the controllers or views needs to change.
/// </summary>
public class JsonBookingStore : IBookingStore
{
    private static readonly SemaphoreSlim Lock = new(1, 1);
    private static readonly JsonSerializerOptions Opts = new() { WriteIndented = true };
    private readonly string _bookingsPath;
    private readonly string _messagesPath;
    private readonly ILogger<JsonBookingStore> _log;

    public JsonBookingStore(IWebHostEnvironment env, ILogger<JsonBookingStore> log)
    {
        var dir = Path.Combine(env.ContentRootPath, "App_Data");
        Directory.CreateDirectory(dir);
        _bookingsPath = Path.Combine(dir, "bookings.json");
        _messagesPath = Path.Combine(dir, "messages.json");
        _log = log;
    }

    public async Task<StoredBooking> SaveAsync(BookingRequest request, PriceQuote quote)
    {
        request.Website = null;
        var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        var booking = new StoredBooking(NewReference(), DateTime.UtcNow, request, quote, "Pending confirmation", token);
        await AppendAsync(_bookingsPath, booking);
        _log.LogInformation("Booking {Ref} saved for {Tour} ({Total})", booking.Reference, request.TourSlug, quote.Total);
        return booking;
    }

    public Task SaveMessageAsync(ContactMessage message) =>
        AppendAsync(_messagesPath, new { ReceivedUtc = DateTime.UtcNow, message.Name, message.Email, message.Phone, message.Message });

    public async Task<StoredBooking?> FindAsync(string reference, string token)
    {
        if (string.IsNullOrEmpty(token)) return null;
        var list = await ReadAsync<StoredBooking>(_bookingsPath);
        var b = list.FirstOrDefault(x => string.Equals(x.Reference, reference, StringComparison.OrdinalIgnoreCase));
        if (b is null || string.IsNullOrEmpty(b.Token)) return null;
        var ok = System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(b.Token), System.Text.Encoding.UTF8.GetBytes(token));
        return ok ? b : null;
    }

    private static string NewReference()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rnd = Random.Shared;
        return "KCM-" + DateTime.UtcNow.ToString("yyMM") + "-" + new string(Enumerable.Range(0, 4).Select(_ => chars[rnd.Next(chars.Length)]).ToArray());
    }

    private static async Task<List<T>> ReadAsync<T>(string path)
    {
        if (!File.Exists(path)) return new();
        await using var s = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<List<T>>(s, Opts) ?? new();
    }

    private static async Task AppendAsync<T>(string path, T item)
    {
        await Lock.WaitAsync();
        try
        {
            var list = File.Exists(path)
                ? JsonSerializer.Deserialize<List<JsonElement>>(await File.ReadAllTextAsync(path)) ?? new()
                : new List<JsonElement>();
            list.Add(JsonSerializer.SerializeToElement(item, Opts));
            await File.WriteAllTextAsync(path, JsonSerializer.Serialize(list, Opts));
        }
        finally { Lock.Release(); }
    }
}
