const pad = (index) => String(index).padStart(2, '0')

export default function NavRail({ labels, active, onJump }) {
  return (
    <nav aria-label="Circuit boards">
      {labels.map((label, index) => (
        <button
          type="button"
          key={label}
          aria-label={`${pad(index)} ${label}`}
          aria-current={active === index ? 'step' : undefined}
          className={active === index ? 'active' : ''}
          onClick={() => onJump(index)}
        >
          {pad(index)} <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
