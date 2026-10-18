// Base map per interface language.
//
// Thai UI  -> standard OpenStreetMap raster tiles (labels in Thai,
//             the local language) — the classic OSM look.
// English UI -> OpenFreeMap "Bright" vector style: modelled on the
//             same classic OSM look, but labels render in
//             English/Latin letters. Served as vector tiles, so it
//             needs the MapLibre GL layer instead of L.tileLayer.
//
// Both services are free and need no API key. History: Wikimedia's
// osm-intl tiles (same look, English labels) block non-Wikimedia
// sites (HTTP 403, approval-only policy). Esri World Street Map was
// the English stand-in until the owner chose OpenFreeMap Bright on
// 2026-10-17 for a look closer to the Thai map.
//
// Two fixes were needed to make the vector map actually render:
// 1. The Bright style JSON lives on the tiles subdomain
//    (https://tiles.openfreemap.org/styles/bright); the bare
//    openfreemap.org/styles/bright path returns the site's 404 page.
// 2. maplibre-gl v6 is ESM-only and its web worker must be wired up
//    explicitly when bundling with Vite — without setWorkerUrl() the
//    map stays blank (see MapLibre's installation docs, Vite setup).
import L from 'leaflet'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import { setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

// Required once per page load, before any MapLibre map is created.
setWorkerUrl(maplibreWorkerUrl)

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Create the base layer for a Leaflet map in the given UI language. */
export function createBaseLayer(lang) {
  if (lang === 'th') {
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: OSM_ATTRIBUTION,
    })
  }
  return maplibreGL({
    style: 'https://tiles.openfreemap.org/styles/bright',
    attributionControl: {
      compact: true,
      customAttribution:
        '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> ' +
        '&copy; <a href="https://www.openmaptiles.org">OpenMapTiles</a> ' +
        OSM_ATTRIBUTION,
    },
  })
}
