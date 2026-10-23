import { useContext, useRef } from 'react'
import { apps, experience, numbers, ai } from './content.js'
import { covers, slug } from './covers.js'
import { GLContext, Media, Roll, Magnetic, usePageMotion, ext } from './ui.jsx'
import { Contact, linkKind } from './Index.jsx'

const pad = (n) => String(n).padStart(2, '0')
const job = experience.find((e) => e.id === 'indotech')

// Facts from content.js that belong to a specific app.
const notes = {
  'Dispatch Management': [`${numbers[1].value} ${numbers[1].unit} ${numbers[1].label}.`],
  'Fasteners Automation': [`${numbers[2].value} ${numbers[2].unit} ${numbers[2].label}.`],
  'Job Lens': [ai.browser.pitch],
}

const linkLabel = { Source: 'Source on GitHub', Live: 'Open the live app', Internal: 'No public link' }

export default function Project({ index }) {
  const root = useRef(null)
  const stage = useContext(GLContext)
  usePageMotion(root, true, index)
  const app = apps[index]
  const cv = covers()
  const nextI = (index + 1) % apps.length
  const next = apps[nextI]
  const kind = linkKind(app.url)

  return (
    <div ref={root} className="view project">
      <div className="project__top mono">
        <a href="#/" data-cursor="Index" className="back">
          <Roll>Back to the index</Roll>
        </a>
        <span>
          {pad(index + 1)} / {pad(apps.length)}
        </span>
      </div>

      <h1 className="project__title" data-title>
        {app.name}
      </h1>

      <dl className="meta">
        <div data-fade>
          <dt className="mono">Built at</dt>
          <dd>{job.company}</dd>
        </div>
        <div data-fade>
          <dt className="mono">Role</dt>
          <dd>{job.role}</dd>
        </div>
        <div data-fade>
          <dt className="mono">Status</dt>
          <dd>In production, one of {numbers[0].value}</dd>
        </div>
        <div data-fade>
          <dt className="mono">Link</dt>
          <dd>
            {app.url ? (
              <a href={app.url} {...ext} data-cursor="Visit" className="inline">
                {linkLabel[kind]}
              </a>
            ) : (
              linkLabel[kind]
            )}
          </dd>
        </div>
      </dl>

      <Media className="project__cover" src={cv[index].url} glSrc={cv[index].canvas} alt={`Cover for ${app.name}: ${app.pitch}`} />

      <div className="project__body">
        <p className="project__pitch" data-split>
          {app.pitch}
        </p>
        <div className="project__notes">
          {(notes[app.name] || []).map((n) => (
            <p key={n} data-fade>
              {n}
            </p>
          ))}
          <p data-fade className="mono project__context">
            {job.short}
          </p>
          {app.url && (
            <Magnetic>
              <a className="pill pill--solid" href={app.url} {...ext} data-cursor="Visit">
                <Roll>{linkLabel[kind]}</Roll>
              </a>
            </Magnetic>
          )}
        </div>
      </div>

      <nav className="next" aria-label="Next project">
        <a
          href={`#/work/${slug(next.name)}`}
          className="next__link"
          data-cursor="Next"
          onPointerEnter={() => stage?.previewShow(cv[nextI].canvas)}
          onPointerLeave={() => stage?.previewHide()}
        >
          <span className="mono">Next, {pad(nextI + 1)} / {pad(apps.length)}</span>
          <span className="next__name">{next.name}</span>
          <span className="next__pitch">{next.pitch}</span>
        </a>
        <ol className="next__all mono" aria-label="All apps">
          {apps.map((a, i) => (
            <li key={a.name}>
              <a href={`#/work/${slug(a.name)}`} aria-current={i === index ? 'page' : undefined}>
                {pad(i + 1)} {a.name}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Contact />
    </div>
  )
}
