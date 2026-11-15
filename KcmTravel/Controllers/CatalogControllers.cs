using System.Text;
using KcmTravel.Data;
using KcmTravel.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace KcmTravel.Controllers;

[Route("destinations")]
public class DestinationsController : Controller
{
    [HttpGet("")]
    public IActionResult Index(string? region)
    {
        ViewBag.Region = region;
        return View(Catalog.Destinations);
    }

    [HttpGet("{slug}")]
    public IActionResult Detail(string slug)
    {
        var d = Catalog.FindDestination(slug);
        return d is null ? NotFound() : View(d);
    }
}

[Route("tours")]
public class ToursController : Controller
{
    [HttpGet("")]
    public IActionResult Index(string? category, string? style, string? destination, DateTime? date, int? adults)
    {
        ViewBag.Category = category;
        ViewBag.Style = style;
        ViewBag.Destination = destination is null ? null : Catalog.FindDestination(destination);
        ViewBag.Date = date?.ToString("yyyy-MM-dd");
        ViewBag.Adults = adults;
        return View(Catalog.Tours);
    }

    [HttpGet("{slug}")]
    public IActionResult Detail(string slug)
    {
        var t = Catalog.FindTour(slug);
        return t is null ? NotFound() : View(t);
    }
}

/// <summary>JSON feed used by the chat assistant and the booking form.</summary>
[ApiController, Route("api")]
public class ApiController : ControllerBase
{
    [HttpGet("catalog")]
    [HttpGet("catalog.json")]
    [ResponseCache(Duration = 600)]
    public IActionResult CatalogFeed() => Ok(new
    {
        tours = Catalog.Tours.Select(t => new
        {
            t.Slug, t.Title, t.Summary, t.Category, t.Nights, t.NightsLabel,
            price = t.PricePerPersonSharing, extraNight = t.ExtraNightPerPerson,
            t.Tags, t.GroupFriendly, image = t.Hero.Sized(640), alt = t.Hero.Alt,
            destinations = t.DestinationSlugs,
            regions = t.DestinationSlugs.Select(s => Catalog.FindDestination(s)?.Region).Distinct(),
        }),
        extras = Catalog.Extras,
        rooms = Catalog.Rooms.ToDictionary(r => r.Key, r => new { label = r.Value.Label, factor = r.Value.Factor }),
        rules = new { childRate = Catalog.ChildRate, pensionerDiscount = Catalog.PensionerDiscount, depositRate = Catalog.DepositRate },
    });
}

public class SeoController : Controller
{
    private readonly SiteSettings _site;
    public SeoController(IOptions<SiteSettings> site) => _site = site.Value;

    [HttpGet("/robots.txt")]
    public ContentResult Robots() => Content(
        $"User-agent: *\nAllow: /\nDisallow: /book/confirmation/\nDisallow: /api/\nDisallow: /admin\nDisallow: /account\nDisallow: /rate\n\nSitemap: {_site.BaseUrl.TrimEnd('/')}/sitemap.xml\n", "text/plain");

    [HttpGet("/sitemap.xml")]
    [ResponseCache(Duration = 3600)]
    public ContentResult Sitemap()
    {
        var b = _site.BaseUrl.TrimEnd('/');
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var urls = new List<(string Loc, string Priority)>
        {
            ("/", "1.0"), ("/tours", "0.9"), ("/destinations", "0.9"), ("/book", "0.8"),
            ("/about", "0.6"), ("/contact", "0.6"), ("/partners", "0.7"), ("/privacy", "0.2"), ("/terms", "0.2"),
        };
        urls.AddRange(Catalog.Destinations.Select(d => ($"/destinations/{d.Slug}", "0.8")));
        urls.AddRange(Catalog.Tours.Select(t => ($"/tours/{t.Slug}", "0.8")));

        var sb = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        foreach (var (loc, p) in urls)
            sb.Append($"  <url><loc>{b}{loc}</loc><lastmod>{today}</lastmod><priority>{p}</priority></url>\n");
        sb.Append("</urlset>");
        return Content(sb.ToString(), "application/xml");
    }
}
