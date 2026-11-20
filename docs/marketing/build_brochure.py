#!/usr/bin/env python3
"""KCM Travel & Tours: launch brochure + explainer video script (HTML -> PDF)."""
import base64, pathlib, html
ROOT = pathlib.Path(__file__).resolve().parent  # docs/marketing
WWW = ROOT.parents[1] / 'KcmTravel/wwwroot'
uri = lambda p, m: f'data:{m};base64,' + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
LOGO = uri(WWW / 'images/brand/kcm-logo.svg', 'image/svg+xml')
F_D = uri(WWW / 'fonts/fraunces.woff2', 'font/woff2'); F_I = uri(WWW / 'fonts/fraunces-italic.woff2', 'font/woff2'); F_B = uri(WWW / 'fonts/manrope.woff2', 'font/woff2')
img = lambda n: f'img/{n}.jpg'
E = html.escape

tours = [
 ('Mpumalanga and Kruger', [
   ('Kruger Full-Day Open-Vehicle Safari', 'Day trip', 1650),
   ("Panorama Route & God's Window Day Tour", 'Day trip', 1250),
   ('Kruger & Panorama Route: 3-Day Classic', '2 nights', 6950),
   ('Greater Kruger Private Lodge: 4-Day Luxury', '3 nights', 18900),
   ("Sudwala Caves & Pilgrim's Rest Weekend", '2 nights', 3850),
   ('Group Kruger Safari: Schools, Churches & Stokvels', '2 nights', 2950)]),
 ('Limpopo heritage', [
   ('Venda Sacred Sites: 3-Day Heritage Route', '2 nights', 4650),
   ('Mapungubwe Heritage & Wildlife Escape', '3 nights', 7450)]),
 ('Cape, coast and mountains', [
   ('Cape Town Highlights', '4 nights', 12400),
   ('Winelands Romantic Escape', '2 nights', 5900),
   ('Garden Route Self-Drive', '5 nights', 10800),
   ('Durban Family Beach Holiday', '3 nights', 5450),
   ('Drakensberg Mountain Weekend', '2 nights', 3950),
   ('Sun City & Pilanesberg Getaway', '2 nights', 4750)]),
]
rand = lambda n: 'R' + f'{n:,}'.replace(',', ' ')
tour_rows = ''.join(f'<tr class="grp"><td colspan="3">{E(g)}</td></tr>' + ''.join(f'<tr><td>{E(t)}</td><td>{d}</td><td class="r">from <b>{rand(p)}</b></td></tr>' for t, d, p in rows) for g, rows in tours)

asks = [
 ('Want to see the Big Five?', 'Open-vehicle safaris into the Kruger National Park leave Mbombela at first light, with a guide who knows where the animals were yesterday.'),
 ('Planning a school trip?', 'Learners, teachers and a bus: we plan the route, the park bookings, the meals and the safety briefing, at a group price per learner.'),
 ('Organising a church outing or stokvel trip?', 'One price per person, one contact person, and a programme that fits your group, whether it is 15 people or 60.'),
 ('Looking for a romantic weekend?', 'A Winelands escape, a private lodge in the Greater Kruger, or a quiet guesthouse on the Panorama Route.'),
 ('Taking the family on holiday?', 'Durban beaches, Sun City and the Pilanesberg, or a self-drive along the Garden Route, with child rates built in.'),
 ('Need something different?', 'Tell us your dates, your budget and what you love. We put together a trip that is yours alone.'),
 ('Own a lodge, a vehicle or a tour business?', 'Partner with KCM. Register your business, get approved, and receive bookings and payouts through your own partner account.'),
]
ask_html = ''.join(f'<div class="ask"><h3>{E(q)}</h3><p>{E(a)}</p></div>' for q, a in asks)

