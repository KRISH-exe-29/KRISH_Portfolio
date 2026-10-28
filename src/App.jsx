import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills, asset } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const lite = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches
const MOTION = '(min-width: 800px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)'
const SONG = { src: asset('audio/fin-de-la-odisea.mp3'), title: 'FIN DE LA ODISEA' }
const LEGENDS = ['DISP', 'EPMS', 'FAST', 'IDS', 'LENS', 'KIOSK', 'RTCC', 'JOBS', 'TEST']
const NUMPAD_DIGIT = [7, 8, 9, 4, 5, 6, 1, 2, 3]
const NUMPAD = NUMPAD_DIGIT.map((d) => 'Numpad' + d)
const APP_COLORS = ['#ff6b5e', '#ffb648', '#e9ff5c', '#59ffae', '#5ce6ff', '#6f8dff', '#b27dff', '#ff72d6', '#f4f1ea']
const FONTS = [
  ['VT323', '400 16px "VT323"'],
  ['Bricolage Grotesque', '700 16px "Bricolage Grotesque"'],
  ['JetBrains Mono', '600 16px "JetBrains Mono"'],
]
const bio = snapshot.bio.split(/\r?\n/)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const codeFor = (c) => (c === ' ' ? 'Space' : 'Key' + c.toUpperCase())
const keyLabel = (e) => (e.key === ' ' ? 'space' : e.key.length === 1 ? e.key.toUpperCase() : e.key.replace('Arrow', '').toLowerCase())

// Tiny event bus so the HUD, nav and toasts re-render on their own, not the whole page.
const bus = { hud: null, nav: null, toast: null, fx: null, compose: null, inSend: false, sound: true }

// A synthesized switch: a short filtered click on top of a low thock. No file to download.
let actx = null
let noise = null
function click(strength = 1) {
  if (!bus.sound) return
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)()
    if (actx.state === 'suspended') actx.resume()
    if (!noise) {
      noise = actx.createBuffer(1, actx.sampleRate * 0.04, actx.sampleRate)
      const d = noise.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
    }
    const t = actx.currentTime
    const src = actx.createBufferSource()
    src.buffer = noise
    const bp = actx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600 + Math.random() * 900
    bp.Q.value = 1.4
    const g = actx.createGain()
    g.gain.setValueAtTime(0.32 * strength, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045)
    src.connect(bp).connect(g).connect(actx.destination)
    src.start(t)
    const o = actx.createOscillator()
    o.frequency.setValueAtTime(190, t)
    o.frequency.exponentialRampToValueAtTime(70, t + 0.07)
    const g2 = actx.createGain()
    g2.gain.setValueAtTime(0.18 * strength, t)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
    o.connect(g2).connect(actx.destination)
    o.start(t)
    o.stop(t + 0.1)
  } catch { /* no audio: the key still moves */ }
}

function openApp(i) {
  const a = apps[i]
  if (!a) return
  if (a.url) window.open(a.url, '_blank', 'noopener,noreferrer')
  else bus.toast?.({ text: `${a.name}: ${a.pitch} No public link for this one.` })
}

// ---------- pieces ----------
function Kc({ children, className = '', style, hidden }) {
  return <span className={`kc ${className}`} style={style} aria-hidden={hidden ? 'true' : undefined}>{children}</span>
}

function KeyRow({ keys, label }) {
  return (
    <p className="keyrow" aria-hidden="true">
      {keys.map((k, i) => <span key={i}>{i > 0 && <i aria-hidden="true">+</i>}<Kc>{k}</Kc></span>)}
      <span className="keyrow-label mono">{label}</span>
    </p>
  )
}

