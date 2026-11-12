/**
 * Each pit stop step's own graphic, drawn in CSS over a corner of its photo
 * (Pitstop.css, "step graphics"): the radio call, the pit lane speed sign,
 * a plan of where the twenty crew stand, a wheel with its single nut, and
 * the release light with the stationary time.
 */

const BARS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Where the crew stand, the car seen from above with its nose up, in
 * percent of the plan: three at each wheel (gun, off, on), a jack at each
 * end and a spare at the front, two steadying the sides, two on the front
 * wing and one watching the lane for the release.
 */
const WHEELS = [
  [30, 26],
  [70, 26],
  [30, 72],
  [70, 72],
];
const CREW = [
  ...WHEELS.flatMap(([x, y]) => {
    const out = x < 50 ? -1 : 1;
    return [
      [x + out * 17, y, 'wheel'],
      [x + out * 11, y - 10, 'wheel'],
      [x + out * 11, y + 10, 'wheel'],
    ];
  }),
  [50, 3, 'jack'],
  [50, 97, 'jack'],
  [74, 4, 'jack'],
  [7, 49, 'side'],
  [93, 49, 'side'],
  [36, 10, 'side'],
  [64, 10, 'side'],
  [95, 90, 'release'],
];

function Radio() {
  return (
    <div className="pdeco pdeco--radio">
      <p className="pdeco__head">
        <i className="pdeco__dot" />
        Team radio
        <span className="pdeco__wave">
          {BARS.map((i) => (
            <b key={i} style={{ '--b': i }} />
          ))}
        </span>
      </p>
      <p className="pdeco__quote">“Box, box.”</p>
      <p className="pdeco__reply">
        <span>Driver</span> Copy.
      </p>
    </div>
  );
}

function SpeedSign() {
  return (
    <div className="pdeco pdeco--sign">
      <span className="pdeco__plate">Pit lane</span>
      <span className="pdeco__disc">
        <b className="t-num">80</b>
        <small>km/h</small>
      </span>
    </div>
  );
}

function CrewPlan() {
  return (
    <div className="pdeco pdeco--crew">
      <div className="pdeco__plan">
        <i className="pdeco__body" />
        {WHEELS.map(([x, y]) => (
          <i key={`${x}-${y}`} className="pdeco__tyre-top" style={{ left: `${x}%`, top: `${y}%` }} />
        ))}
        {CREW.map(([x, y, role], i) => (
          <i key={i} className="pdeco__person" data-role={role} style={{ left: `${x}%`, top: `${y}%`, '--n': i }} />
        ))}
      </div>
      <p className="pdeco__legend">
        <span data-role="wheel">12 on the wheels</span>
        <span data-role="jack">3 on the jacks</span>
        <span data-role="side">4 on the car</span>
        <span data-role="release">1 on the release</span>
      </p>
    </div>
  );
}

function Wheel() {
  return (
    <div className="pdeco pdeco--wheel">
      <span className="pdeco__wheel">
        <i className="pdeco__tyre" />
        <i className="pdeco__rim" />
        <i className="pdeco__nut" />
      </span>
      <span className="pdeco__caption">
        <b className="t-num">1</b> nut, one turn of the gun
      </span>
    </div>
  );
}

function Release() {
  return (
    <div className="pdeco pdeco--release">
      <span className="pdeco__lights">
        <i data-lamp="hold" />
        <i data-lamp="go" />
      </span>
      <p className="pdeco__board">
        <b className="t-num">2.0</b>
        <span>Seconds stationary</span>
      </p>
    </div>
  );
}

const DECO = { call: Radio, lane: SpeedSign, crew: CrewPlan, gun: Wheel, release: Release };

export default function PitDeco({ kind }) {
  const Deco = DECO[kind];
  return Deco ? (
    <div className="pdeco-wrap" aria-hidden="true">
      <Deco />
    </div>
  ) : null;
}
