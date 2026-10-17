import { PROPERTY_TYPES } from '../lib/format'

const BED_OPTIONS = ['', '1', '2', '3', '4', '5']

export default function SearchBar({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="searchbar">
      <div className="searchbar-row">
        <input
          className="input search-query"
          type="text"
          placeholder="Search by area, e.g. Sukhumvit, Phuket…"
          value={filters.query}
          onChange={(e) => set('query', e.target.value)}
        />
        <div className="seg">
          <button
            type="button"
            className={filters.listingType === 'sale' ? 'seg-btn active' : 'seg-btn'}
            onClick={() => set('listingType', 'sale')}
          >
            Buy
          </button>
          <button
            type="button"
            className={filters.listingType === 'rent' ? 'seg-btn active' : 'seg-btn'}
            onClick={() => set('listingType', 'rent')}
          >
            Rent
          </button>
        </div>
      </div>
      <div className="searchbar-row searchbar-filters">
        <select className="input" value={filters.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
          <option value="">All types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Min ฿"
          value={filters.minPrice}
          onChange={(e) => set('minPrice', e.target.value)}
        />
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Max ฿"
          value={filters.maxPrice}
          onChange={(e) => set('maxPrice', e.target.value)}
        />
        <select className="input" value={filters.bedrooms} onChange={(e) => set('bedrooms', e.target.value)}>
          <option value="">Beds</option>
          {BED_OPTIONS.filter(Boolean).map((b) => (
            <option key={b} value={b}>{b}+</option>
          ))}
        </select>
        <select className="input" value={filters.bathrooms} onChange={(e) => set('bathrooms', e.target.value)}>
          <option value="">Baths</option>
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
          Clear
        </button>
      </div>
    </div>
  )
}
