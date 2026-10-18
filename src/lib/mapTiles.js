import L from 'leaflet'

// Base map tiles per interface language.
//
// Thai UI  -> standard OpenStreetMap tiles (labels in Thai, the local language).
// English UI -> Esri World Street Map (labels in English).
//
// Both are free tile services that need no API key.
// (Wikimedia's international tiles were tried first but they block
// non-Wikimedia sites with HTTP 403, so Esri is used instead.)
export function tileConfig(lang) {
  if (lang === 'th') {
    return {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  }
  return {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.esri.com/">Esri</a>',
  }
}

// Detail mini-map engine (listing detail page): builds the base tile layer
// for the current interface language, so callers just do
// createBaseLayer(lang).addTo(map).
export function createBaseLayer(lang) {
  const tiles = tileConfig(lang)
  return L.tileLayer(tiles.url, {
    attribution: tiles.attribution,
  })
}