scenes = [
 ('0:00 – 0:05', 'Sunrise over the bushveld; an open safari vehicle rolls out. KCM logo fades in.', 'Imagine meeting the Big Five before breakfast.', 'KCM Travel & Tours'),
 ('0:05 – 0:15', 'Quick cuts: elephants at a waterhole, God\'s Window viewpoint, Blyde River Canyon.', 'From the Kruger National Park to the Panorama Route, we know the Lowveld because it is home.', 'Born in Mbombela'),
 ('0:15 – 0:25', 'Group shots: learners stepping off a bus, a church group at a viewpoint, friends laughing.', 'Planning a school trip, a church outing or a stokvel getaway? We handle the transport, the bookings and the details.', 'Groups, schools, churches, stokvels'),
 ('0:25 – 0:35', 'Couple at a wine farm; a family on Durban beach; Table Mountain cableway.', 'A romantic weekend in the Winelands. A family holiday in Durban. Cape Town, the Garden Route, the Drakensberg.', 'Trips from R1 250 per person'),
 ('0:35 – 0:47', 'Screen recording: the KCM website, choosing a tour, the price updating as travellers are added.', 'Choose your trip online and see the price straight away. No waiting for a quote.', 'See your price instantly'),
 ('0:47 – 0:57', 'Screen recording: Kaycee chat asking about dates, group size and budget.', 'Not sure where to go? Ask Kaycee, our trip assistant. Answer a few questions and she sends your plan to our team.', 'Meet Kaycee'),
 ('0:57 – 1:07', 'Venda and Mapungubwe: Lake Fundudzi, the Sagole baobab, Mapungubwe at sunset.', 'Go further: the sacred sites of Venda and the ancient kingdom of Mapungubwe.', 'Heritage routes'),
 ('1:07 – 1:15', 'Lodge owner and a driver shaking hands with a KCM guide.', 'Own a lodge, a vehicle or a tour business? Grow with us as a KCM partner.', 'Partner with KCM'),
 ('1:15 – 1:25', 'Sunset over the savanna; logo and "Launching soon" card.', 'KCM Travel & Tours. Your trip, planned properly. Launching soon.', 'LAUNCHING SOON'),
]
scene_rows = ''.join(f'<tr><td class="t">{t}</td><td>{E(v)}</td><td><i>"{E(vo)}"</i></td><td><b>{E(os)}</b></td></tr>' for t, v, vo, os in scenes)

