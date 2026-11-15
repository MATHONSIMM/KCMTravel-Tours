using Microsoft.AspNetCore.Mvc;

namespace KcmTravel.Controllers;

/// <summary>Partner programme, partner account and admin dashboard pages.
/// The pages are shells: their data comes from the pilot backend (Google Apps Script) in the browser,
/// so they also work on static hosting (GitHub Pages).</summary>
public class PortalController : Controller
{
    [HttpGet("/partners")]
    public IActionResult Partners() => View();

    [HttpGet("/account")]
    public IActionResult Account() => View();

    [HttpGet("/rate")]
    public IActionResult Rate() => View();

    [HttpGet("/admin")]
    public IActionResult Admin() => View();
}
