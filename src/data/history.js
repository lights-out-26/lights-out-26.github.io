/**
 * Seven stops through Formula 1 history, each told through one car.
 * `photo` points at public/photos/eras/<photo>.webp; the 2026 stop uses a
 * 2026 action shot instead.
 */
export const ERAS = [
  {
    year: 1950,
    title: 'The first World Championship',
    car: 'Alfa Romeo Alfetta',
    photo: 'eras/1950',
    caption: 'Alfa Romeo 159, the 1951 development of the 158, at the Museo Storico Alfa Romeo',
    body: 'Silverstone, 13 May 1950. Seven races make up the first season and Alfa Romeo wins every one it enters. The engine sits in front of the driver, the tyres are barely wider than a road car’s, and there are no seat belts.',
    fact: ['Front-engined', '1.5 litres, supercharged'],
  },
  {
    year: 1978,
    title: 'Ground effect',
    car: 'Lotus 79',
    photo: 'eras/1978',
    caption: 'Lotus 79, driven at Barber Motorsports Park in 2010',
    body: 'Engines have long since moved behind the driver and wings arrived a decade ago. Now Lotus shapes the underside of the car like an upturned wing and seals it with sliding skirts. The car is pulled down onto the track, and Mario Andretti wins the title.',
    fact: ['Underfloor tunnels', '6 wins in its first season'],
  },
  {
    year: 1988,
    title: 'The turbo peak',
    car: 'McLaren MP4/4',
    photo: 'eras/1988',
    caption: 'McLaren MP4/4 at the Goodwood Festival of Speed, 2014',
    body: 'The last year of the first turbo era belongs to one car. Ayrton Senna and Alain Prost win 15 of the 16 races in the low, Honda-powered MP4/4, a strike rate that stood as the record for 35 years.',
    fact: ['15 wins from 16', '1.5-litre V6 turbo'],
  },
  {
    year: 2004,
    title: 'The V10 years',
    car: 'Ferrari F2004',
    photo: 'eras/2004',
    caption: 'Ferrari F2004, photographed in 2012',
    body: 'Three-litre V10 engines turn at 19,000 rpm and tyre makers are at war. Michael Schumacher wins 13 races and a seventh title in the F2004, and some of the lap records it set stood for more than a decade.',
    fact: ['13 wins for Schumacher', '3.0-litre V10'],
  },
  {
    year: 2014,
    title: 'Hybrid power',
    car: 'Mercedes F1 W05 Hybrid',
    photo: 'eras/2014',
    caption: 'Mercedes F1 W05 Hybrid at the 2014 Chinese Grand Prix',
    body: 'The engine becomes a power unit: a 1.6-litre turbo V6 with two electric motors recovering energy from braking and from exhaust heat. Mercedes gets it right first and wins eight constructors’ titles in a row.',
    fact: ['16 wins from 19', 'First turbo-hybrid'],
  },
  {
    year: 2026,
    title: 'A reset',
    car: 'The 2026 cars',
    photo: 'action/mercedes',
    caption: 'Mercedes W17 at the 2026 Austrian Grand Prix',
    body: 'New chassis rules and new engine rules arrive together for the first time. The cars are shorter, narrower and 30 kg lighter, their wings move, and nearly half the power is electric. Eleven teams line up, the most since 2016.',
    fact: ['Active aerodynamics', '350 kW electric'],
  },
];
