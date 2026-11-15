import { createElement, Fragment, useEffect, useState } from 'react';
import ko from '../i18n/ko';

/**
 * Language: English is the source text. t() looks the English up in
 * i18n/ko.js when Korean is on, and falls back to the English when a line
 * has no translation. The choice is remembered, like the sound switch.
 *
 * Shell calls useLang(), so a switch re-renders the whole tree; a memo'd
 * component that shows text has to call useLang() itself.
 */

const KEY = 'lo26-lang';
let lang = read();
const listeners = new Set();

function read() {
  try {
    return window.localStorage.getItem(KEY) === 'ko' ? 'ko' : 'en';
  } catch {
    return 'en';
  }
}

if (typeof document !== 'undefined') document.documentElement.lang = lang;

export const getLang = () => lang;

export function setLang(next) {
  lang = next;
  document.documentElement.lang = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* private mode: the choice lasts for this visit only */
  }
  listeners.forEach((fn) => fn(next));
}

export function useLang() {
  const [value, setValue] = useState(lang);
  useEffect(() => {
    listeners.add(setValue);
    setValue(lang);
    return () => listeners.delete(setValue);
  }, []);
  return value;
}

const missing = new Set();

/**
 * The text for `en` in the current language. `{name}` placeholders are filled
 * from `vars`; when a value is an element the result is an array for JSX.
 */
export function t(en, vars) {
  let text = en;
  if (lang === 'ko') {
    if (ko[en]) text = ko[en];
    // Figures and codes ("22 → 16") need no entry, so only text with words is reported.
    else if (import.meta.env.DEV && /[a-z]/.test(en) && !missing.has(en)) {
      missing.add(en);
      console.warn('[ko] missing:', en);
    }
  }
  if (!vars) return text;
  const parts = text.split(/\{(\w+)\}/);
  if (parts.every((p, i) => i % 2 === 0 || typeof vars[p] !== 'object')) return parts.map((p, i) => (i % 2 ? vars[p] : p)).join('');
  return parts.map((p, i) => (i % 2 ? createElement(Fragment, { key: i }, vars[p]) : p));
}

/** "A, B and C" in the current language. */
export const list = (items) => new Intl.ListFormat(lang === 'ko' ? 'ko' : 'en-GB', { type: 'conjunction' }).format(items);
