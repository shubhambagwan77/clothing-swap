import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, useMeta, money } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

// Shrinks the photo in the browser so uploads stay small
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a valid image'));
      img.onload = () => {
        const max = 800;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AddItem() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const meta = useMeta();

  const [form, setForm] = useState({
    title: '', type: 'T-Shirt', category: 'Men', brand: '', size: 'M', condition: 'Good',
    city: user.city, description: '', image: '', estimatedValue: '',
  });
  const [suggested, setSuggested] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((old) => ({ ...old, [field]: value }));
  }

  // when editing, load the existing item
  useEffect(() => {
    if (!editing) return;
    api('/clothes/' + id)
      .then((item) => setForm({ ...item, estimatedValue: item.estimatedValue, owner: undefined }))
      .catch((err) => setError(err.message));
  }, [editing, id]);

  // live value suggestion from the calculator
  useEffect(() => {
    api('/meta/estimate', { method: 'POST', body: { type: form.type, brand: form.brand, condition: form.condition } })
      .then((data) => setSuggested(data.estimatedValue))
      .catch(() => {});
  }, [form.type, form.brand, form.condition]);

  async function pickImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      update('image', await resizeImage(file));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (form.title.trim().length < 3) {
      setError('Give the item a title of at least 3 characters');
      return;
    }
    setBusy(true);
    setError('');
    const body = { ...form, estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined };
    try {
      const saved = editing
        ? await api('/clothes/' + id, { method: 'PUT', body })
        : await api('/clothes', { method: 'POST', body });
      navigate('/item/' + saved._id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <section className="panel narrow">
      <h2>{editing ? 'Edit listing' : 'List an item for swap'}</h2>
      <form onSubmit={submit} className="stack">
        <label>
          Photo
          <input type="file" accept="image/*" onChange={pickImage} />
        </label>
        {form.image && <img src={form.image} alt="Preview" className="preview" />}

        <label>
          Title
          <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Levi's 511 Slim Fit Jeans" />
        </label>

        <div className="two">
          <label>
            Category
            <select value={form.category} onChange={(e) => update('category', e.target.value)}>
              {meta.categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Type
            <select value={form.type} onChange={(e) => update('type', e.target.value)}>
              {meta.types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <div className="two">
          <label>
            Brand
            <input value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="Unbranded" />
          </label>
          <label>
            Size
            <select value={form.size} onChange={(e) => update('size', e.target.value)}>
              {meta.sizes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="two">
          <label>
            Condition
            <select value={form.condition} onChange={(e) => update('condition', e.target.value)}>
              {meta.conditions.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>
            City
            <select value={form.city} onChange={(e) => update('city', e.target.value)}>
              {meta.cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <label>
          Estimated swap value (₹)
          <input
            type="number"
            min="1"
            value={form.estimatedValue}
            onChange={(e) => update('estimatedValue', e.target.value)}
            placeholder={'Suggested: ' + suggested}
          />
          <small className="muted">
            Calculated from type, brand and condition: {money(suggested)}. Leave empty to use it.
          </small>
        </label>

        <label>
          Description
          <textarea rows="3" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Wear, fit, any flaws..." />
        </label>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Saving...' : editing ? 'Save changes' : 'Publish listing'}
        </button>
      </form>
    </section>
  );
}
