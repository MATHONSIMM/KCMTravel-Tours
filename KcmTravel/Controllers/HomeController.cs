using KcmTravel.Data;
using KcmTravel.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KcmTravel.Controllers;

public class HomeController : Controller
{
    private readonly IBookingStore _store;
    public HomeController(IBookingStore store) => _store = store;

    [HttpGet("/")]
    public IActionResult Index() => View();

    [HttpGet("/about")]
    public IActionResult About() => View();

    [HttpGet("/careers")]
    public IActionResult Careers() => View();

    [HttpGet("/contact")]
    public IActionResult Contact() => View(new ContactMessage());

    [HttpPost("/contact"), ValidateAntiForgeryToken, EnableRateLimiting("forms")]
    public async Task<IActionResult> Contact(ContactMessage model)
    {
        if (!string.IsNullOrEmpty(model.Website)) return RedirectToAction(nameof(Contact)); // bot
        if (!ModelState.IsValid) return View(model);
        await _store.SaveMessageAsync(model);
        TempData["ContactSent"] = model.Name.Split(' ')[0];
        return RedirectToAction(nameof(Contact));
    }

    [HttpGet("/privacy")]
    public IActionResult Privacy() => View();

    [HttpGet("/terms")]
    public IActionResult Terms() => View();

    [HttpGet("/error/{code:int?}")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error(int? code)
    {
        Response.StatusCode = code ?? 500;
        return View(code ?? 500);
    }
}
