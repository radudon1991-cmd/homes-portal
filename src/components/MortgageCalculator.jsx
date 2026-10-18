import { useMemo, useState } from 'react'
import { formatBaht } from '../lib/format'
import { useLang } from '../lib/i18n'

// Mortgage estimate for SALE listings (user request, 2026-10-18,
// modelled on the Thai bank calculator he screenshotted — but live:
// every input recalculates instantly, no "calculate" button).
// Standard amortisation: M = P * r(1+r)^n / ((1+r)^n - 1), where
// r is the monthly rate and n the number of months.
// Defaults match his example: 30% down, 3% interest, 30 years.
export default function MortgageCalculator({ price }) {
  const { t } = useLang()
  const [homePrice, setHomePrice] = useState(price || 0)
  const [downPct, setDownPct] = useState(30)
  const [rate, setRate] = useState(3)
  const [years, setYears] = useState(30)

  const calc = useMemo(() => {
    const p = Math.max(0, Number(homePrice) || 0)
    const dp = Math.min(90, Math.max(0, Number(downPct) || 0))
    const down = Math.round((p * dp) / 100)
    const loan = Math.max(0, p - down)
    const r = (Number(rate) || 0) / 100 / 12
    const n = Math.max(1, Math.round(Number(years) || 1)) * 12
    const monthly =
      loan <= 0 ? 0 : r <= 0 ? loan / n : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const firstInterest = loan * r
    const firstPrincipal = Math.max(0, monthly - firstInterest)
    const totalInterest = Math.max(0, monthly * n - loan)
    return { down, loan, monthly, firstInterest, firstPrincipal, totalInterest }
  }, [homePrice, downPct, rate, years])

  const principalPct = calc.monthly > 0 ? Math.round((calc.firstPrincipal / calc.monthly) * 100) : 0
  const interestPct = calc.monthly > 0 ? 100 - principalPct : 0

  return (
    <div className="mtg-box">
      <h3 className="mtg-title">🏦 {t('mtg_title')}</h3>
      <div className="mtg-monthly">
        <span>{t('mtg_monthly')}</span>
        <strong>{formatBaht(Math.round(calc.monthly))}{t('mtg_per_month')}</strong>
      </div>
      <div className="mtg-bar">
        <div className="mtg-seg principal" style={{ width: `${principalPct}%` }} />
        <div className="mtg-seg interest" style={{ width: `${interestPct}%` }} />
      </div>
      <div className="mtg-legend">
        <span><i className="mtg-dot principal" />{t('mtg_principal')} {formatBaht(Math.round(calc.firstPrincipal))} · {principalPct}%</span>
        <span><i className="mtg-dot interest" />{t('mtg_interest')} {formatBaht(Math.round(calc.firstInterest))} · {interestPct}%</span>
      </div>
      <div className="mtg-grid">
        <label>{t('mtg_price')}
          <input className="input" type="number" min="0" value={homePrice} onChange={(e) => setHomePrice(e.target.value)} />
        </label>
        <label>{t('mtg_down_pct')}
          <input className="input" type="number" min="0" max="90" value={downPct} onChange={(e) => setDownPct(e.target.value)} />
        </label>
        <label>{t('mtg_rate')}
          <input className="input" type="number" min="0" step="0.05" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label>{t('mtg_years')}
          <input className="input" type="number" min="1" max="40" value={years} onChange={(e) => setYears(e.target.value)} />
        </label>
      </div>
      <div className="mtg-rows">
        <div><span>{t('mtg_down')}</span><strong>{formatBaht(calc.down)}</strong></div>
        <div><span>{t('mtg_loan')}</span><strong>{formatBaht(calc.loan)}</strong></div>
        <div><span>{t('mtg_total_interest')}</span><strong>{formatBaht(Math.round(calc.totalInterest))}</strong></div>
      </div>
      <p className="hint">{t('mtg_note')}</p>
    </div>
  )
}
