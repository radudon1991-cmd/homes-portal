import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MapView from '../components/MapView'
import SearchBar from '../components/SearchBar'
import ListingCard from '../components/ListingCard'
import GroupChat from '../components/GroupChat'
import { fetchListings, applyFilters, dataSource } from '../lib/listings'
import { useLang } from '../lib/i18n'

const DEFAULT_FILTERS = {
  query: '',
  listingType: '',
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

  // Owner's design rule (2026-10-17): the side/bottom list shows only
  // the 5 most recent matching posts, as compact rows with square
  // thumbnails. The map still shows ALL matching pins.
  const recent = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
    [filtered]
  )

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
          <div className="map-legend">
            <span className="legend-row">
              <span className="legend-item"><span className="legend-dot pin-sale" />{t('buy')}</span>
              <span className="legend-item"><span className="legend-dot pin-rent" />{t('rent')}</span>
            </span>
          </div>
        </div>
        <aside className="home-panel">
          <div className="panel-head">
            {loading ? t('loading') : `${filtered.length} ${filtered.length === 1 ? t('property_one') : t('property_many')}`}
            {error && <span className="error-text"> ({error})</span>}
          </div>
          <div className="panel-list">
            {recent.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                selected={l.id === selectedId}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <p className="empty">{t('no_results')}</p>
            )}
            {!loading && filtered.length > recent.length && (
              <p className="panel-note">{t('showing_recent_5', { count: filtered.length })}</p>
            )}
          </div>
        </aside>
      </div>
      <GroupChat />
    </div>
  )
}
