// The tape itself, drawn in SVG. `wound` is how much tape has moved to the right-hand spool (0 to 1),
// `turn` is how far the hubs have rotated in degrees, `side` is the label showing.
const TEETH = [0, 60, 120, 180, 240, 300]
const MIN = 17 // an empty spool's radius
const MAX = 46 // a full one

function Reel({ cx, pack, turn }) {
  return (
    <g transform={`translate(${cx} 150)`}>
      <circle r={pack} className="pack" />
      <g transform={`rotate(${turn})`}>
        <circle r="15" className="hub" />
        {TEETH.map((a) => <rect key={a} x="-2" y="-15" width="4" height="6" rx="1" transform={`rotate(${a})`} className="tooth" />)}
        <circle r="6" className="spindle" />
      </g>
    </g>
  )
}

export default function Cassette({ wound, turn, side, count }) {
  // Tape is conserved: the areas of the two packs add up to the same total.
  const total = MAX * MAX + MIN * MIN
  const right = Math.sqrt(MIN * MIN + (MAX * MAX - MIN * MIN) * wound)
  const left = Math.sqrt(Math.max(MIN * MIN, total - right * right))
  return (
    <svg className="cassette" viewBox="0 0 520 330" role="img" aria-label={`A cassette, side ${side}, tape counter at ${count}`}>
      <rect x="6" y="6" width="508" height="318" rx="18" className="shell" />
      <rect x="34" y="28" width="452" height="196" rx="8" className="label" />
      <rect x="34" y="28" width="452" height="34" rx="8" className={`stripe side-${side}`} />
      <text x="56" y="54" className="side">{side}</text>
      <text x="96" y="53" className="title">KRISH · mixtape</text>
      <text x="470" y="52" className="nr" textAnchor="end">{side === 'A' ? 'the career' : 'the person'}</text>
      <text x="260" y="96" className="scrawl" textAnchor="middle">{side === 'A' ? 'songs about shipping things' : 'b-sides & after hours'}</text>
      <line x1="56" x2="464" y1="206" y2="206" className="rule" />
      <clipPath id="window">
        <rect x="150" y="110" width="220" height="82" rx="41" />
      </clipPath>
      <rect x="150" y="110" width="220" height="82" rx="41" className="window" />
      {/* The spools are only seen through the window, as on a real cassette. */}
      <g clipPath="url(#window)">
        <Reel cx={205} pack={left} turn={turn} />
        <Reel cx={315} pack={right} turn={turn * 1.3} />
      </g>
      <path d="M120 324 L148 262 H372 L400 324" className="bridge" />
      {[176, 344].map((x) => <circle key={x} cx={x} cy="296" r="9" className="hole" />)}
      {[22, 498].map((x) => [22, 308].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" className="screw" />))}
    </svg>
  )
}
