// Token storage
const TOKEN_KEY = 'token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

// JWT utilities
export const parseJwt = (token) => {
  const base64Url = token.split('.')[1];
  if (!base64Url) throw new Error('Invalid token');
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};

// Fetch helpers
export const withAuthHeaders = (headers = {}) => {
  const token = getToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

export const fetchWithAuth = (url, options = {}) => {
  const headers = withAuthHeaders(options.headers);
  return fetch(url, { ...options, headers });
};

export const fetchWithAuthJSON = (url, options = {}) => {
    const jsonHeaders = {
        // FIX: Add Content-Type here, it will be merged into options.headers
        'Content-Type': 'application/json',
    };

    // If options.headers exists, merge jsonHeaders with it,
    // ensuring fetchWithAuth gets the Content-Type header
    const mergedOptions = {
        ...options,
        headers: {
            ...jsonHeaders,
            ...options.headers,
        },
    };

    return fetchWithAuth(url, mergedOptions)
        .then(res => {
            // Handle non-OK status codes before attempting to parse JSON
            if (res.ok) {
                return res.json();
            }
            // Attempt to read error message as JSON first, fallback to text/status
            return res.json().catch(() => res.text().then(text => ({ error: text || `HTTP error! status: ${res.status}` })))
                .then(errorData => Promise.reject(errorData));
        });
};