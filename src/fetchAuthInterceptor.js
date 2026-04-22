import { API_URL } from './config';

const PUBLIC_AUTH_PATHS = ['/login', '/register'];

function getSessionToken() {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;
    const user = JSON.parse(rawUser);
    return user?.session_token || null;
  } catch {
    return null;
  }
}

function shouldAttachToken(url) {
  if (!url.startsWith(API_URL)) return false;
  return !PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

export function setupFetchAuthInterceptor() {
  if (window.__fetchAuthInterceptorInstalled) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';

    if (!shouldAttachToken(url)) {
      return originalFetch(input, init);
    }

    const token = getSessionToken();
    if (!token) {
      return originalFetch(input, init);
    }

    // Clonar init y agregar header Authorization
    const newInit = { ...init };
    newInit.headers = { ...init.headers };
    newInit.headers['Authorization'] = `Bearer ${token}`;

    return originalFetch(input, newInit);
  };

  window.__fetchAuthInterceptorInstalled = true;
}
