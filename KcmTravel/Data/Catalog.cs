using KcmTravel.Models;

namespace KcmTravel.Data;

/// <summary>
/// All destinations, tours, extras and sample content for the site.
/// Prices are DEMO prices in South African rand (VAT included) until real rates are loaded.
/// Later this class can be replaced by a database (SQL Server / EF Core) without touching the views.
/// </summary>
public static class Catalog
{
    private const string U = "https://images.unsplash.com/";
    private static Photo Un(string id, string alt) => new(U + id, alt, "Unsplash");
    private static Photo Local(string file, string alt) => new("/images/places/" + file, alt);

    // ---------- Photos ----------
    public static class P
    {
        public static readonly Photo Lioness = Un("photo-1594916105020-b28f829993b7", "Lioness resting on a rock in the Lowveld");
        public static readonly Photo Rhinos = Un("photo-1612703252506-e2f1f674752d", "Two rhinos grazing in the Kruger National Park");
        public static readonly Photo SavannaSunset = Un("photo-1758029762866-3d4bff447b83", "Sunset over the Kruger savanna");
        public static readonly Photo Zebras = Un("photo-1586943353950-95bdbe3207a1", "Zebras drinking at a waterhole in Kruger");
        public static readonly Photo Elephant = Un("photo-1612434146481-29c9d69e5e8d", "Elephant walking along a dusty Kruger road");
        public static readonly Photo ElephantHerd = Un("photo-1682354671040-397b79ca492e", "Herd of elephants crossing green bushveld");
        public static readonly Photo Giraffe = Un("photo-1758029910182-a06a651cb3f3", "Giraffe in dry bushveld");
        public static readonly Photo GodsWindow = Un("photo-1617046684381-627c3da329c8", "Forested escarpment seen from God's Window");
        public static readonly Photo Canyon = Un("photo-1645777762248-cd62e0c9149a", "Blyde River Canyon with the river winding below");
        public static readonly Photo CanyonAerial = Un("photo-1563810242717-f594259f3cf9", "Aerial view of the Blyde River and mountains");
        public static readonly Photo BerlinFalls = Un("photo-1667903717737-912ad0faeccf", "Berlin Falls dropping over a cliff near Graskop");
        public static readonly Photo LowveldHills = Un("photo-1622397492747-e7b1ff40b8a5", "Green Lowveld hills in Mpumalanga");
        public static readonly Photo Sudwala = Un("photo-1790708143799-4daf77a42e04", "Stalagmite lit up inside the Sudwala Caves");
        public static readonly Photo SudwalaSign = Un("photo-1790708123659-4161d231c6d5", "Welcome sign at the Sudwala Caves among ferns");
        public static readonly Photo CableCar = Un("photo-1591205024850-d3420e30469e", "Table Mountain cableway above the clouds facing Lion's Head");
        public static readonly Photo CapeTownAerial = Un("photo-1770988966553-d1239584151c", "Aerial view of Cape Town beneath Table Mountain");
        public static readonly Photo CapeCoast = Un("photo-1765706729877-cf69f724921b", "Mountain peak above the Cape coastline");
        public static readonly Photo Winelands = Un("photo-1638012858969-fac36ad2ea32", "Vineyards below the mountains near Stellenbosch");
        public static readonly Photo WineGlasses = Un("photo-1503427948460-3ca3eb79c566", "Friends raising wine glasses at a Cape wine farm");
        public static readonly Photo GardenRoute = Un("photo-1704034471197-b5ca4655c5f2", "Garden Route coastline and ocean");
        public static readonly Photo GardenLake = Un("photo-1690969986201-56acaa3794a4", "Lake surrounded by forest on the Garden Route");
        public static readonly Photo Penguin = Un("photo-1520796412393-db86e624492e", "African penguin on the rocks above the sea");
        public static readonly Photo Durban = Un("photo-1682065936841-6bb7f68207b7", "Durban beachfront with the city behind");
        public static readonly Photo DurbanWaves = Un("photo-1626951876321-3b7137628f83", "Warm Indian Ocean waves breaking on a Durban beach");
        public static readonly Photo Drakensberg = Un("photo-1625750010410-a9359021775c", "Drakensberg peaks under a blue sky");
        public static readonly Photo DrakensbergLake = Un("photo-1566840021279-9713abd97c05", "Mountain lake in the Drakensberg");
        public static readonly Photo PilanesbergElephant = Un("photo-1683530073298-be2c3c2866a1", "Elephant in dry grass in the Pilanesberg");
        public static readonly Photo PilanesbergGiraffe = Un("photo-1681829484935-c036681271f7", "Giraffe standing in the Pilanesberg crater");
        public static readonly Photo Mapungubwe = Local("mapungubwe-heritage-centre.webp", "Mapungubwe Interpretation Centre domes in the bushveld");
        public static readonly Photo MapungubwePath = Local("mapungubwe-path-sunset.webp", "Path past the Mapungubwe centre at sunset");
        public static readonly Photo Sagole = Local("sagole-baobab-venda.webp", "The giant Sagole baobab in Venda");
        public static readonly Photo VondoForest = Local("thathe-vondo-forest.webp", "Red dirt road through the Thathe Vondo forest");
        public static readonly Photo Fundudzi = Local("lake-fundudzi-venda.webp", "Lake Fundudzi surrounded by Venda hills");
        public static readonly Photo VondoLodge = Local("vondo-lodge-view.webp", "Thatched lodge deck overlooking Limpopo bush hills");
    }

