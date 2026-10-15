import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money, when } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Chat() {
  const { id } = useParams();
  const { user } = useAuth();

  const [swap, setSwap] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bottom = useRef(null);

  const loadSwap = useCallback(async () => {
    try {
      setSwap(await api('/swaps/' + id));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await api('/swaps/' + id + '/messages'));
    } catch {
      // keep the old messages if one refresh fails
    }
  }, [id]);

  // load once, then refresh messages every few seconds
  useEffect(() => {
    loadSwap();
    loadMessages();
    const timer = setInterval(loadMessages, 4000);
    return () => clearInterval(timer);
  }, [loadSwap, loadMessages]);

  useEffect(() => {
    if (bottom.current) bottom.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api('/swaps/' + id + '/messages', { method: 'POST', body: { text } });
      setText('');
      setError('');
      loadMessages();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(status) {
    try {
      setSwap(await api('/swaps/' + id + '/status', { method: 'PATCH', body: { status } }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !swap) return <p className="error">{error}</p>;
  if (!swap) return <p className="muted">Loading...</p>;

  const isOwner = user._id === swap.owner._id;
  const isRequester = user._id === swap.requester._id;
  const isParticipant = isOwner || isRequester;
  const other = isOwner ? swap.requester : swap.owner;
  const closed = ['rejected', 'cancelled'].includes(swap.status);
  const showContact = ['accepted', 'completed'].includes(swap.status) && isParticipant;

  return (
    <section className="panel">
      <Link to="/dashboard" className="muted small">← Back to dashboard</Link>
      <div className="row">
        <h2>Swap chat</h2>
        <span className={'status ' + swap.status}>{swap.status}</span>
      </div>

      <div className="compare small-compare">
        <div className="compare-box">
          <p className="muted small">{swap.owner.name} gives</p>
          <h3>{swap.requestedItem ? swap.requestedItem.title : 'Item removed'}</h3>
          <p>{swap.requestedItem && money(swap.requestedItem.estimatedValue)}</p>
        </div>
        <div className="compare-mid">⇄</div>
        <div className="compare-box">
          <p className="muted small">{swap.requester.name} gives</p>
          <h3>{swap.offeredItem ? swap.offeredItem.title : 'Item removed'}</h3>
          <p>{swap.offeredItem && money(swap.offeredItem.estimatedValue)}</p>
        </div>
      </div>
      {swap.fairness && <p className="muted center">Value check: {swap.fairness.label}</p>}

      {showContact && (
        <p className="success">
          Swap agreed. Contact {other.name}: {other.phone || 'no phone added'} · {other.email}
        </p>
      )}

      <div className="actions">
        {isOwner && swap.status === 'pending' && (
          <>
            <button type="button" className="btn" onClick={() => changeStatus('accepted')}>Accept swap</button>
            <button type="button" className="btn danger" onClick={() => changeStatus('rejected')}>Reject</button>
          </>
        )}
        {isRequester && swap.status === 'pending' && (
          <button type="button" className="btn danger" onClick={() => changeStatus('cancelled')}>Cancel request</button>
        )}
        {isParticipant && swap.status === 'accepted' && (
          <>
            <button type="button" className="btn" onClick={() => changeStatus('completed')}>Mark swap completed</button>
            <button type="button" className="btn danger" onClick={() => changeStatus('cancelled')}>Cancel swap</button>
          </>
        )}
      </div>

      <div className="chat-box">
        {messages.length === 0 && <p className="muted center">No messages yet. Say hello and agree on the details.</p>}
        {messages.map((m) => (
          <div key={m._id} className={'bubble ' + (m.sender._id === user._id ? 'me' : 'them')}>
            <small>{m.sender.name} · {when(m.createdAt)}</small>
            <p>{m.text}</p>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {error && <p className="error">{error}</p>}
      {isParticipant && !closed && (
        <form onSubmit={send} className="chat-form">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength="1000"
            placeholder="Type a message to negotiate the swap"
          />
          <button type="submit" className="btn">Send</button>
        </form>
      )}
      {closed && <p className="muted center">This swap is closed, chat is read only.</p>}
    </section>
  );
}
