// Six line drawings, one per level. Each is drawn on a 1600 x 900 sheet with the thing the
// camera flies through at the centre (800, 450).
const range = (n) => [...Array(n).keys()]

function Pylon({ x, y, s = 1, window: open }) {
  const half = (yy) => 110 - (82 * -yy) / 660 // the legs lean in towards the top
  const tier = (k) => -k * 82
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-110 0 -28 -660M110 0 28 -660M-28 -660 0 -700 28 -660" />
      {range(8).map((k) => {
        const [a, b] = [tier(k), tier(k + 1)]
        return (
          <path
            key={k}
            d={`M${-half(a)} ${a}H${half(a)}` + (k === open ? '' : `M${-half(a)} ${a}L${half(b)} ${b}M${half(a)} ${a}L${-half(b)} ${b}`)}
          />
        )
      })}
      {[5, 6, 7].map((k) => {
        const reach = 300 - k * 20
        return <path key={k} d={`M${-reach} ${tier(k)}H${reach}M${-reach} ${tier(k)}L${-half(tier(k + 1))} ${tier(k + 1)}M${reach} ${tier(k)}L${half(tier(k + 1))} ${tier(k + 1)}M${-reach} ${tier(k)}v26M${reach} ${tier(k)}v26`} />
      })}
    </g>
  )
}

// A conductor sagging between two towers.
const span = (x1, y1, x2, y2) => `M${x1} ${y1}Q${(x1 + x2) / 2} ${Math.max(y1, y2) + Math.abs(x2 - x1) * 0.16} ${x2} ${y2}`

function Grid() {
  const near = [5, 6, 7].map((k) => [300 - k * 20, 880 - k * 82 + 26])
  return (
    <>
      <path d="M0 640H1600M1090 640A90 90 0 0 1 1270 640" />
      <path className="faint" d={range(9).map((k) => `M800 640L${-800 + k * 400} 900`).join('')} />
      {near.map(([reach, y], k) => (
        <path key={k} className="hot" d={span(800 - reach, y, 250 + reach * 0.32, 640 - (5 + k) * 82 * 0.32 + 8) + span(800 + reach, y, 1350 - reach * 0.32, 640 - (5 + k) * 82 * 0.32 + 8) + span(250 - reach * 0.32, 640 - (5 + k) * 82 * 0.32 + 8, 60 + reach * 0.14, 640 - (5 + k) * 82 * 0.14) + span(1350 + reach * 0.32, 640 - (5 + k) * 82 * 0.32 + 8, 1540 - reach * 0.14, 640 - (5 + k) * 82 * 0.14)} />
      ))}
      <Pylon x={60} y={640} s={0.14} />
      <Pylon x={1540} y={640} s={0.14} />
      <Pylon x={250} y={640} s={0.32} />
      <Pylon x={1350} y={640} s={0.32} />
      <Pylon x={800} y={880} window={5} />
    </>
  )
}

function Bay() {
  return (
    <>
      <path d="M0 800H1600" />
      <path className="hot" d={range(14).map((k) => `M${k * 130 - 60} 900l70 -100`).join('')} />
      <rect x="520" y="300" width="560" height="460" />
      <path d="M520 340H1080M560 760v40M1040 760v40M520 800h80M1000 800h80" />
      {[-1, 1].map((side) => (
        <path key={side} d={range(7).map((k) => `M${800 + side * (300 + k * 26)} 360V740`).join('') + `M${800 + side * 280} 400H${800 + side * 456}M${800 + side * 280} 700H${800 + side * 456}`} />
      ))}
      {[640, 800, 960].map((x) => (
        <path key={x} d={`M${x} 300V110M${x - 8} 110h16` + range(7).map((k) => `M${x - 26 + k} ${280 - k * 22}h${52 - 2 * k}`).join('')} />
      ))}
      <path d="M1010 300V230M940 190H1180A22 22 0 0 1 1180 234H940A22 22 0 0 1 940 190" />
      <rect className="hot" x="730" y="408" width="140" height="84" />
      <path className="hot" d="M746 428h108M746 446h70M746 464h108M746 478h44" />
      <circle cx="600" cy="640" r="34" />
      <path d="M600 640l18 -22" />
    </>
  )
}