function Boot({ log, ready, onGo }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="boot" role="dialog" aria-modal="true" aria-label="Loading the keyboard" onPointerDown={() => ready && onGo()}>
      <div className="boot-screen">
        <p className="boot-head">KEYCAP BIOS 26.10 · TTY1 · {me.name.toUpperCase()} <span>{now.toLocaleTimeString('en-GB')}</span></p>
        <ol className="boot-log" aria-live="polite">
          {log.map((l) => (
            <li key={l.id}><span>{l.label}</span>{l.status !== undefined && <b className={l.status === 'ok' ? 'ok' : ''}>{l.status}</b>}</li>
          ))}
        </ol>
        <p className="boot-prompt">&gt; {ready ? 'PRESS ANY KEY' : ''}<span className="caret" /></p>
        {ready && <p className="boot-sub">any key starts the keyboard and the song</p>}
      </div>
      <button className="boot-skip" onClick={onGo} autoFocus>Skip intro <kbd>Esc</kbd></button>
      <p className="boot-foot" aria-hidden="true"><span>F1 work</span><span>NUM 1-9 apps</span><span>ENTER send</span></p>
    </div>
  )
}

function Nav() {
  const [cur, setCur] = useState('top')
  useEffect(() => { bus.nav = setCur; return () => { bus.nav = null } }, [])
  const items = [['top', 'Home'], ['apps', 'Apps'], ['work', 'Work'], ['numbers', 'Numbers'], ['github', 'GitHub'], ['send', 'Send']]
  return (
    <nav className="nav" aria-label="Sections">
      <a className="brand mono" href="#top">KEYCAP</a>
      <ol>
        {items.map(([id, label], i) => (
          <li key={id}><a href={'#' + id} className={cur === id ? 'on' : ''} aria-current={cur === id ? 'true' : undefined}><span className="kc nk" aria-hidden="true">{i + 1}</span><span className="nl">{label}</span></a></li>
        ))}
      </ol>
    </nav>
  )
}

function Hud() {
  const [s, set] = useState({ key: '', n: 0, day: null })
  useEffect(() => { bus.hud = (p) => set((o) => ({ ...o, ...p(o) })); return () => { bus.hud = null } }, [])
  return (
    <p className="hud mono" aria-hidden="true">
      {s.day
        ? <span>{fmtDate(s.day.date)} · {s.day.count} contribution{s.day.count === 1 ? '' : 's'}</span>
        : <span>last key <b>{s.key || '—'}</b> · {s.n} press{s.n === 1 ? '' : 'es'}</span>}
    </p>
  )
}

function Toast() {
  const [t, set] = useState(null)
  useEffect(() => {
    let id = 0
    bus.toast = (v) => { clearTimeout(id); set(v); id = setTimeout(() => set(null), v.keep ? 12000 : 5000) }
    return () => { bus.toast = null; clearTimeout(id) }
  }, [])
  return (
    <div className="toast" role="status" aria-live="polite">
      {t && <p>{t.text} {t.href && <a href={t.href} target="_blank" rel="noopener noreferrer">{t.label}</a>}</p>}
    </div>
  )
}

function Hero({ typed, done }) {
  return (
    <section id="top" className="hero" data-shot="hero" data-nav="top">
      <div className="hero-copy">
        <p className="eyebrow mono">KEYCAP · {me.city} · {me.field}</p>
        <h1 aria-label={me.name}><span aria-hidden="true">{typed}</span><span className={`caret ${done ? 'blink' : ''}`} aria-hidden="true" /></h1>
        <p className="lede">{bio[0]}.</p>
        <p className="sub">{me.role}. <b>Ctrl+Z for factories.</b></p>
        <p className="hint mono">Press any key. Every key on yours presses one on mine.</p>
      </div>
      <p className="scrollcue mono" aria-hidden="true"><Kc>↓</Kc> scroll, or hold space</p>
    </section>
  )
}

