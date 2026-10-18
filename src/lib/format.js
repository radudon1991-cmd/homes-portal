// Thai baht formatting helpers.

/** 24500000 -> "฿24,500,000" */
export function formatBaht(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '–'
  return '฿' + Number(n).toLocaleString('en-US')
}

/** 24500000 -> "฿24.5M", 85000 -> "฿85K" (compact label for map pins) */
export function formatBahtCompact(n) {
  const num = Number(n)
  if (Number.isNaN(num)) return '–'
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

/** Full price label for a listing: sales just the amount; rentals get a
 *  /month or /day suffix from the listing's rent_period. Needs the i18n t(). */
export function formatPrice(listing, t) {
  const base = formatBaht(listing.price_thb)
  if (listing.listing_type !== 'rent') return base
  return base + (listing.rent_period === 'daily' ? t('per_day') : t('per_month'))
}

export function formatDate(iso, lang) {
  if (!iso) return '–'
  // Thai locale gives Thai month names + Buddhist year, e.g. "17 ต.ค. 2569".
  const locale = lang === 'th' ? 'th-TH' : 'en-GB'
  return new Date(iso).toLocaleDateString(locale, {
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

// All 77 Thai provinces (owner request 2026-10-17: the short list was
// too limited). `en` is the canonical value stored in the database;
// `th` is only a display label — dropdowns and listing displays
// translate via provinceLabel() so a listing keeps ONE province value
// whichever language it was posted in.
export const PROVINCES = [
  { en: 'Bangkok', th: 'กรุงเทพมหานคร' },
  { en: 'Amnat Charoen', th: 'อำนาจเจริญ' },
  { en: 'Ang Thong', th: 'อ่างทอง' },
  { en: 'Bueng Kan', th: 'บึงกาฬ' },
  { en: 'Buriram', th: 'บุรีรัมย์' },
  { en: 'Chachoengsao', th: 'ฉะเชิงเทรา' },
  { en: 'Chai Nat', th: 'ชัยนาท' },
  { en: 'Chaiyaphum', th: 'ชัยภูมิ' },
  { en: 'Chanthaburi', th: 'จันทบุรี' },
  { en: 'Chiang Mai', th: 'เชียงใหม่' },
  { en: 'Chiang Rai', th: 'เชียงราย' },
  { en: 'Chonburi', th: 'ชลบุรี' },
  { en: 'Chumphon', th: 'ชุมพร' },
  { en: 'Kalasin', th: 'กาฬสินธุ์' },
  { en: 'Kamphaeng Phet', th: 'กำแพงเพชร' },
  { en: 'Kanchanaburi', th: 'กาญจนบุรี' },
  { en: 'Khon Kaen', th: 'ขอนแก่น' },
  { en: 'Krabi', th: 'กระบี่' },
  { en: 'Lampang', th: 'ลำปาง' },
  { en: 'Lamphun', th: 'ลำพูน' },
  { en: 'Loei', th: 'เลย' },
  { en: 'Lopburi', th: 'ลพบุรี' },
  { en: 'Mae Hong Son', th: 'แม่ฮ่องสอน' },
  { en: 'Maha Sarakham', th: 'มหาสารคาม' },
  { en: 'Mukdahan', th: 'มุกดาหาร' },
  { en: 'Nakhon Nayok', th: 'นครนายก' },
  { en: 'Nakhon Pathom', th: 'นครปฐม' },
  { en: 'Nakhon Phanom', th: 'นครพนม' },
  { en: 'Nakhon Ratchasima', th: 'นครราชสีมา' },
  { en: 'Nakhon Sawan', th: 'นครสวรรค์' },
  { en: 'Nakhon Si Thammarat', th: 'นครศรีธรรมราช' },
  { en: 'Nan', th: 'น่าน' },
  { en: 'Narathiwat', th: 'นราธิวาส' },
  { en: 'Nong Bua Lamphu', th: 'หนองบัวลำภู' },
  { en: 'Nong Khai', th: 'หนองคาย' },
  { en: 'Nonthaburi', th: 'นนทบุรี' },
  { en: 'Pathum Thani', th: 'ปทุมธานี' },
  { en: 'Pattani', th: 'ปัตตานี' },
  { en: 'Phang Nga', th: 'พังงา' },
  { en: 'Phatthalung', th: 'พัทลุง' },
  { en: 'Phayao', th: 'พะเยา' },
  { en: 'Phetchabun', th: 'เพชรบูรณ์' },
  { en: 'Phetchaburi', th: 'เพชรบุรี' },
  { en: 'Phichit', th: 'พิจิตร' },
  { en: 'Phitsanulok', th: 'พิษณุโลก' },
  { en: 'Phrae', th: 'แพร่' },
  { en: 'Phra Nakhon Si Ayutthaya', th: 'พระนครศรีอยุธยา' },
  { en: 'Phuket', th: 'ภูเก็ต' },
  { en: 'Prachinburi', th: 'ปราจีนบุรี' },
  { en: 'Prachuap Khiri Khan', th: 'ประจวบคีรีขันธ์' },
  { en: 'Ranong', th: 'ระนอง' },
  { en: 'Ratchaburi', th: 'ราชบุรี' },
  { en: 'Rayong', th: 'ระยอง' },
  { en: 'Roi Et', th: 'ร้อยเอ็ด' },
  { en: 'Sa Kaeo', th: 'สระแก้ว' },
  { en: 'Sakon Nakhon', th: 'สกลนคร' },
  { en: 'Samut Prakan', th: 'สมุทรปราการ' },
  { en: 'Samut Sakhon', th: 'สมุทรสาคร' },
  { en: 'Samut Songkhram', th: 'สมุทรสงคราม' },
  { en: 'Saraburi', th: 'สระบุรี' },
  { en: 'Satun', th: 'สตูล' },
  { en: 'Sing Buri', th: 'สิงห์บุรี' },
  { en: 'Sisaket', th: 'ศรีสะเกษ' },
  { en: 'Songkhla', th: 'สงขลา' },
  { en: 'Sukhothai', th: 'สุโขทัย' },
  { en: 'Suphan Buri', th: 'สุพรรณบุรี' },
  { en: 'Surat Thani', th: 'สุราษฎร์ธานี' },
  { en: 'Surin', th: 'สุรินทร์' },
  { en: 'Tak', th: 'ตาก' },
  { en: 'Trang', th: 'ตรัง' },
  { en: 'Trat', th: 'ตราด' },
  { en: 'Ubon Ratchathani', th: 'อุบลราชธานี' },
  { en: 'Udon Thani', th: 'อุดรธานี' },
  { en: 'Uthai Thani', th: 'อุทัยธานี' },
  { en: 'Uttaradit', th: 'อุตรดิตถ์' },
  { en: 'Yala', th: 'ยะลา' },
  { en: 'Yasothon', th: 'ยโสธร' },
]

/** Display label for a stored province value in the current language.
 *  Unknown/legacy values (e.g. 'Chonburi (Pattaya)') pass through as-is. */
export function provinceLabel(value, lang) {
  if (!value) return value
  const p = PROVINCES.find((x) => x.en === value)
  if (!p) return value
  return lang === 'th' ? p.th : p.en
}

// Map bounds [south, west, north, east] per province, computed from
// GADM ADM1 boundary data — the map flies to and locks onto these
// when a province filter is chosen (owner's feature, 2026-10-18).
export const PROVINCE_BOUNDS = {
  "Bangkok": [13.4931, 100.32, 13.9542, 100.939],
  "Amnat Charoen": [15.5354, 104.4211, 16.2824, 105.0628],
  "Ang Thong": [14.4362, 100.1955, 14.8008, 100.5167],
  "Bueng Kan": [17.7671, 103.2471, 18.4467, 104.1926],
  "Buriram": [14.1295, 102.4335, 15.794, 103.5067],
  "Chachoengsao": [13.1774, 100.8501, 13.9756, 101.9903],
  "Chai Nat": [14.9021, 99.7169, 15.4166, 100.3547],
  "Chaiyaphum": [15.3141, 101.3182, 16.7297, 102.4608],
  "Chanthaburi": [12.2853, 101.6868, 13.3346, 102.5356],
  "Chiang Mai": [17.2727, 98.0098, 20.1442, 99.5739],
  "Chiang Rai": [18.9976, 99.2602, 20.4631, 100.5798],
  "Chonburi": [12.5079, 100.6473, 13.5989, 101.7201],
  "Chumphon": [9.6011, 98.6268, 11.0328, 99.5197],
  "Kalasin": [16.18, 103.1002, 17.0997, 104.2431],
  "Kamphaeng Phet": [15.8566, 98.9873, 16.9074, 100.0568],
  "Kanchanaburi": [13.7249, 98.1838, 15.6595, 99.8779],
  "Khon Kaen": [15.6305, 101.7497, 17.0874, 103.1881],
  "Krabi": [7.3998, 98.6114, 8.6744, 99.4163],
  "Lampang": [17.2055, 98.881, 19.416, 100.1273],
  "Lamphun": [17.4227, 98.6667, 18.7081, 99.3225],
  "Loei": [16.7507, 100.8351, 18.2178, 102.1557],
  "Lopburi": [14.6537, 100.4233, 15.5801, 101.4147],
  "Mae Hong Son": [17.6355, 97.3452, 19.8113, 98.6528],
  "Maha Sarakham": [15.4047, 102.8456, 16.6421, 103.5064],
  "Mukdahan": [16.1832, 104.0732, 16.9048, 104.9807],
  "Nakhon Nayok": [13.9587, 100.9143, 14.5112, 101.5062],
  "Nakhon Pathom": [13.6468, 99.8306, 14.2086, 100.3337],
  "Nakhon Phanom": [16.7847, 103.9846, 18.025, 104.8066],
  "Nakhon Ratchasima": [14.1194, 101.183, 15.8063, 103.0142],
  "Nakhon Sawan": [15.0559, 99.0863, 16.1947, 100.8501],
  "Nakhon Si Thammarat": [7.8362, 99.2345, 9.3227, 100.7454],
  "Nan": [18.0115, 100.3381, 19.6318, 101.3594],
  "Narathiwat": [5.7372, 101.3715, 6.6353, 102.093],
  "Nong Bua Lamphu": [16.7661, 101.9836, 17.6767, 102.6832],
  "Nong Khai": [17.5909, 102.058, 18.3022, 103.416],
  "Nonthaburi": [13.7883, 100.2652, 14.1389, 100.5687],
  "Pathum Thani": [13.9157, 100.3329, 14.2733, 100.9529],
  "Pattani": [6.5498, 101.0187, 6.9517, 101.7252],
  "Phang Nga": [7.8879, 97.6308, 9.3516, 98.7067],
  "Phatthalung": [7.0903, 99.7324, 7.8936, 100.4285],
  "Phayao": [18.8035, 99.6847, 19.7339, 100.6489],
  "Phetchabun": [15.3186, 100.6375, 17.1309, 101.7895],
  "Phetchaburi": [12.54, 99.0998, 13.3432, 100.1039],
  "Phichit": [15.911, 99.9845, 16.6457, 100.7716],
  "Phitsanulok": [16.3072, 99.8577, 17.7416, 101.1114],
  "Phrae": [17.7042, 99.3682, 18.8324, 100.5531],
  "Phra Nakhon Si Ayutthaya": [14.1101, 100.2432, 14.673, 100.8253],
  "Phuket": [7.4613, 98.2581, 8.2002, 98.6162],
  "Prachinburi": [13.5811, 101.1386, 14.4619, 102.1082],
  "Prachuap Khiri Khan": [10.955, 99.1475, 12.6525, 100.0322],
  "Ranong": [9.3047, 98.326, 10.7854, 98.9651],
  "Ratchaburi": [13.148, 99.1672, 13.9483, 100.0703],
  "Rayong": [12.5127, 100.9856, 13.1631, 101.832],
  "Roi Et": [15.4036, 103.2738, 16.4707, 104.3534],
  "Sa Kaeo": [13.2357, 101.8617, 14.1945, 102.941],
  "Sakon Nakhon": [16.7707, 103.2535, 18.0881, 104.4378],
  "Samut Prakan": [13.4783, 100.4453, 13.7178, 100.9638],
  "Samut Sakhon": [13.4249, 100.0286, 13.7327, 100.4204],
  "Samut Songkhram": [13.2449, 99.8534, 13.5141, 100.0796],
  "Saraburi": [14.2426, 100.5766, 15.0448, 101.4557],
  "Satun": [6.4051, 99.1542, 7.1301, 100.2207],
  "Sing Buri": [14.714, 100.1828, 15.1097, 100.4897],
  "Sisaket": [14.3421, 103.9047, 15.567, 104.9108],
  "Songkhla": [6.2887, 100.0546, 7.9368, 101.1123],
  "Sukhothai": [16.6812, 99.3112, 17.8198, 100.1128],
  "Suphan Buri": [14.0584, 99.2833, 15.0808, 100.2823],
  "Surat Thani": [8.3007, 98.4427, 10.1264, 100.0906],
  "Surin": [14.329, 103.0923, 15.4813, 104.0936],
  "Tak": [15.1799, 97.7448, 17.867, 99.4463],
  "Trang": [6.7939, 99.0534, 8.0134, 99.9982],
  "Trat": [11.5614, 102.2436, 12.7564, 102.9151],
  "Ubon Ratchathani": [14.2097, 104.3748, 16.096, 105.6391],
  "Udon Thani": [16.8003, 102.0182, 18.0829, 103.6694],
  "Uthai Thani": [14.9385, 98.9846, 15.7954, 100.1063],
  "Uttaradit": [17.1625, 99.8984, 18.3794, 101.193],
  "Yala": [5.6162, 100.8352, 6.6828, 101.6091],
  "Yasothon": [15.2883, 103.9994, 16.3477, 104.8273],
}

/** Leaflet bounds [[s, w], [n, e]] for a province, or null. */
export function provinceBounds(name) {
  const b = PROVINCE_BOUNDS[name]
  return b ? [[b[0], b[1]], [b[2], b[3]]] : null
}
/** Thailand-wide bounds (union of all 77 provinces): with no
 *  province filter chosen, the map is fenced to these (owner's
 *  rule, 2026-10-18) so visitors can never wander off the country. */
export const THAILAND_BOUNDS = (() => {
  const all = Object.values(PROVINCE_BOUNDS)
  return [
    [Math.min(...all.map((b) => b[0])), Math.min(...all.map((b) => b[1]))],
    [Math.max(...all.map((b) => b[2])), Math.max(...all.map((b) => b[3]))],
  ]
})()

