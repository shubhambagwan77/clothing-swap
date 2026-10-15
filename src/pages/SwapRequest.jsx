import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../api.js';
import { ItemImage } from '../components/ItemCard.jsx';

export default function SwapRequest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [mine, setMine] = useState([]);
  const [offered, setOffered] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api('/clothes/' + id), api('/clothes/' + id + '/matches')])
      .then(([target, matches]) => {
        setItem(target);
        setMine(matches);
        if (matches.length > 0) setOffered(matches[0]._id); // best value match first
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const chosen = mine.find((m) => m._id === offered);

  async function submit(e) {
    e.preventDefault();
    if (!offered) {
      setError('Choose one of your items to offer');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const swap = await api('/swaps', {
        method: 'POST',
        body: { requestedItem: id, offeredItem: offered, message },
      });
      navigate('/chat/' + swap._id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (error && !item) return <p className="error">{error}</p>;
  if (!item) return <p className="muted">Loading...</p>;

  return (
    <section className="panel">
      <Link to={'/item/' + id} className="muted small">← Back to item</Link>
      <h2>Request a swap</h2>

      <div className="compare">
        <div className="compare-box">
          <p className="muted small">You want</p>
          <ItemImage item={item} />
          <h3>{item.title}</h3>
          <p>{money(item.estimatedValue)} · {item.city}</p>
        </div>
        <div className="compare-mid">⇄</div>
        <div className="compare-box">
          <p className="muted small">You offer</p>
          {chosen ? (
            <>
              <ItemImage item={chosen} />
              <h3>{chosen.title}</h3>
              <p>{money(chosen.estimatedValue)}</p>
              <p className={'fair ' + (chosen.fairness.ratio >= 0.8 ? 'good' : chosen.fairness.ratio >= 0.6 ? 'mid' : 'bad')}>
                {chosen.fairness.label}
                {chosen.fairness.difference > 0 && ` (difference ${money(chosen.fairness.difference)})`}
              </p>
            </>
          ) : (
            <p className="muted">Pick an item below</p>
          )}
        </div>
      </div>

      {mine.length === 0 ? (
        <p>
          You have no available items to offer. <Link to="/sell">List an item</Link> first.
        </p>
      ) : (
        <form onSubmit={submit} className="stack">
          <h3>Your items (closest in value first)</h3>
          <div className="pick-list">
            {mine.map((m) => (
              <label key={m._id} className={'pick ' + (offered === m._id ? 'selected' : '')}>
                <input type="radio" name="offered" checked={offered === m._id} onChange={() => setOffered(m._id)} />
                <span>
                  <strong>{m.title}</strong>
                  <small>
                    {money(m.estimatedValue)} · {m.fairness.label}
                  </small>
                </span>
              </label>
            ))}
          </div>

          <label>
            Message to the owner
            <textarea
              rows="3"
              maxLength="500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I would like to swap my item for yours..."
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Sending...' : 'Send swap request'}
          </button>
        </form>
      )}
    </section>
  );
}