function Apps() {
  return (
    <section id="apps" className="apps" data-shot="apps" data-nav="apps">
      <div className="panel rise">
        <KeyRow keys={['num', '1–9']} label="the app pad" />
        <h2>{me.lines[0]}</h2>
        <p className="sub">Nine coloured keys on the right of the board, one per production app at Indo Tech Transformers. Click a key, press Numpad 1 to 9, or use the list.</p>
        <ol className="applist">
          {apps.map((a, i) => {
            const body = (
              <>
                <Kc hidden className="app" style={{ '--c': APP_COLORS[i] }}>{LEGENDS[i]}</Kc>
                <span className="app-name">{a.name}</span>
                <span className="app-pitch">{a.pitch}</span>
                <span className="app-num mono" aria-hidden="true">num {NUMPAD_DIGIT[i]}</span>
              </>
            )
            return (
              <li key={a.name} onPointerEnter={() => bus.focusApp?.(i)} onPointerLeave={() => bus.focusApp?.(-1)}>
                {a.url
                  ? <a href={a.url} target="_blank" rel="noopener noreferrer" onFocus={() => bus.focusApp?.(i)} onBlur={() => bus.focusApp?.(-1)} aria-label={`${a.name}: ${a.pitch} (opens in a new tab)`}>{body}</a>
                  : <div className="nolink">{body}</div>}
              </li>
            )
          })}
        </ol>
        {building.map((b) => (
          <p key={b.name} className="building mono"><Kc>WIP</Kc> Still on the switch tester: <b>{b.name}</b>. {b.pitch} {b.status}.</p>
        ))}
      </div>
    </section>
  )
}

function withPhantom(text) {
  const parts = text.split('Phantom')
  if (parts.length < 2) return text
  return <>{parts[0]}<kbd className="codename" title="a codename">Phantom</kbd>{parts[1]}</>
}

