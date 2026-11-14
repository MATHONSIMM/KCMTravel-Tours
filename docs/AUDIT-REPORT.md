# Website Audit: KCM Travel & Tours (independent QA)

- **Site under test:** http://127.0.0.1:5217 (ASP.NET Core MVC, Development env), source `/home/claude/build/KCM Travel & Tours/KcmTravel`
- **Audited:** 2026-11-14, by an independent auditor (did not build the site)
- **Audience:** South Africa, en-ZA, ZAR
- **Target keywords (given):** Kruger safari tours from Mbombela; Panorama Route tour; God's Window tour; Venda heritage tour; Mpumalanga travel agency; South Africa holiday packages
- **Environment caveat:** images.unsplash.com is blocked in the sandbox, so remote photos did not load. They are **not** reported as broken. It also means the Lighthouse performance numbers for Unsplash-heavy pages are **too optimistic** (no photo bytes downloaded). Only the Venda page, which uses local images, gives a realistic image-load picture.

## 1. Verdict: **FAIL**

There is one Critical issue: the mobile menu is broken on most pages. There are also five High issues.

## 2. Scorecard

| Category | Weight | Score |
|---|---|---|
| A. SEO & ranking readiness | 30% | 70 |
| B. Images & media | 15% | 75 |
| C. Performance / CWV | 20% | 78 |
| D. Accessibility | 15% | 72 |
| E. Mobile & UX | 10% | 45 |
| F. Security, trust & compliance | 10% | 70 |
| **Overall** | | **70 / 100** |

### Lighthouse 13 (headless Chrome)

| Page | Form | Perf | A11y | BP | SEO | LCP | CLS | Weight |
|---|---|---|---|---|---|---|---|---|
| / | mobile | 99 | 96 | 96 | 100 | 0.9 s* | 0 | 898 KiB* |
| / | desktop | 100 | 100 | 96 | 100 | 0.3 s* | 0.001 | 1,004 KiB* |
| /tours | mobile | 100 | 93 | 96 | 100 | 0.9 s* | 0.003 | 431 KiB* |
| /tours/kruger-panorama-3-day | mobile | 100 | 95 | 96 | 100 | 0.9 s* | 0 | 258 KiB* |
| /destinations/venda-sacred-sites | mobile | **87** | 94 | 100 | 100 | **4.1 s** | 0 | 1,085 KiB |
| /book | mobile | 100 | 91 | 96 | 100 | 1.0 s* | 0 | 896 KiB* |

\* Unsplash images could not load, so the real LCP and weight will be higher in production. Best Practices lost points only because of the blocked Unsplash requests in the console.

Reports: `lh-mobile-*.json`, `lh-desktop-home.report.html/json`.

### Other tools run
- **axe-core** (Playwright, 375 px, WCAG 2.1 AA): 11 pages checked.
- **linkinator** (recursive): 70 internal links checked, 0 broken. Social, WhatsApp, Unsplash and the production domain were skipped.
- **html-validate**: only minor findings (duplicate `name` on checkbox groups, which is valid for checkboxes; `aria-label` on non-interactive elements).
- **Custom Playwright checks**: horizontal overflow, tap target size and menu behaviour.
- All 35 `sitemap.xml` URLs return 200.

## 3. Top 5 fixes
1. Fix the mobile menu and the horizontal scroll (Critical, C1).
2. Take out the fabricated and sample reviews and the "website demo" note before launch (H1).
3. Fix JSON-LD encoding (`&amp;`, `&#x27;`) and the placeholder `sameAs` and social links (H2, H3).
4. Make the booking confirmation URL unguessable (H4).
5. Add the "Mpumalanga travel agency" keyword (H5). Shorten titles and descriptions; use absolute og:image URLs.

## 4. Findings