function Panel() {
  return (
    <>
      <rect x="330" y="90" width="940" height="740" />
      <path d="M800 90V830M330 150H1270M330 770H1270M770 440v60M830 440v0" />
      {[480, 1120].map((x) => (
        <g key={x}>
          <circle cx={x} cy="250" r="56" />
          <path d={`M${x - 40} 268A44 44 0 0 1 ${x + 40} 268M${x} 268l${x < 800 ? 22 : -14} -44`} />
        </g>
      ))}
      {range(9).map((k) => {
        const [cx, cy] = [680 + (k % 3) * 120, 330 + Math.floor(k / 3) * 120]
        return (
          <g key={k}>
            <circle className={k % 4 ? 'hot lamp' : 'lamp'} style={{ '--k': k }} cx={cx} cy={cy} r="26" />
            <circle cx={cx} cy={cy} r="34" />
            <rect x={cx - 34} y={cy + 44} width="68" height="14" />
          </g>
        )
      })}
      <path className="faint" d={range(8).map((k) => `M400 ${640 + k * 14}h180M1020 ${640 + k * 14}h180`).join('')} />
    </>
  )
}

function Board() {
  const pins = range(8).map((k) => 723 + k * 22)
  const run = (k) => 60 + Math.abs(k - 3.5) * 46
  return (
    <>
      <rect x="700" y="350" width="200" height="200" />
      <circle cx="722" cy="372" r="6" />
      {pins.map((p, k) => {
        const dir = p < 800 ? -1 : 1
        const n = run(k)
        const q = p - 350 // the same pin, measured down the side of the chip
        return (
          <g key={k}>
            <path className="hot" d={`M${p} 350V${300 - k * 6}l${dir * n} ${-n}V0M${p} 550V${600 + k * 6}l${dir * n} ${n}V900`} />
            <path className="hot" d={`M700 ${q}H${640 - k * 6}l${-n} ${dir * n}H0M900 ${q}H${960 + k * 6}l${n} ${dir * n}H1600`} />
            <circle cx={p + dir * n} cy={300 - k * 6 - n} r="5" />
            <circle cx={960 + k * 6 + n} cy={q + dir * n} r="5" />
          </g>
        )
      })}
      {[[240, 200], [1300, 660], [300, 700]].map(([x, y]) => <path key={x} d={`M${x} ${y}h90v34h-90zM${x - 30} ${y + 17}h30M${x + 90} ${y + 17}h30`} />)}
      <circle cx="1320" cy="210" r="46" />
      <path d="M1320 164v92M1296 190h-14M1352 190h-14M1345 183v14" />
      {[[70, 70], [1530, 70], [70, 830], [1530, 830]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="20" />)}
    </>
  )
}

function Chip() {
  const layers = [4, 6, 9, 6, 4].map((n, l) => range(n).map((k) => [400 + l * 200, 450 + (k - (n - 1) / 2) * (640 / 9)]))
  return (
    <>
      <rect x="250" y="80" width="1100" height="740" />
      <path className="faint" d={range(12).map((k) => `M${290 + k * 94} 80v-40M${290 + k * 94} 820v40`).join('')} />
      {layers.slice(0, -1).map((layer, l) => (
        <path key={l} className="faint" d={layer.map(([x, y]) => layers[l + 1].map(([x2, y2]) => `M${x} ${y}L${x2} ${y2}`).join('')).join('')} />
      ))}
      {range(4).map((l) => {
        const [a, b] = [layers[l][(l * 2 + 1) % layers[l].length], layers[l + 1][(l * 3 + 2) % layers[l + 1].length]]
        return <path key={l} className="hot pulse" style={{ '--k': l }} d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} />
      })}
      {layers.flat().map(([x, y]) => <circle key={`${x}-${y}`} className={x === 800 && y === 450 ? 'hot' : undefined} cx={x} cy={y} r="13" />)}
    </>
  )
}

function Ground() {
  return (
    <>
      <path className="hot" d="M800 0V450M620 450H980M680 500H920M740 550H860" />
      <path d={'M0 250' + range(32).map((k) => `q25 ${k % 2 ? 90 : -90} 50 0`).join('')} />
      <path className="faint" d={range(6).map((k) => `M0 ${640 + k * 46}Q800 ${600 + k * 70} 1600 ${640 + k * 46}`).join('')} />
      {[90, 170, 250].map((r) => <circle key={r} className="faint" cx="800" cy="450" r={r} />)}
    </>
  )
}

const drawings = [Grid, Bay, Panel, Board, Chip, Ground]

export function Scene({ level }) {
  const Drawing = drawings[level]
  return (
    <svg className="scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className="cam"><Drawing /></g>
    </svg>
  )
}
