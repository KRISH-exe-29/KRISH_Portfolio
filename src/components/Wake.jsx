// The pinned sequence after the hero: four short lines sharpen and fade in turn while the transformer turns behind them.
const MANTRAS = ['Energise.', 'Keep scrolling.', 'The unit wakes.', 'Now listen to the hum.']

export default function Wake() {
  return (
    <section
      id="wake"
      className="wake"
      data-string="progress"
      data-string-id="wake"
      data-string-enter-el="top"
      data-string-enter-vp="top"
      data-string-exit-el="bottom"
      data-string-exit-vp="bottom"
    >
      <div className="wake-stage">
        {MANTRAS.map((line, i) => (
          <p key={line} style={{ '--i': i }} data-string="split" data-string-split="word|char">
            {line}
          </p>
        ))}
      </div>
    </section>
  )
}