    // ---------- Destinations ----------
    public static readonly IReadOnlyList<Destination> Destinations = new List<Destination>
    {
        new("kruger-national-park", "Kruger National Park", "Mpumalanga & Limpopo", "Mpumalanga",
            "Big Five country, an hour from our door",
            "Nearly two million hectares of bushveld with lion, leopard, elephant, buffalo and rhino. Join a guided open-vehicle safari or stay a few nights in a rest camp or private lodge.",
            "We are based in Mbombela, so Kruger is our backyard. Our guides know which loops the lions have been using this week, which waterholes are busy in the dry season, and which rest camp makes the best breakfast. A day is enough for a first taste. Two or three nights give you the early-morning drives, when the bush is at its liveliest.",
            "May to September (dry winter, animals gather at water)", "About 4.5 hours by road from Johannesburg",
            new[] { "Open-vehicle Big Five game drives", "Sunrise and night drives with SANParks rangers", "Rest-camp braai under the stars", "Over 500 bird species" },
            P.Lioness, new[] { P.Rhinos, P.Elephant, P.Zebras, P.SavannaSunset },
            new[] { "bush", "family", "adventure", "romance" }),

        new("gods-window-panorama-route", "God's Window & the Panorama Route", "Mpumalanga", "Mpumalanga",
            "Stand at the edge of the escarpment",
            "A scenic drive along the edge of the Drakensberg escarpment: God's Window, Bourke's Luck Potholes, the Three Rondavels, and the Lisbon and Berlin waterfalls.",
            "On a clear morning you can see the Lowveld spread out almost a kilometre below God's Window. We go early, before the mist rolls in and the tour buses arrive. Then we work our way north to the potholes the river has carved into the rock, and finish at the Three Rondavels viewpoint over the Blyde River Canyon. Lunch is pancakes in Graskop, as tradition demands.",
            "All year; April to August for the clearest views", "About 4.5 hours by road from Johannesburg",
            new[] { "God's Window and Wonder View", "Bourke's Luck Potholes", "Three Rondavels lookout", "Lisbon and Berlin Falls" },
            P.GodsWindow, new[] { P.Canyon, P.BerlinFalls, P.CanyonAerial },
            new[] { "mountains", "romance", "family" }),

        new("blyde-river-canyon", "Blyde River Canyon", "Mpumalanga", "Mpumalanga",
            "One of the largest green canyons on earth",
            "Cliffs, subtropical forest and the Blydepoort dam far below. Take a boat cruise on the dam, hike the canyon trails, or simply take in the viewpoints.",
            "Most people see the canyon from above. We also take you to the bottom: a boat trip on the dam beneath the Three Rondavels, where the cliffs rise straight out of the water and hippos keep an eye on the boat. Add a night in a canyon-edge lodge and you get the sunset as well.",
            "All year", "About 5 hours by road from Johannesburg",
            new[] { "Boat cruise on Blydepoort dam", "Canyon-rim hiking trails", "Kadishi tufa waterfall", "Sunset from the canyon edge" },
            P.Canyon, new[] { P.CanyonAerial, P.GodsWindow, P.LowveldHills },
            new[] { "mountains", "adventure", "romance" }),

        new("sudwala-caves", "Sudwala Caves", "Mpumalanga", "Mpumalanga",
            "Walk into ancient dolomite caves",
            "Among the oldest known caves in the world, set in the hills between Mbombela and Machadodorp. Guided walks lead through chambers of stalactites and stalagmites, with a dinosaur park outside.",
            "The main chamber is so big, and its sound so good, that concerts used to be held in it. Your guide will show you the fossilised algae on the walls and tell you about the Swazi prince who once hid here. It's a short, easy trip from Mbombela and a hit with children, so we often pair it with Pilgrim's Rest or a lazy Lowveld weekend.",
            "All year (the caves stay about 17°C)", "About 3.5 hours by road from Johannesburg",
            new[] { "Guided cave walks", "The amphitheatre chamber", "Dinosaur park for children", "Close to Mbombela" },
            P.Sudwala, new[] { P.SudwalaSign, P.LowveldHills },
            new[] { "family", "heritage", "adventure" }),

        new("pilgrims-rest-graskop", "Pilgrim's Rest & Graskop", "Mpumalanga", "Mpumalanga",
            "Gold-rush history and mountain air",
            "Pilgrim's Rest is a whole gold-rush village kept as a living museum. Nearby Graskop has the gorge lift, waterfalls and the best pancakes in the province.",
            "Pan for gold where the diggers did in the 1870s, browse the old general dealers, then head to Graskop for the glass lift that drops 51 metres into a forest gorge. The town is a good base for the Panorama Route too, with lots of cosy guesthouses and log cabins.",
            "All year; winter evenings are crisp, so bring a jacket", "About 4.5 hours by road from Johannesburg",
            new[] { "Gold panning in Pilgrim's Rest", "Graskop Gorge lift", "Mac Mac and Berlin Falls", "Pancakes, as tradition demands" },
            P.BerlinFalls, new[] { P.LowveldHills, P.GodsWindow },
            new[] { "heritage", "family", "mountains" }),

        new("venda-sacred-sites", "Venda: Sacred Lakes & Forests", "Limpopo", "Limpopo",
            "The Soutpansberg few visitors get to see",
            "Lake Fundudzi, the Thathe Vondo sacred forest, Phiphidi Falls and the giant Sagole baobab. A heritage route through Venda culture, crafts and some of the greenest hills in South Africa.",
            "Venda is a place of stories. Lake Fundudzi is sacred, and you view it with respect and with a local guide. The Thathe Vondo forest has a sacred grove that has been protected for generations, and the Sagole baobab is so big that it takes more than twenty people holding hands to circle it. We work with local guides and craft centres, so your visit supports the communities that look after these places.",
            "March to October (green after the rains, mild days)", "About 5.5 hours by road from Johannesburg",
            new[] { "Lake Fundudzi viewpoint", "Thathe Vondo sacred forest", "Phiphidi Falls", "The Sagole baobab" },
            P.VondoForest, new[] { P.Fundudzi, P.Sagole, P.VondoLodge },
            new[] { "heritage", "adventure", "mountains" }),

        new("mapungubwe", "Mapungubwe", "Limpopo", "Limpopo",
            "Where South Africa's first kingdom began",
            "A UNESCO World Heritage Site where the Limpopo and Shashe rivers meet. It holds the remains of an Iron Age kingdom and the famous golden rhino, and lies in a national park with elephant and baobab.",
            "Around a thousand years ago, Mapungubwe hill was the centre of a kingdom that traded gold and ivory as far as Egypt and China. Today you can climb the hill, see the golden rhino replica at the award-winning interpretation centre, and stand at the confluence lookout where three countries meet. Nights here are dark and full of stars.",
            "April to September (cooler days)", "About 6 hours by road from Johannesburg",
            new[] { "Mapungubwe Hill heritage walk", "Interpretation centre and golden rhino", "Confluence lookout over three countries", "Treetop boardwalk" },
            P.Mapungubwe, new[] { P.MapungubwePath, P.ElephantHerd },
            new[] { "heritage", "bush", "adventure" }),

        new("cape-town", "Cape Town & Table Mountain", "Western Cape", "Western Cape",
            "The Mother City, mountain to ocean",
            "Table Mountain, Robben Island, Cape Point, the penguins at Boulders Beach and the V&A Waterfront. A city with a mountain in the middle and an ocean on either side.",
            "Take the cableway up for sunrise, spend an afternoon in Bo-Kaap and finish with dinner at the Waterfront. Go out to Cape Point, where you can stand at the tip of the Cape Peninsula, and stop on the way to watch the penguins at Boulders. We handle the flights, transfers and tickets so you can enjoy the trip.",
            "November to March (summer); whale season is June to November", "About a 2-hour flight from Johannesburg",
            new[] { "Table Mountain cableway", "Robben Island ferry tour", "Cape Point and Boulders penguins", "V&A Waterfront" },
            P.CableCar, new[] { P.CapeTownAerial, P.CapeCoast, P.Penguin },
            new[] { "city", "romance", "beach", "family" }),

        new("cape-winelands", "Cape Winelands", "Western Cape", "Western Cape",
            "Stellenbosch, Franschhoek and Paarl",
            "Historic wine estates under granite mountains, with long lunches and wine tastings. You can ride the Franschhoek wine tram between farms.",
            "The Winelands are only 45 minutes from Cape Town, but they feel very different. Cape Dutch farmhouses, oak-lined streets in Stellenbosch, and tasting rooms that look out over the vines. Add a night or two to any Cape Town trip, or come just for a romantic weekend.",
            "All year; harvest season is February to March", "About 45 minutes from Cape Town",
            new[] { "Franschhoek wine tram", "Stellenbosch historic centre", "Wine and food pairings", "Mountain-view lunches" },
            P.Winelands, new[] { P.WineGlasses, P.CapeCoast },
            new[] { "romance", "city" }),

        new("garden-route", "The Garden Route", "Western Cape", "Western Cape",
            "Lagoons, forests and the Indian Ocean",
            "A road trip from Mossel Bay to Storms River: Knysna's lagoon, Plettenberg Bay's beaches, the Tsitsikamma suspension bridge, and ostrich farms in Oudtshoorn.",
            "This is South Africa's favourite road trip, and best done slowly. We plan the route, book the stops and give you a car. You choose how much adventure you want, from the Bloukrans bungee to a sunset cruise on the Knysna lagoon.",
            "October to April", "Fly to George (about 1 hour 45 minutes from Johannesburg)",
            new[] { "Tsitsikamma suspension bridge", "Knysna Heads and lagoon cruise", "Plettenberg Bay beaches", "Oudtshoorn and the Cango Caves" },
            P.GardenRoute, new[] { P.GardenLake, P.Penguin },
            new[] { "beach", "adventure", "romance", "family" }),

        new("durban-kzn-coast", "Durban & the KZN Coast", "KwaZulu-Natal", "KwaZulu-Natal",
            "Warm water and a bunny chow",
            "The Golden Mile, uShaka Marine World and warm Indian Ocean beaches, with Ballito and Umhlanga close by. South Africa's favourite family holiday.",
            "Durban is warm even in winter, which is why families come back every school holiday. Spend the mornings on the beach, the afternoons at uShaka, and have curry for supper. We book family-friendly hotels on the beachfront or in Umhlanga, and can add a day at a Zulu cultural village.",
            "All year (warm winters)", "About 6 hours by road or a 1-hour flight from Johannesburg",
            new[] { "Golden Mile beachfront", "uShaka Marine World", "Umhlanga and Ballito", "Durban curry and bunny chow" },
            P.Durban, new[] { P.DurbanWaves },
            new[] { "beach", "family", "city" }),

        new("drakensberg", "The Drakensberg", "KwaZulu-Natal", "KwaZulu-Natal",
            "UNESCO mountains and San rock art",
            "The uKhahlamba-Drakensberg Park: the Amphitheatre, the Tugela Falls, ancient San rock paintings and mountain resorts with fireplaces.",
            "Hike to the top of Tugela Falls, or keep it gentle with trout fishing and long walks in the foothills. Visit rock-art shelters where San painters left eland and hunters thousands of years ago. In winter the peaks are often dusted with snow.",
            "All year; April to May for clear skies", "About 4 hours by road from Johannesburg",
            new[] { "Amphitheatre and Tugela Falls hike", "San rock art shelters", "Mountain resorts", "Horse riding and trout fishing" },
            P.Drakensberg, new[] { P.DrakensbergLake },
            new[] { "mountains", "adventure", "family", "romance" }),

        new("sun-city-pilanesberg", "Sun City & Pilanesberg", "North West", "North West",
            "Big Five and the Valley of Waves",
            "A malaria-free Big Five reserve inside an ancient volcanic crater, next to the Sun City resort, its wave pool and golf courses.",
            "Do a morning game drive in the Pilanesberg and spend the afternoon at the Valley of Waves. It's an easy getaway from Gauteng. Families love it, and couples can add a hot-air balloon flight over the crater at sunrise.",
            "All year (malaria-free)", "About 2.5 hours by road from Johannesburg",
            new[] { "Pilanesberg game drives", "Valley of Waves", "Hot-air balloon over the crater", "Two championship golf courses" },
            P.PilanesbergElephant, new[] { P.PilanesbergGiraffe },
            new[] { "bush", "family", "adventure" }),
    };

