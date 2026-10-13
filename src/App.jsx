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
      </main>
    </>
  )
}
