namespace KcmTravel.Models;

/// <summary>Bound from the "Site" section of appsettings.json — edit contact details there.</summary>
public class SiteSettings
{
    public string Name { get; set; } = "KCM Travel & Tours";
    public string LegalName { get; set; } = "KCM Travel Tours (Pty) Ltd";
    public string RegistrationNumber { get; set; } = "";
    public string BaseUrl { get; set; } = "https://www.kcmtravel.co.za";
    public string Phone { get; set; } = "";
    public string PhoneDisplay { get; set; } = "";
    public string WhatsApp { get; set; } = "";
    public string Email { get; set; } = "";
    public string Area { get; set; } = "";
    public string Hours { get; set; } = "";
    public string Facebook { get; set; } = "";
    public string Instagram { get; set; } = "";
    public string TikTok { get; set; } = "";
    public string YouTube { get; set; } = "";
    public string LinkedIn { get; set; } = "";
    public bool ShowSampleLabels { get; set; } = true;
    public bool ShowReviews { get; set; }

    public string WhatsAppLink(string text) =>
        $"https://wa.me/{WhatsApp}?text={Uri.EscapeDataString(text)}";
}
