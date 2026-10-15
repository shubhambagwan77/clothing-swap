import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, when } from '../api.js';

const TABS = ['Overview', 'Users', 'Listings', 'Swaps', 'Reports'];

export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  async function load(which) {
    try {
      setError('');
      if (which === 'Overview') setStats(await api('/admin/stats'));
      if (which === 'Users') setUsers(await api('/admin/users'));
      if (which === 'Listings') setListings(await api('/admin/listings'));
      if (which === 'Swaps') setSwaps(await api('/admin/swaps'));
      if (which === 'Reports') setReports(await api('/admin/reports'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load(tab);
  }, [tab]);

  async function toggleBan(u) {
    try {
      await api('/admin/users/' + u._id, { method: 'PATCH', body: { banned: !u.banned } });
      load('Users');
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeListing(id) {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await api('/clothes/' + id, { method: 'DELETE' });
      load('Listings');
    } catch (err) {
      setError(err.message);
    }
  }

  async function resolve(id, action) {
    const note = window.prompt('Note for the record (optional):') || '';
    try {
      await api('/admin/reports/' + id, { method: 'PATCH', body: { action, note } });
      load('Reports');
    } catch (err) {
      setError(err.message);
    }
  }

  const max = stats ? Math.max(1, ...stats.byCategory.map((c) => c.count)) : 1;

  return (
    <>
      <h2 className="section-title">Admin panel</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}

      <section className="panel">
        {tab === 'Overview' && stats && (
          <>
            <div className="stats">
              <div><strong>{stats.users}</strong><span>Users</span></div>
              <div><strong>{stats.listings}</strong><span>Listings</span></div>
              <div><strong>{stats.swaps}</strong><span>Swap requests</span></div>
              <div><strong>{stats.successfulSwaps}</strong><span>Successful swaps</span></div>
              <div><strong>{stats.activeUsers}</strong><span>Active users (30 days)</span></div>
              <div><strong>{stats.engagementRate}%</strong><span>Engagement rate</span></div>
              <div><strong>{stats.conversionRate}%</strong><span>Request conversion</span></div>
              <div><strong>{stats.openReports}</strong><span>Open reports</span></div>
            </div>
            <h3>Listings by category</h3>
            {stats.byCategory.map((c) => (
              <div key={c._id} className="bar-row">
                <span>{c._id}</span>
                <div className="bar"><div style={{ width: (c.count / max) * 100 + '%' }} /></div>
                <strong>{c.count}</strong>
              </div>
            ))}
            <h3>Swaps by status</h3>
            <p className="muted">
              {stats.byStatus.length === 0 ? 'No swaps yet' : stats.byStatus.map((s) => s._id + ': ' + s.count).join('  ·  ')}
            </p>
          </>
        )}

        {tab === 'Users' && users.map((u) => (
          <div className="list-row" key={u._id}>
            <div>
              <strong>{u.name}</strong> <span className="muted small">{u.role}</span>
              <p className="muted small">{u.email} · {u.city} · {u.listingCount} listings · joined {when(u.createdAt)}</p>
            </div>
            <div className="row-actions">
              {u.banned && <span className="status rejected">suspended</span>}
              {u.role !== 'admin' && (
                <button type="button" className={u.banned ? 'btn small' : 'btn small danger'} onClick={() => toggleBan(u)}>
                  {u.banned ? 'Reinstate' : 'Suspend'}
                </button>
              )}
            </div>
          </div>
        ))}

        {tab === 'Listings' && listings.map((l) => (
          <div className="list-row" key={l._id}>
            <div>
              <Link to={'/item/' + l._id}><strong>{l.title}</strong></Link>
              <p className="muted small">
                {l.owner ? l.owner.name : 'Unknown'} · {l.city} · {money(l.estimatedValue)}
              </p>
            </div>
            <div className="row-actions">
              <span className={'status ' + l.status}>{l.status}</span>
              <button type="button" className="btn small danger" onClick={() => removeListing(l._id)}>Remove</button>
            </div>
          </div>
        ))}

        {tab === 'Swaps' && (
          <>
            {swaps.length === 0 && <p className="muted">No swaps yet.</p>}
            {swaps.map((s) => (
              <div className="list-row" key={s._id}>
                <div>
                  <strong>{s.requestedItem ? s.requestedItem.title : 'removed'}</strong> ⇄{' '}
                  <strong>{s.offeredItem ? s.offeredItem.title : 'removed'}</strong>
                  <p className="muted small">
                    {s.requester ? s.requester.name : '?'} → {s.owner ? s.owner.name : '?'} · {when(s.createdAt)}
                  </p>
                </div>
                <div className="row-actions">
                  <span className={'status ' + s.status}>{s.status}</span>
                  <Link className="btn small secondary" to={'/chat/' + s._id}>View chat</Link>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'Reports' && (
          <>
            {reports.length === 0 && <p className="muted">No reports. Everything looks fine.</p>}
            {reports.map((r) => (
              <div className="list-row" key={r._id}>
                <div>
                  <strong>{r.listing ? r.listing.title : 'Listing already removed'}</strong>
                  <p className="muted small">Reported by {r.reporter ? r.reporter.name : '?'} · {when(r.createdAt)}</p>
                  <p>“{r.reason}”</p>
                  {r.resolution && <p className="success small">Resolved: {r.resolution}</p>}
                </div>
                <div className="row-actions">
                  <span className={'status ' + (r.status === 'open' ? 'pending' : 'completed')}>{r.status}</span>
                  {r.status === 'open' && (
                    <>
                      <button type="button" className="btn small secondary" onClick={() => resolve(r._id, 'dismiss')}>Dismiss</button>
                      <button type="button" className="btn small danger" onClick={() => resolve(r._id, 'remove_listing')}>Remove listing</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </>
  );
}
