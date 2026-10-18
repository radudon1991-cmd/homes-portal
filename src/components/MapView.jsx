import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatBahtCompact, formatPrice, provinceBounds } from '../lib/format'
import { useLang } from '../lib/i18n'
import { createBaseLayer } from '../lib/mapTiles'

// A simple round dot pin (avoids Leaflet's default image assets under Vite).
export function dotIcon() {
  return L.divIcon({
    className: 'loc-dot-wrap',
    html: '<div class="loc-dot"></div>',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// Pin colour is simply the listing kind (owner's simplification,
// 2026-10-18): SALE pins are blue, RENT pins are green. The whole
// price-range colour system was removed so every pin can share one
// map without a Buy/Rent mode switch.
function pinIcon(listing, selected) {
  const cls = `price-pin ${listing.listing_type === 'rent' ? 'pin-rent' : 'pin-sale'}${selected ? ' selected' : ''}`
  return L.divIcon({
    className: 'price-pin-wrap',
    html: `<div class="${cls}">${formatBahtCompact(listing.price_thb)}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// Builds the photo popup shown when a pin is tapped/clicked.
// Uses DOM APIs (textContent) so listing titles can't inject HTML.
function buildPopupEl(listing, t, onOpen) {
  const el = document.createElement('div')
  el.className = 'map-popup'
  const photo = listing.image_urls?.[0]
  if (photo) {
    const img = document.createElement('img')
    img.className = 'map-popup-photo'
    img.src = photo
    img.alt = ''
    img.loading = 'lazy'
    el.appendChild(img)
  }
  const title = document.createElement('div')
  title.className = 'map-popup-title'
  title.textContent = listing.title
  el.appendChild(title)
  const price = document.createElement('div')
  price.className = 'map-popup-price'
  price.textContent = formatPrice(listing, t)
  el.appendChild(price)
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'map-popup-link'
  btn.textContent = t('view_details')
  btn.addEventListener('click', () => onOpen(listing.id))
  el.appendChild(btn)
  return el
}

export default function MapView({ listings, selectedId, onSelect, onOpenListing, province }) {
  const { lang, t } = useLang()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tileRef = useRef(null)
  const markersRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onOpenRef = useRef(onOpenListing)
  onOpenRef.current = onOpenListing
  const tRef = useRef(t)
  tRef.current = t

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
    tileRef.current = createBaseLayer(lang).addTo(map)
  }, [lang])

  // Province lock (owner's feature, 2026-10-18): when a province
  // filter is chosen, fly to that province and fence PANNING to its
  // bounds so visitors can't drift away and lose it. Zoom in/out
  // stays completely normal. Clearing the filter removes the fence.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let timer
    if (province) {
      const b = provinceBounds(province)
      if (b) {
        const bounds = L.latLngBounds(b)
        // Fly first, clamp after: setting maxBounds while the view is
        // outside it makes Leaflet snap awkwardly mid-flight.
        map.flyToBounds(bounds, { padding: [14, 14], duration: 0.9 })
        timer = setTimeout(() => {
          map.setMaxBounds(bounds.pad(0.03))
          map.options.maxBoundsViscosity = 1.0
        }, 950)
      }
    } else {
      map.setMaxBounds(undefined)
      map.options.maxBoundsViscosity = 0
    }
    return () => clearTimeout(timer)
  }, [province])

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
        marker.bindPopup(
          () => buildPopupEl(l, tRef.current, (id) => onOpenRef.current?.(id)),
          { maxWidth: 260 },
        )
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

  return <div ref={containerRef} className="map-container" />
}
