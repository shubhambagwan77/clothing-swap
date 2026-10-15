import { Link } from 'react-router-dom';
import { money } from '../api.js';

const ICONS = { Men: '👔', Women: '👗', Kids: '🧸', Accessories: '👜' };

// Picture of the item, or a coloured placeholder when no photo was uploaded
export function ItemImage({ item, className = 'card-img' }) {
  if (item.image) return <img src={item.image} alt={item.title} className={className} />;
  return (
    <div className={className + ' placeholder'}>
      <span>{ICONS[item.category] || '👕'}</span>
      <small>{item.type}</small>
    </div>
  );
}

export default function ItemCard({ item }) {
  return (
    <article className="card">
      <Link to={'/item/' + item._id} className="card-link">
        <ItemImage item={item} />
        <div className="card-body">
          <h3>{item.title}</h3>
          <p className="muted">
            {item.brand} · Size {item.size}
          </p>
          <div className="row">
            <span className="badge">{item.condition}</span>
            <strong>{money(item.estimatedValue)}</strong>
          </div>
          <p className="muted small">
            📍 {item.city}
            {item.distanceKm !== undefined && item.distanceKm !== null && ` · ${item.distanceKm} km away`}
          </p>
          {item.status !== 'available' && <span className={'status ' + item.status}>{item.status}</span>}
        </div>
      </Link>
    </article>
  );
}
