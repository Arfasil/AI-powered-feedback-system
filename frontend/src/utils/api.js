const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const request = async (method, path, data = null) => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method: method.toUpperCase(), headers };
  if (data) opts.body = JSON.stringify(data);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return { data: json, status: res.status };
};

const api = {
  get: (path) => request('GET', path),
  post: (path, data) => request('POST', path, data),
  put: (path, data) => request('PUT', path, data),
  delete: (path) => request('DELETE', path),
};

export default api;