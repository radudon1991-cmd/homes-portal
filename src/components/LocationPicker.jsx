import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { dotIcon } from './MapView'
import { useLang } from '../lib/i18n'
import { createBaseLayer } from '../lib/mapTiles'

// Map used in the "post a property" form. Clicking drops the pin, and
// since 2026-10-18 (user request) a search box + GPS button sit above
// it: sellers type a road / district / sub-district / landmark name
// (Thai or English, OpenStreetMap Nominatim, Thailand only) and the
// map flies there — the human still places the pin on the exact spot,
// because the pin is the truth TruePin stands for. The GPS button
// drops the pin where the seller is standing.
export default function LocationPicker({ value, onChange }) {
  const { lang, t } = useLang()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tileRef = useRef(null)
  const markerRef = useRef(null)
  const debounceRef = useRef(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [searchMsg, setSearchMsg] = useState('')

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Place (or move) the pin and report it. notify=false only for the
  // initial marker restored from an existing listing.
  const placeMarker = (lat, lng, notify = true) => {
    const map = mapRef.current
    if (!map) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true, icon: dotIcon() }).addTo(map)
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng()
        onChangeRef.current({ lat: p.lat, lng: p.lng })
      })
    }
    if (notify) onChangeRef.current({ lat, lng })
  }
  const placeMarkerRef = useRef(placeMarker)
  placeMarkerRef.current = placeMarker

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const start = value ?? { lat: 13.7563, lng: 100.5018 }
    const map = L.map(containerRef.current).setView([start.lat, start.lng], value ? 14 : 6)
    if (value) placeMarkerRef.current(value.lat, value.lng, false)
    map.on('click', (e) => {
      placeMarkerRef.current(e.latlng.lat, e.latlng.lng)
    })
    mapRef.current = map
    // Keep the map sized correctly inside the form.
    setTimeout(() => map.invalidateSize(), 200)
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Base map tiles follow the UI language (Thai labels / English labels).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (tileRef.current) map.removeLayer(tileRef.current)
    tileRef.current = createBaseLayer(lang).addTo(map)
  }, [lang])

  const runSearch = async (text) => {
    const q = (text ?? query).trim()
    if (q.length < 3) return
    setSearching(true)
    setSearchMsg('')
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=th' +
        `&accept-language=${lang === 'th' ? 'th' : 'en'}&q=${encodeURIComponent(q)}`
      const res = await fetch(url)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
      if (!data || data.length === 0) setSearchMsg(t('loc_no_results'))
    } catch {
      setResults([])
      setSearchMsg(t('loc_search_failed'))
    } finally {
      setSearching(false)
    }
  }

  const onQueryChange = (e) => {
    const v = e.target.value
    setQuery(v)
    setSearchMsg('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.trim().length >= 3) {
      debounceRef.current = setTimeout(() => runSearch(v), 500)
    } else {
      setResults([])
    }
  }

  const pickResult = (r) => {
    const lat = parseFloat(r.lat)
    const lon = parseFloat(r.lon)
    const map = mapRef.current
    if (!map || Number.isNaN(lat) || Number.isNaN(lon)) return
    if (r.boundingbox && r.boundingbox.length === 4) {
      const [south, north, west, east] = r.boundingbox.map(Number)
      map.flyToBounds(
        [
          [south, west],
          [north, east],
        ],
        { padding: [12, 12] }
      )
    } else {
      map.flyTo([lat, lon], 16)
    }
    placeMarker(lat, lon)
    setResults([])
    setQuery(r.display_name.split(',')[0])
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchMsg(t('loc_gps_unavailable'))
      return
    }
    setLocating(true)
    setSearchMsg('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude, longitude } = pos.coords
        mapRef.current?.flyTo([latitude, longitude], 17)
        placeMarker(latitude, longitude)
      },
      () => {
        setLocating(false)
        setSearchMsg(t('loc_gps_failed'))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="picker-wrap">
      <div className="picker-search">
        <input
          className="input"
          type="text"
          value={query}
          onChange={onQueryChange}
          onKeyDown={(e) => {
            // The picker lives inside the listing <form> — Enter must
            // search, never submit the whole form.
            if (e.key === 'Enter') {
              e.preventDefault()
              runSearch()
            }
          }}
          placeholder={t('loc_search_ph')}
        />
        <button type="button" className="btn btn-primary" onClick={() => runSearch()} disabled={searching}>
          {searching ? '…' : `🔍 ${t('loc_search_btn')}`}
        </button>
        <button type="button" className="btn btn-ghost" onClick={useMyLocation} disabled={locating}>
          📍 {t('loc_gps_btn')}
        </button>
      </div>
      {searchMsg && <p className="hint">{searchMsg}</p>}
      {results.length > 0 && (
        <ul className="picker-results">
          {results.map((r) => (
            <li key={r.place_id}>
              <button type="button" onClick={() => pickResult(r)}>
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div ref={containerRef} className="picker-map" />
    </div>
  )
}
