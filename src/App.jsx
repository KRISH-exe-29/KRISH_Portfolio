import { useEffect } from 'react'
import { startScroll } from './motion.js'
import Transformer from './three/Transformer.jsx'
import Chrome from './components/Chrome.jsx'
import Guide from './components/Guide.jsx'
import Hero from './components/Hero.jsx'
import Wake from './components/Wake.jsx'
import Guides from './sections/Guides.jsx'
import Hub from './sections/Hub.jsx'
import Minds from './sections/Minds.jsx'
import Ship from './sections/Ship.jsx'
import Record from './sections/Record.jsx'
import Outro from './sections/Outro.jsx'
import './components/shell.css'

// Krish.exe: a StringTune-style tour of one engineer, guided by a pixel foreman.
export default function App() {
  useEffect(() => {
    startScroll()
    // The wordmark in the header appears once the hero's giant one has scrolled away.
    const mark = () => document.documentElement.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.6)
    window.addEventListener('scroll', mark, { passive: true })
    mark()
    return () => window.removeEventListener('scroll', mark)
  }, [])

  return (
    <>
      <Transformer />
      <Chrome />
      <main>
        <Hero />
        <Wake />
        <Guides />
        <Hub />
        <Minds />
        <Ship />
        <Record />
        <Outro />
        <p className="credit caption quiet">
          Music: Ishikari Lore by <a href="https://incompetech.com/" target="_blank" rel="noopener noreferrer">Kevin MacLeod</a>,{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
        </p>
      </main>
      <Guide />
    </>
  )
}
