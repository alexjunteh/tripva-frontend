/* Prebuilt destination itineraries used by the landing-page demo gallery.
   These stay client-side so a demo always opens even if the API is unavailable. */
(function () {
  const demos = {
    tokyo: { city: 'Tokyo', country: 'Japan', emoji: '🗼', budget: '$1,850', image: 'assets/landing/destination-0.webp', coords: [35.6762, 139.6503], hotel: 'Shibuya Stream Excel Hotel', days: [
      ['Shibuya & Harajuku', 'Meiji Jingu, Takeshita Street, and Shibuya after dark', ['Meiji Jingu Shrine', 'Takeshita Street', 'Shibuya Sky at sunset']],
      ['Food & Future Tokyo', 'Tsukiji breakfast, teamLab, and Ginza', ['Tsukiji Outer Market', 'teamLab Borderless', 'Ginza architecture walk']],
      ['Old Tokyo', 'Temples, markets, and skyline views', ['Senso-ji Temple', 'Nakamise shopping street', 'Tokyo Skytree']]
    ]},
    santorini: { city: 'Santorini', country: 'Greece', emoji: '🏛️', budget: '$2,200', image: 'assets/landing/destination-1.webp', coords: [36.3932, 25.4615], hotel: 'Imerovigli Caldera View Suites', days: [
      ['Caldera arrival', 'Fira lanes, cliff views, and a first sunset', ['Fira caldera walk', 'Three Bells of Fira', 'Imerovigli sunset walk']],
      ['Oia day', 'Whitewashed lanes and the island’s iconic blue domes', ['Oia village morning walk', 'Ammoudi Bay swim', 'Oia sunset viewpoint']],
      ['Volcanic coast', 'A quieter beach day and local wine', ['Red Beach', 'Akrotiri archaeological site', 'Santorini wine tasting']]
    ]},
    kyoto: { city: 'Kyoto', country: 'Japan', emoji: '⛩️', budget: '$1,650', image: 'assets/landing/destination-2.webp', coords: [35.0116, 135.7681], hotel: 'The Gate Hotel Kyoto', days: [
      ['Eastern Kyoto', 'Temples, lanes, and Gion at golden hour', ['Kiyomizu-dera', 'Ninenzaka and Sannenzaka', 'Gion evening walk']],
      ['Arashiyama', 'Bamboo, river views, and a quiet temple', ['Arashiyama Bamboo Grove', 'Tenryu-ji Temple', 'Togetsukyo Bridge']],
      ['Fushimi & Nishiki', 'Torii gates and Kyoto’s kitchen', ['Fushimi Inari Taisha', 'Nishiki Market', 'Pontocho lane walk']]
    ]},
    bali: { city: 'Bali', country: 'Indonesia', emoji: '🌴', budget: '$1,400', image: 'assets/landing/destination-3.webp', coords: [-8.4095, 115.1889], hotel: 'Ubud Valley Retreat', days: [
      ['Ubud reset', 'Rice terraces, a temple, and a slow evening', ['Tegalalang Rice Terrace', 'Tirta Empul Temple', 'Ubud Art Market']],
      ['Coast day', 'Beach time and a clifftop sunset', ['Padang Padang Beach', 'Uluwatu Temple', 'Jimbaran Beach sunset']],
      ['North Bali', 'Waterfalls and a local café stop', ['Tegenungan Waterfall', 'Campuhan Ridge Walk', 'Balinese cooking class']]
    ]},
    paris: { city: 'Paris', country: 'France', emoji: '🗼', budget: '$2,300', image: 'assets/landing/destination-4.webp', coords: [48.8566, 2.3522], hotel: 'Hotel des Arts Montmartre', days: [
      ['Montmartre arrival', 'A gentle first afternoon above the city', ['Sacré-Cœur Basilica', 'Montmartre lanes', 'Place du Tertre']],
      ['Paris icons', 'The tower, the river, and classic boulevards', ['Eiffel Tower', 'Seine river cruise', 'Champs-Élysées walk']],
      ['Art & Marais', 'Museum highlights and a neighbourhood dinner', ['Louvre Museum', 'Le Marais walk', 'Canal Saint-Martin walk']]
    ]},
    iceland: { city: 'Iceland', country: 'Iceland', emoji: '❄️', budget: '$2,650', image: 'assets/landing/destination-5.webp', coords: [64.1466, -21.9426], hotel: 'Reykjavik Harbour Hotel', days: [
      ['Reykjavik start', 'Design, harbour air, and geothermal warmth', ['Hallgrímskirkja', 'Reykjavik harbour walk', 'Sky Lagoon soak']],
      ['South Coast', 'Waterfalls, black sand, and sea stacks', ['Seljalandsfoss waterfall', 'Skógafoss waterfall', 'Reynisfjara Black Sand Beach']],
      ['Golden Circle', 'Geysers, rift valleys, and a final hot spring', ['Thingvellir National Park', 'Geysir geothermal area', 'Gullfoss waterfall']]
    ]},
    queenstown: { city: 'Queenstown', country: 'New Zealand', emoji: '🏔️', budget: '$2,450', image: 'assets/landing/destination-6.webp', coords: [-45.0312, 168.6626], hotel: 'Lake Wakatipu Lodge', days: [
      ['Lake Wakatipu', 'A lakeside arrival and the best town viewpoints', ['Queenstown Gardens', 'Lake Wakatipu walk', 'Skyline Gondola']],
      ['Arrowtown & wine', 'Gold-rush streets and Central Otago flavours', ['Arrowtown historic walk', 'Gibbston Valley tasting', 'Onsen Hot Pools']],
      ['Big landscapes', 'A full day among Fiordland-scale scenery', ['Glenorchy scenic drive', 'Bob’s Cove track', 'Queenstown waterfront dinner']]
    ]},
    barcelona: { city: 'Barcelona', country: 'Spain', emoji: '🏖️', budget: '$1,950', image: 'assets/landing/destination-7.webp', coords: [41.3874, 2.1686], hotel: 'Eixample Modernist Stay', days: [
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
    paris: ['Montmartre bistro dinner', 'Left Bank dinner', 'Canal Saint-Martin wine bar'],
    iceland: ['Reykjavik harbour seafood dinner', 'Vik-area dinner stop', 'Reykjavik final-night dinner'],
    queenstown: ['central Queenstown dinner', 'Gibbston Valley dinner', 'Queenstown waterfront dinner'],
    barcelona: ['Eixample tapas dinner', 'Barceloneta seafood dinner', 'Poble-sec tapas crawl']
  };

  const localGuidance = {
    tokyo: { breakfast: 'Pick up coffee and onigiri; a loaded Suica card keeps the first train transfer simple.', morning: 'Arrive early for a quieter first stop and avoid the busiest subway window between 07:30 and 09:30.', transit: 'Use the rail network between stops and keep the route in the same neighbourhood rather than backtracking.', reserve: 'Check whether this stop has timed entry, then book the evening table before the afternoon rush.', dinner: 'Reserve a counter or small table by late afternoon, especially on Friday and Saturday.' },
    santorini: { breakfast: 'Have breakfast close to the caldera, then use the cooler morning light for the cliff walk.', morning: 'Start early before day visitors arrive; the best lanes are calmer before the first island buses.', transit: 'Use the Fira-Oia bus or a pre-booked transfer instead of trying to move a car through the narrow lanes.', reserve: 'Confirm your sunset table or boat place in advance, then leave the viewpoint before the post-sunset rush.', dinner: 'Book a terrace table a day ahead and ask for a wind-sheltered spot.' },
    kyoto: { breakfast: 'Start with coffee and a light Japanese breakfast; load an ICOCA card for buses and Keihan trains.', morning: 'Be at the temple gate when it opens to experience the lanes before the tour groups.', transit: 'Walk the old streets where possible, then use the nearest rail line instead of crossing Kyoto by bus at midday.', reserve: 'Check seasonal illuminations and any timed garden access before locking in the afternoon.', dinner: 'Reserve Pontocho or Gion dinner ahead, particularly during blossom and foliage seasons.' },
    bali: { breakfast: 'Eat near the hotel and ask reception to arrange a driver before peak traffic builds.', morning: 'Visit temples and terraces early, with shoulders and knees covered and a sarong ready where required.', transit: 'Keep a private driver or Grab for the longer transfer; travel times are much slower than map estimates.', reserve: 'Confirm sunset, wellness, and cooking-class places the day before because weather can shift the schedule.', dinner: 'Choose a restaurant near your final stop so the return journey is short after dark.' },
    paris: { breakfast: 'Begin at a neighbourhood boulangerie, then use contactless Metro entry for the first cross-city ride.', morning: 'Book the headline museum or tower slot for the morning to avoid the longest security and entry lines.', transit: 'Use the Metro between districts and leave time to walk the final few blocks where Paris is at its best.', reserve: 'Keep timed-ticket confirmations offline and reserve popular dinner rooms before the afternoon.', dinner: 'Ask for a 20:00 table and plan the final stroll around the same arrondissement.' },
    iceland: { breakfast: 'Check road.is and the weather forecast over breakfast before committing to the driving route.', morning: 'Leave Reykjavik early for daylight and the first waterfall stop; waterproof layers stay in the car.', transit: 'Use a rental car only after checking wind and road alerts, and refuel before the more remote stretches.', reserve: 'Pre-book lagoon or tour slots and keep an alternate city plan ready for severe weather.', dinner: 'Return to Reykjavik before dark when possible and reserve a harbour table for a relaxed finish.' },
    queenstown: { breakfast: 'Fuel up in town and check the DOC and weather updates before any lake or mountain route.', morning: 'Start scenic drives early so you can stop at lookouts without rushing the return to town.', transit: 'Use a rental car for Arrowtown and Glenorchy, with extra time for photo stops and changing road conditions.', reserve: 'Book gondola, onsen, and cellar-door experiences before the day; prime late-afternoon slots go first.', dinner: 'Reserve lakefront dining for the evening and walk back through central Queenstown.' },
    barcelona: { breakfast: 'Start with a bakery stop and a T-casual or contactless Metro ride before the main sites open.', morning: 'Use a timed morning entry for Gaudi sites, when interiors are quieter and the light is better.', transit: 'Walk within each district and use the Metro only for the longer jump to avoid losing the day in taxis.', reserve: 'Keep Sagrada Familia and Park Guell tickets on your phone, then book tapas before the evening crowd.', dinner: 'Plan a late Spanish dinner near the final neighbourhood, with a reservation after 20:30.' }
  };

  function dateAt(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  function buildDemo(slug) {
    const cfg = demos[slug];
    if (!cfg) return null;
    const guidance = localGuidance[slug];
    const start = 21;
    const days = cfg.days.map(([title, subtitle, stops], index) => ({
      day: index + 1,
      date: dateAt(start + index),
      title,
      subtitle,
      emoji: index === 0 ? '✈️' : index === 1 ? '✨' : '🌙',
      heroSeed: cfg.city.toLowerCase(),
      imageUrl: `assets/demos/${slug}-${index}.webp`,
      highlights: stops,
      timeline: [
        { time: '08:30', title: 'Breakfast and route check', detail: guidance.breakfast, type: 'food', mapQuery: `${stops[0]}, ${cfg.city}` },
        { time: '09:30', title: stops[0], detail: `${guidance.morning} Allow around 90 minutes here before moving on.`, type: 'activity', mapQuery: `${stops[0]}, ${cfg.city}` },
        { time: '12:30', title: stops[1], detail: `${guidance.transit} Stop for lunch close to ${stops[1]} rather than crossing the city twice.`, type: 'activity', mapQuery: `${stops[1]}, ${cfg.city}` },
        { time: '15:30', title: stops[2], detail: `${guidance.reserve} This is the anchor experience for the afternoon.`, type: 'activity', mapQuery: `${stops[2]}, ${cfg.city}` },
        { time: '19:30', title: localMeals[slug][index], detail: guidance.dinner, type: 'food', mapQuery: `${localMeals[slug][index]}, ${cfg.city}` }
      ]
    }));
    const end = dateAt(start + days.length - 1);
    return {
      trip: {
        id: `demo-${slug}`,
        name: `${cfg.city} Weekend Guide`,
        emoji: cfg.emoji,
        destination: `${cfg.city}, ${cfg.country}`,
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
      hotels: [{ city: cfg.city, name: cfg.hotel, nights: days.length - 1, price: 'Sample mid-range stay', tier: 'mid', note: `Well located for this ${cfg.city} route.`, checkin: dateAt(start), checkout: dateAt(start + days.length) }],
      budget: [
        { label: 'Return travel', amount: '$650', icon: '✈️', note: 'Estimate for two travellers', status: 'pending', category: 'transport' },
        { label: 'Accommodation', amount: '$520', icon: '🏨', note: `${days.length - 1} nights in a central stay`, status: 'pending', category: 'accommodation' },
        { label: 'Food and coffee', amount: '$330', icon: '🍽️', note: 'Mix of local favourites and relaxed meals', status: 'pending', category: 'food' },
        { label: 'Experiences', amount: '$260', icon: '🎟️', note: 'Entries, tours, and local transport', status: 'pending', category: 'activities' }
      ],
      tips: [{ category: `${cfg.city} notes`, icon: cfg.emoji, items: ['Book headline attractions before you travel.', 'Keep one open block each day for a place you discover on the way.', 'Use this sample as a starting point, then adjust dates, pace, and budget.'] }],
      urgent: [{ label: `Check ${cfg.city} headline attraction availability`, note: 'Popular times and experiences can sell out early.', url: '' }],
      tickets: [],
      mapStops: [{ name: cfg.city, lat: cfg.coords[0], lng: cfg.coords[1], type: 'visit' }]
    };
  }

  window.TripvaDemoTrips = { build: buildDemo, slugs: Object.keys(demos) };
})();
