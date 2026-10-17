// Base map tiles per interface language.
//
// Thai UI  -> standard OpenStreetMap tiles (labels in Thai, the local language).
// English UI -> Wikimedia's internationalized OSM render (labels in English).
//
// Both are free tile services that need no API key.
export function tileConfig(lang) {
  if (lang === 'th') {
    return {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  }
  return {
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Wikimedia maps',
  }
}