    // ---------- Tours / packages ----------
    public static readonly IReadOnlyList<TourPackage> Tours = new List<TourPackage>
    {
        new("kruger-day-safari", "Kruger Full-Day Open-Vehicle Safari",
            "A full day in Kruger in an open safari vehicle with a qualified guide. You're collected before sunrise and back by late afternoon.",
            "Safari", new[] { "kruger-national-park" }, 0, 1650m, 0m,
            "No overnight stay", "Mbombela, White River or Hazyview (hotel pickup)",
            new[] { "Hotel pickup and drop-off", "Open safari vehicle and FGASA-qualified guide", "Bottled water and breakfast pack", "Park entry for SA residents" },
            new[] { "Lunch at the rest camp", "International conservation fees", "Gratuities" },
            new[] { new ItineraryDay(1, "Into the park at gate opening", "Pickup around 05:00 and in through Numbi or Phabeni gate as the gates open. Morning drive towards Skukuza, with a rest-camp stop for lunch, then an afternoon loop along the Sabie River before heading home.") },
            P.Lioness, "Most booked", true, new[] { "bush", "family", "adventure" }),

        new("panorama-route-day", "Panorama Route & God's Window Day Tour",
            "Our God's Window tour covers the whole Panorama Route in one relaxed, guided day: God's Window, Bourke's Luck Potholes, the Three Rondavels and two waterfalls.",
            "Scenic", new[] { "gods-window-panorama-route", "blyde-river-canyon", "pilgrims-rest-graskop" }, 0, 1250m, 0m,
            "No overnight stay", "Mbombela, White River, Hazyview or Graskop",
            new[] { "Hotel pickup and drop-off", "Air-conditioned vehicle and guide", "All viewpoint entrance fees" },
            new[] { "Lunch in Graskop", "Graskop Gorge lift tickets", "Gratuities" },
            new[] { new ItineraryDay(1, "The edge of the escarpment", "God's Window before the mist, then Lisbon Falls, Bourke's Luck Potholes and the Three Rondavels. Pancakes in Graskop, then Berlin Falls on the way home.") },
            P.GodsWindow, null, true, new[] { "mountains", "family", "romance" }),

        new("kruger-panorama-3-day", "Kruger & Panorama Route: 3-Day Classic",
            "Our best-loved short trip: two days of game drives in Kruger and a day along the Panorama Route, with two nights in a Kruger rest camp.",
            "Safari", new[] { "kruger-national-park", "gods-window-panorama-route" }, 2, 6950m, 1650m,
            "Kruger rest-camp bungalow (en-suite)", "Mbombela or Kruger Mpumalanga International Airport (KMIA)",
            new[] { "2 nights in a Kruger rest-camp bungalow", "Breakfast and dinner daily", "3 guided days in an open vehicle", "Sunset game drive with a SANParks ranger", "Panorama Route entrance fees" },
            new[] { "Lunches and drinks", "Flights", "International conservation fees", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Panorama Route", "Pickup in Mbombela or at KMIA. God's Window, the potholes and the Three Rondavels, then into Kruger in the late afternoon for a sunset ranger drive."),
                new ItineraryDay(2, "Full day in Kruger", "Out at first light to look for the Big Five along the Sabie and Lower Sabie roads. Lunch at a rest camp, then an afternoon drive and a braai at camp."),
                new ItineraryDay(3, "Morning drive and home", "One last early drive, breakfast at camp, then back to Mbombela or the airport by early afternoon."),
            },
            P.Elephant, "Best value", true, new[] { "bush", "mountains", "family", "adventure" }),

        new("greater-kruger-lodge-4-day", "Greater Kruger Private Lodge: 4-Day Luxury",
            "Three nights at a luxury lodge in a private reserve next to Kruger. Off-road tracking, bush walks and dinners in a boma under the stars.",
            "Safari", new[] { "kruger-national-park" }, 3, 18900m, 5800m,
            "4-star private game lodge (luxury suite)", "KMIA or Hoedspruit airport",
            new[] { "3 nights in a luxury suite", "All meals and local drinks", "Two game drives a day with a tracker", "Guided bush walk", "Return airport transfers" },
            new[] { "Flights", "Premium drinks", "Conservation levy (paid at the lodge)", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Arrive in the bush", "Transfer from the airport, lunch on the deck and your first afternoon drive, with sundowners in the bush."),
                new ItineraryDay(2, "Tracking the Big Five", "Morning drive, brunch, time by the pool, then an evening drive and dinner in the boma."),
                new ItineraryDay(3, "On foot", "A guided bush walk to learn the tracks and smaller creatures, then an evening drive."),
                new ItineraryDay(4, "Last light", "A final sunrise drive and breakfast before your transfer."),
            },
            P.SavannaSunset, "Honeymoon pick", false, new[] { "bush", "romance" }),

        new("sudwala-pilgrims-rest-weekend", "Sudwala Caves & Pilgrim's Rest Weekend",
            "An easy Lowveld weekend: the ancient Sudwala Caves, gold panning in Pilgrim's Rest and two nights in a Graskop guesthouse.",
            "Heritage", new[] { "sudwala-caves", "pilgrims-rest-graskop" }, 2, 3850m, 950m,
            "Graskop guesthouse (en-suite)", "Mbombela or own transport",
            new[] { "2 nights in a guesthouse with breakfast", "Sudwala Caves guided tour", "Pilgrim's Rest gold panning", "Guided transport on day 1 and 2" },
            new[] { "Lunches and dinners", "Graskop Gorge lift", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Into the caves", "Morning at the Sudwala Caves and dinosaur park, then up the escarpment to Graskop."),
                new ItineraryDay(2, "Gold-rush town", "Pilgrim's Rest museums and gold panning, with an afternoon at the Graskop Gorge lift if you like."),
                new ItineraryDay(3, "Waterfalls home", "Mac Mac and Berlin Falls on the way back to Mbombela."),
            },
            P.Sudwala, "Family favourite", true, new[] { "family", "heritage", "mountains" }),

        new("venda-sacred-sites-3-day", "Venda Sacred Sites: 3-Day Heritage Route",
            "Lake Fundudzi, the Thathe Vondo forest, Phiphidi Falls and the Sagole baobab, with local Venda guides and craft-centre visits.",
            "Heritage", new[] { "venda-sacred-sites" }, 2, 4650m, 1100m,
            "Lodge near Thohoyandou (en-suite)", "Mbombela, Polokwane or Thohoyandou",
            new[] { "2 nights at a lodge with breakfast and dinner", "Local Venda heritage guide", "Phiphidi Falls and Thathe Vondo entry", "Craft-centre visits" },
            new[] { "Lunches", "Transport from Johannesburg (add-on)", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Falls and forest", "Phiphidi Falls, then the Thathe Vondo forest drive with stories of the sacred grove."),
                new ItineraryDay(2, "The sacred lake", "Lake Fundudzi viewpoint with a local guide, then pottery and woodcarving studios."),
                new ItineraryDay(3, "The big tree", "Drive north to the Sagole baobab before heading home."),
            },
            P.VondoForest, "Only at KCM", true, new[] { "heritage", "adventure" }),

        new("mapungubwe-heritage-escape", "Mapungubwe Heritage & Wildlife Escape",
            "Three nights where the Limpopo and Shashe rivers meet: the hill of the golden rhino, the confluence lookout and elephants among the baobabs.",
            "Heritage", new[] { "mapungubwe" }, 3, 7450m, 1450m,
            "SANParks chalet or bush lodge", "Polokwane or own transport",
            new[] { "3 nights' accommodation", "Breakfast daily", "Guided Mapungubwe Hill walk", "Interpretation centre entry", "Sunset drive" },
            new[] { "Lunches and dinners", "Conservation fees", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Into the north", "Arrive at the park and take a sunset drive among the baobabs."),
                new ItineraryDay(2, "The kingdom", "Guided Mapungubwe Hill walk and the interpretation centre."),
                new ItineraryDay(3, "Three countries", "The confluence lookout and treetop boardwalk."),
                new ItineraryDay(4, "Departure", "A morning at leisure, then the drive home."),
            },
            P.Mapungubwe, null, true, new[] { "heritage", "bush" }),

        new("cape-town-4-night", "Cape Town Highlights: 4 Nights",
            "Table Mountain, Robben Island, Cape Point and the Waterfront. Four nights in a 4-star city hotel with transfers and tours sorted.",
            "City", new[] { "cape-town", "cape-winelands" }, 4, 12400m, 2100m,
            "4-star hotel near the V&A Waterfront", "Cape Town International Airport",
            new[] { "4 nights with breakfast", "Return airport transfers", "Table Mountain cableway ticket", "Full-day Cape Point tour", "Robben Island ferry ticket" },
            new[] { "Flights (add as an extra)", "Lunches and dinners", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Arrive in the Mother City", "Transfer to your hotel and an evening at the Waterfront."),
                new ItineraryDay(2, "Mountain and island", "Morning cableway up Table Mountain, afternoon ferry to Robben Island."),
                new ItineraryDay(3, "Cape Point", "Chapman's Peak, Cape Point and the Boulders penguins."),
                new ItineraryDay(4, "Your day", "Bo-Kaap, Kirstenbosch or a Winelands add-on."),
                new ItineraryDay(5, "Home", "Transfer to the airport."),
            },
            P.CableCar, "Summer special", false, new[] { "city", "romance", "beach", "family" }),

        new("winelands-romantic-2-night", "Winelands Romantic Escape: 2 Nights",
            "A boutique stay in Franschhoek, a day on the wine tram and a long lunch with a view.",
            "City", new[] { "cape-winelands" }, 2, 5900m, 2450m,
            "Boutique guesthouse in Franschhoek", "Cape Town or own transport",
            new[] { "2 nights with breakfast", "Franschhoek wine tram ticket", "Welcome bubbly in your room" },
            new[] { "Transfers", "Lunches and dinners", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Into the valley", "Check in and stroll Huguenot Road."),
                new ItineraryDay(2, "The wine tram", "Hop between estates and have lunch among the vines."),
                new ItineraryDay(3, "Slow morning", "Breakfast and depart."),
            },
            P.Winelands, null, false, new[] { "romance" }),

        new("garden-route-5-night", "Garden Route Self-Drive: 5 Nights",
            "George to Storms River at your own pace: Knysna, Plettenberg Bay and Tsitsikamma, with a hire car and hand-picked stops.",
            "Adventure", new[] { "garden-route" }, 5, 10800m, 1750m,
            "Guesthouses and small hotels", "George airport",
            new[] { "5 nights with breakfast", "Group B hire car for 6 days", "Knysna lagoon cruise", "Tsitsikamma park entry", "Route map and planning call" },
            new[] { "Flights", "Fuel and tolls", "Lunches and dinners" },
            new[]
            {
                new ItineraryDay(1, "George to Knysna", "Collect your car and drive the Wilderness lakes to Knysna."),
                new ItineraryDay(2, "Knysna", "Lagoon cruise and the Heads."),
                new ItineraryDay(3, "Plettenberg Bay", "Beaches and Robberg Nature Reserve."),
                new ItineraryDay(4, "Tsitsikamma", "The suspension bridge and Storms River mouth."),
                new ItineraryDay(5, "Free day", "Bungee, zip-lining or a lazy day."),
                new ItineraryDay(6, "Back to George", "Drive back for your flight."),
            },
            P.GardenRoute, null, false, new[] { "beach", "adventure", "romance", "family" }),

        new("durban-family-beach-3-night", "Durban Family Beach Holiday: 3 Nights",
            "A beachfront hotel, a day at uShaka and the warm Indian Ocean. Children's rates included.",
            "Beach", new[] { "durban-kzn-coast" }, 3, 5450m, 1300m,
            "3-star beachfront hotel (family rooms)", "King Shaka International Airport or own transport",
            new[] { "3 nights with breakfast", "uShaka Marine World tickets", "Return airport transfers" },
            new[] { "Flights", "Lunches and dinners", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Beach time", "Arrive and walk the Golden Mile."),
                new ItineraryDay(2, "uShaka", "A full day at uShaka Marine World."),
                new ItineraryDay(3, "Umhlanga", "The lighthouse, the pier and curry for supper."),
                new ItineraryDay(4, "Home", "Transfer and depart."),
            },
            P.Durban, "School holidays", true, new[] { "beach", "family" }),

        new("drakensberg-weekend", "Drakensberg Mountain Weekend",
            "Two nights at a mountain resort with a guided hike to the San rock-art shelters.",
            "Adventure", new[] { "drakensberg" }, 2, 3950m, 1350m,
            "Mountain resort (half board)", "Own transport or Johannesburg shuttle (extra)",
            new[] { "2 nights, breakfast and dinner", "Guided rock-art hike", "Resort activities" },
            new[] { "Transport", "Lunches", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Into the mountains", "Check in and take a sunset walk."),
                new ItineraryDay(2, "Rock art", "A guided hike to the San painting shelters."),
                new ItineraryDay(3, "Depart", "Breakfast and home."),
            },
            P.Drakensberg, null, true, new[] { "mountains", "adventure", "family" }),

        new("sun-city-pilanesberg-2-night", "Sun City & Pilanesberg Getaway",
            "Two nights at Sun City with a guided Pilanesberg game drive and Valley of Waves access.",
            "Safari", new[] { "sun-city-pilanesberg" }, 2, 4750m, 1950m,
            "Sun City Cabanas (family room)", "Johannesburg (transfer extra) or own transport",
            new[] { "2 nights with breakfast", "Pilanesberg morning game drive", "Valley of Waves access" },
            new[] { "Transport", "Lunches and dinners", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Arrive", "Check in and spend the afternoon at the Valley of Waves."),
                new ItineraryDay(2, "Game drive", "Early drive in the crater, then the resort."),
                new ItineraryDay(3, "Depart", "Breakfast and home."),
            },
            P.PilanesbergElephant, null, true, new[] { "bush", "family" }),

        new("group-kruger-school-church", "Group Kruger Safari: Schools, Churches & Stokvels",
            "A budget-friendly 3-day Kruger trip for groups of 20 or more, with a bus, safari vehicles, meals and dormitory or chalet stays. Teachers and leaders travel free (1 per 15).",
            "Safari", new[] { "kruger-national-park", "gods-window-panorama-route" }, 2, 2950m, 750m,
            "Group chalets or dorms near Kruger", "Anywhere in Mpumalanga or Gauteng (bus included)",
            new[] { "Return bus transport", "2 nights' group accommodation", "All meals", "2 open-vehicle game drives", "Panorama Route stops", "1 free leader per 15 travellers" },
            new[] { "Spending money", "Gratuities" },
            new[]
            {
                new ItineraryDay(1, "Panorama on the way", "Depart early with viewpoint stops, then check in near the Kruger gates."),
                new ItineraryDay(2, "Kruger", "A full day of game drives and a braai."),
                new ItineraryDay(3, "Home", "A morning drive and the bus home."),
            },
            P.ElephantHerd, "Groups 20+", true, new[] { "bush", "family" }),
    };

