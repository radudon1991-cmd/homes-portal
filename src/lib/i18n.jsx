import { createContext, useContext, useEffect, useState } from 'react'

// Thai + English UI strings. t('key') looks up the current language,
// falling back to English, then to the key itself.
// Use {name} placeholders via t('key', { name: value }).

const en = {
  // brand
  brand_main: 'Thailand',
  brand_accent: 'Real Estate',
  footer: 'Thailand Real Estate — find Thai properties on the map.',
  page_title: 'Thailand Real Estate — Thailand Property Search',

  // navbar
  nav_search: 'Search',
  nav_post: '+ Post property',
  nav_mylistings: 'My listings',
  nav_login: 'Log in',
  nav_signup: 'Sign up free',
  nav_logout: 'Log out',

  // search bar
  search_placeholder: 'Search by area, e.g. Sukhumvit, Phuket…',
  buy: 'Buy',
  rent: 'Rent',
  all_types: 'All types',
  min_price: 'Min ฿',
  max_price: 'Max ฿',
  beds: 'Beds',
  baths: 'Baths',
  clear: 'Clear',
  type_condo: 'Condo',
  type_house: 'House',
  type_townhouse: 'Townhouse',
  type_land: 'Land',

  // home
  loading: 'Loading…',
  property_one: 'property',
  property_many: 'properties',
  no_results: 'No properties match your search. Try widening the filters.',
  demo_banner: 'Demo mode — showing sample listings. Connect Supabase (see README) to go live with real data.',
  page_not_found: 'Page not found.',

  // listing card / badges
  for_rent: 'For rent',
  for_sale: 'For sale',
  bd: 'bd',
  ba: 'ba',
  sqm: 'sqm',

  // listing detail
  back_to_map: '← Back to map',
  no_photos: 'No photos yet',
  about: 'About this property',
  no_description: 'No description provided.',
  fact_type: 'Type',
  fact_bedrooms: 'Bedrooms',
  fact_bathrooms: 'Bathrooms',
  fact_area: 'Floor area',
  fact_province: 'Province',
  fact_posted: 'Posted',
  contact_seller: 'Contact seller',
  seller_fallback: 'Seller',
  listing_not_found: 'Listing not found.',
  back_to_search: 'Back to search',

  // login
  welcome: 'Welcome back',
  login_sub: 'Log in to post and manage your properties.',
  email: 'Email',
  password: 'Password',
  logging_in: 'Logging in…',
  login: 'Log in',
  no_account: 'No account yet?',
  signup_free_link: 'Sign up free',
  accounts_not_setup: 'Accounts are not set up yet — connect Supabase first (see README).',

  // signup
  create_account: 'Create your account',
  signup_sub: 'Free. Post properties in minutes.',
  display_name: 'Display name',
  name_placeholder: 'e.g. Nicha P.',
  password_min: 'Password (min 6 characters)',
  creating: 'Creating…',
  signup: 'Sign up',
  have_account: 'Already have an account?',
  login_link: 'Log in',
  check_email: 'Check your email',
  confirm_sent: 'We sent a confirmation link to {email}. Click it, then log in.',
  go_to_login: 'Go to log in',

  // post listing
  edit_listing: 'Edit your listing',
  post_property: 'Post a property',
  not_yours: 'Listing not found or not yours.',
  val_title: 'Please give the listing a clear title (5+ characters).',
  val_price: 'Please enter a valid price in baht.',
  val_province: 'Please choose a province.',
  val_location: 'Please tap the map to set the property location.',
  photo_upload_failed: 'Photo upload failed: ',
  title_label: 'Title *',
  title_ph: 'e.g. Modern 2BR condo near BTS Asok',
  for_label: 'For *',
  sale: 'Sale',
  rent_opt: 'Rent',
  type_label: 'Type *',
  price_label: 'Price (THB) *',
  price_ph: 'e.g. 24500000',
  bedrooms_label: 'Bedrooms',
  bathrooms_label: 'Bathrooms',
  area_label: 'Floor area (sqm)',
  area_ph: 'e.g. 78',
  province_label: 'Province *',
  address_label: 'Address / area',
  address_ph: 'Soi, road, district…',
  description_label: 'Description',
  description_ph: 'Describe the property: condition, furniture, nearby transport, facilities…',
  pin_title: 'Pin the location on the map *',
  pin_hint: 'Click the map to drop a pin where the property is. Drag the pin to adjust.',
  pinned_at: 'Pinned at',
  photos_label: 'Photos',
  photo_hint: 'JPG/PNG photos work best. First photo becomes the cover.',
  phone_label: 'Your contact phone',
  phone_ph: 'e.g. 081-234-5678',
  cancel: 'Cancel',
  saving: 'Saving…',
  save_changes: 'Save changes',
  publish: 'Publish listing',

  // my listings
  my_listings: 'My listings',
  post_new: '+ Post new property',
  none_yet: "You haven't posted any properties yet.",
  post_first: 'Post your first property',
  view: 'View',
  edit: 'Edit',
  delete: 'Delete',
  delete_confirm: 'Delete "{title}"? This cannot be undone.',
}

