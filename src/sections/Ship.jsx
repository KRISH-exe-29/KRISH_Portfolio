import { numbers } from '../content.js'
import './Ship.css'

// "9 apps in production at Indo Tech Transformers." The rank entry reads "Rank 7 of 1500+ colleges at IIT Bombay NEC."
const sentence = ({ value, unit, label }) =>
  unit === 'rank' ? `Rank ${value} ${label}.` : `${value} ${unit} ${label}.`

export default function Ship() {
  return (
    <section id="ship" className="chapter ship" data-string="progress">
      <h2 className="sr-only">Ship</h2>
      <div className="ship-word" aria-hidden="true">
        {[...'SHIP'].map((letter) => (
          <span key={letter}>{letter}</span>
        ))}
      </div>

      <p className="caption ship-line">Your manual step is living on borrowed time.</p>

      <ol className="ship-list">
        {numbers.slice(0, 4).map((n, i) => (
          <li key={n.unit}>
            <span className="caption ship-mark">({i + 1})</span>
            <p className="blur-in" data-string="split|progress" data-string-split="word|char">{sentence(n)}</p>
          </li>
        ))}
      </ol>

      {numbers.slice(4).map((n) => (
        <p key={n.unit} className="caption quiet ship-extra">{sentence(n)}</p>
      ))}
    </section>
  )
}
