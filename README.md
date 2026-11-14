# KCM Travel & Tours: website

An ASP.NET Core 8 MVC website for **KCM Travel Tours (Pty) Ltd**, a travel and tour company based in Mbombela, Mpumalanga.

## Run it in Visual Studio

1. You need **Visual Studio 2022 (17.8 or newer)** with the **ASP.NET and web development** workload. This includes the .NET 8 SDK.
2. Double-click **`KcmTravel.sln`**.
3. Press **F5** (or the green ▶ button). The site opens in your browser.
   - If Visual Studio asks to trust the development HTTPS certificate, click **Yes**.
4. The site needs internet access to show the destination photos, which load from Unsplash.

From a terminal instead: `cd KcmTravel` then `dotnet run`, and open the URL it prints.

## What's in the site

| Page | URL |
|---|---|
| Home: hero slideshow, quick search, destinations rail, trip styles, featured tours, Venda feature, season planner, reviews, groups | `/` |
| All tours, with filters for category, style, destination and group size | `/tours` |
| Tour detail: itinerary, inclusions, gallery, booking box | `/tours/{slug}` |
| Destinations, with a province filter | `/destinations` |
| Destination detail: best time to visit, highlights, trips | `/destinations/{slug}` |
| 5-step booking form with live price in rand | `/book` |
| Booking confirmation with reference number | `/book/confirmation/{ref}` |
| About, Contact, Privacy (POPIA), Booking terms | `/about`, `/contact`, `/privacy`, `/terms` |
| SEO: sitemap and robots | `/sitemap.xml`, `/robots.txt` |

The **Naledi chat assistant** (bottom right) asks about trip style, province, dates, travellers, nights and budget. It then suggests 3 trips with a price estimate for the group, and a "Book this" link that fills in the booking form for you. It can also pass everything to a consultant on WhatsApp.

The **WhatsApp button** and footer links open WhatsApp on **076 436 0010** with a ready-made message.

## Where to change things

| What | File |
|---|---|
| Phone, WhatsApp, email, address, hours, social media links | `KcmTravel/appsettings.json` → `Site` section |
| Destinations, tours, prices, itineraries, extras, pricing rules | `KcmTravel/Data/Catalog.cs` |
| Colours, fonts, spacing | `KcmTravel/wwwroot/css/site.css` (the top `:root` block) |
| Slideshow slides on the home page | `KcmTravel/Views/Home/Index.cshtml` (the `slides` list at the top) |
| Chat assistant questions | `KcmTravel/wwwroot/js/chat.js` (the `STEPS` list) |
| Logo files | `KcmTravel/wwwroot/images/brand/` |

## Bookings and messages (demo mode)

Booking requests and contact messages are saved as JSON files in `KcmTravel/App_Data/` (`bookings.json`, `messages.json`). No email is sent yet.

**To go live**, implement `IBookingStore` (in `Data/BookingStore.cs`) with SQL Server or Entity Framework, plus an email or WhatsApp Business notification, and register it in `Program.cs`. The pages don't need to change.

The chat assistant follows a fixed script for now. To connect a real AI model later, add a server endpoint and call it from `reply()` in `chat.js`.

## Before launch: checklist

- [ ] **Prices:** every price is DEMO data. Load real rates in `Data/Catalog.cs`.
- [ ] **Email and domain:** `bookings@kcmtravel.co.za` and `https://www.kcmtravel.co.za` are placeholders. Update `appsettings.json`, then set up the mailbox and domain.
- [ ] **Social links:** they currently point to the Facebook, Instagram, TikTok, YouTube and LinkedIn home pages. Replace them with KCM's page URLs.
- [ ] **Reviews:** the reviews on the home page are samples. Replace them with real guest reviews in `Catalog.Testimonials`, then set `"ShowSampleLabels": false`.
- [ ] **Photos:** remote photos are free-licence Unsplash images, loaded from Unsplash. The local photos in `wwwroot/images/places` came from the client's Drive folder. Confirm KCM has the rights to use them, or replace them with your own photos. Your own photos are always best.
- [ ] **Legal pages:** have a legal adviser review the Privacy and Terms templates.
- [ ] Add Google Analytics or Search Console tags and a cookie notice if you start tracking.
- [ ] After deploying, submit `https://your-domain/sitemap.xml` in Google Search Console.

## Deploying

The site runs on any host that supports ASP.NET Core 8: Azure App Service, Windows hosting with IIS, or a Linux VPS. In Visual Studio, right-click the project, choose **Publish**, and follow the wizard.

The site uses the `App_Data` folder for demo storage, so make sure the app has write permission there, or switch to a database first.
