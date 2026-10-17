import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { dotIcon } from './MapView'

// Small map used in the "post a property" form: click anywhere to drop the pin.
export default function LocationPicker({ value, onChange }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const start = value ?? { lat: 13.7563, lng: 100.5018 }
    const map = L.map(containerRef.current).setView([start.lat, start.lng], value ? 14 : 6)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    if (value) {
      markerRef.current = L.marker([value.lat, value.lng], { draggable: true, icon: dotIcon() }).addTo(map)
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng()
        onChange({ lat: p.lat, lng: p.lng })
      })
    }
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true, icon: dotIcon() }).addTo(map)
        markerRef.current.on('dragend', () => {
          const p = markerRef.current.getLatLng()
          onChange({ lat: p.lat, lng: p.lng })
        })
      }
      onChange({ lat, lng })
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

  return <div ref={containerRef} className="picker-map" />
}
