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
 */
import SEQUENCES from './sequences.json';

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

/** Credits grouped by author, for the credits list. */
export const CREDIT_GROUPS = Object.values(
  Object.entries(CREDITS).reduce((groups, [key, c]) => {
    const id = `${c.author}|${c.licence.name}`;
    (groups[id] ||= { author: c.author, licence: c.licence, items: [] }).items.push({ key, ...c });
    return groups;
  }, {})
);

export const creditFor = (key) => CREDITS[key];
