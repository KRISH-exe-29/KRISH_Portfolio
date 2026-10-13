import { ai } from '../content.js'
import './Minds.css'

export default function Minds() {
  return (
    <section id="ai" className="chapter minds" data-string="progress">
      <header className="minds-head">
        <p className="caption">Modular by nature. Build small, scale sharp.</p>
        <h2 className="blur-in" data-string="split|progress" data-string-split="word|char">What it thinks with</h2>
        <p className="lede">Three ways the tools reason. Each one cites its work.</p>
      </header>

      <div className="minds-cards">
        <article className="slab minds-card">
          <h3>{ai.agent.name}</h3>
          <p className="minds-pitch">{ai.agent.pitch}</p>
          <ol className="minds-versions">
            {ai.agent.versions.map((name, i) => (
              <li key={name}>
                <span className="caption quiet">v{String(i + 1).padStart(2, '0')}</span>
                {name}
              </li>
            ))}
          </ol>
        </article>

        <article className="slab minds-card">
          <h3>{ai.rag.name}</h3>
          <p className="minds-pitch">{ai.rag.pitch}</p>
          <ol className="minds-chain">
            {ai.rag.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="slab minds-card">
          <h3>{ai.browser.name}</h3>
          <p className="minds-pitch">{ai.browser.pitch}</p>
          <div className="minds-stack">
            <p className="caption quiet">Working with</p>
            <p>{ai.stack.join(', ')}.</p>
          </div>
        </article>
      </div>
    </section>
  )
}
