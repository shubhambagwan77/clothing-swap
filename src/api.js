import { useEffect, useState } from 'react';

// Empty in development (Vite proxy) and in production when one server serves everything
const BASE = import.meta.env.VITE_API_URL || '';

export function getToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  } catch {
    // storage blocked, ignore
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + '/api' + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty body
  }
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

// Lists used by dropdowns: cities, categories, sizes, conditions, types
export function useMeta() {
  const [meta, setMeta] = useState({ categories: [], conditions: [], sizes: [], types: [], cities: [] });
  useEffect(() => {
    api('/meta').then(setMeta).catch(() => {});
  }, []);
  return meta;
}

export function money(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function when(date) {
  return new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
