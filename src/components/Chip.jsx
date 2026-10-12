import { useState } from 'react'
import { scatter } from './scatter.js'

// The link stays out of the DOM until the reveal: several URLs carry the owner's handle.
export default function Chip({ item, revealed, index }) {
  const [open, setOpen] = useState(false)

  return (
    <article className={`chip loose-piece ${open ? 'chip-open' : ''}`} style={scatter(index)}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {item.name}
      </button>
      {open && <p>{item.pitch}</p>}
      {revealed && item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          Open ↗
        </a>
      )}
    </article>
  )
}
