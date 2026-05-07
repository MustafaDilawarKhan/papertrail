import React from 'react'
import { navigate } from '../lib/useHashRoute'

export function Icon({ name, className = '', filled = false, size }) {
  const style = {
    fontSize: size ? `${size}px` : undefined,
    fontVariationSettings: filled ? "'FILL' 1" : undefined,
  }
  return <span className={`material-symbols-outlined ${className}`.trim()} style={style}>{name}</span>
}

export function Link({ to, children, className = '', onClick, ...rest }) {
  const href = to.startsWith('#') ? to : `#${to}`
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (onClick) onClick(event)
        if (!event.defaultPrevented) {
          event.preventDefault()
          navigate(to)
        }
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

export function Brand({ small = false, admin = false }) {
  return (
    <Link to="/landing" className="brand">
      <span className={`brand-wordmark ${small ? 'brand-wordmark-small' : ''}`}>Aid</span>
      {admin ? <span className="brand-pill">Admin</span> : <span className="brand-subtitle">AI Research</span>}
    </Link>
  )
}

export function Toggle({ on, setOn, labelOn = 'On', labelOff = 'Off' }) {
  return (
    <button className={`toggle ${on ? 'toggle-on' : ''}`} onClick={() => setOn(!on)} type="button" aria-pressed={on}>
      <span className="toggle-thumb" />
      <span className="toggle-label">{on ? labelOn : labelOff}</span>
    </button>
  )
}

export function EmptyState({ icon = 'inbox', title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
