/**
 * Photo credits. Every photograph on this site comes from Wikimedia Commons
 * under a Creative Commons licence, which asks for the author to be named,
 * the licence to be linked and changes to be stated.
 *
 * Changes made here: photos were resized and cropped; the side-on car shots
 * were also cut out from their backgrounds, levelled, and split into separate
 * wheel layers. Under the ShareAlike terms, these adapted images are offered
 * under the same licence as the originals.
 */
const BY_SA_4 = { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' };
const BY_SA_2 = { name: 'CC BY-SA 2.0', url: 'https://creativecommons.org/licenses/by-sa/2.0/' };

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
};

/**
 * Sound credits. Real recordings from Wikimedia Commons (scripts/sounds.json):
 * Edvvc's at the Goodwood Festival of Speed hillclimb (CC BY-SA 3.0), and the
 * soundtracks of two videos filmed at 2021 Grands Prix (CC BY-SA 4.0). The
 * clips were cut, faded and loudness-normalised, and the adapted clips are
 * shared under the same licences. The start-light beeps and the flat-out
 * engine are made in the browser and have no source.
 */
const BY_SA_3 = { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' };
export const SOUND_CREDITS = [
  ['launch', 'Ferrari F60 (2009).ogg', 'Ferrari F60 (2009)', 'the race start'],
  ['era-1950', 'Mercedes-Benz W196 (1954).ogg', 'Mercedes-Benz W196 (1954), driven by Stirling Moss', 'history, 1950'],
  ['era-1978', 'Lotus-Cosworth 79 (1978).ogg', 'Lotus 79 (1978)', 'history, 1978'],
  ['era-1988', 'McLaren-Honda MP4 4 (1988) driven by Bruno Senna.ogg', 'McLaren MP4/4 (1988), driven by Bruno Senna', 'history, 1988'],
  ['era-2004', 'Red Bull-Cosworth RB1 (2005).ogg', 'Red Bull RB1 (2005, Cosworth V10), driven by Mark Webber', 'history, 2004'],
  ['era-2014', 'Formula 1 Turkish GP 2021.ogg', 'Turbo-hybrid V6 cars, 2021 Turkish Grand Prix', 'history, 2014', 'SAİT71', BY_SA_4],
  ['era-2026', '2021 Russian Grand Prix - start for warm-up.webm', 'Turbo-hybrid V6 grid leaving for the formation lap, 2021 Russian Grand Prix', 'history, 2026', 'rubin16', BY_SA_4],
].map(([key, file, car, where, author = 'Edvvc', licence = BY_SA_3]) => ({ key, file, car, where, author, licence, url: page(file) }));

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
