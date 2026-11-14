/**
 * Photo credits. Every photograph on this site comes from Wikimedia Commons
 * under a Creative Commons licence, which asks for the author to be named,
 * the licence to be linked and changes to be stated.
 *
 * Changes made here: photos were resized and cropped; the side-on car shots
 * were also cut out from their backgrounds, levelled, and split into separate
 * wheel layers; the frames of each burst sequence were aligned on the car and
 * matched for exposure and colour. Under the ShareAlike terms, these adapted
 * images are offered under the same licence as the originals.
 *
 * Two exceptions, both in the pit stop and neither freely licensed: the
 * top-down car is Ferrari's own 2026 launch image (found on F1-Fansite), cut
 * out of its background with its race number changed from 16 to 44; and the
 * tyre rolling behind the heading is Pirelli's studio photo of a P Zero
 * supersoft (found on AUSmotive.com), cut out on a circle, darkened a little and
 * with the white of its wheel made transparent.
 */
import SEQUENCES from './sequences.json';

const BY_SA_4 = { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' };
const BY_SA_2 = { name: 'CC BY-SA 2.0', url: 'https://creativecommons.org/licenses/by-sa/2.0/' };
const BY_2 = { name: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0/' };
const PD = { name: 'Public domain', url: 'https://creativecommons.org/publicdomain/mark/1.0/' };

const page = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_')).replace(/%2C/g, ',')}`;

/** Lukas Raich's series from the 2026 Austrian Grand Prix: [photo key, car number, driver, frame]. */
const AUSTRIA_2026 = [
  ['mercedes-a', 12, 'Antonelli', 3], ['mercedes-b', 63, 'Russell', 3], ['action/mercedes', 63, 'Russell', 2],
  ['ferrari-a', 44, 'Hamilton', 3], ['ferrari-b', 16, 'Leclerc', 3], ['action/ferrari', 44, 'Hamilton', 2],
  ['redbull-a', 3, 'Verstappen', 3], ['redbull-b', 6, 'Hadjar', 3], ['action/redbull', 3, 'Verstappen', 2],
  ['mclaren-a', 1, 'Norris', 3], ['mclaren-b', 81, 'Piastri', 3], ['action/mclaren', 1, 'Norris', 2],
  ['racingbulls-a', 30, 'Lawson', 3], ['racingbulls-b', 41, 'Lindblad', 3], ['action/racingbulls', 41, 'Lindblad', 2],
  ['alpine-a', 10, 'Gasly', 3], ['alpine-b', 43, 'Colapinto', 3], ['action/alpine', 43, 'Colapinto', 2],
  ['haas-a', 31, 'Ocon', 3], ['haas-b', 87, 'Bearman', 3], ['action/haas', 87, 'Bearman', 2],
  ['audi-a', 5, 'Bortoleto', 3], ['audi-b', 27, 'Hülkenberg', 3], ['action/audi', 27, 'Hülkenberg', 2],
  ['williams-a', 23, 'Albon', 3], ['williams-b', 55, 'Sainz', 3], ['action/williams', 23, 'Albon', 2],
  ['astonmartin-a', 14, 'Alonso', 3], ['astonmartin-b', 18, 'Stroll', 3], ['action/astonmartin', 14, 'Alonso', 2],
  ['cadillac-a', 11, 'Perez', 3], ['cadillac-b', 77, 'Bottas', 3], ['action/cadillac', 77, 'Bottas', 2],
];

const ARCHIVE = [
  ['eras/1950', 'Arese Museo Storico Alfa Romeo 1951 GP Tipo 159 Alfetta 4.jpg', 'Zairon', BY_SA_4, 'Alfa Romeo 159 Alfetta'],
  ['eras/1978', 'Lotus 79 at Barber 01.jpg', 'Legends Of Motorsports', BY_SA_2, 'Lotus 79'],
  ['eras/1988', 'McLaren MP4-4 at Goodwood 2014 003.jpg', 'Nic Redhead', BY_SA_2, 'McLaren MP4/4'],
  ['eras/2004', 'Ferrari F2004 (8925316574).jpg', 'emperornie', BY_SA_2, 'Ferrari F2004'],
  ['eras/2014', 'Lewis Hamilton 2014 China Race.jpg', 'emperornie', BY_SA_2, 'Mercedes F1 W05 Hybrid'],
  ['pit/crew-waiting', 'Haas F1 Team 2017 United States GP (37946707226).jpg', 'Curt Smith', BY_2, 'Haas pit crew, 2017 United States GP'],
  ['pit/astonmartin-2021', 'Aston Martin pit USGP 2021.jpg', 'Declan M Martin', PD, 'Aston Martin AMR21 in its pit box, 2021 United States GP'],
  ['pit/redbull-2015', 'Daniil Kvyat-Red Bull-2015 (5).JPG', 'Alberto-g-rovi', BY_SA_4, 'Red Bull practice pit stop, Barcelona testing 2015'],
  ['pit/wheel-gun', 'Formula One Wheel Gun.jpg', 'Rich Jones', BY_2, 'A Formula One wheel gun'],
  ['pit/ferrari-2017', 'Kimi Raikkonen 2017 United States GP (37946719176).jpg', 'Curt Smith', BY_2, 'Ferrari pit crew, 2017 United States GP'],
];

/**
 * The tyre photos (scripts/prepare-tyres.py): [photo key, Commons file, author, licence, subject].
 * The three slicks are crops of one photo, as are the intermediate and the full wet.
 */
const DUTCH_2024_TYRES = '2024-08-25 Motorsport, Formel 1, Großer Preis der Niederlande 2024 STP 3619 by Stepro.jpg';
const LONDON_RAIN_TYRES = 'Pirelli Tyre Sets at Formula 1 Exhibition, London 03.jpg';
const TYRE_PHOTOS = [
  ['tyres/range', 'Pirelli Tyre Sets at Formula 1 Exhibition, London 04.jpg', 'Hullian111', BY_SA_4, 'The tyre range, Formula 1 Exhibition, London 2025'],
  ['tyres/soft', DUTCH_2024_TYRES, 'Steffen Prößdorf', BY_SA_4, 'Soft tyre, 2024 Dutch GP'],
  ['tyres/medium', DUTCH_2024_TYRES, 'Steffen Prößdorf', BY_SA_4, 'Medium tyre, 2024 Dutch GP'],
  ['tyres/hard', DUTCH_2024_TYRES, 'Steffen Prößdorf', BY_SA_4, 'Hard tyre, 2024 Dutch GP'],
  ['tyres/inter', LONDON_RAIN_TYRES, 'Hullian111', BY_SA_4, 'Intermediate tyre, Formula 1 Exhibition, London 2025'],
  ['tyres/wet', LONDON_RAIN_TYRES, 'Hullian111', BY_SA_4, 'Full wet tyre, Formula 1 Exhibition, London 2025'],
  ['tyres/sidewall', 'Pirelli P Zero Formula 1 Medium Slick Tyre 2026.jpg', 'TaurusEmerald', BY_SA_4, '2026 medium tyre and its sidewall'],
  ['tyres/worn', 'FIA F1 Austria 2024 misc (tire rubber pickup).jpg', 'Lukas Raich', BY_SA_4, 'Used hard tyre, 2024 Austrian GP'],
  // The tyre behind the tyres heading is made of pieces of these two photos.
  ['tyres/ring-slicks', DUTCH_2024_TYRES, 'Steffen Prößdorf', BY_SA_4, 'Soft, medium and hard pieces of the tyre behind the tyres heading'],
  ['tyres/ring-rain', LONDON_RAIN_TYRES, 'Hullian111', BY_SA_4, 'Intermediate and full wet pieces of the tyre behind the tyres heading'],
];

export const CREDITS = {
  ...Object.fromEntries(
    AUSTRIA_2026.map(([key, no, driver, frame]) => {
      const file = `FIA F1 Austria 2026 Nr. ${no} ${driver} (${frame}).jpg`;
      return [key, { file, author: 'Lukas Raich', licence: BY_SA_4, url: page(file), subject: `No. ${no}, ${driver}` }];
    })
  ),
  ...Object.fromEntries(
    ARCHIVE.map(([key, file, author, licence, subject]) => [key, { file, author, licence, url: page(file), subject }])
  ),
  // A note as well as a subject, so the credits list prints it as it is (see Footer.jsx).
  ...Object.fromEntries(
    TYRE_PHOTOS.map(([key, file, author, licence, subject]) => [key, { file, author, licence, url: page(file), subject, note: subject }])
  ),
  // The pit stop's top-down car: Ferrari's launch image, not freely licensed.
  'pit/sf26-top': {
    file: null,
    author: 'Scuderia Ferrari, 2026 launch image (via F1-Fansite)',
    licence: { name: 'not freely licensed', url: 'https://www.f1-fansite.com/f1-wallpaper/2026-ferrari-sf-26-f1-car-launch-photos/' },
    url: 'https://www.f1-fansite.com/f1-wallpaper/2026-ferrari-sf-26-f1-car-launch-photos/',
    subject: 'Ferrari SF-26 from above (pit stop marker; number changed from 16 to 44)',
  },
  // The tyre rolling behind the pit stop's heading: Pirelli's studio photo, not freely licensed.
  'pit/soft-tyre': {
    file: null,
    author: 'Pirelli, studio photo (via AUSmotive.com)',
    licence: { name: 'not freely licensed', url: 'https://www.ausmotive.com/' },
    url: 'https://www.ausmotive.com/',
    subject: 'Pirelli P Zero supersoft (pit stop heading; cut out on a circle)',
    note: 'Pirelli P Zero supersoft (pit stop heading; cut out on a circle)',
  },
  // Steffen Prößdorf's bursts from the 2026 Dutch Grand Prix (scripts/sequences.json): aligned on the car and colour-matched.
  ...Object.fromEntries(
    Object.values(SEQUENCES.sets).flatMap((s) =>
      s.frames.map((f, i) => {
        const file = `2026-08-21 Motorsport, Formel 1, Großer Preis der Niederlande 2026 STP ${f.stp}.jpg`;
        const subject = `No. ${s.no}, ${s.driver}`;
        return [f.src, { file, author: 'Steffen Prößdorf', licence: BY_SA_4, url: page(file), subject, note: `${subject}, frame ${i + 1} of ${s.frames.length}` }];
      })
    )
  ),
};

/**
 * Sound credits. Real recordings from Wikimedia Commons (scripts/sounds.json):
 * Edvvc's at the Goodwood Festival of Speed hillclimb (CC BY-SA 3.0), and the
 * soundtracks of videos filmed at 2021 Grands Prix and a 2015 pit stop practice
 * (CC BY-SA 4.0). The clips were cut, faded and loudness-normalised, and the
 * adapted clips are shared under the same licences. The pit stop radio is the
 * exception: a "Box, box" clip downloaded from Myinstants, where it was
 * uploaded with no source or licence stated, used as it is. The start-light
 * beeps and the flat-out engine are made in the browser and have no source.
 */
const BY_SA_3 = { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' };
const MYINSTANTS = 'https://www.myinstants.com/en/instant/formula-1-box-box-27468/';
const UNKNOWN = { name: 'licence unknown', url: MYINSTANTS };
export const SOUND_CREDITS = [
  ['start', '2021 Russian Grand Prix - start for warm-up.webm', 'Turbo-hybrid V6 grid leaving for the formation lap, 2021 Russian Grand Prix', 'the start lights', 'rubin16', BY_SA_4],
  ['launch', 'Ferrari F60 (2009).ogg', 'Ferrari F60 (2009)', 'the race start'],
  ['era-1950', 'Mercedes-Benz W196 (1954).ogg', 'Mercedes-Benz W196 (1954), driven by Stirling Moss', 'history, 1950'],
  ['era-1978', 'Lotus-Cosworth 79 (1978).ogg', 'Lotus 79 (1978)', 'history, 1978'],
  ['era-1988', 'McLaren-Honda MP4 4 (1988) driven by Bruno Senna.ogg', 'McLaren MP4/4 (1988), driven by Bruno Senna', 'history, 1988'],
  ['era-2004', 'Red Bull-Cosworth RB1 (2005).ogg', 'Red Bull RB1 (2005, Cosworth V10), driven by Mark Webber', 'history, 2004'],
  ['era-2014', 'Formula 1 Turkish GP 2021.ogg', 'Turbo-hybrid V6 cars, 2021 Turkish Grand Prix', 'history, 2014', 'SAİT71', BY_SA_4],
  ['era-2026', 'Formula 1 Turkish GP 2021 - 2.ogg', 'Turbo-hybrid V6 cars, 2021 Turkish Grand Prix (second video)', 'history, 2026', 'SAİT71', BY_SA_4],
  ['pit-guns', 'Red Bull Racing Pit Stop Practice.webm', 'Red Bull Racing pit stop practice, Mexico City 2015 (wheel guns)', 'the pit stop', 'ProtoplasmaKid', BY_SA_4],
  ['pit-release', '2021 Russian Grand Prix - start for warm-up.webm', 'Turbo-hybrid V6 pulling away, 2021 Russian Grand Prix', 'the pit stop', 'rubin16', BY_SA_4],
  ['pit-radio', 'formula 1 box box', '"Box, box" on the team radio', 'the pit stop', 'blue828 on Myinstants', UNKNOWN, MYINSTANTS],
].map(([key, file, car, where, author = 'Edvvc', licence = BY_SA_3, url = page(file)]) => ({ key, file, car, where, author, licence, url }));

/** Sound credits grouped by author, for the credits list. */
export const SOUND_GROUPS = Object.values(
  SOUND_CREDITS.reduce((groups, c) => {
    const id = `${c.author}|${c.licence.name}`;
    (groups[id] ||= { author: c.author, licence: c.licence, items: [] }).items.push(c);
    return groups;
  }, {})
);

export const soundCreditFor = (key) => SOUND_CREDITS.find((c) => c.key === key);

/** Credits grouped by author, for the credits list. */
export const CREDIT_GROUPS = Object.values(
  Object.entries(CREDITS).reduce((groups, [key, c]) => {
    const id = `${c.author}|${c.licence.name}`;
    (groups[id] ||= { author: c.author, licence: c.licence, items: [] }).items.push({ key, ...c });
    return groups;
  }, {})
);

export const creditFor = (key) => CREDITS[key];