    // ---------- Extras ----------
    public static readonly IReadOnlyList<Extra> Extras = new List<Extra>
    {
        new("transfer", "Airport transfer (return)", "From KMIA, OR Tambo, Cape Town or King Shaka airport to your accommodation", 950m, "booking"),
        new("car", "Car hire", "Group B automatic with insurance, per day", 520m, "night"),
        new("sunset", "Sunset or night game drive", "With a SANParks ranger or lodge guide", 690m, "person"),
        new("balloon", "Hot-air balloon flight", "Sunrise flight with champagne breakfast", 4200m, "person"),
        new("gorge", "Graskop Gorge lift", "Glass lift into the forest gorge", 290m, "person"),
        new("meals", "Meal upgrade", "Add lunch and dinner every day", 420m, "person-night"),
        new("insurance", "Travel insurance", "Medical, cancellation and baggage cover", 185m, "person"),
        new("celebration", "Celebration set-up", "Honeymoon, anniversary or birthday surprise in your room", 850m, "booking"),
        new("photo", "Photo package", "Edited photos from your guide, shared on WhatsApp", 450m, "booking"),
    };

    // ---------- Pricing rules (demo) ----------
    public const decimal ChildRate = 0.5m;          // 3–11 years
    public const decimal PensionerDiscount = 0.10m; // 60+
    public const decimal SingleSupplement = 0.35m;  // single room
    public const decimal DepositRate = 0.30m;

