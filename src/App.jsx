import { useEffect } from 'react'
import { startScroll } from './motion.js'
import Trace from './components/Trace.jsx'
import Chrome from './components/Chrome.jsx'
import Hero from './components/Hero.jsx'
import Core from './sections/Core.jsx'
import Windings from './sections/Windings.jsx'
import Interaction from './sections/Interaction.jsx'
import Leads from './sections/Leads.jsx'
import './components/shell.css'

// One page, one sweep: the hero at 20 Hz, then four bands up to 2 MHz.
export default function App() {
  useEffect(() => {
    startScroll()
  }, [])

  return (
    <>
      <Trace />
      <Chrome />
      <main>
        <Hero />
        <Core />
        <Windings />
        <Interaction />
        <Leads />
        <p className="credit readout">
          Music: Floating Cities by <a href="https://incompetech.com/" target="_blank" rel="noopener noreferrer">Kevin MacLeod</a>,{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
        </p>
      </main>
    </>
  )
}
