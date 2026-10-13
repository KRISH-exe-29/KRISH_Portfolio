import { useEffect, useRef } from 'react'
import { animate, createScope, onScroll, stagger } from 'animejs'
import Band from '../components/Band.jsx'
import { ai } from '../content.js'
import { calm } from '../motion.js'
import './Interaction.css'

export default function Interaction() {
  const side = useRef(null)

  useEffect(() => {
    if (calm) return
    const scope = createScope({ root: side }).add(() => {
      animate('.interaction-plate', {
        y: [28, 0], opacity: [0, 1], duration: 900, ease: 'out(4)', delay: stagger(90),
        autoplay: onScroll({ target: side.current, enter: 'bottom-=10% top' }),
      })
    })
    return () => scope.revert()
  }, [])

  return (
    <Band band="interaction" title="I taught the factory to answer back." lede={ai.agent.pitch}>
      <div className="interaction-grid">
        <div className="interaction-agent">
          <h3>{ai.agent.name}</h3>
          <p className="interaction-note">Each version added one capability.</p>
          <ol className="interaction-versions">
            {ai.agent.versions.map((name, i) => (
              <li key={name} className="interaction-row" style={{ '--i': i }}>
                <span className="readout">v{i + 1}</span>
                <span>{name}</span>
                <i className="interaction-bar" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </div>

        <div className="interaction-side" ref={side}>
          <article className="plate interaction-plate">
            <h3>{ai.rag.name}</h3>
            <p>{ai.rag.pitch}</p>
            <ol className="interaction-flow">
              {ai.rag.steps.map((step) => <li key={step}><span>{step}</span></li>)}
            </ol>
          </article>
          <article className="plate interaction-plate">
            <h3>{ai.browser.name}</h3>
            <p>{ai.browser.pitch}</p>
          </article>
          <article className="plate interaction-plate">
            <h3>Working with</h3>
            <p>{ai.stack.join(', ')}.</p>
          </article>
        </div>
      </div>
    </Band>
  )
}
