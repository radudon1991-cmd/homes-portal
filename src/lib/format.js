// Thai baht formatting helpers.

/** 24500000 -> "฿24,500,000" */
export function formatBaht(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return '฿' + Number(n).toLocaleString('en-US')
}

/** 24500000 -> "฿24.5M", 85000 -> "฿85K" (compact label for map pins) */
export function formatBahtCompact(n) {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  if (num >= 1_000_000) {
    const m = num / 1_000_000
    return '฿' + (Number.isInteger(m) ? m : m.toFixed(1)) + 'M'
  }
  if (num >= 1_000) {
    const k = num / 1_000
    return '฿' + (Number.isInteger(k) ? k : k.toFixed(0)) + 'K'
  }
  return '฿' + num
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const PROPERTY_TYPES = [
  { value: 'condo', label: 'Condo' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
]

export const LISTING_TYPES = [
  { value: 'sale', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
]

// A short list of Thai provinces for the form dropdown.
// (The full list of 77 provinces can be added later.)
export const PROVINCES = [
  'Bangkok',
  'Phuket',
  'Chiang Mai',
  'Chonburi (Pattaya)',
  'Prachuap Khiri Khan (Hua Hin)',
  'Samut Prakan',
  'Nonthaburi',
  'Pathum Thani',
  'Chiang Rai',
  'Khon Kaen',
  'Surat Thani (Koh Samui)',
  'Krabi',
  'Nakhon Ratchasima',
  'Songkhla',
]