doc = f'''<!DOCTYPE html><html lang="en-ZA"><head><meta charset="utf-8"><title>KCM Travel &amp; Tours</title><style>
@font-face {{ font-family: Fraunces; src: url("{F_D}") format("woff2"); font-weight: 100 900; }}
@font-face {{ font-family: Fraunces; font-style: italic; src: url("{F_I}") format("woff2"); font-weight: 100 900; }}
@font-face {{ font-family: Manrope; src: url("{F_B}") format("woff2"); font-weight: 200 800; }}
@page {{ size: A4; margin: 0; }}
:root {{ --ink: #14201b; --soft: #55645d; --accent: #b4542a; --sand: #f6f0e7; --line: #e4dacb; --green: #1f5f45; --dark: #0f1915; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; font-family: Manrope, sans-serif; color: var(--ink); font-size: 10.6pt; line-height: 1.55; }}
h1, h2, h3 {{ font-family: Fraunces, Georgia, serif; font-weight: 500; line-height: 1.12; margin: 0; }}
em {{ font-family: Fraunces, serif; font-style: italic; }}
.page {{ width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; padding: 18mm 17mm; }}
.page:last-child {{ page-break-after: auto; }}
.kicker {{ font-size: 8.5pt; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--accent); margin-bottom: 4mm; }}
h2 {{ font-size: 27pt; margin-bottom: 6mm; }}
p {{ margin: 0 0 3.5mm; }}
.lead {{ font-size: 12.5pt; color: var(--soft); }}
.foot {{ position: absolute; left: 17mm; right: 17mm; bottom: 9mm; display: flex; justify-content: space-between; font-size: 7.5pt; color: #8b958f; }}
/* cover */
.cover {{ padding: 0; background: var(--dark); color: #fff; }}
.cover .photo {{ position: absolute; inset: 0 0 auto 0; height: 168mm; background: url({img('mapungubwe-path-sunset')}) center/cover; }}
.cover .photo::after {{ content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,25,21,.15) 0%, rgba(15,25,21,.0) 40%, rgba(15,25,21,1) 100%); }}
.cover .logo {{ position: absolute; top: 14mm; left: 17mm; width: 34mm; background: rgba(255,255,255,.92); padding: 3mm 4mm; border-radius: 3mm; }}
.cover .body {{ position: absolute; left: 17mm; right: 17mm; top: 150mm; }}
.cover h1 {{ font-size: 44pt; letter-spacing: -.01em; }}
.cover h1 em {{ color: #e9c98f; }}
.cover .lead {{ color: #d5dbd7; font-size: 13.5pt; margin-top: 6mm; max-width: 150mm; }}
.cover .soon {{ position: absolute; left: 17mm; bottom: 16mm; display: inline-flex; align-items: center; gap: 4mm; padding: 3.5mm 7mm; border: 1.5px solid #e9c98f; border-radius: 99px; color: #e9c98f; font-weight: 800; letter-spacing: .2em; font-size: 10pt; }}
.cover .soon::before {{ content: ""; width: 2.6mm; height: 2.6mm; border-radius: 50%; background: #e9c98f; }}
.cover .where {{ position: absolute; right: 17mm; bottom: 18mm; color: #aeb8b2; font-size: 9pt; text-align: right; }}
/* about */
.split {{ display: grid; grid-template-columns: 1.05fr .95fr; gap: 10mm; align-items: start; }}
.ph {{ width: 100%; border-radius: 3mm; display: block; object-fit: cover; }}
.facts {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 8mm; }}
.facts div {{ background: var(--sand); border-radius: 3mm; padding: 4.5mm; }}
.facts b {{ display: block; font-family: Fraunces, serif; font-weight: 500; font-size: 20pt; color: var(--accent); line-height: 1.1; }}
.facts span {{ font-size: 8.8pt; color: var(--soft); }}
ul.ticks {{ list-style: none; padding: 0; margin: 4mm 0 0; }}
ul.ticks li {{ position: relative; padding-left: 7mm; margin-bottom: 2.6mm; }}
ul.ticks li::before {{ content: ""; position: absolute; left: 0; top: 1.6mm; width: 3.4mm; height: 1.8mm; border-left: 2px solid var(--green); border-bottom: 2px solid var(--green); transform: rotate(-45deg); }}
/* asks */
.asks {{ display: grid; grid-template-columns: 1fr 1fr; gap: 9mm 9mm; margin-top: 8mm; }}
.ask {{ padding: 6mm 0 0; border-top: 2px solid var(--line); break-inside: avoid; }}
.ask h3 {{ font-size: 17pt; margin-bottom: 2mm; color: var(--green); }}
.ask p {{ font-size: 10.8pt; color: var(--soft); margin: 0; }}
.ask:last-child {{ grid-column: 1 / -1; background: var(--sand); border: 0; border-radius: 3mm; padding: 5mm 6mm; }}
/* tours */
table {{ width: 100%; border-collapse: collapse; }}
.tours td {{ padding: 2.3mm 2mm; border-bottom: 1px solid var(--line); font-size: 10pt; }}
.tours tr.grp td {{ padding-top: 5mm; font-size: 8.5pt; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); border-bottom: 1.5px solid var(--accent); }}
.tours td:nth-child(2) {{ color: var(--soft); white-space: nowrap; width: 22mm; }}
.tours td.r {{ text-align: right; white-space: nowrap; width: 34mm; }}
.small {{ font-size: 8.6pt; color: var(--soft); }}
.strip {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-bottom: 7mm; }}
.strip img {{ height: 38mm; }}
/* steps */
.steps {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; margin: 6mm 0 8mm; }}
.steps div {{ border-top: 3px solid var(--green); padding-top: 3mm; }}
.steps b {{ display: block; font-family: Fraunces, serif; font-weight: 500; font-size: 22pt; color: var(--green); }}
.steps span {{ font-size: 9.4pt; }}
.shots {{ display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }}
.shots figure {{ margin: 0; }}
.shots img {{ width: 100%; border-radius: 2.5mm; border: 1px solid var(--line); display: block; }}
figcaption {{ font-size: 8.4pt; color: var(--soft); margin-top: 1.5mm; }}
/* video */
.script td {{ padding: 2.4mm 2mm; border-bottom: 1px solid var(--line); vertical-align: top; font-size: 8.9pt; }}
.script th {{ text-align: left; font-size: 7.6pt; letter-spacing: .12em; text-transform: uppercase; color: var(--soft); padding: 2mm; border-bottom: 1.5px solid var(--ink); }}
.script td.t {{ white-space: nowrap; font-weight: 800; color: var(--accent); }}
.notes {{ display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 6mm; font-size: 9.2pt; }}
.notes div {{ background: var(--sand); border-radius: 3mm; padding: 4.5mm 5mm; }}
.notes h3 {{ font-size: 12.5pt; margin-bottom: 2mm; }}
.notes ul {{ margin: 0; padding-left: 4.5mm; }}
/* back */
.back {{ background: var(--dark); color: #fff; padding: 0; }}
.back .photo {{ position: absolute; inset: 0; background: url({img('sagole-baobab-venda')}) center/cover; opacity: .3; }}
.back .in {{ position: absolute; left: 17mm; right: 17mm; top: 50%; transform: translateY(-50%); text-align: center; }}
.back .logo {{ width: 40mm; background: rgba(255,255,255,.92); padding: 3mm 4mm; border-radius: 3mm; }}
.back h2 {{ font-size: 54pt; letter-spacing: .02em; margin: 12mm 0 5mm; }}
.back h2 em {{ color: #e9c98f; }}
.back p {{ color: #dfe5e1; font-size: 13pt; max-width: 140mm; margin: 0 auto 4mm; }}
.back .tag {{ display: inline-block; margin-top: 8mm; padding: 3mm 7mm; border: 1.5px solid #e9c98f; border-radius: 99px; color: #e9c98f; font-weight: 800; letter-spacing: .2em; font-size: 9.5pt; }}
</style></head><body>

<section class="page cover">
  <div class="photo"></div>
  <img class="logo" src="{LOGO}" alt="KCM Travel &amp; Tours">
  <div class="body">
    <h1>Your trip,<br><em>planned properly.</em></h1>
    <p class="lead">Safaris, heritage routes, beach holidays and group tours across South Africa, planned by a local team from Mbombela.</p>
  </div>
  <div class="soon">LAUNCHING SOON</div>
  <div class="where">KCM Travel &amp; Tours<br>Msogwaba, Mbombela, Mpumalanga</div>
</section>

<section class="page">
  <div class="kicker">Who we are</div>
  <div class="split">
    <div>
      <h2>A Lowveld tour company that does the planning for you.</h2>
      <p class="lead">KCM Travel &amp; Tours is a South African tour operator based in Msogwaba, Mbombela, on the doorstep of the Kruger National Park and the Panorama Route.</p>
      <p>We work with trusted local drivers, guides, lodges and guesthouses, so every trip is run by people who know the area. You get one team that plans the route, books the stays, arranges transport and stays in touch with you until you are home.</p>
      <ul class="ticks">
        <li>Clear prices per person, shown before you book</li>
        <li>Day trips, weekends and multi-day tours</li>
        <li>Schools, churches, stokvels, families, couples and companies</li>
        <li>Your personal details handled under POPIA</li>
      </ul>
    </div>
    <div><img class="ph" src="{img('mapungubwe-heritage-centre')}" alt="" style="height:118mm"></div>
  </div>
  <div class="facts">
    <div><b>14</b><span>ready-made trips across five provinces</span></div>
    <div><b>R1 250</b><span>starting price per person for a day tour</span></div>
    <div><b>1 team</b><span>from first question to safe return</span></div>
  </div>
  <div class="foot"><span>KCM Travel &amp; Tours</span><span>2</span></div>
</section>

<section class="page">
  <div class="kicker">Is this you?</div>
  <h2>What can you do with KCM?</h2>
  <p class="lead">Seven ways KCM can help, whoever you are travelling with.</p>
  <div class="asks">{ask_html}</div>
  <div class="foot"><span>KCM Travel &amp; Tours</span><span>3</span></div>
</section>

<section class="page">
  <div class="kicker">Our trips</div>
  <h2>Ready-made trips, <em>priced per person.</em></h2>
  <div class="strip"><img class="ph" src="{img('lake-fundudzi-venda')}" alt=""><img class="ph" src="{img('thathe-vondo-forest')}" alt=""><img class="ph" src="{img('vondo-lodge-view')}" alt=""></div>
  <table class="tours">{tour_rows}</table>
  <p class="small" style="margin-top:4mm">Prices are per adult, sharing, and are indicative before launch. Children, pensioners, room upgrades, airport transfers and car hire are priced on the website when you book. Custom trips are quoted on request.</p>
  <div class="foot"><span>KCM Travel &amp; Tours</span><span>4</span></div>
</section>

<section class="page">
  <div class="kicker">How it works</div>
  <h2>Booking takes a few minutes.</h2>
  <div class="steps">
    <div><b>1</b><span>Choose a trip on the website, or ask Kaycee to suggest one.</span></div>
    <div><b>2</b><span>Add your dates and travellers and see the price straight away.</span></div>
    <div><b>3</b><span>Send your request. You get a reference number immediately.</span></div>
    <div><b>4</b><span>Our team confirms the details with you and sends your quotation.</span></div>
  </div>
  <div class="shots">
    <figure><img src="{img('02-booking-form')}" alt=""><figcaption>The booking form shows your estimate as you add travellers and extras.</figcaption></figure>
    <figure><img src="{img('03-kaycee')}" alt=""><figcaption>Kaycee, our trip assistant, asks a few questions and sends your plan to the team.</figcaption></figure>
  </div>
  <h3 style="font-size:16pt;margin:9mm 0 3mm">Groups and partners</h3>
  <p><b>Groups:</b> schools, churches, stokvels and companies get one contact person, one price per person and a programme built around the group.</p>
  <p><b>Partners:</b> lodges, guesthouses, drivers, guides and tour businesses can register on the website. Once approved, partners see their trips, payouts and guest ratings in their own account.</p>
  <div class="foot"><span>KCM Travel &amp; Tours</span><span>5</span></div>
</section>

<section class="page">
  <div class="kicker">For the launch video</div>
  <h2>Explainer video script <span style="font-size:15pt;color:var(--soft)">(about 85 seconds)</span></h2>
  <table class="script"><thead><tr><th>Time</th><th>What we see</th><th>Voice-over</th><th>On-screen text</th></tr></thead><tbody>{scene_rows}</tbody></table>
  <div class="notes">
    <div><h3>Short versions</h3><ul>
      <li><b>30 seconds:</b> scenes 1, 3, 5 and 9.</li>
      <li><b>15 seconds (reels, status):</b> scene 1, then "Safaris, school trips and getaways from Mbombela. KCM Travel &amp; Tours, launching soon."</li></ul></div>
    <div><h3>Production notes</h3><ul>
      <li>Warm, calm voice; light acoustic or marimba music.</li>
      <li>Use real KCM and partner footage where possible; screen-record the live website for scenes 5 and 6.</li>
      <li>End every version on the "Launching soon" card.</li></ul></div>
  </div>
  <div class="foot"><span>KCM Travel &amp; Tours</span><span>6</span></div>
</section>

<section class="page back">
  <div class="photo"></div>
  <div class="in">
    <img class="logo" src="{LOGO}" alt="KCM Travel &amp; Tours">
    <h2>Launching <em>soon</em></h2>
    <p>Safaris, heritage routes, beach holidays and group tours, planned properly by a local team.</p>
    <p style="font-size:10.5pt;color:#b9c3bd">KCM Travel &amp; Tours · Msogwaba, Mbombela, Mpumalanga</p>
    <div class="tag">COMING SOON</div>
  </div>
</section>
</body></html>'''
(ROOT / 'brochure.html').write_text(doc, encoding='utf-8')
print('ok')
