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
