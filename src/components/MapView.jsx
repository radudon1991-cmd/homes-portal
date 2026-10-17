import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatBahtCompact } from '../lib/format'
import { useLang } from '../lib/i18n'
import { tileConfig } from '../lib/mapTiles'

// A simple round dot pin (avoids Leaflet's default image assets under Vite).
export function dotIcon() {
  return L.divIcon({
    className: 'loc-dot-wrap',
    html: '<div class="loc-dot"></div>',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function pinIcon(listing, selected) {
  const cls = `price-pin ${listing.listing_type === 'rent' ? 'rent' : 'sale'}${selected ? ' selected' : ''}`
  return L.divIcon({
    className: 'price-pin-wrap',
    html: `<div class="${cls}">${formatBahtCompact(listing.price_thb)}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

export default function MapView({ listings, selectedId, onSelect }) {
  const { lang } = useLang()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tileRef = useRef(null)
  const markersRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Create the map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = L.map(containerRef.current, {
      center: [13.7, 101.0],
      zoom: 6,
      scrollWheelZoom: true,
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Base map tiles follow the UI language (Thai labels / English labels).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (tileRef.current) map.removeLayer(tileRef.current)
    const tiles = tileConfig(lang)
    tileRef.current = L.tileLayer(tiles.url, {
      maxZoom: 19,
      attribution: tiles.attribution,
    }).addTo(map)
  }, [lang])

  // Sync markers with listings.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const seen = new Set()
    listings.forEach((l) => {
      if (l.latitude == null || l.longitude == null) return
      seen.add(l.id)
      const existing = markersRef.current.get(l.id)
      const selected = l.id === selectedId
      if (existing) {
        existing.setIcon(pinIcon(l, selected))
        existing.setZIndexOffset(selected ? 1000 : 0)
      } else {
        const marker = L.marker([l.latitude, l.longitude], {
          icon: pinIcon(l, selected),
          zIndexOffset: selected ? 1000 : 0,
        })
        marker.on('click', () => {
          onSelectRef.current?.(l.id)
          map.flyTo([l.latitude, l.longitude], Math.max(map.getZoom(), 13), { duration: 0.6 })
        })
        marker.addTo(map)
        markersRef.current.set(l.id, marker)
      }
    })
    // Remove markers for listings no longer present.
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }
  }, [listings, selectedId])

  // Fly to the selected listing when chosen from the side panel.
  const lastFlown = useRef(null)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId || lastFlown.current === selectedId) return
    const l = listings.find((x) => x.id === selectedId)
    if (l && l.latitude != null) {
      lastFlown.current = selectedId
      map.flyTo([l.latitude, l.longitude], Math.max(map.getZoom(), 13), { duration: 0.6 })
    }
  }, [selectedId, listings])

  return <div ref={containerRef} className="map-container" />
}
