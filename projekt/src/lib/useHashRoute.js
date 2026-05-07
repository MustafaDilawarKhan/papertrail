import { useEffect, useState } from 'react'

export function normalizeHash(hash) {
  if (!hash || hash === '#') return '/'
  return hash.replace(/^#/, '') || '/'
}

export function navigate(to) {
  window.location.hash = to.startsWith('#') ? to : `#${to}`
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => normalizeHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => setRoute(normalizeHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) navigate('/landing')
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
