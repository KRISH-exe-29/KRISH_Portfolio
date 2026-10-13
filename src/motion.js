import StringTune, { StringProgress, StringParallax, StringLerp, StringMagnetic } from '@fiddle-digital/string-tune'

// True when the visitor asked for less motion: smooth scroll and entrance animation switch off.
export const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// StringTune drives the real window scroll, so position: sticky and anime.js onScroll keep working.
// It is a singleton with no clean restart, so it starts once and is never destroyed.
let st
export function startScroll() {
  if (st) return st
  st = StringTune.getInstance()
  st.use(StringProgress)
  st.use(StringParallax)
  st.use(StringLerp)
  st.use(StringMagnetic)
  st.scrollDesktopMode = calm ? 'default' : 'smooth'
  st.scrollMobileMode = 'default'
  st.start(0)
  return st
}

export const scrollTo = (selector) => startScroll().scrollTo({ selector, offset: -72, duration: 1100 })
