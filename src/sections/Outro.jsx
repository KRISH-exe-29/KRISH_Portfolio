import { me } from '../content.js'
import './Outro.css'

const out = { target: '_blank', rel: 'noopener noreferrer' }

export default function Outro() {
  return (
    <section id="contact" className="chapter outro" data-string="progress" data-string-id="outro">
      <p className="caption">Attribute driven. No meetings until you truly need one.</p>
      <h2 className="blur-in" data-string="split|progress" data-string-split="word|char">Hand me your worst spreadsheet.</h2>
      <p className="lede">{me.lines[1]}</p>

      <div className="outro-links">
        <a className="pill hot" href={`mailto:${me.email}`}>{me.email}</a>
        <a className="pill" href={me.linkedin} {...out}>LinkedIn</a>
        <a className="pill" href={me.github} {...out}>GitHub</a>
        <a className="pill" href={me.resume} download>Download resume</a>
      </div>

      <p className="giant outro-mark" aria-hidden="true">Krish.exe<sup>©</sup></p>

      <ul className="outro-foot">
        <li className="caption quiet">{me.name} product</li>
        <li className="caption quiet">{me.city}</li>
        <li className="caption quiet">For transformers and the software around them</li>
        <li className="caption quiet">&apos;26</li>
      </ul>
    </section>
  )
}
