import { experience, field } from '../content.js'
import './Guides.css'

const note = field[0]

export default function Guides() {
  return (
    <section id="guides" className="chapter guides">
      <div className="guides-mantra">
        <p className="caption">Automate with evidence, not overhead.</p>
        <h2 className="guides-statement blur-in" data-string="split|progress" data-string-split="word|char">To master the test bay is to master the detail.</h2>
      </div>

      <div className="guides-head">
        <h3 className="guides-head-title">Field<br />guides</h3>
        <p className="caption quiet">Five postings, oldest first</p>
      </div>

      <ol className="guides-list">
        {experience.map((job) => (
          <li key={job.id} className="guides-item" data-string="progress">
            <div className="guides-lead">
              <p className="caption guides-year">{job.year}</p>
              <h3 className="guides-title">{job.company}</h3>
              <p className="guides-short">{job.short}</p>
            </div>

            <div className="guides-body">
              <p className="guides-role">{job.role}</p>
              <p className="caption quiet">{job.place}</p>
              <p className="guides-text">{job.text}</p>
            </div>

            {job.photo && (
              <figure className="guides-photo slab">
                <img src={job.photo} alt={job.photoAlt} loading="lazy" />
              </figure>
            )}

            {job.id === 'buhler' && (
              <div className="guides-note">
                <p className="caption quiet">Notebook, {note.when}</p>
                <p className="guides-text">{note.text}</p>
                <a className="pill" href={note.link.url} target="_blank" rel="noopener noreferrer">{note.link.label}</a>
                <div className="guides-note-photos">
                  {note.photos.map((photo) => (
                    <figure key={photo.src} className="guides-note-photo slab">
                      <img src={photo.src} alt={photo.alt} loading="lazy" />
                      <figcaption className="caption quiet">{photo.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
