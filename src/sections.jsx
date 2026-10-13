// Every fact block, read straight from content.js. Styling belongs to the concept, not here.
import { me, numbers, experience, apps, sideProjects, ai, awards, leadership, certifications, skills, field } from './content.js'

const out = { target: '_blank', rel: 'noopener noreferrer' }

export function Numbers() {
  return (
    <ul className="numbers">
      {numbers.map((n) => <li key={n.unit}><b>{n.value}</b> <span>{n.unit}</span> <small>{n.label}</small></li>)}
    </ul>
  )
}

// Photo sets from content.js, one block per set. `only` picks a single set by id.
export function Field({ only }) {
  return field.filter((f) => !only || f.id === only).map((f) => (
    <article className="field" key={f.id}>
      <h3>{f.title}</h3>
      <p className="where">{f.when}</p>
      <p className="say">{f.text}</p>
      <div className="shots">
        {f.photos.map((p) => (
          <figure key={p.src} className={p.wide ? 'full' : undefined}>
            <img src={p.src} alt={p.alt} loading="lazy" />
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </article>
  ))
}

export function Jobs() {
  return (
    <ol className="jobs">
      {experience.map((e, i) => (
        <li key={e.id} style={{ '--i': i }}>
          <p className="when">{e.year}</p>
          <h3>{e.company}</h3>
          <p className="meta">{e.role}, {e.place}</p>
          <p>{e.text}</p>
          {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" />}
        </li>
      ))}
    </ol>
  )
}

export function Links({ items, className = 'apps' }) {
  return (
    <ul className={className}>
      {items.map((a, i) => (
        <li key={a.name} style={{ '--i': i }} data-live={a.url ? '' : undefined}>
          {a.url ? <a href={a.url} {...out}>{a.name}</a> : <b>{a.name}</b>}
          <span>{a.pitch}</span>
        </li>
      ))}
    </ul>
  )
}
export const Apps = () => <Links items={apps} />
export const SideProjects = () => <Links items={sideProjects} className="apps side" />

export function Agent() {
  return (
    <div className="agent">
      <h3>{ai.agent.name}</h3>
      <p>{ai.agent.pitch}</p>
      <ol className="versions">{ai.agent.versions.map((v, i) => <li key={v} style={{ '--i': i }}>{v}</li>)}</ol>
    </div>
  )
}

export function Rag() {
  return (
    <div className="rag">
      <h3>{ai.rag.name}</h3>
      <p>{ai.rag.pitch}</p>
      <ol className="steps">{ai.rag.steps.map((s) => <li key={s}>{s}</li>)}</ol>
    </div>
  )
}

export function BrowserAI() {
  return (
    <div className="browser-ai">
      <h3>{ai.browser.name}</h3>
      <p>{ai.browser.pitch}</p>
      <p className="stack">{ai.stack.join(', ')}</p>
    </div>
  )
}

export function Awards() {
  return (
    <ul className="awards">
      {awards.map((a) => (
        <li key={a.title}>
          <p className="when">{a.year}</p>
          <h3>{a.title}</h3>
          <p>{a.detail}</p>
          {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" />}
        </li>
      ))}
    </ul>
  )
}

export function Leadership() {
  return (
    <div className="lead">
      <h3>{leadership.title}</h3>
      <p>{leadership.text}</p>
      <div className="photos">
        {leadership.photos.map((p) => <img key={p.src} src={p.src} alt={p.alt} loading="lazy" />)}
      </div>
    </div>
  )
}

export function Certifications() {
  return (
    <div className="certs">
      <h3>Certifications</h3>
      <ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
    </div>
  )
}

export function Skills() {
  return (
    <dl className="skills">
      {Object.entries(skills).map(([group, list]) => (
        <div key={group}><dt>{group}</dt><dd>{list.join(', ')}</dd></div>
      ))}
    </dl>
  )
}

export function Contact() {
  return (
    <p className="contact">
      <a href={`mailto:${me.email}`}>{me.email}</a>
      <a href={me.resume} download>Download resume</a>
      <a href={me.linkedin} {...out}>LinkedIn</a>
      <a href={me.github} {...out}>GitHub</a>
    </p>
  )
}
