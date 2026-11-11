import { createElement, memo } from 'react';

/**
 * Splits text into words and characters so CSS can stagger them. Screen
 * readers get the plain string; the pieces are hidden from them.
 * `style` picks the reveal: "rise" | "brake" | "focus" (see motion.css).
 */
function SplitText({ text, as = 'span', styleName = 'rise', className = '', stagger, delay, inView, ...rest }) {
  let i = 0;
  const words = String(text).split(' ');
  return createElement(
    as,
    {
      className: `split ${className}`,
      'data-style': styleName,
      'data-inview': inView === undefined ? undefined : String(inView),
      'aria-label': text,
      style: { '--stagger': stagger ? `${stagger}ms` : undefined, '--delay': delay ? `${delay}ms` : undefined },
      ...rest,
    },
    words.map((word, w) => (
      <span key={w} aria-hidden="true">
        <span className="split__word">
          {[...word].map((ch, c) => (
            <span key={c} className="split__ch" style={{ '--i': i++ }}>
              {ch}
            </span>
          ))}
        </span>
        {w < words.length - 1 ? ' ' : ''}
      </span>
    ))
  );
}

export default memo(SplitText);
