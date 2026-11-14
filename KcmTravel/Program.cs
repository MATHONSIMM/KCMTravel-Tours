using System.IO.Compression;
using KcmTravel.Data;
using KcmTravel.Models;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<SiteSettings>(builder.Configuration.GetSection("Site"));
builder.Services.AddSingleton<IBookingStore, JsonBookingStore>();
builder.Services.AddControllersWithViews();
builder.Services.AddRouting(o => { o.LowercaseUrls = true; });

builder.Services.AddResponseCompression(o =>
{
    o.EnableForHttps = true;
    o.Providers.Add<BrotliCompressionProvider>();
    o.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

// Basic protection for the booking and contact forms
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    // per visitor (IP address): 20 form actions per 5 minutes
    o.AddPolicy("forms", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(5) }));
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseStatusCodePagesWithReExecute("/error/{0}");
app.UseHttpsRedirection();
app.UseResponseCompression();

// Security headers
app.Use(async (ctx, next) =>
{
    var h = ctx.Response.Headers;
    h["X-Content-Type-Options"] = "nosniff";
    h["Referrer-Policy"] = "strict-origin-when-cross-origin";
    h["X-Frame-Options"] = "SAMEORIGIN";
    h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    h["Content-Security-Policy"] =
        "default-src 'self'; img-src 'self' data: https://images.unsplash.com; " +
        "style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; " +
        "frame-src https://www.google.com https://maps.google.com; connect-src 'self'; " +
        "form-action 'self'; base-uri 'self'; frame-ancestors 'self'";
    await next();
});

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = c =>
    {
        if (!app.Environment.IsDevelopment())
            c.Context.Response.Headers["Cache-Control"] = "public,max-age=2592000";
    }
});

app.UseRouting();
app.UseRateLimiter();

app.MapControllers();
app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");

app.Run();
