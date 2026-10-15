import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money, when } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { ItemImage } from '../components/ItemCard.jsx';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api('/clothes/' + id)
      .then(setItem)
      .catch((err) => setError(err.message));
  }, [id, user]);

  async function removeItem() {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api('/clothes/' + id, { method: 'DELETE' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  async function report() {
    const reason = window.prompt('What is wrong with this listing?');
    if (!reason) return;
    try {
      await api('/clothes/' + id + '/report', { method: 'POST', body: { reason } });
      setNotice('Thanks, the admin will review this listing.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !item) return <p className="error">{error}</p>;
  if (!item) return <p className="muted">Loading...</p>;

  const isOwner = user && item.owner && user._id === item.owner._id;

  return (
    <section className="panel detail">
      <ItemImage item={item} className="detail-img" />
      <div className="detail-info">
        <Link to="/" className="muted small">← Back to browse</Link>
        <h2>{item.title}</h2>
        <p className="price">{money(item.estimatedValue)} <span className="muted small">estimated swap value</span></p>
        {item.status !== 'available' && <span className={'status ' + item.status}>{item.status}</span>}

        <table className="facts">
          <tbody>
            <tr><th>Category</th><td>{item.category}</td></tr>
            <tr><th>Type</th><td>{item.type}</td></tr>
            <tr><th>Brand</th><td>{item.brand}</td></tr>
            <tr><th>Size</th><td>{item.size}</td></tr>
            <tr><th>Condition</th><td>{item.condition}</td></tr>
            <tr>
              <th>Location</th>
              <td>
                {item.city}
                {item.distanceKm !== undefined && item.distanceKm !== null && ` (${item.distanceKm} km from you)`}
              </td>
            </tr>
            <tr><th>Listed by</th><td>{item.owner ? item.owner.name : 'Unknown'}</td></tr>
            <tr><th>Listed on</th><td>{when(item.createdAt)}</td></tr>
          </tbody>
        </table>

        {item.description && <p>{item.description}</p>}
        {error && <p className="error">{error}</p>}
        {notice && <p className="success">{notice}</p>}

        <div className="actions">
          {!isOwner && item.status === 'available' && (
            <button
              type="button"
              className="btn"
              onClick={() => navigate(user ? '/swap/' + item._id : '/login', { state: { from: '/swap/' + item._id } })}
            >
              Request a swap
            </button>
          )}
          {isOwner && (
            <>
              <Link className="btn secondary" to={'/sell/' + item._id}>Edit</Link>
              <button type="button" className="btn danger" onClick={removeItem}>Delete</button>
            </>
          )}
          {user && !isOwner && (
            <button type="button" className="btn ghost" onClick={report}>Report listing</button>
          )}
        </div>
        {!user && <p className="muted small">Log in to send a swap request.</p>}
      </div>
    </section>
  );
}
