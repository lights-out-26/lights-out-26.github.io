import { setSound, useSound } from '../lib/sound';
import { t } from '../lib/lang';
import './SoundToggle.css';

/** On/off for the engine sounds. Off until the viewer turns it on. */
export default function SoundToggle({ className = '' }) {
  const on = useSound();
  return (
    <button
      type="button"
      className={`soundtoggle ${className}`}
      aria-pressed={on}
      aria-label={t(on ? 'Turn engine sound off' : 'Turn engine sound on')}
      title={t(on ? 'Sound on' : 'Sound off')}
      onClick={() => setSound(!on)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
        {on ? (
          <>
            <path className="soundtoggle__wave" d="M15.5 9a4.2 4.2 0 0 1 0 6" />
            <path className="soundtoggle__wave soundtoggle__wave--2" d="M18 6.5a7.8 7.8 0 0 1 0 11" />
          </>
        ) : (
          <path className="soundtoggle__wave" d="M15.5 9.5l5 5m0-5l-5 5" />
        )}
      </svg>
      <span className="soundtoggle__text">{t(on ? 'Sound on' : 'Sound off')}</span>
    </button>
  );
}