    public static readonly Dictionary<string, (string Label, decimal Factor)> Rooms = new()
    {
        ["double"] = ("Double / twin (sharing)", 1.00m),
        ["family"] = ("Family room", 0.95m),
        ["single"] = ("Single room", 1.00m + SingleSupplement),
        ["self-catering"] = ("Self-catering unit", 0.90m),
        ["upgrade"] = ("Luxury upgrade", 1.25m),
    };

    // ---------- Trip styles ----------
    public static readonly IReadOnlyList<TripStyle> Styles = new List<TripStyle>
    {
        new("bush", "Wildlife & safari", "Kruger, private lodges and the Pilanesberg", P.Rhinos),
        new("mountains", "Mountains & views", "The Panorama Route, Blyde Canyon and the Berg", P.Canyon),
        new("heritage", "Heritage & culture", "Venda, Mapungubwe and gold-rush towns", P.Sagole),
        new("beach", "Beach & coast", "Durban, the Garden Route and the Cape", P.DurbanWaves),
        new("romance", "Couples & honeymoons", "Lodges, wine farms and sunsets", P.WineGlasses),
        new("family", "Family holidays", "Easy trips with children's rates", P.Zebras),
    };

    // ---------- Sample reviews (replace with real guest reviews) ----------
    public static readonly IReadOnlyList<Testimonial> Testimonials = new List<Testimonial>
    {
        new("Thandi M.", "Soweto", "Kruger & Panorama 3-Day", "We saw four of the Big Five on day two. Our guide stopped for every bird my son asked about, and he asked about a lot of birds."),
        new("Pastor S. Nkosi", "Emalahleni", "Group Kruger Safari", "We took 42 youth members. The bus was on time, the food was plenty and the children still talk about the elephants at the waterhole."),
        new("Lerato & Sipho", "Pretoria", "Greater Kruger Lodge", "Our honeymoon. They put rose petals in the room and a bottle of bubbly at the boma. We'll be back for our anniversary."),
        new("Megan R.", "Durban", "Venda Sacred Sites", "I had never heard of Thathe Vondo before. Going with a local guide made it feel like we were being welcomed, not just visiting."),
    };

    // ---------- Lookups ----------
    public static Destination? FindDestination(string slug) => Destinations.FirstOrDefault(d => d.Slug == slug);
    public static TourPackage? FindTour(string slug) => Tours.FirstOrDefault(t => t.Slug == slug);
    public static IEnumerable<TourPackage> ToursFor(string destinationSlug) => Tours.Where(t => t.DestinationSlugs.Contains(destinationSlug));
    public static IEnumerable<string> Regions => Destinations.Select(d => d.Region).Distinct();
    public static IEnumerable<string> Categories => Tours.Select(t => t.Category).Distinct();
}
