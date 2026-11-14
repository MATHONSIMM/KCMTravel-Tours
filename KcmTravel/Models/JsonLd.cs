using System.Text.Json;
using Microsoft.AspNetCore.Html;

namespace KcmTravel.Models;

/// <summary>Renders schema.org structured data safely (no HTML-encoding of values).</summary>
public static class JsonLd
{
    private static readonly JsonSerializerOptions Opts = new() { WriteIndented = false };

    public static IHtmlContent Script(object data) =>
        new HtmlString("<script type=\"application/ld+json\">" + JsonSerializer.Serialize(data, Opts) + "</script>");

    public static Dictionary<string, object?> Node(string type, params (string Key, object? Value)[] props)
    {
        var d = new Dictionary<string, object?> { ["@context"] = "https://schema.org", ["@type"] = type };
        foreach (var (k, v) in props) if (v is not null) d[k] = v;
        return d;
    }

    public static Dictionary<string, object?> Obj(string type, params (string Key, object? Value)[] props)
    {
        var d = new Dictionary<string, object?> { ["@type"] = type };
        foreach (var (k, v) in props) if (v is not null) d[k] = v;
        return d;
    }

    public static object Breadcrumbs(string baseUrl, params (string Name, string Path)[] items) =>
        Node("BreadcrumbList", ("itemListElement", items.Select((x, i) => Obj("ListItem", ("position", i + 1), ("name", x.Name), ("item", baseUrl + x.Path))).ToArray()));
}

public static class Seo
{
    /// <summary>Keeps meta descriptions within ~160 characters, cutting at a sentence or word boundary.</summary>
    public static string Desc(string text, int max = 160)
    {
        text = text.Trim();
        if (text.Length <= max) return text;
        var cut = text[..max];
        var dot = cut.LastIndexOf(". ", StringComparison.Ordinal);
        if (dot > 90) return cut[..(dot + 1)];
        var sp = cut.LastIndexOf(' ');
        return cut[..sp].TrimEnd(',', ';', ':') + "…";
    }
}