| # | Sev | Cat | Page(s) | Issue | Evidence | Exact fix |
|---|---|---|---|---|---|---|
| C1 | **Critical** | E/D | All pages without a hero (/book, /privacy, /terms, 404, /book/confirmation). Every page once the user scrolls (`.is-scrolled`). | Mobile menu is broken, and the page scrolls sideways by 375 px. | `site.css:105` and `:111` put `backdrop-filter` on `.site-header`. That makes the header the containing block for the `position:fixed` `.main-nav` (`site.css:601`). The open menu is then only 375×150 px (the header box), and its links render as transparent text over the page content. `.main-nav` sits at `translateX(100%)` inside that box, so `documentElement.scrollWidth` = **750** at a 375 px viewport (measured on /book, /privacy, /terms, /nope); `scrollTo(400,0)` moves to x=375. Screenshots: `nav-open-book-375.png`, `nav-open-home-scrolled-375.png`, `book-375.png`, `privacy-375.png` (750 px wide). | Move the off-canvas nav out of the filtered element: render `.main-nav` (mobile) as a sibling of `<header>`, or put the blur on a `.site-header::before` pseudo-element instead of the header itself. Add `html,body{overflow-x:clip}` as a safety net. Then re-test the open menu at 375 px, both at the top of the page and after scrolling. |
| H1 | High | F/A | / (Reviews section) | Fabricated testimonials are shipped, with a visible "Sample reviews for the website demo. Replace them with real guest reviews before launch." note. They also show 5-star markup. | `Data/Catalog.cs:414-421`, `Views/Home/Index.cshtml:342-344`. `appsettings.json` has `"ShowSampleLabels": true`, which is the production config. | Remove the section, or replace it with real, attributable reviews (Google Business Profile). Set `ShowSampleLabels:false`. Never add Review/AggregateRating schema for these. |
| H2 | High | A | Every page (JSON-LD) | Structured data values are HTML-encoded by Razor inside `<script>`. Google reads them literally: `"name": "KCM Travel &amp; Tours"`, `"God&#x27;s Window &amp; the Panorama Route"`, and image URLs with `&amp;fit=crop&amp;w=1200`. | `_Layout.cshtml` JSON-LD (`"@site.Name"`, `"@ogImage"`), `Views/Destinations/Detail.cshtml:17-25`, `Views/Tours/Detail.cshtml`. Verified in the rendered HTML of /, /tours/kruger-panorama-3-day and /destinations/gods-window-panorama-route. | Build the JSON-LD as an object and output `@Html.Raw(JsonSerializer.Serialize(obj))`, or wrap each value in `@Html.Raw(JsonEncodedText.Encode(x))`. Validate with the Rich Results Test. |
| H3 | High | A/F | Every page | Social links and `sameAs` point to bare homepages (`https://www.facebook.com/`, instagram, tiktok, youtube). | `appsettings.json` "Facebook"…"YouTube". Used in the footer `.socials` and in the TravelAgency `sameAs`. | Put in the real profile URLs. Until then, drop the empty ones from both the footer and `sameAs`. |
| H4 | High | F (POPIA) | /book/confirmation/{ref} | The booking reference is the only key to a page showing the customer's first name, cell number, tour, dates and price. It can be guessed: `KCM-yyMM-` plus 4 characters from 32 gives about 1.05 M combinations per month. GET is not rate-limited. | `Data/BookingStore.cs:53-58` (`Random.Shared`, 4 chars). `BookingController.Confirmation` has no auth or rate limit (the limiter applies to POST only). | Add a 128-bit random token (`RandomNumberGenerator`/Guid) to the URL, separate from the display reference. Or show the confirmation once via TempData. Rate-limit GET, and mask the phone number (`082 *** 4567`). |
| H5 | High | A | Site-wide | Target keyword "Mpumalanga travel agency" does not appear anywhere ("travel agency" appears 0 times on /, /tours, /destinations, /about and the tour pages). "God's Window tour" also never appears as a phrase. | `curl` plus grep on the rendered pages. | Work "travel agency in Mbombela, Mpumalanga" into the home H1/intro, the /about H1 and the title. Add a dedicated God's Window tour landing copy section on /tours/panorama-route-day. |
| M1 | Medium | A | 8 of 10 pages | Titles are longer than 60 characters after decoding: / 71, /tours 61, /book 74, /destinations 90, Venda 94, tour detail 71. Venda title reads "Venda: Sacred Lakes & Forests: Tours, Best Time…" (double colon). Descriptions run 160–177 characters, or are cut with "…" (Venda, tour detail). | `/tmp/seo.py` output. Template in `Destinations/Detail.cshtml:8-10`. | Keep titles to 50–60 characters, e.g. "Venda Heritage Tours & Sacred Sites \| KCM". Write descriptions by hand, 140–160 characters, with no mid-word truncation. |
| M2 | Medium | A | Destinations using local images (Venda, Mapungubwe) | `og:image`, `twitter:image` and JSON-LD `image` are relative (`/images/places/thathe-vondo-forest.webp`). | Venda page head. `Photo.Sized()` returns a relative URL for local files. | Prefix with `BaseUrl`. Provide a 1200×630 JPG for OG (WebP OG has limited support on WhatsApp/Facebook). |
| M3 | Medium | C/B | /destinations/venda-sacred-sites | Mobile LCP is 4.1 s and Performance 87. The local hero gets one URL for every srcset width. | `_PageHero.cshtml` srcset 800–2400w → the same `thathe-vondo-forest.webp` (980×670, 176 KB) is shown at a 1800 px slot and looks soft on desktop (`venda-1440.png`). `mapungubwe-heritage-centre.webp` is 467 KB (>200 KB). | Export 800/1280/1800 px variants (around 60–120 KB each) and generate real srcset entries for local photos. Compress the Mapungubwe image. |
| M4 | Medium | D | All pages, 375 px | The chat launcher has no accessible name on mobile (axe: critical `button-name`). Its only text is in `.chat-launcher-text {display:none}`. | `site.css:648`, `_ChatWidget.cshtml:3`. | Add `aria-label="Plan a trip with Naledi, our trip assistant"` to `.chat-launcher`. |
| M5 | Medium | D | /book, and other cream-background `.eyebrow` | Contrast is 4.3:1 (#b9532a on #f6f1e7, 12 px), below 4.5:1. | axe `color-contrast`. `site.css:96`. | Darken `--earth` for text to around #a3461f, or make it larger or bold at 14 px+. |
| M6 | Medium | E/D | All pages, 375 px | Floating WhatsApp and chat bubbles cover content: slide dot "06" on the home hero, "Deposit due… R" on /book, and the sidebar "Plan a trip to Venda" card at 1440. The header phone tap target is 18×18 px on mobile. | `hero-375-json.png`, `book-375.png`, `venda-1440.png`. `.header-phone` `site.css:129/593`. | Merge the two floaters into one, add bottom padding to forms and summary cards, and give `.header-phone` 44×44 px padding. |
| M7 | Medium | A | Any mixed-case URL | `/Tours` returns 200 with `canonical=https://www.kcmtravel.co.za/Tours`. Duplicate URLs canonicalise to themselves. | `_Layout.cshtml` canonical uses the raw `Request.Path`. | Lowercase the canonical path, or 301-redirect uppercase paths to lowercase. |
| M8 | Medium | C | Static files | No `Cache-Control` in Development; production sets 30 days on all static files. That is fine, but Lighthouse flags around 850 KB of uncacheable assets. The CSS is not minified. | `Program.cs` `OnPrepareResponse`. | Confirm the production headers after deploy. Minify `site.css`. Consider `immutable` for `asp-append-version` assets. |
| M9 | Medium | E/C | / at 375 px | The home page is 29,990 px tall on mobile (about 37 screens), with 78 `<img>` and 6 hero slides. Data cost is a concern in SA. | `home-375.png`. | Cut sections, cap rails at 6 cards, and load secondary sections on demand. |
| M10 | Medium | F | Launch | No analytics and no Google Search Console verification tag. | `_Layout.cshtml`. | Add GSC verification and a consent-gated analytics script. Update the privacy notice to match. |
| L1 | Low | A | / | Hero H1 is "visually-hidden keyword prefix + slide headline". The hidden text is acceptable but borders on keyword hiding. The stats counters render "0" in the HTML (`data-count`), so crawlers and no-JS users see 0. | `Views/Home/Index.cshtml:69`, stats block. | Make the H1 visible text carry the keyword. Server-render the final numbers. |
| L2 | Low | D | /tours | Heading order skips from H1 to H3 (tour cards). | Lighthouse `heading-order`. | Add an H2 ("All tours") or use H2 for the card titles. |
| L3 | Low | A | /error/200 | The error route returns status 200 for any code passed in. | `HomeController.Error`. | Restrict it to 400–599. |
| L4 | Low | D | / | The hero dots have `aria-label` that does not match their visible text ("01"). | Lighthouse `label-content-name-mismatch`. | Start the label with the visible number: "01: Kruger National Park". |

### What is done well
- One H1 per page, unique canonicals, `lang="en-ZA"`, and `og:locale en_ZA`.
- robots.txt references the sitemap. The sitemap is complete and valid, and all 35 URLs return 200.
- The 404 page returns a real 404 status with `noindex`.
- Breadcrumb and TouristTrip schema include a ZAR Offer.
- Every `<img>` has `alt`, `width` and `height`. Below-the-fold images are lazy-loaded, and the hero is preloaded with `fetchpriority`.
- Fonts are self-hosted with `font-display:swap` and preloaded. There is a `prefers-reduced-motion` guard, a pausable carousel and a skip link.
- Strong CSP and other security headers, anti-forgery tokens, a honeypot, rate limiting on POST, and a POPIA privacy notice. No secrets in client code.

## 5. Ranking outlook
Local, long-tail terms such as "Venda heritage tour" and "Kruger safari tours from Mbombela" are realistic targets. Competition there is moderate: other Nelspruit and Hazyview operators, SafariBookings and TripAdvisor listings. The site has good technical foundations and real destination copy, but most pages are thin, with 120–420 words of main content outside the home page.

"Panorama Route tour" and "God's Window tour" are dominated by established operators and OTAs. Ranking for them needs dedicated 800–1,500-word guides (route map, timings, entry fees, best season, FAQs with FAQPage schema).

"Mpumalanga travel agency" is currently unaddressed (H5). "South Africa holiday packages" is a national head term held by Flight Centre, Travelstart and others; expect no visibility there without significant backlinks.

Priorities:
- A Google Business Profile at the Msogwaba/Mbombela address with real reviews.
- Citations: Mpumalanga Tourism, SATSA membership, local directories.
- Backlinks from church, school and stokvel partners.
- Original photos to replace stock Unsplash images, which competitors also use.

No ranking position can be promised.

## 6. Screenshots (`/home/claude/audit/`)
- **Full page at 375 / 768 / 1440 px**, named `<page>-<width>.png`: home, tours, tour, dest, venda, book, about, contact, privacy, 404.
- **Mobile menu bug:** `nav-open-book-375.png`, `nav-open-home-scrolled-375.png`. For comparison, `nav-open-home-top-375.png` shows the menu working on a hero page before scrolling.
- **Hero at viewport size:** `hero-375-json.png`. (Full-page captures of the home hero look dark only because the Unsplash images are blocked.)

---

# Re-audit (2026-11-14, after fixes)

The developer applied fixes and restarted the server on :5217 (Development). No source files were changed during this re-audit.

To judge production behaviour, I briefly started a second copy of the existing build with `ASPNETCORE_ENVIRONMENT=Production` on :5218. It used the same binaries and loaded `appsettings.json`. I stopped it after testing.

## Verdict: FAIL → **PASS WITH NOTES**

| Category | Before | After |
|---|---|---|
| A. SEO & ranking readiness | 70 | 86 |
| B. Images & media | 75 | 75 |
| C. Performance / CWV | 78 | 78 |
| D. Accessibility | 72 | 88 |
| E. Mobile & UX | 45 | 75 |
| F. Security, trust & compliance | 70 | 85 |
| **Overall** | **70** | **82** |

### Lighthouse mobile, after fixes (Perf / A11y / BP / SEO)

| Page | Scores | Notes |
|---|---|---|
| / | 100 / 100 / 96 / 100 | |
| /book | 100 / 100 / 96 / 100 | |
| /tours | 100 / 98 / 96 / 100 | |
| /destinations/venda-sacred-sites | 87 / 100 / 100 / 100 | LCP still 4.1 s |

Reports: `lh-mobile-re-*.json`. axe (WCAG 2.1 AA, 375 px) found **0 violations on all 11 pages**. Before, every page had a critical `button-name` violation and /book also failed contrast.

## Critical / High: before → after

| # | Before | After | Evidence |
|---|---|---|---|
| C1 Mobile nav + horizontal scroll | Broken: menu clipped to 375×150 px, scrollWidth 750 | **Fixed** | `backdrop-filter` removed from `.site-header`, and `html,body{overflow-x:clip}` added (`site.css:40-41`). scrollWidth is now 375 on /book, /privacy, /terms and 404, and `scrollTo(400)` leaves x=0. The open menu is 375×812 both at the top and after scrolling (`reaudit-nav-open-book-375.png`, `reaudit-nav-open-home-scrolled-375.png`). |
| H1 Fake reviews + demo note | Shown in production config | **Fixed for production** | The section is now gated by `ShowReviews` (`Index.cshtml:330`). `appsettings.json` sets `ShowReviews:false`. The production instance renders no `review-grid` and no "Sample reviews" note. Development still shows them on purpose for the client demo. |
| H2 HTML-encoded JSON-LD | `&amp;` / `&#x27;` in values and image URLs | **Fixed** | All JSON-LD blocks on 12 pages parse cleanly, with zero HTML entities. The God's Window JSON-LD now reads `God's Window & the Panorama Route`. |
| H3 Placeholder socials / sameAs | Bare homepages | **Fixed for production** | The layout filters out empty URLs. The production home page has no `sameAs` and no facebook.com link. Development keeps generic links for the demo. |
| H4 Guessable confirmation URL | 4-character reference, GET unlimited | **Fixed** | The URL now needs a 128-bit `RandomNumberGenerator` token (`?t=`), compared with `FixedTimeEquals`. A known reference with no token or a wrong token returns 404. GET is rate-limited per IP: 20 requests per 5 minutes, then 429 (verified). The phone number is masked (`Model.MaskedPhone`). |
| H5 "Mpumalanga travel agency" missing | 0 mentions | **Fixed** | Home title is "Mbombela Travel Agency: Kruger Safaris & Tours \| KCM". The home H1 and description say "a travel agency in Mbombela, Mpumalanga". "travel agency" appears 9× on / and 4× on /about. "God's Window tour" appears 4× on /tours/panorama-route-day and 3× on /. |

## Quick Medium re-checks

| Item | After |
|---|---|
| M4 Chat launcher accessible name | **Fixed**: `aria-label="Plan a trip with Naledi, our trip assistant"` |
| M5 `.eyebrow` contrast | **Fixed**: `--earth` is now #a8481f, and axe finds no contrast failures |
| M2 og:image absolute | **Fixed**: absolute on all 12 pages checked, including Venda |
| M7 Lowercase canonical | **Fixed**: `/Tours` now has canonical `…/tours` |
| M1 Title / description lengths | **Mostly fixed**: home 52, /tours 53, tour 51, Venda 39, /about 53. Still more than 60 characters: /destinations (82), /destinations/gods-window-panorama-route (67), /book (66). Descriptions longer than 160 characters: /about (176), /book (181), /destinations (175). God's Window description is still truncated with "…". |
| M3 Venda local hero / LCP | **Open**: still a single 980 px file across all srcset widths. LCP 4.1 s, Perf 87. `mapungubwe-heritage-centre.webp` is still 467 KB. |
| M6, M8–M10 | Not re-checked or unchanged: floating-button overlap, CSS minification, mobile home length, analytics/GSC launch to-do |

## Remaining Critical / High
**None.**

Launch notes:
- Production must run with `ASPNETCORE_ENVIRONMENT=Production` (the default when the variable is unset). Running in Development shows the fake reviews and generic social links.
- `ShowSampleLabels` is still `true` in `appsettings.json`. That is harmless while `ShowReviews=false`, but set it to false to avoid accidents.
- PASS (85+) needs the open Medium items fixed: local image variants and Venda LCP, the three long titles and descriptions, and an analytics/GSC tag.
