import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Letters animate in once, when the board first powers. Screen readers get the aria-label.
export default function KineticHeading({ text, active, reduced }) {
  const headingRef = useRef(null)
  const played = useRef(false)

  useEffect(() => {
    if (!active || reduced || played.current || !headingRef.current) return
    played.current = true
    gsap.fromTo(
      headingRef.current.querySelectorAll('[data-letter]'),
      { yPercent: 115, rotate: 7, opacity: 0 },
      { yPercent: 0, rotate: 0, opacity: 1, stagger: 0.025, duration: 0.56, ease: 'power4.out' },
    )
  }, [active, reduced])

  const words = text.split(' ')

  return (
    <h2 ref={headingRef} aria-label={text} className="kinetic-heading">
      {words.map((word, wordIndex) => [
        <span className="kinetic-word" key={wordIndex}>
          {word.split('').map((letter, index) => (
            <span data-letter aria-hidden="true" key={index}>
              {letter}
            </span>
          ))}
        </span>,
        // The space sits between the nowrap word spans, so lines only break between words.
        wordIndex < words.length - 1 ? ' ' : null,
      ])}
    </h2>
  )
}
