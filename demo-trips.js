/* Prebuilt destination itineraries used by the landing-page demo gallery.
   These stay client-side so a demo always opens even if the API is unavailable. */
(function () {
  const demos = {
    tokyo: { city: 'Tokyo', country: 'Japan', emoji: '🗼', budget: '$1,850', image: 'assets/landing/destination-0.webp', coords: [35.6762, 139.6503], hotel: 'Shibuya Stream Excel Hotel', days: [
      ['Shibuya & Harajuku', 'Meiji Jingu, Takeshita Street, and Shibuya after dark', ['Meiji Jingu Shrine', 'Takeshita Street', 'Shibuya Sky at sunset']],
      ['Food & Future Tokyo', 'Tsukiji breakfast, teamLab, and Ginza', ['Tsukiji Outer Market', 'teamLab Borderless', 'Ginza dinner']],
      ['Old Tokyo', 'Temples, markets, and skyline views', ['Senso-ji Temple', 'Nakamise shopping street', 'Tokyo Skytree']]
    ]},
    santorini: { city: 'Santorini', country: 'Greece', emoji: '🏛️', budget: '$2,200', image: 'assets/landing/destination-1.webp', coords: [36.3932, 25.4615], hotel: 'Imerovigli Caldera View Suites', days: [
      ['Caldera arrival', 'Fira lanes, cliff views, and a first sunset', ['Fira caldera walk', 'Three Bells of Fira', 'Sunset dinner in Imerovigli']],
      ['Oia day', 'Whitewashed lanes and the island’s iconic blue domes', ['Oia village morning walk', 'Ammoudi Bay swim', 'Oia sunset viewpoint']],
      ['Volcanic coast', 'A quieter beach day and local wine', ['Red Beach', 'Akrotiri archaeological site', 'Santorini wine tasting']]
    ]},
    kyoto: { city: 'Kyoto', country: 'Japan', emoji: '⛩️', budget: '$1,650', image: 'assets/landing/destination-2.webp', coords: [35.0116, 135.7681], hotel: 'The Gate Hotel Kyoto', days: [
      ['Eastern Kyoto', 'Temples, lanes, and Gion at golden hour', ['Kiyomizu-dera', 'Ninenzaka and Sannenzaka', 'Gion evening walk']],
      ['Arashiyama', 'Bamboo, river views, and a quiet temple', ['Arashiyama Bamboo Grove', 'Tenryu-ji Temple', 'Togetsukyo Bridge']],
      ['Fushimi & Nishiki', 'Torii gates and Kyoto’s kitchen', ['Fushimi Inari Taisha', 'Nishiki Market lunch', 'Pontocho dinner']]
    ]},
    bali: { city: 'Bali', country: 'Indonesia', emoji: '🌴', budget: '$1,400', image: 'assets/landing/destination-3.webp', coords: [-8.4095, 115.1889], hotel: 'Ubud Valley Retreat', days: [
      ['Ubud reset', 'Rice terraces, a temple, and a slow evening', ['Tegalalang Rice Terrace', 'Tirta Empul Temple', 'Ubud market dinner']],
      ['Coast day', 'Beach time and a clifftop sunset', ['Padang Padang Beach', 'Uluwatu Temple', 'Jimbaran seafood dinner']],
      ['North Bali', 'Waterfalls and a local café stop', ['Tegenungan Waterfall', 'Campuhan Ridge Walk', 'Balinese cooking class']]
    ]},
    paris: { city: 'Paris', country: 'France', emoji: '🗼', budget: '$2,300', image: 'assets/landing/destination-4.webp', coords: [48.8566, 2.3522], hotel: 'Hotel des Arts Montmartre', days: [
      ['Montmartre arrival', 'A gentle first afternoon above the city', ['Sacré-Cœur Basilica', 'Montmartre lanes', 'French bistro dinner']],
      ['Paris icons', 'The tower, the river, and classic boulevards', ['Eiffel Tower', 'Seine river cruise', 'Champs-Élysées walk']],
      ['Art & Marais', 'Museum highlights and a neighbourhood dinner', ['Louvre Museum', 'Le Marais walk', 'Canal Saint-Martin dinner']]
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
      ['Park & tapas', 'Views, colour, and a long final meal', ['Park Güell', 'El Born galleries', 'Tapas dinner in Poble-sec']]
    ]}
  };

  function dateAt(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  function buildDemo(slug) {
    const cfg = demos[slug];
    if (!cfg) return null;
    const start = 21;
    const days = cfg.days.map(([title, subtitle, stops], index) => ({
      day: index + 1,
      date: dateAt(start + index),
      title,
      subtitle,
      emoji: index === 0 ? '✈️' : index === 1 ? '✨' : '🌙',
      heroSeed: cfg.city.toLowerCase(),
      imageUrl: cfg.image,
      highlights: stops,
      timeline: [
        { time: '09:00', title: stops[0], detail: `Start early for a calmer ${cfg.city} experience. Keep this flexible around weather and opening hours.`, type: 'activity', mapQuery: `${stops[0]}, ${cfg.city}` },
        { time: '13:00', title: stops[1], detail: `Pause nearby for a local lunch, then explore at your own pace.`, type: 'activity', mapQuery: `${stops[1]}, ${cfg.city}` },
        { time: '18:30', title: stops[2], detail: `Finish the day here. Reserve ahead where available, especially in peak season.`, type: 'activity', mapQuery: `${stops[2]}, ${cfg.city}` }
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
