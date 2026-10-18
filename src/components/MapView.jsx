import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatBahtCompact, formatPrice } from '../lib/format'
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

// Pin colour by price range. The bands differ per category
// (user's spec, 2026-10-17):
//   sale:          green <=100K, blue <=500K, pink <=1M, red above
//   rent monthly:  green <=8K,   blue <=15K,  pink <=25K, red above
//   rent daily:    green <=700,  blue <=1.5K, pink <=3.5K, red above
function priceTier(listing) {
  const p = Number(listing.price_thb) || 0
  if (listing.listing_type === 'rent') {
    if (listing.rent_period === 'daily') {
      if (p <= 700) return 'tier-green'
      if (p <= 1500) return 'tier-blue'
      if (p <= 3500) return 'tier-pink'
      return 'tier-red'
    }
    if (p <= 8000) return 'tier-green'
    if (p <= 15000) return 'tier-blue'
    if (p <= 25000) return 'tier-pink'
    return 'tier-red'
  }
  if (p <= 100000) return 'tier-green'
  if (p <= 500000) return 'tier-blue'
  if (p <= 1000000) return 'tier-pink'
  return 'tier-red'
}

function pinIcon(listing, selected) {
  const cls = `price-pin ${priceTier(listing)}${selected ? ' selected' : ''}`
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

export default function MapView({ listings, selectedId, onSelect, onOpenListing }) {
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
