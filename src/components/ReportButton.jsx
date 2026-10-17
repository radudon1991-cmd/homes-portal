import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'

const REASONS = [
  'wrong_location',
  'wrong_price',
  'fake_photos',
  'already_sold',
  'misleading',
  'other',
]

// Report button for a listing. Only logged-in users can report (anti-troll),
// one report per user per listing (enforced in the database).
export default function ReportButton({ listingId }) {
  const { user } = useAuth()
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('wrong_location')
  const [details, setDetails] = useState('')
  const [state, setState] = useState('idle') // idle | sending | done | duplicate
  const [error, setError] = useState('')

  if (!user) return null

  const submit = async (e) => {
    e.preventDefault()
    setState('sending')
    setError('')
    const { error } = await supabase.from('reports').insert({
      listing_id: listingId,
      reporter_id: user.id,
      reason,
      details: details.trim(),
    })
    if (error) {
      if (error.code === '23505') setState('duplicate')
      else {
        setError(error.message)
        setState('idle')
      }
      return
    }
    setState('done')
  }

  if (state === 'done') return <p className="hint ok">{t('report_success')}</p>
  if (state === 'duplicate') return <p className="hint">{t('report_duplicate')}</p>

  return (
    <div className="report-box">
      {!open ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
          ⚠ {t('report_listing')}
        </button>
      ) : (
        <form onSubmit={submit} className="report-form">
          <strong>{t('report_title')}</strong>
          <label>
            {t('report_reason')}
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {t('reason_' + r)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('report_details')}
            <textarea
              className="input"
              rows={3}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('report_details_ph')}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              {t('report_cancel')}
            </button>
            <button className="btn btn-primary btn-sm" disabled={state === 'sending'}>
              {t('report_submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
