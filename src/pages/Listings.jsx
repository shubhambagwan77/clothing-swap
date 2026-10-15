import { useEffect, useState } from 'react';
import { api, useMeta } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import ItemCard from '../components/ItemCard.jsx';

export default function Listings() {
  const meta = useMeta();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: '', category: 'All', condition: 'All', size: 'All', city: 'All', nearMe: false, maxKm: '300', sort: 'new',
  });

  function change(field, value) {
    setFilters({ ...filters, [field]: value });
  }

  // reload whenever a filter changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    ['category', 'condition', 'size', 'city'].forEach((key) => {
      if (filters[key] !== 'All') params.set(key, filters[key]);
    });
    if (filters.nearMe && user) {
      params.set('near', user.city);
      params.set('maxKm', filters.maxKm);
      params.set('sort', 'near');
    } else if (filters.sort !== 'new') {
      params.set('sort', filters.sort);
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api('/clothes?' + params.toString())
        .then((data) => {
          setItems(data);
          setError('');
        })
        .catch(() => setError('Could not load clothes. Please try again.'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, user]);

  return (
    <>
      <section className="hero">
        <h1>Give clothes a second life</h1>
        <p>Swap what you no longer wear for something new. No money, less waste.</p>
      </section>

      <section className="panel">
        <div className="filters">
          <input
            className="grow"
            placeholder="Search by name, brand or type"
            value={filters.q}
            onChange={(e) => change('q', e.target.value)}
          />
          <select value={filters.condition} onChange={(e) => change('condition', e.target.value)}>
            <option value="All">Any condition</option>
            {meta.conditions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={filters.size} onChange={(e) => change('size', e.target.value)}>
            <option value="All">Any size</option>
            {meta.sizes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={filters.city} onChange={(e) => change('city', e.target.value)}>
            <option value="All">All cities</option>
            {meta.cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={filters.sort} onChange={(e) => change('sort', e.target.value)}>
            <option value="new">Newest first</option>
            <option value="value">Highest value</option>
          </select>
        </div>

        <div className="tabs">
          {['All', ...meta.categories].map((c) => (
            <button
              type="button"
              key={c}
              className={filters.category === c ? 'tab active' : 'tab'}
              onClick={() => change('category', c)}
            >
              {c}
            </button>
          ))}
        </div>

        {user && (
          <div className="near">
            <label className="check">
              <input type="checkbox" checked={filters.nearMe} onChange={(e) => change('nearMe', e.target.checked)} />
              Show swaps near me ({user.city})
            </label>
            {filters.nearMe && (
              <select value={filters.maxKm} onChange={(e) => change('maxKm', e.target.value)}>
                <option value="50">within 50 km</option>
                <option value="150">within 150 km</option>
                <option value="300">within 300 km</option>
                <option value="1000">within 1000 km</option>
              </select>
            )}
          </div>
        )}
      </section>

      <h2 className="section-title">Available clothes ({items.length})</h2>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && items.length === 0 && !error && <p className="muted">No clothes match these filters.</p>}

      <div className="grid">
        {items.map((item) => (
          <ItemCard key={item._id} item={item} />
        ))}
      </div>
    </>
  );
}
