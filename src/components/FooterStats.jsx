import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useLang } from '../lib/i18n'

// Footer stats line: total registered members + members active in
// the last 30 days (from profiles.last_active_at, migration8). The
// owner asked for this (2026-10-17) to know when the free plan needs
// upgrading; it also works as social proof for visitors.
export default function FooterStats() {
  const { t, lang } = useLang()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_active_at', since),
    ]).then(([total, active]) => {
      if (cancelled) return
      if (total.count != null) {
        setStats({ total: total.count, active: active.count ?? 0 })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!stats) return null
  const fmt = (n) => n.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')
  return (
    <span className="footer-stats">
      {' · '}
      {t('stats_members', { count: fmt(stats.total) })}
      {' · '}
      {t('stats_active', { count: fmt(stats.active) })}
    </span>
  )
}
