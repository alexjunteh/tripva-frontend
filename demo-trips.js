/* Prebuilt destination itineraries used by the landing-page demo gallery.
   These stay client-side so a demo always opens even if the API is unavailable. */
(function () {
  const demos = {
    tokyo: { city: 'Tokyo', country: 'Japan', emoji: '🗼', budget: '$1,850', image: 'assets/landing/destination-0.webp', coords: [35.6762, 139.6503], hotel: 'Shibuya Stream Excel Hotel', hotelPrice: '$145/night', days: [
      ['Shibuya & Harajuku', 'Meiji Jingu, Takeshita Street, and Shibuya after dark', ['Meiji Jingu Shrine', 'Takeshita Street', 'Shibuya Sky at sunset']],
      ['Food & Future Tokyo', 'Tsukiji breakfast, teamLab, and Ginza', ['Tsukiji Outer Market', 'teamLab Borderless', 'Ginza architecture walk']],
      ['Old Tokyo', 'Temples, markets, and skyline views', ['Senso-ji Temple', 'Nakamise shopping street', 'Tokyo Skytree']]
    ]},
    santorini: { city: 'Santorini', country: 'Greece', emoji: '🏛️', budget: '$2,200', image: 'assets/landing/destination-1.webp', coords: [36.3932, 25.4615], hotel: 'Imerovigli Caldera View Suites', hotelPrice: '€180/night', days: [
      ['Caldera arrival', 'Fira lanes, cliff views, and a first sunset', ['Fira caldera walk', 'Three Bells of Fira', 'Imerovigli sunset walk']],
      ['Oia day', 'Whitewashed lanes and the island’s iconic blue domes', ['Oia village morning walk', 'Ammoudi Bay swim', 'Oia sunset viewpoint']],
      ['Volcanic coast', 'A quieter beach day and local wine', ['Red Beach', 'Akrotiri archaeological site', 'Santorini wine tasting']]
    ]},
    kyoto: { city: 'Kyoto', country: 'Japan', emoji: '⛩️', budget: '$1,650', image: 'assets/landing/destination-2.webp', coords: [35.0116, 135.7681], hotel: 'The Gate Hotel Kyoto', hotelPrice: '$130/night', days: [
      ['Eastern Kyoto', 'Temples, lanes, and Gion at golden hour', ['Kiyomizu-dera', 'Ninenzaka and Sannenzaka', 'Gion evening walk']],
      ['Arashiyama', 'Bamboo, river views, and a quiet temple', ['Arashiyama Bamboo Grove', 'Tenryu-ji Temple', 'Togetsukyo Bridge']],
      ['Fushimi & Nishiki', 'Torii gates and Kyoto’s kitchen', ['Fushimi Inari Taisha', 'Nishiki Market', 'Pontocho lane walk']]
    ]},
    bali: { city: 'Bali', country: 'Indonesia', emoji: '🌴', budget: '$1,400', image: 'assets/landing/destination-3.webp', coords: [-8.4095, 115.1889], hotel: 'Ubud Valley Retreat', hotelPrice: '$95/night', days: [
      ['Ubud reset', 'Rice terraces, a temple, and a slow evening', ['Tegalalang Rice Terrace', 'Tirta Empul Temple', 'Ubud Art Market']],
      ['Coast day', 'Beach time and a clifftop sunset', ['Padang Padang Beach', 'Uluwatu Temple', 'Jimbaran Beach sunset']],
      ['North Bali', 'Waterfalls and a local café stop', ['Tegenungan Waterfall', 'Campuhan Ridge Walk', 'Balinese cooking class']]
    ]},
    paris: { city: 'Paris', country: 'France', emoji: '🗼', budget: '$3,200', image: 'assets/landing/destination-4.webp', coords: [48.8566, 2.3522], hotel: 'Hotel des Arts Montmartre', hotelPrice: '€155/night', tripName: 'Paris & Amsterdam Guide', destination: 'Paris & Amsterdam', extraHotel: { city: 'Amsterdam', name: 'Canal House Jordaan', nights: 3, price: '€165/night' }, cities: ['Paris', 'Paris', 'Paris', 'Paris', 'Amsterdam', 'Amsterdam', 'Amsterdam'], days: [
      ['Arrive in Paris', 'Check in, evening Seine stroll, and crêpes at dusk', ['Evening Seine stroll', 'Île de la Cité walk', 'Crêperie Montparnasse']],
      ['Eiffel & Le Marais', 'Sunrise tower, hidden cafés, and Rue des Rosiers', ['Eiffel Tower', 'Le Marais cafés', 'Rue des Rosiers']],
      ['Louvre & Montmartre', 'World-class art, Sacré-Cœur, and sunset over the city', ['Louvre Museum', 'Sacré-Cœur Basilica', 'Montmartre sunset walk']],
      ['Versailles Day Trip', 'Hall of Mirrors, garden fountains, and a royal picnic', ['Palace of Versailles', 'Versailles Gardens', "Marie-Antoinette's Estate"]],
      ['Amsterdam Canals', 'Train from Paris, canal cruise, and Jordaan quarter', ['Thalys to Amsterdam', 'Canal boat cruise', 'Jordaan quarter walk']],
      ['Museums & Markets', 'Rijksmuseum, Albert Cuyp Market, and Dutch pancakes', ['Rijksmuseum', 'Albert Cuyp Market', 'De Pijp neighbourhood']],
      ['Final Day', 'Anne Frank House, Vondelpark, and farewell dinner', ['Anne Frank House', 'Vondelpark stroll', 'Leidseplein farewell']]
    ]},
    iceland: { city: 'Iceland', country: 'Iceland', emoji: '❄️', budget: '$2,650', image: 'assets/landing/destination-5.webp', coords: [64.1466, -21.9426], hotel: 'Reykjavik Harbour Hotel', hotelPrice: '$195/night', days: [
      ['Reykjavik start', 'Design, harbour air, and geothermal warmth', ['Hallgrímskirkja', 'Reykjavik harbour walk', 'Sky Lagoon soak']],
      ['South Coast', 'Waterfalls, black sand, and sea stacks', ['Seljalandsfoss waterfall', 'Skógafoss waterfall', 'Reynisfjara Black Sand Beach']],
      ['Golden Circle', 'Geysers, rift valleys, and a final hot spring', ['Thingvellir National Park', 'Geysir geothermal area', 'Gullfoss waterfall']]
    ]},
    queenstown: { city: 'Queenstown', country: 'New Zealand', emoji: '🏔️', budget: '$2,450', image: 'assets/landing/destination-6.webp', coords: [-45.0312, 168.6626], hotel: 'Lake Wakatipu Lodge', hotelPrice: 'NZ$210/night', days: [
      ['Lake Wakatipu', 'A lakeside arrival and the best town viewpoints', ['Queenstown Gardens', 'Lake Wakatipu walk', 'Skyline Gondola']],
      ['Arrowtown & wine', 'Gold-rush streets and Central Otago flavours', ['Arrowtown historic walk', 'Gibbston Valley tasting', 'Onsen Hot Pools']],
      ['Big landscapes', 'A full day among Fiordland-scale scenery', ['Glenorchy scenic drive', 'Bob’s Cove track', 'Queenstown waterfront dinner']]
    ]},
    barcelona: { city: 'Barcelona', country: 'Spain', emoji: '🏖️', budget: '$1,950', image: 'assets/landing/destination-7.webp', coords: [41.3874, 2.1686], hotel: 'Eixample Modernist Stay', hotelPrice: '€140/night', days: [
      ['Modernist Barcelona', 'Gaudí architecture and an Eixample evening', ['Sagrada Família', 'Passeig de Gràcia', 'Casa Batlló exterior']],
      ['Old city & sea', 'Markets, Gothic lanes, and Barceloneta', ['La Boqueria Market', 'Gothic Quarter walk', 'Barceloneta sunset']],
      ['Park & tapas', 'Views, colour, and a long final meal', ['Park Güell', 'El Born galleries', 'Poble-sec tapas district']]
    ]}
  };

  const localMeals = {
    tokyo: ['yakitori dinner in Shibuya', 'sushi counter dinner in Ginza', 'tempura dinner near Asakusa'],
    santorini: ['caldera-view dinner in Imerovigli', 'seafood dinner at Ammoudi Bay', 'winery dinner near Akrotiri'],
    kyoto: ['Gion kaiseki dinner', 'Arashiyama riverside dinner', 'Pontocho dinner'],
    bali: ['Balinese rijsttafel in Ubud', 'seafood dinner in Jimbaran', 'Ubud cooking-class supper'],
    paris: ['Seine-side crêperie dinner', 'Le Marais falafel dinner', 'Montmartre bistro dinner', 'Left Bank dinner after Versailles', 'Jordaan canal-side dinner', 'De Pijp Dutch dinner', 'Leidseplein farewell dinner'],
    iceland: ['Reykjavik harbour seafood dinner', 'Vik-area dinner stop', 'Reykjavik final-night dinner'],
    queenstown: ['central Queenstown dinner', 'Gibbston Valley dinner', 'Queenstown waterfront dinner'],
    barcelona: ['Eixample tapas dinner', 'Barceloneta seafood dinner', 'Poble-sec tapas crawl']
  };

  const localGuidance = {
    tokyo: { breakfast: 'Pick up coffee and onigiri; a loaded Suica card keeps the first train transfer simple.', morning: 'Arrive early for a quieter first stop and avoid the busiest subway window between 07:30 and 09:30.', transit: 'Use the rail network between stops and keep the route in the same neighbourhood rather than backtracking.', reserve: 'Check whether this stop has timed entry, then book the evening table before the afternoon rush.', dinner: 'Reserve a counter or small table by late afternoon, especially on Friday and Saturday.' },
    santorini: { breakfast: 'Have breakfast close to the caldera, then use the cooler morning light for the cliff walk.', morning: 'Start early before day visitors arrive; the best lanes are calmer before the first island buses.', transit: 'Use the Fira-Oia bus or a pre-booked transfer instead of trying to move a car through the narrow lanes.', reserve: 'Confirm your sunset table or boat place in advance, then leave the viewpoint before the post-sunset rush.', dinner: 'Book a terrace table a day ahead and ask for a wind-sheltered spot.' },
    kyoto: { breakfast: 'Start with coffee and a light Japanese breakfast; load an ICOCA card for buses and Keihan trains.', morning: 'Be at the temple gate when it opens to experience the lanes before the tour groups.', transit: 'Walk the old streets where possible, then use the nearest rail line instead of crossing Kyoto by bus at midday.', reserve: 'Check seasonal illuminations and any timed garden access before locking in the afternoon.', dinner: 'Reserve Pontocho or Gion dinner ahead, particularly during blossom and foliage seasons.' },
    bali: { breakfast: 'Eat near the hotel and ask reception to arrange a driver before peak traffic builds.', morning: 'Visit temples and terraces early, with shoulders and knees covered and a sarong ready where required.', transit: 'Keep a private driver or Grab for the longer transfer; travel times are much slower than map estimates.', reserve: 'Confirm sunset, wellness, and cooking-class places the day before because weather can shift the schedule.', dinner: 'Choose a restaurant near your final stop so the return journey is short after dark.' },
    paris: { breakfast: 'Start at a local bakery or café, then use contactless transit for the first ride of the day.', morning: 'Book the headline museum or landmark for the morning to avoid the longest queues.', transit: 'Use the metro or tram between districts and walk the final stretch to soak in the neighbourhood.', reserve: 'Keep timed-ticket confirmations offline and reserve popular dinner spots before the afternoon.', dinner: 'Reserve a table for 20:00 and plan the final stroll through the same neighbourhood.' },
    iceland: { breakfast: 'Check road.is and the weather forecast over breakfast before committing to the driving route.', morning: 'Leave Reykjavik early for daylight and the first waterfall stop; waterproof layers stay in the car.', transit: 'Use a rental car only after checking wind and road alerts, and refuel before the more remote stretches.', reserve: 'Pre-book lagoon or tour slots and keep an alternate city plan ready for severe weather.', dinner: 'Return to Reykjavik before dark when possible and reserve a harbour table for a relaxed finish.' },
    queenstown: { breakfast: 'Fuel up in town and check the DOC and weather updates before any lake or mountain route.', morning: 'Start scenic drives early so you can stop at lookouts without rushing the return to town.', transit: 'Use a rental car for Arrowtown and Glenorchy, with extra time for photo stops and changing road conditions.', reserve: 'Book gondola, onsen, and cellar-door experiences before the day; prime late-afternoon slots go first.', dinner: 'Reserve lakefront dining for the evening and walk back through central Queenstown.' },
    barcelona: { breakfast: 'Start with a bakery stop and a T-casual or contactless Metro ride before the main sites open.', morning: 'Use a timed morning entry for Gaudi sites, when interiors are quieter and the light is better.', transit: 'Walk within each district and use the Metro only for the longer jump to avoid losing the day in taxis.', reserve: 'Keep Sagrada Familia and Park Guell tickets on your phone, then book tapas before the evening crowd.', dinner: 'Plan a late Spanish dinner near the final neighbourhood, with a reservation after 20:30.' }
  };

  function dateAt(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  // Map pin for each demo stop, from OpenStreetMap Nominatim (checked 2026-11-27,
  // each within its city's radius). A stop missing here gets no pin.
  const stopCoords = {
    tokyo: {
      "Meiji Jingu Shrine": [35.67484, 139.69963],
      "Takeshita Street": [35.67116, 139.70496],
      "Shibuya Sky at sunset": [35.65829, 139.70226],
      "Tsukiji Outer Market": [35.66539, 139.77047],
      "teamLab Borderless": [35.662, 139.74342],
      "Ginza architecture walk": [35.67201, 139.76472],
      "Senso-ji Temple": [35.7134, 139.79553],
      "Nakamise shopping street": [35.71252, 139.79652],
      "Tokyo Skytree": [35.71005, 139.81071],
    },
    santorini: {
      "Fira caldera walk": [36.41492, 25.43245],
      "Three Bells of Fira": [36.42326, 25.42835],
      "Imerovigli sunset walk": [36.43256, 25.42283],
      "Oia village morning walk": [36.46221, 25.37573],
      "Ammoudi Bay swim": [36.45996, 25.37057],
      "Oia sunset viewpoint": [36.46221, 25.37573],
      "Red Beach": [36.34734, 25.39482],
      "Akrotiri archaeological site": [36.35179, 25.40349],
      "Santorini wine tasting": [36.38757, 25.43651],
    },
    kyoto: {
      "Kiyomizu-dera": [34.9943, 135.78444],
      "Ninenzaka and Sannenzaka": [34.99648, 135.78132],
      "Gion evening walk": [35.00469, 135.7784],
      "Arashiyama Bamboo Grove": [35.01674, 135.67115],
      "Tenryu-ji Temple": [35.01622, 135.67294],
      "Togetsukyo Bridge": [35.01287, 135.67776],
      "Fushimi Inari Taisha": [34.96752, 135.77971],
      "Nishiki Market": [35.00502, 135.76557],
      "Pontocho lane walk": [35.00425, 135.77121],
    },
    bali: {
      "Tegalalang Rice Terrace": [-8.42855, 115.27988],
      "Tirta Empul Temple": [-8.41493, 115.31603],
      "Ubud Art Market": [-8.50643, 115.26156],
      "Padang Padang Beach": [-8.81122, 115.10364],
      "Uluwatu Temple": [-8.82937, 115.08434],
      "Jimbaran Beach sunset": [-8.78089, 115.16392],
      "Tegenungan Waterfall": [-8.57523, 115.2907],
      "Campuhan Ridge Walk": [-8.49902, 115.25516],
      "Balinese cooking class": [-8.51702, 115.25505],
    },
    paris: {
      "Evening Seine stroll": [48.85995, 2.29226],
      "Île de la Cité walk": [48.85471, 2.34748],
      "Crêperie Montparnasse": [48.8422, 2.32566],
      "Eiffel Tower": [48.85826, 2.2945],
      "Le Marais cafés": [48.86277, 2.36478],
      "Rue des Rosiers": [48.85779, 2.35814],
      "Louvre Museum": [48.86115, 2.33803],
      "Sacré-Cœur Basilica": [48.88681, 2.34302],
      "Montmartre sunset walk": [48.88546, 2.33915],
      "Palace of Versailles": [48.80443, 2.12029],
      "Versailles Gardens": [48.84985, 2.1212],
      "Marie-Antoinette's Estate": [48.81922, 2.11279],
      "Thalys to Amsterdam": [48.87957, 2.35721],
      "Canal boat cruise": [52.36495, 4.89687],
      "Jordaan quarter walk": [52.37542, 4.8811],
      "Rijksmuseum": [52.35984, 4.88504],
      "Albert Cuyp Market": [52.35523, 4.89178],
      "De Pijp neighbourhood": [52.35335, 4.89696],
      "Anne Frank House": [52.37516, 4.88408],
      "Vondelpark stroll": [52.3572, 4.86412],
      "Leidseplein farewell": [52.36396, 4.88276],
    },
    iceland: {
      "Hallgrímskirkja": [64.1418, -21.92671],
      "Reykjavik harbour walk": [64.15167, -21.9421],
      "Sky Lagoon soak": [64.11647, -21.94644],
      "Seljalandsfoss waterfall": [63.61546, -19.98817],
      "Skógafoss waterfall": [63.5321, -19.51129],
      "Reynisfjara Black Sand Beach": [63.40443, -19.0588],
      "Thingvellir National Park": [64.27861, -21.08194],
      "Geysir geothermal area": [64.3089, -20.30049],
      "Gullfoss waterfall": [64.32661, -20.12168],
    },
    queenstown: {
      "Queenstown Gardens": [-45.03633, 168.66171],
      "Lake Wakatipu walk": [-45.0888, 168.52111],
      "Skyline Gondola": [-45.02753, 168.65246],
      "Arrowtown historic walk": [-44.93774, 168.82894],
      "Gibbston Valley tasting": [-45.01228, 168.91515],
      "Onsen Hot Pools": [-44.981, 168.68543],
      "Glenorchy scenic drive": [-44.84868, 168.38239],
      "Queenstown waterfront dinner": [-45.03325, 168.6578],
    },
    barcelona: {
      "Sagrada Família": [41.4035, 2.17443],
      "Passeig de Gràcia": [41.39782, 2.15814],
      "Casa Batlló exterior": [41.39154, 2.1647],
      "La Boqueria Market": [41.38174, 2.17155],
      "Gothic Quarter walk": [41.38384, 2.17451],
      "Barceloneta sunset": [41.38204, 2.18544],
      "Park Güell": [41.41423, 2.15246],
      "El Born galleries": [41.38484, 2.18287],
      "Poble-sec tapas district": [41.37281, 2.16197],
    },
  };

  function buildDemo(slug) {
    const cfg = demos[slug];
    if (!cfg) return null;
    const guidance = localGuidance[slug];
    const start = 21;
    const days = cfg.days.map(([title, subtitle, stops], index) => {
      const imageUrl = `assets/demos/${slug}-${index}.webp`;
      // One photo per named stop, so each caption shows the place it names.
      const stopImageUrl = (k) => `assets/demos/${slug}-d${index}-${k}.webp`;
      const photoSpot = `${stops[2]} photo stop`;
      const dayCity = (cfg.cities && cfg.cities[index]) || cfg.city;
      return {
        day: index + 1,
        date: dateAt(start + index),
        title,
        subtitle,
        emoji: index === 0 ? '✈️' : index === 1 ? '✨' : '🌙',
        heroSeed: cfg.city.toLowerCase(),
        imageUrl,
        highlights: stops,
        // These galleries are intentionally self-hosted. A demo must remain
        // visually complete even when third-party image hosts are unavailable.
        photos: [
          { url: stopImageUrl(0), time: 'Morning', caption: stops[0] },
          { url: stopImageUrl(1), time: 'Afternoon', caption: stops[1] },
          { url: stopImageUrl(2), time: 'Golden hour', caption: stops[2] }
        ],
        localTips: [
          guidance.morning,
          guidance.transit,
          `Save ${stops[2]} in Maps before leaving Wi-Fi; it is the best place to keep the afternoon flexible.`
        ],
        timeline: [
          { time: '08:30', title: 'Breakfast and route check', detail: guidance.breakfast, type: 'food', mapQuery: `${stops[0]}, ${dayCity}` },
          { time: '09:30', title: stops[0], detail: `${guidance.morning} Allow around 90 minutes here before moving on.`, type: 'activity', mapQuery: `${stops[0]}, ${dayCity}`, imageUrl: stopImageUrl(0) },
          { time: '12:30', title: stops[1], detail: `${guidance.transit} Stop for lunch close to ${stops[1]} rather than crossing the city twice.`, type: 'activity', mapQuery: `${stops[1]}, ${dayCity}`, imageUrl: stopImageUrl(1) },
          { time: '14:15', title: `Transfer to ${stops[2]}`, detail: `${guidance.transit} Leave with a 20-minute buffer for the final approach.`, type: 'transport', mapQuery: `${stops[2]}, ${dayCity}` },
          { time: '15:30', title: stops[2], detail: `${guidance.reserve} This is the anchor experience for the afternoon.`, type: 'activity', mapQuery: `${stops[2]}, ${dayCity}`, imageUrl: stopImageUrl(2) },
          { time: '17:45', title: photoSpot, detail: `Frame ${stops[2]} in softer late-day light. Keep this as a photo-first stop rather than rushing straight to dinner.`, tip: `Best light is roughly 45 minutes before sunset; bring a wide lens or use your phone's 0.5x camera.`, type: 'photospot', mapQuery: `${stops[2]}, ${dayCity}`, imageUrl: stopImageUrl(2) },
          { time: '19:30', title: localMeals[slug][index], detail: guidance.dinner, type: 'food', mapQuery: `${localMeals[slug][index]}, ${dayCity}` }
        ]
      };
    });
    const end = dateAt(start + days.length - 1);
    return {
      trip: {
        id: `demo-${slug}`,
        name: cfg.tripName || `${cfg.city} Weekend Guide`,
        emoji: cfg.emoji,
        destination: cfg.destination || `${cfg.city}, ${cfg.country}`,
        startDate: dateAt(start),
        endDate: end,
        dates: `${days.length} days · sample itinerary`,
        people: 2,
        travelers: 2,
        budget: `${cfg.budget} total`,
        days: days.length,
        archetype: 'couple',
        interests: ['culture', 'food', 'photography'],
        heroSeed: cfg.city.toLowerCase(),
        isDemo: true
      },
      days,
      hotels: [
        { city: cfg.city, name: cfg.hotel, nights: cfg.extraHotel ? days.length - 1 - cfg.extraHotel.nights : days.length - 1, price: cfg.hotelPrice, tier: 'mid', note: `Well located for this ${cfg.city} route.`, checkin: dateAt(start), checkout: dateAt(start + (cfg.extraHotel ? days.length - 1 - cfg.extraHotel.nights : days.length)), stayBudgetStatus: 'within-cap' },
        ...(cfg.extraHotel ? [{ city: cfg.extraHotel.city, name: cfg.extraHotel.name, nights: cfg.extraHotel.nights, price: cfg.extraHotel.price, tier: 'mid', note: `Well located for this ${cfg.extraHotel.city} route.`, checkin: dateAt(start + days.length - 1 - cfg.extraHotel.nights), checkout: dateAt(start + days.length), stayBudgetStatus: 'within-cap' }] : [])
      ],
      budget: [
        { label: 'Return travel', amount: cfg.extraHotel ? '$850' : '$650', icon: '✈️', note: cfg.extraHotel ? 'Flights + inter-city train for two' : 'Estimate for two travellers', status: 'pending', category: 'transport' },
        { label: 'Accommodation', amount: cfg.extraHotel ? '$960' : '$520', icon: '🏨', note: `${days.length - 1} nights across ${cfg.extraHotel ? '2 cities' : 'a central stay'}`, status: 'pending', category: 'accommodation' },
        { label: 'Food and coffee', amount: cfg.extraHotel ? '$560' : '$330', icon: '🍽️', note: 'Mix of local favourites and relaxed meals', status: 'pending', category: 'food' },
        { label: 'Experiences', amount: cfg.extraHotel ? '$420' : '$260', icon: '🎟️', note: 'Entries, tours, and local transport', status: 'pending', category: 'activities' }
      ],
      tips: [{ category: `${cfg.city} notes`, icon: cfg.emoji, items: ['Book headline attractions before you travel.', 'Keep one open block each day for a place you discover on the way.', 'Use this sample as a starting point, then adjust dates, pace, and budget.'] }],
      urgent: [{ label: `Check ${cfg.city} headline attraction availability`, note: 'Popular times and experiences can sell out early.', url: '' }],
      tickets: [],
      mapStops: [
        { name: cfg.city, lat: cfg.coords[0], lng: cfg.coords[1], type: 'visit', city: cfg.city },
        // Only stops with known coordinates; a pin without them breaks the route map.
        ...days.flatMap(day => day.timeline
          .filter(item => item.type === 'activity')
          .map(item => ({ name: item.title, ll: (stopCoords[slug] || {})[item.title] }))
          .filter(s => s.ll)
          .map(s => ({ name: s.name, city: cfg.city, type: 'activity', day: day.day, lat: s.ll[0], lng: s.ll[1] })))
      ]
    };
  }

  window.TripvaDemoTrips = { build: buildDemo, slugs: Object.keys(demos) };
})();
