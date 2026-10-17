import { useLang, TYPE_KEY } from '../lib/i18n'

const BED_OPTIONS = ['', '1', '2', '3', '4', '5']
const TYPE_VALUES = ['condo', 'house', 'townhouse', 'land']

export default function SearchBar({ filters, onChange }) {
  const { t } = useLang()
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="searchbar">
      <div className="searchbar-row">
        <input
          className="input search-query"
          type="text"
          placeholder={t('search_placeholder')}
          value={filters.query}
          onChange={(e) => set('query', e.target.value)}
        />
        <div className="seg">
          <button
            type="button"
            className={filters.listingType === 'sale' ? 'seg-btn active' : 'seg-btn'}
            onClick={() => set('listingType', 'sale')}
          >
            {t('buy')}
          </button>
          <button
            type="button"
            className={filters.listingType === 'rent' ? 'seg-btn active' : 'seg-btn'}
            onClick={() => set('listingType', 'rent')}
          >
            {t('rent')}
          </button>
        </div>
      </div>
      <div className="searchbar-row searchbar-filters">
        <select className="input" value={filters.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
          <option value="">{t('all_types')}</option>
          {TYPE_VALUES.map((v) => (
            <option key={v} value={v}>{t(TYPE_KEY[v])}</option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          min="0"
          placeholder={t('min_price')}
          value={filters.minPrice}
          onChange={(e) => set('minPrice', e.target.value)}
        />
        <input
          className="input"
          type="number"
          min="0"
          placeholder={t('max_price')}
          value={filters.maxPrice}
          onChange={(e) => set('maxPrice', e.target.value)}
        />
        <select className="input" value={filters.bedrooms} onChange={(e) => set('bedrooms', e.target.value)}>
          <option value="">{t('beds')}</option>
          {BED_OPTIONS.filter(Boolean).map((b) => (
            <option key={b} value={b}>{b}+</option>
          ))}
        </select>
        <select className="input" value={filters.bathrooms} onChange={(e) => set('bathrooms', e.target.value)}>
          <option value="">{t('baths')}</option>
          {BED_OPTIONS.filter(Boolean).map((b) => (
            <option key={b} value={b}>{b}+</option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            onChange({ query: '', listingType: 'sale', propertyType: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '' })
          }
        >
          {t('clear')}
        </button>
      </div>
    </div>
  )
}
