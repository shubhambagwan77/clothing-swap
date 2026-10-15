import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, useMeta } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const meta = useMeta();

  const [tab, setTab] = useState('listings');
  const [items, setItems] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({ name: user.name, city: user.city, phone: user.phone || '' });
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      const [mine, allSwaps] = await Promise.all([api('/clothes/mine'), api('/swaps')]);
      setItems(mine);
      setSwaps(allSwaps);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function removeItem(id) {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api('/clothes/' + id, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function setStatus(id, status) {
    try {
      await api('/swaps/' + id + '/status', { method: 'PATCH', body: { status } });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      setUser(await api('/auth/me', { method: 'PUT', body: profile }));
      setNotice('Profile updated');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  const received = swaps.filter((s) => s.owner._id === user._id);
  const sent = swaps.filter((s) => s.requester._id === user._id);
  const done = swaps.filter((s) => s.status === 'completed').length;
  const pending = received.filter((s) => s.status === 'pending').length;

  function SwapRow({ s, incoming }) {
    return (
      <div className="list-row">
        <div>
          <strong>{s.requestedItem ? s.requestedItem.title : 'Item removed'}</strong>
          <span className="muted"> ⇄ </span>
          <strong>{s.offeredItem ? s.offeredItem.title : 'Item removed'}</strong>
          <p className="muted small">
            {incoming ? 'From ' + s.requester.name : 'To ' + s.owner.name}
            {s.fairness && ' · ' + s.fairness.label}
          </p>
        </div>
        <div className="row-actions">
          <span className={'status ' + s.status}>{s.status}</span>
          {incoming && s.status === 'pending' && (
            <>
              <button type="button" className="btn small" onClick={() => setStatus(s._id, 'accepted')}>Accept</button>
              <button type="button" className="btn small danger" onClick={() => setStatus(s._id, 'rejected')}>Reject</button>
            </>
          )}
          <Link className="btn small secondary" to={'/chat/' + s._id}>Chat</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="panel">
        <h2>Hi, {user.name}</h2>
        <div className="stats">
          <div><strong>{items.length}</strong><span>My listings</span></div>
          <div><strong>{pending}</strong><span>Requests waiting</span></div>
          <div><strong>{done}</strong><span>Swaps completed</span></div>
        </div>
      </section>

      <div className="tabs">
        {[['listings', 'My listings'], ['received', 'Requests received'], ['sent', 'Requests sent'], ['profile', 'Profile']].map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? 'tab active' : 'tab'} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        {tab === 'listings' && (
          <>
            <div className="row">
              <h3>My listings</h3>
              <Link className="btn small" to="/sell">+ List an item</Link>
            </div>
            {items.length === 0 && <p className="muted">You have not listed anything yet.</p>}
            {items.map((i) => (
              <div className="list-row" key={i._id}>
                <div>
                  <Link to={'/item/' + i._id}><strong>{i.title}</strong></Link>
                  <p className="muted small">{i.brand} · {i.size} · {i.condition} · {money(i.estimatedValue)}</p>
                </div>
                <div className="row-actions">
                  <span className={'status ' + i.status}>{i.status}</span>
                  <Link className="btn small secondary" to={'/sell/' + i._id}>Edit</Link>
                  <button type="button" className="btn small danger" onClick={() => removeItem(i._id)}>Delete</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'received' && (
          <>
            <h3>Requests for my items</h3>
            {received.length === 0 && <p className="muted">No requests yet.</p>}
            {received.map((s) => <SwapRow key={s._id} s={s} incoming />)}
          </>
        )}

        {tab === 'sent' && (
          <>
            <h3>Requests I sent</h3>
            {sent.length === 0 && <p className="muted">You have not requested any swap yet. <Link to="/">Browse clothes</Link></p>}
            {sent.map((s) => <SwapRow key={s._id} s={s} />)}
          </>
        )}

        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="stack narrow-form">
            <h3>My profile</h3>
            <label>Name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
            <label>Email<input value={user.email} disabled /></label>
            <label>
              City
              <select value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })}>
                {meta.cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Phone<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
            {notice && <p className="success">{notice}</p>}
            <button type="submit" className="btn">Save profile</button>
          </form>
        )}
      </section>
    </>
  );
}
