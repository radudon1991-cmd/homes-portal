import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n'

const RULE_KEYS = ['rule_1', 'rule_2', 'rule_3', 'rule_4', 'rule_5', 'rule_6', 'rule_7']

// Welcome message + posting rules (owner-approved draft, 2026-10-18).
// variant 'full'    — signup page: welcome title, intro, rules, outro.
// variant 'compact' — top of the post-property form: title + rules.
export default function HouseRules({ variant = 'full' }) {
  const { t } = useLang()
  if (variant === 'compact') {
    return (
      <div className="rules-box">
        <p className="rules-title">📌 {t('house_rules_title')}</p>
        <ol className="rules-list">
          {RULE_KEYS.map((k) => <li key={k}>{t(k)}</li>)}
        </ol>
        <p className="rules-more"><Link to="/terms">{t('full_terms_link')}</Link></p>
      </div>
    )
  }
  return (
    <div className="rules-box">
      <p className="rules-title">{t('welcome_title')}</p>
      <p>{t('welcome_intro')}</p>
      <ol className="rules-list">
        {RULE_KEYS.map((k) => <li key={k}>{t(k)}</li>)}
      </ol>
      <p>{t('welcome_outro')}</p>
    </div>
  )
}
