import { Link } from 'react-router-dom'
import { formatBaht } from '../lib/format'

const PLACEHOLDER = 'https://picsum.photos/seed/placeholder/800/600'

export default function ListingCard({ listing, selected, onHover }) {
  const photo = listing.image_urls?.[0] || PLACEHOLDER
  return (
    <Link
      to={`/listing/${listing.id}`}
      className={`card${selected ? ' selected' : ''}`}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="card-photo">
        <img src={photo} alt={listing.title} loading="lazy" />
        <span className={`badge ${listing.listing_type}`}>
          {listing.listing_type === 'rent' ? 'For rent' : 'For sale'}
        </span>
      </div>
      <div className="card-body">
        <div className="card-price">{formatBaht(listing.price_thb)}</div>
        <div className="card-title">{listing.title}</div>
        <div className="card-meta">
          {listing.bedrooms > 0 && <span>{listing.bedrooms} bd</span>}
          {listing.bathrooms > 0 && <span>{listing.bathrooms} ba</span>}
          {listing.area_sqm > 0 && <span>{listing.area_sqm} sqm</span>}
          <span className="card-province">{listing.province}</span>
        </div>
      </div>
    </Link>
  )
}
