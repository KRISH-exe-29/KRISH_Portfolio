import { ai, apps, building, awards, certifications, experience, field, leadership, me, numbers } from '../content.js'
import Chip from './Chip.jsx'
import KineticHeading from './KineticHeading.jsx'
import { scatter } from './scatter.js'

const external = { target: '_blank', rel: 'noopener noreferrer' }

function PowerOn() {
  return (
    <>
      <p className="caption">SYSTEM // STANDBY</p>
      <h1>
        ENERGISE
        <br />
        THE SIGNAL
      </h1>
      <p>Scroll to send one electron through seven boards.</p>
    </>
  )
}

function Source() {
  return (
    <div className="loose-grid">
      {experience.slice(0, 4).map((item, index) => (
        <article className="fact loose-piece" style={scatter(index, 10)} key={item.id}>
          <b>{item.year}</b>
          <strong>{item.company}</strong>
          <span>{item.short}</span>
          {/* Only the railway photo is anonymous; the others wait for the reveal. */}
          {item.id === 'railway' && <img src={item.photo} alt={item.photoAlt} />}
        </article>
      ))}
    </div>
  )
}

function IndoTech({ revealed }) {
  const role = experience[4]
  return (
    <>
      <p className="caption">
        {role.role}
        {' // '}
        {role.company}
      </p>
      <p>{role.text}</p>
      <div className="chip-field">
        {apps.map((item, index) => (
          <Chip key={item.name} item={item} index={index} revealed={revealed} />
        ))}
      </div>
      {building.map((b) => (
        <p key={b.name} className="caption">Now building{' // '}{b.name}: {b.pitch} {b.status}.</p>
      ))}
    </>
  )
}

function Processor() {
  const facts = [
    { badge: String(ai.agent.versions.length), title: ai.agent.name, text: ai.agent.pitch },
    { title: ai.rag.name, text: ai.rag.steps.join(' → ') },
    { title: ai.browser.name, text: ai.browser.pitch },
    { title: 'Stack', text: ai.stack.join(' · ') },
  ]
  return (
    <div className="loose-grid">
      {facts.map((fact, index) => (
        <article className="fact loose-piece" style={scatter(index, 20)} key={fact.title}>
          {fact.badge && <b>{fact.badge}</b>}
          <strong>{fact.title}</strong>
          <span>{fact.text}</span>
        </article>
      ))}
    </div>
  )
}

function Signal() {
  return (
    <>
      <div className="numbers">
        {numbers.map((item, index) => (
          <article className="loose-piece" style={scatter(index, 30)} key={item.label}>
            <b>{item.value}</b>
            <em>{item.unit}</em>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
      <div className="awards">
        {awards.map((item) => (
          <p key={item.title}>
            <b>{item.year}</b> {item.title} — {item.detail}
          </p>
        ))}
      </div>
    </>
  )
}

function Amplifier() {
  return (
    <>
      <article className="fact leadership">
        <strong>{leadership.title}</strong>
        <span>{leadership.text}</span>
      </article>
      <div className="certs">
        {certifications.map((item, index) => (
          <span className="loose-piece" style={scatter(index, 40)} key={item}>
            {item}
          </span>
        ))}
      </div>
    </>
  )
}

function OutputPending() {
  return (
    <>
      <h2>
        OUTPUT
        <br />
        PENDING.
      </h2>
      <p className="caption">Complete the circuit to unlock this board.</p>
    </>
  )
}

// Photo sets from content.js, one block per set. `only` picks a single set by id.
function Field({ only }) {
  return field.filter((f) => !only || f.id === only).map((f) => (
    <article className="field" key={f.id}>
      <h3>{f.title}</h3>
      <p className="where">{f.when}</p>
      <p className="say">{f.text}</p>
      {f.link && <a href={f.link.url} target="_blank" rel="noopener noreferrer">{f.link.label} ↗</a>}
      <div className="shots">
        {f.photos.map((p) => (
          <figure key={p.src}>
            <img src={p.src} alt={p.alt} loading="lazy" />
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </article>
  ))
}

// Rendered only after the reveal: this is the first place identity enters the DOM.
function Output() {
  const photos = [
    ...leadership.photos,
    ...awards.filter((item) => item.photo).map((item) => ({ src: item.photo, alt: item.photoAlt })),
  ]
  return (
    <>
      <p className="caption">CIRCUIT CLOSED // 06</p>
      <h2>{me.name}</h2>
      <div className="output">
        <img src={me.portrait} alt={`${me.name} portrait`} />
        <div>
          <strong>{me.role}</strong>
          <p>{me.city}</p>
          <a href={`mailto:${me.email}`}>{me.email}</a>
          <a href={me.linkedin} {...external}>
            LinkedIn ↗
          </a>
          <a href={me.github} {...external}>
            GitHub ↗
          </a>
          <a href={me.resume} {...external}>
            Resume ↗
          </a>
          <p>{me.lines[0]}</p>
        </div>
      </div>
      <div className="reveal-photos">
        {photos.map((photo) => (
          <img key={photo.src} src={photo.src} alt={photo.alt} />
        ))}
      </div>
      <Field />
      <div className="unlocked-apps">
        {apps
          .filter((item) => item.url)
          .map((item) => (
            <a key={item.name} href={item.url} {...external}>
              {item.name} ↗
            </a>
          ))}
      </div>
    </>
  )
}

const headlines = [null, 'FROM THE SOURCE', 'FACTORY FREQUENCY', 'THINKING IN CIRCUITS', 'PROOF OF SIGNAL', 'TURN IT UP']
const bodies = [null, Source, IndoTech, Processor, Signal, Amplifier]

export default function BoardCopy({ index, powered, revealed, reduced }) {
  if (index === 0) return <PowerOn />
  if (index === 6) return revealed ? <Output /> : <OutputPending />
  const Body = bodies[index]
  return (
    <>
      <KineticHeading text={headlines[index]} active={powered} reduced={reduced} />
      <Body revealed={revealed} />
    </>
  )
}