function Work() {
  const [on, setOn] = useState(0)
  useEffect(() => { bus.fx = setOn; return () => { bus.fx = null } }, [])
  return (
    <section id="work" className="work" data-shot="exp" data-nav="work">
      <div className="work-pin">
        <header className="work-head">
          <KeyRow keys={['F1', 'F5']} label="experience" />
          <h2>F1 to F5. One function key per job.</h2>
          <p className="sub">Every one of them taught a shortcut the long way first.</p>
          <ol className="fxbar" aria-hidden="true">
            {experience.map((x, i) => <li key={x.id} className={on === i ? 'on' : ''}><Kc className={on === i ? 'down' : ''}>F{i + 1}</Kc><span>{x.year}</span></li>)}
          </ol>
        </header>
        <div className="fxcards">
          {experience.map((x, i) => (
            <article key={x.id} className={`fxcard ${on === i ? 'on' : ''} ${i < on ? 'past' : ''}`}>
              {x.photo
                ? <img src={x.photo} alt={x.photoAlt} loading="lazy" decoding="async" />
                : <div className="fxtile" aria-hidden="true"><span>F{i + 1}</span></div>}
              <div className="fxtext">
                <p className="mono fxmeta">F{i + 1} · {x.year} · {x.place}</p>
                <h3>{x.company}</h3>
                <p className="role">{x.role}</p>
                <p className="short">{x.short}</p>
                <p>{withPhantom(x.text)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Meme({ setup, src, alt, caption, reframe }) {
  return (
    <section className="meme" data-shot="off" aria-label="Intermission">
      <p className="meme-setup">{setup}</p>
      <figure className="meme-fig">
        <img src={src} alt={alt} loading="lazy" decoding="async" />
        {caption && <figcaption className="mono">{caption}</figcaption>}
      </figure>
      <p className="meme-reframe">{reframe}</p>
    </section>
  )
}

function Numbers() {
  return (
    <section id="numbers" className="numbers" data-shot="numbers" data-nav="numbers">
      <div className="wrap">
        <KeyRow keys={['ctrl', 'shift', '#']} label="the numbers" />
        <h2 className="rise">Same keys, fewer presses.</h2>
        <ul className="numgrid">
          {numbers.map((n) => (
            <li key={n.unit} className="numkey rise">
              <b>{n.value}</b>
              <span className="mono">{n.unit}</span>
              <p>{n.label}</p>
            </li>
          ))}
        </ul>
        <ul className="deltas rise">
          <li><span className="mono">Test planning, Indo Tech</span><b>2 h → 5 min</b></li>
          <li><span className="mono">Hardware docs, Bühler</span><b>30–40 min → under 30 s</b></li>
          <li><span className="mono">Manual calculation errors</span><b>−90%</b></li>
        </ul>
      </div>
    </section>
  )
}

function More() {
  return (
    <section id="more" className="more" data-shot="hero">
      <div className="wrap stack">
        <article className="panel rise">
          <KeyRow keys={['ctrl', 'space']} label="the AI row" />
          <h2>Ctrl+Space: the AI row.</h2>
          <h3>{ai.agent.name}</h3>
          <p>{ai.agent.pitch}</p>
          <ol className="versions">
            {ai.agent.versions.map((v, i) => <li key={v}><Kc>v{i + 1}</Kc><span>{v}</span></li>)}
          </ol>
          <h3>{ai.rag.name}</h3>
          <p>{ai.rag.pitch}</p>
          <p className="combo">
            {ai.rag.steps.map((s, i) => <span key={s}>{i > 0 && <i aria-hidden="true">+</i>}<Kc>{s}</Kc></span>)}
          </p>
          <h3>{ai.browser.name}</h3>
          <p>{ai.browser.pitch}</p>
          <p className="chips">{ai.stack.map((s) => <span key={s} className="chip mono">{s}</span>)}</p>
        </article>

        <article className="panel rise">
          <h2>Macros on the side.</h2>
          <ul className="side">
            {sideProjects.map((p) => (
              <li key={p.name}>
                {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer"><b>{p.name}</b> ↗</a> : <b>{p.name}</b>}
                <span>{p.pitch}</span>
              </li>
            ))}
          </ul>
        </article>

        {field.map((f) => (
          <article key={f.id} className="panel rise">
            <p className="mono fxmeta">Field notes · {f.when}</p>
            <h2>{f.title}</h2>
            <p>{f.text}</p>
            <div className="photos two">
              {f.photos.map((p) => (
                <figure key={p.src}><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /><figcaption>{p.caption}</figcaption></figure>
              ))}
            </div>
            <p><a className="btn" href={f.link.url} target="_blank" rel="noopener noreferrer">{f.link.label} ↗</a></p>
          </article>
        ))}

        <article className="panel rise">
          <h2>Achievements unlocked.</h2>
          <ol className="awards">
            {awards.map((a) => (
              <li key={a.title}>
                <span className="mono">{a.year}</span>
                <div><b>{a.title}</b><span>{a.detail}</span></div>
                {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" decoding="async" />}
              </li>
            ))}
          </ol>
        </article>

        <article className="panel rise">
          <h2>{leadership.title}</h2>
          <p>{leadership.text}</p>
          <div className="photos three">
            {leadership.photos.map((p) => <figure key={p.src}><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /></figure>)}
          </div>
        </article>

        <article className="panel rise">
          <h2>Keymap.</h2>
          {Object.entries(skills).map(([group, list]) => (
            <div key={group} className="skillrow">
              <p className="mono">{group}</p>
              <p className="chips">{list.map((s) => <span key={s} className="kc chip-kc">{s}</span>)}</p>
            </div>
          ))}
          <h3>Certified</h3>
          <ul className="certs">{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
        </article>
      </div>
    </section>
  )
}

function GitHub({ repos, live }) {
  const best = snapshot.bestDay
  return (
    <section id="github" className="github" data-shot="github" data-nav="github">
      <div className="gh-stage">
        <KeyRow keys={['git', 'push']} label="the heatmap" />
        <h2>One key per day. Pressed by commits.</h2>
        <p className="sub">{snapshot.days.length} days, one glass key each. The taller it stands, the harder it got hit. Hover a key for its day.</p>
      </div>
      <div className="panel gh-panel rise">
        <p className="bestday"><Kc className="space">{fmtDate(best.date)}</Kc> <span><b>{best.contributionCount} contributions in one day.</b> That&apos;s the worn-out spacebar.</span></p>
        <dl className="ghstats">
          <div><dt className="mono">contributions</dt><dd>{snapshot.contributionsLastYear}</dd></div>
          <div><dt className="mono">commits</dt><dd>{snapshot.commitsLastYear}</dd></div>
          <div><dt className="mono">pull requests</dt><dd>{snapshot.prsLastYear}</dd></div>
          <div><dt className="mono">on GitHub since</dt><dd>{new Date(snapshot.joined).getUTCFullYear()}</dd></div>
        </dl>
        <blockquote className="bio">{bio.map((l) => <span key={l}>{l}</span>)}<cite className="mono">github.com/{snapshot.login}</cite></blockquote>
        <h3>Spare keycaps: {repos.length} public repos {live ? <span className="mono live">live</span> : <span className="mono">snapshot {snapshot.snapshotAt.slice(0, 10)}</span>}</h3>
        <ul className="repos">
          {repos.map((r) => (
            <li key={r.name}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="repo">
                <b>{r.name}</b>
                <span className="mono">{r.language || 'misc'}{r.stars ? ` · ★ ${r.stars}` : ''}</span>
                {r.description && <span className="desc">{r.description}</span>}
              </a>
            </li>
          ))}
        </ul>
        <p className="note mono">Last-year numbers are from the {snapshot.snapshotAt.slice(0, 10)} snapshot; the repo list refreshes from the GitHub API when it can.</p>
        <p><a className="btn" href={me.github} target="_blank" rel="noopener noreferrer">github.com/{snapshot.login} ↗</a></p>
      </div>
    </section>
  )
}

function Send() {
  const [lines, setLines] = useState([])
  const [state, setState] = useState('idle')
  const busy = useRef(false)
  const subject = 'A manual step worth a button'
  const body = "Hi Krishna,\n\nHere's a job we still do by hand:\n\n"
  const href = `mailto:${me.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  const compose = async () => {
    if (busy.current) return
    busy.current = true
    setState('down')
    click(1.2)
    const out = [`to: ${me.email}`, `subject: ${subject}`, "body: Hi Krishna, here's a job we still do by hand…", 'opening your mail app ⏎']
    setLines([])
    for (const l of out) {
      if (!calm) await wait(260)
      setLines((o) => [...o, l])
    }
    await wait(calm ? 0 : 300)
    window.location.href = href
    setState('sent')
    busy.current = false
  }
  useEffect(() => { bus.compose = compose; return () => { bus.compose = null } })
  return (
    <section id="send" className="send" data-shot="send" data-nav="send">
      <div className="panel send-panel rise">
        <KeyRow keys={['ctrl', 'c']} label="your problem" />
        <h2>Ctrl+C your problem. Ctrl+V it here.</h2>
        <p className="sub">{me.lines[1]} {me.lines[2]}</p>
        <div className="sendrow">
          <button type="button" className={`sendkey ${state === 'down' ? 'down' : ''}`} onClick={compose} style={{ backgroundImage: `url(${asset('img/pins/glass-keycap.jpg')})` }}>
            <span className="sendkey-cap">send <span aria-hidden="true">⏎</span></span>
            <span className="sendkey-hint mono">press Enter</span>
          </button>
          <pre className="compose mono" aria-live="polite">{lines.length ? lines.join('\n') : '> waiting for Enter_'}</pre>
        </div>
        <p className="plain">Or plain email: <a href={`mailto:${me.email}`}>{me.email}</a></p>
        <ul className="links">
          <li><a className="btn" href={me.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></li>
          <li><a className="btn" href={me.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a></li>
          <li><a className="btn" href={me.resume} target="_blank" rel="noopener noreferrer">Résumé (PDF) ↗</a></li>
        </ul>
        <p className="sign">{me.lines[3]}</p>
      </div>
      <footer className="foot mono">
        <p>psst: some words on this page are also shortcuts. Try typing a codename.</p>
        <p>{me.name} · {me.city} · Song: “{SONG.title}” · Some images from the owner’s Pinterest boards.</p>
      </footer>
    </section>
  )
}

// ---------- the page ----------
export default function App() {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const sceneRef = useRef(null)
  const analyserRef = useRef(null)
  const lenisRef = useRef(null)
  const [phase, setPhase] = useState(calm ? 'done' : 'boot')
  const [log, setLog] = useState([])
  const [ready, setReady] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [typed, setTyped] = useState(calm ? me.name : '')
  const [repos, setRepos] = useState(() => snapshot.repos.filter((r) => !r.fork))
  const [live, setLive] = useState(false)
  const [music, setMusic] = useMusic(() => audioRef.current, (ctx, source) => {
    const an = ctx.createAnalyser()
    an.fftSize = 256
    an.smoothingTimeConstant = 0.7
    source.connect(an)
    an.connect(ctx.destination)
    analyserRef.current = an
    sceneRef.current?.setAnalyser(an)
  })
  useEffect(() => { bus.sound = music }, [music])

  // Boot: load the real things and report them honestly.
  useEffect(() => {
    const put = (id, label, status) => setLog((l) => {
      const n = { id, label, status }
      const i = l.findIndex((x) => x.id === id)
      return i < 0 ? [...l, n] : l.map((x, j) => (j === i ? n : x))
    })
    const tick = (t, dms) => sceneRef.current?.tick(dms / 1000)
    ;(async () => {
      put('sys', `screen ${window.innerWidth}x${window.innerHeight} @ ${Math.min(2, window.devicePixelRatio || 1).toFixed(1)}x · ${lite ? 'lite' : 'full'} quality`)
      for (const [fam, spec] of FONTS) {
        put(fam, `loading font ${fam}`, '…')
        const ok = await Promise.race([document.fonts.load(spec).then((f) => f.length > 0), wait(3500).then(() => false)]).catch(() => false)
        put(fam, `loading font ${fam}`, ok ? 'ok' : 'fallback')
      }
      try {
        put('chunk', 'fetching keyboard.js + three.js', '…')
        const mod = await import('./Keyboard.js')
        put('chunk', 'fetching keyboard.js + three.js', 'ok')
        const apIn = apps.map((a, i) => ({ legend: LEGENDS[i], short: 'num ' + NUMPAD_DIGIT[i] }))
        const s = await mod.createKeyboard(canvasRef.current, {
          apps: apIn, days: snapshot.days, bestDay: snapshot.bestDay, lite, calm,
          onProgress: (n, t) => put('caps', 'building keycaps', `${n}/${t}`),
          onApp: openApp,
          onSend: () => bus.compose?.(),
          onResume: () => window.open(me.resume, '_blank', 'noopener,noreferrer'),
          onDay: (d) => bus.hud?.(() => ({ day: d })),
          onPress: () => click(),
        })
        sceneRef.current = s
        bus.focusApp = (i) => s.focusApp(i)
        if (analyserRef.current) s.setAnalyser(analyserRef.current)
        put('gl', 'compiling shaders', '…')
        await wait(16)
        s.compile()
        put('gl', 'compiling shaders', 'ok')
        gsap.ticker.add(tick)
        setSceneReady(true)
      } catch (err) {
        put('gl', `webgl unavailable (${err?.message || 'error'})`, 'text only')
      }
      put('gh', `fetching api.github.com/users/${snapshot.login}`, '…')
      try {
        const ac = new AbortController()
        const to = setTimeout(() => ac.abort(), 5000)
        const r = await fetch(`https://api.github.com/users/${snapshot.login}/repos?per_page=100&sort=pushed`, { signal: ac.signal })
        clearTimeout(to)
        const list = r.ok ? await r.json() : null
        if (!Array.isArray(list) || !list.length) throw new Error('empty')
        setRepos(list.filter((x) => !x.fork).map((x) => ({ name: x.name, description: x.description, language: x.language, stars: x.stargazers_count, url: x.html_url })))
        setLive(true)
        put('gh', `fetching api.github.com/users/${snapshot.login}`, `ok, ${list.filter((x) => !x.fork).length} repos`)
      } catch {
        put('gh', `fetching api.github.com/users/${snapshot.login}`, `offline, snapshot ${snapshot.snapshotAt.slice(0, 10)}`)
      }
      const a = audioRef.current
      put('song', `buffering song "${SONG.title}"`, '…')
      const songOk = a && (a.readyState >= 3 || await Promise.race([
        new Promise((r) => a.addEventListener('canplaythrough', () => r(true), { once: true })),
        wait(3000).then(() => false),
      ]))
      put('song', `buffering song "${SONG.title}"`, songOk ? 'ok' : 'streaming')
      put('ready', 'READY.')
      setReady(true)
    })()
    return () => { gsap.ticker.remove(tick) }
  }, [])

  // Any key (or Esc / Skip at any time) ends the boot.
  useEffect(() => {
    if (phase !== 'boot') return
    const go = (e) => {
      if (e.key === 'Escape' || (ready && !e.repeat)) setPhase('done')
    }
    window.addEventListener('keydown', go)
    return () => window.removeEventListener('keydown', go)
  }, [phase, ready])

  // After the boot: the board assembles, then types his name.
  useEffect(() => {
    if (phase !== 'done') return
    document.documentElement.classList.remove('booting')
    lenisRef.current?.start()
    requestAnimationFrame(() => ScrollTrigger.refresh())
    if (sceneReady) sceneRef.current.assemble()
    if (calm) return
    let stop = false
    ;(async () => {
      await wait(sceneReady ? 2300 : 600)
      for (let i = 1; i <= me.name.length && !stop; i++) {
        setTyped(me.name.slice(0, i))
        sceneRef.current?.tap(codeFor(me.name[i - 1]))
        click(0.8)
        await wait(me.name[i - 1] === ' ' ? 200 : 95 + Math.random() * 70)
      }
    })()
    return () => { stop = true }
  }, [phase, sceneReady])

  // Real keyboard → 3D keys, apps, the Send key and the hidden codename.
  useEffect(() => {
    let buf = ''
    let phantom = false
    const down = (e) => {
      if (phase !== 'done') return
      sceneRef.current?.down(e.code)
      if (e.repeat) return
      click()
      bus.hud?.((o) => ({ key: keyLabel(e), n: o.n + 1, day: null }))
      const app = NUMPAD.indexOf(e.code)
      if (app >= 0) openApp(app)
      if (e.code === 'Enter' && bus.inSend && (document.activeElement === document.body || !document.activeElement)) bus.compose?.()
      if (e.key.length === 1) {
        buf = (buf + e.key.toLowerCase()).slice(-7)
        if (buf === 'phantom') {
          buf = ''
          phantom = !phantom
          sceneRef.current?.phantom(phantom)
          document.documentElement.classList.toggle('phantom', phantom)
          bus.toast?.(phantom
            ? { text: 'Project: Phantom unlocked. The keyboard went invisible. The résumé key did not.', href: me.resume, label: 'Open the résumé ↗', keep: true }
            : { text: 'Phantom off. Keys are back.' })
        }
      }
    }
    const up = (e) => sceneRef.current?.up(e.code)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [phase])

  // Scroll: Lenis + ScrollTrigger drive the camera and the reveals.
  useEffect(() => {
    if (!calm) document.documentElement.classList.add('booting')
    const lenis = calm ? null : new Lenis({ lerp: 0.1 })
    lenisRef.current = lenis
    if (lenis && !calm) lenis.stop()
    const raf = (t) => lenis?.raf(t * 1000)
    lenis?.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      if (!a) return
      const el = document.querySelector(a.getAttribute('href'))
      if (!el) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(el, { duration: 1.4 })
      else el.scrollIntoView()
      history.replaceState(null, '', a.getAttribute('href'))
    }
    document.addEventListener('click', onClick)
    // lazy images change the page height: re-measure the triggers once they land
    let rid = 0
    const onLoad = (e) => { if (e.target.tagName === 'IMG') { clearTimeout(rid); rid = setTimeout(() => ScrollTrigger.refresh(), 200) } }
    document.addEventListener('load', onLoad, true)

    const ctx = gsap.context(() => {
      // the pin is created first so every trigger below it measures with the pin spacing included
      const fxUpdate = (s) => {
        sceneRef.current?.shot(null, s.progress)
        bus.fx?.(Math.min(4, Math.round(s.progress * 4)))
      }
      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        ScrollTrigger.create({ trigger: '#work', pin: '.work-pin', start: 'top top', end: () => '+=' + window.innerHeight * 4, scrub: true, refreshPriority: 1, onUpdate: fxUpdate })
      })
      mm.add('not all and ' + MOTION, () => {
        ScrollTrigger.create({ trigger: '#work', start: 'top center', end: 'bottom center', onUpdate: fxUpdate })
      })
      gsap.utils.toArray('[data-shot]').forEach((el) => {
        ScrollTrigger.create({
          trigger: el, start: 'top 55%', end: 'bottom 55%',
          onToggle: (self) => {
            if (!self.isActive) return
            const s = sceneRef.current
            const shot = el.dataset.shot
            bus.inSend = shot === 'send'
            if (el.dataset.nav) bus.nav?.(el.dataset.nav)
            if (!s) return
            s.setActive(shot !== 'off')
            if (shot !== 'off') s.shot(shot)
          },
        })
      })
      ScrollTrigger.create({ trigger: '#top', start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => sceneRef.current?.hero(s.progress) })
      if (!calm) {
        gsap.utils.toArray('.rise').forEach((el) => {
          gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0% round 18px)', y: 60 }, {
            clipPath: 'inset(0% 0% 0% 0% round 18px)', y: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onComplete: () => gsap.set(el, { clearProps: 'clipPath' }),
          })
        })
        gsap.utils.toArray('.keyrow').forEach((row) => {
          const caps = row.querySelectorAll('.kc')
          gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%', once: true } })
            .from(caps, { y: -36, opacity: 0, rotate: () => gsap.utils.random(-25, 25), duration: 0.5, stagger: 0.08, ease: 'back.out(2)' })
            .to(caps, { y: 4, duration: 0.07, stagger: 0.09, yoyo: true, repeat: 1, ease: 'power1.in' })
        })
        gsap.utils.toArray('.meme-fig img').forEach((img) => {
          gsap.fromTo(img, { clipPath: 'inset(36% 30% 36% 30% round 28px)' }, {
            clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none',
            scrollTrigger: { trigger: img, start: 'top 85%', end: 'center 55%', scrub: true },
          })
        })
      }
    })
    return () => {
      ctx.revert()
      gsap.ticker.remove(raf)
      document.removeEventListener('click', onClick)
      document.removeEventListener('load', onLoad, true)
      clearTimeout(rid)
      lenis?.destroy()
    }
  }, [])

  return (
    <>
      <a className="skiplink" href="#apps">Skip to content</a>
      <canvas ref={canvasRef} className="scene" aria-hidden="true" />
      <audio ref={audioRef} src={SONG.src} preload="auto" loop />
      <Nav />
      <button type="button" className="music mono" data-music aria-pressed={!music} onClick={() => setMusic(!music)}>
        <span className={`bars ${music ? 'on' : ''}`} aria-hidden="true"><i /><i /><i /></span>
        {music ? 'Music off' : 'Music on'}
      </button>
      <main>
        <Hero typed={typed} done={typed === me.name} />
        <Apps />
        <Work />
        <Meme
          setup="Me, watching someone retype a fastener spec sheet by hand."
          src={asset('img/pins/scared.jpg')}
          alt="A glossy red chrome figure clutching its head in horror"
          reframe="60+ specifications. One study. Straight to the CEO."
        />
        <Numbers />
        <More />
        <Meme
          setup="Monday, 9 AM. Same Excel. Same forty minutes."
          src={asset('img/pins/anya.jpg')}
          alt="Anya from Spy x Family pointing excitedly at a gym, captioned We go Jim"
          caption="we go script"
          reframe="30 to 40 minutes → under 30 seconds. And 90% of the manual calculation errors, gone."
        />
        <GitHub repos={repos} live={live} />
        <Send />
      </main>
      <Hud />
      <Toast />
      {phase === 'boot' && <Boot log={log} ready={ready} onGo={() => setPhase('done')} />}
    </>
  )
}