const th = {
  // brand
  brand_main: 'Thailand',
  brand_accent: 'Real Estate',
  footer: 'Thailand Real Estate — ค้นหาอสังหาริมทรัพย์ไทยบนแผนที่',
  page_title: 'Thailand Real Estate — ค้นหาอสังหาริมทรัพย์ไทย',

  // navbar
  nav_search: 'ค้นหา',
  nav_post: '+ ลงประกาศ',
  nav_mylistings: 'ประกาศของฉัน',
  nav_login: 'เข้าสู่ระบบ',
  nav_signup: 'สมัครฟรี',
  nav_logout: 'ออกจากระบบ',

  // search bar
  search_placeholder: 'ค้นหาตามพื้นที่ เช่น สุขุมวิท ภูเก็ต…',
  buy: 'ซื้อ',
  rent: 'เช่า',
  all_types: 'ทุกประเภท',
  min_price: 'ราคาต่ำสุด ฿',
  max_price: 'ราคาสูงสุด ฿',
  beds: 'ห้องนอน',
  baths: 'ห้องน้ำ',
  clear: 'ล้าง',
  type_condo: 'คอนโด',
  type_house: 'บ้าน',
  type_townhouse: 'ทาวน์เฮาส์',
  type_land: 'ที่ดิน',

  // home
  loading: 'กำลังโหลด…',
  property_one: 'ประกาศ',
  property_many: 'ประกาศ',
  no_results: 'ไม่พบประกาศที่ตรงกับการค้นหา ลองขยายเงื่อนไขการค้นหา',
  demo_banner: 'โหมดทดลอง — กำลังแสดงประกาศตัวอย่าง เชื่อมต่อ Supabase (ดู README) เพื่อใช้งานข้อมูลจริง',
  page_not_found: 'ไม่พบหน้านี้',

  // listing card / badges
  for_rent: 'ให้เช่า',
  for_sale: 'ขาย',
  bd: 'นอน',
  ba: 'น้ำ',
  sqm: 'ตร.ม.',

  // listing detail
  back_to_map: '← กลับไปแผนที่',
  no_photos: 'ยังไม่มีรูปภาพ',
  about: 'เกี่ยวกับอสังหาริมทรัพย์นี้',
  no_description: 'ไม่มีรายละเอียด',
  fact_type: 'ประเภท',
  fact_bedrooms: 'ห้องนอน',
  fact_bathrooms: 'ห้องน้ำ',
  fact_area: 'พื้นที่ใช้สอย',
  fact_province: 'จังหวัด',
  fact_posted: 'ลงประกาศเมื่อ',
  contact_seller: 'ติดต่อผู้ขาย',
  seller_fallback: 'ผู้ขาย',
  listing_not_found: 'ไม่พบประกาศนี้',
  back_to_search: 'กลับไปค้นหา',

  // login
  welcome: 'ยินดีต้อนรับกลับ',
  login_sub: 'เข้าสู่ระบบเพื่อลงประกาศและจัดการอสังหาริมทรัพย์ของคุณ',
  email: 'อีเมล',
  password: 'รหัสผ่าน',
  logging_in: 'กำลังเข้าสู่ระบบ…',
  login: 'เข้าสู่ระบบ',
  no_account: 'ยังไม่มีบัญชี?',
  signup_free_link: 'สมัครฟรี',
  accounts_not_setup: 'ยังไม่ได้ตั้งค่าระบบบัญชี — เชื่อมต่อ Supabase ก่อน (ดู README)',

  // signup
  create_account: 'สร้างบัญชีของคุณ',
  signup_sub: 'ฟรี ลงประกาศได้ในไม่กี่นาที',
  display_name: 'ชื่อที่แสดง',
  name_placeholder: 'เช่น ณิชา พ.',
  password_min: 'รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)',
  creating: 'กำลังสร้าง…',
  signup: 'สมัครสมาชิก',
  have_account: 'มีบัญชีอยู่แล้ว?',
  login_link: 'เข้าสู่ระบบ',
  check_email: 'ตรวจสอบอีเมลของคุณ',
  confirm_sent: 'เราส่งลิงก์ยืนยันไปที่ {email} แล้ว คลิกลิงก์แล้วเข้าสู่ระบบ',
  go_to_login: 'ไปหน้าเข้าสู่ระบบ',

  // post listing
  edit_listing: 'แก้ไขประกาศของคุณ',
  post_property: 'ลงประกาศอสังหาริมทรัพย์',
  not_yours: 'ไม่พบประกาศ หรือไม่ใช่ประกาศของคุณ',
  val_title: 'กรุณาตั้งชื่อประกาศให้ชัดเจน (อย่างน้อย 5 ตัวอักษร)',
  val_price: 'กรุณากรอกราคาเป็นบาทให้ถูกต้อง',
  val_province: 'กรุณาเลือกจังหวัด',
  val_location: 'กรุณาแตะแผนที่เพื่อระบุตำแหน่งอสังหาริมทรัพย์',
  photo_upload_failed: 'อัปโหลดรูปไม่สำเร็จ: ',
  title_label: 'ชื่อประกาศ *',
  title_ph: 'เช่น คอนโด 2 ห้องนอน ใกล้ BTS อโศก',
  for_label: 'สำหรับ *',
  sale: 'ขาย',
  rent_opt: 'เช่า',
  type_label: 'ประเภท *',
  price_label: 'ราคา (บาท) *',
  price_ph: 'เช่น 24500000',
  bedrooms_label: 'ห้องนอน',
  bathrooms_label: 'ห้องน้ำ',
  area_label: 'พื้นที่ใช้สอย (ตร.ม.)',
  area_ph: 'เช่น 78',
  province_label: 'จังหวัด *',
  address_label: 'ที่อยู่ / ย่าน',
  address_ph: 'ซอย ถนน เขต…',
  description_label: 'รายละเอียด',
  description_ph: 'บรรยายอสังหาริมทรัพย์: สภาพ เฟอร์นิเจอร์ การเดินทาง สิ่งอำนวยความสะดวก…',
  pin_title: 'ปักหมุดตำแหน่งบนแผนที่ *',
  pin_hint: 'คลิกแผนที่เพื่อปักหมุดตำแหน่งอสังหาริมทรัพย์ ลากหมุดเพื่อปรับตำแหน่ง',
  pinned_at: 'ปักหมุดที่',
  photos_label: 'รูปภาพ',
  photo_hint: 'รูป JPG/PNG ดีที่สุด รูปแรกจะเป็นรูปปก',
  phone_label: 'เบอร์โทรติดต่อของคุณ',
  phone_ph: 'เช่น 081-234-5678',
  cancel: 'ยกเลิก',
  saving: 'กำลังบันทึก…',
  save_changes: 'บันทึกการแก้ไข',
  publish: 'เผยแพร่ประกาศ',

  // my listings
  my_listings: 'ประกาศของฉัน',
  post_new: '+ ลงประกาศใหม่',
  none_yet: 'คุณยังไม่ได้ลงประกาศอสังหาริมทรัพย์',
  post_first: 'ลงประกาศแรกของคุณ',
  view: 'ดู',
  edit: 'แก้ไข',
  delete: 'ลบ',
  delete_confirm: 'ลบ "{title}"? การกระทำนี้ไม่สามารถย้อนกลับได้',
}

const STRINGS = { en, th }
const TITLES = { en: en.page_title, th: th.page_title }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('tre-lang') === 'th' ? 'th' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('tre-lang', lang)
    } catch {
      /* ignore */
    }
    document.title = TITLES[lang]
    document.documentElement.lang = lang === 'th' ? 'th' : 'en'
  }, [lang])

  const t = (key, vars) => {
    let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(`{${k}}`, String(v))
      }
    }
    return s
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}

// Map a property_type value to its translated label key.
export const TYPE_KEY = {
  condo: 'type_condo',
  house: 'type_house',
  townhouse: 'type_townhouse',
  land: 'type_land',
}
