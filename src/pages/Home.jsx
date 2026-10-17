import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MapView from '../components/MapView'
import SearchBar from '../components/SearchBar'
import ListingCard from '../components/ListingCard'
import { fetchListings, applyFilters, dataSource } from '../lib/listings'
import { useLang } from '../lib/i18n'

const DEFAULT_FILTERS = {
  query: '',
  listingType: 'sale',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
}

export default function Home() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchListings().then(({ data, error }) => {
      if (error) setError(error.message)
      else setListings(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => applyFilters(listings, filters), [listings, filters])

  return (
    <div className="home">
      <SearchBar filters={filters} onChange={setFilters} />
      {dataSource === 'demo' && (
        <div className="demo-banner">
          {t('demo_banner')}
        </div>
      )}
      <div className="home-main">
        <div className="home-map">
          <MapView
            listings={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onOpenListing={(id) => navigate(`/listing/${id}`)}
          />
        </div>
        <aside className="home-panel">
          <div className="panel-head">
            {loading ? t('loading') : `${filtered.length} ${filtered.length === 1 ? t('property_one') : t('property_many')}`}
            {error && <span className="error-text"> ({error})</span>}
          </div>
          <div className="panel-list">
            {filtered.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                selected={l.id === selectedId}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <p className="empty">{t('no_results')}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
