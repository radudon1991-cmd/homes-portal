import { Link } from 'react-router-dom'
import { formatBaht } from '../lib/format'
import { useLang } from '../lib/i18n'

const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/800/600'

export default function ListingCard({ listing, selected }) {
  const { t } = useLang()
  const photo = listing.image_urls?.[0] || PLACEHOLDER
  return (
    <Link
      to={`/listing/${listing.id}`}
      className={`card${selected ? ' selected' : ''}`}
    >
      <div className="card-photo">
        <img src={photo} alt={listing.title} loading="lazy" />
        <span className={`badge ${listing.listing_type}`}>
          {listing.listing_type === 'rent' ? t('for_rent') : t('for_sale')}
        </span>
      </div>
      <div className="card-body">
        <div className="card-price">{formatBaht(listing.price_thb)}</div>
        <div className="card-title">{listing.title}</div>
        <div className="card-meta">
          {listing.bedrooms > 0 && <span>{listing.bedrooms} {t('bd')}</span>}
          {listing.bathrooms > 0 && <span>{listing.bathrooms} {t('ba')}</span>}
          {listing.area_sqm > 0 && <span>{listing.area_sqm} {t('sqm')}</span>}
          <span className="card-province">{listing.province}</span>
        </div>
      </div>
    </Link>
  )
}
