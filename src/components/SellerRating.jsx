import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'

// Shows a seller's average rating; lets a logged-in buyer rate them
// (one rating per rater per seller — update to change it).
export default function SellerRating({ sellerId }) {
  const { user } = useAuth()
  const { t } = useLang()
  const [ratings, setRatings] = useState([])
  const [myRating, setMyRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('ratings')
      .select('rating, rater_id')
      .eq('seller_id', sellerId)
      .then(({ data }) => setRatings(data ?? []))
  }, [sellerId])

  const avg = ratings.length
    ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
    : null
  const alreadyRated = user && ratings.some((r) => r.rater_id === user.id)
  const canRate = user && user.id !== sellerId

  const submit = async (e) => {
    e.preventDefault()
    if (!myRating) return
    setError('')
    const { error } = await supabase.from('ratings').upsert(
      {
        seller_id: sellerId,
        rater_id: user.id,
        rating: myRating,
        comment: comment.trim(),
      },
      { onConflict: 'seller_id,rater_id' }
    )
    if (error) setError(error.message)
    else {
      setSent(true)
      const { data } = await supabase
        .from('ratings')
        .select('rating, rater_id')
        .eq('seller_id', sellerId)
      setRatings(data ?? [])
    }
  }

  return (
    <div className="seller-rating">
      <h3>{t('seller_rating')}</h3>
      {avg == null ? (
        <p className="hint">{t('no_ratings')}</p>
      ) : (
        <p className="rating-avg">
          ★ {avg.toFixed(1)}{' '}
          <span className="hint">
            ({ratings.length} {t('reviews')})
          </span>
        </p>
      )}
      {canRate && !sent && (
        <form onSubmit={submit}>
          <div className="stars" role="radiogroup" aria-label={t('rate_seller')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= myRating ? 'star on' : 'star'}
                onClick={() => setMyRating(n)}
                aria-label={`${n}`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('rating_comment_ph')}
          />
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-ghost btn-sm" disabled={!myRating}>
            {alreadyRated ? t('rating_update') : t('rating_submit')}
          </button>
        </form>
      )}
      {sent && <p className="hint ok">{t('rating_thanks')}</p>}
    </div>
  )
}
