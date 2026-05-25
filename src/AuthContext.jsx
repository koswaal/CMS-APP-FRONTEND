import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from './config';
import { getProfileImage } from './avatarUtils';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario desde localStorage al montar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      // Refrescar datos del backend (para tener permisos actualizados)
      refreshUserData(parsed.session_token);
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUserData = async (token) => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token || user?.session_token}` },
      });
      const data = await response.json();
      if (data.success && data.user) {
        const userData = {
          ...data.user,
          role: data.user.role || 'operador',
          profile_photo: data.user.profile_photo || null,
          avatar: data.user.profile_photo
            ? `${API_URL.replace('/api', '')}/storage/profile_photos/${data.user.profile_photo}`
            : getProfileImage(null, data.user.name),
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (err) {
      // Si falla, mantener datos de localStorage
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name, username, passwordConfirmation) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(', ')
          : data.message || 'Error en el registro';
        setError(errorMsg);
        setLoading(false);
        return false;
      }

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setLoading(false);
      return true;
    } catch (err) {
      const errorMsg = err.message || 'Error de conexión con el servidor';
      setError(errorMsg);
      console.error('Error de registro:', err);
      setLoading(false);
      return false;
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    console.log('Login - URL:', `${API_URL}/login`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          username,
          password,
        }),
      });
      clearTimeout(timeoutId);

      console.log('Login - Response status:', response.status);
      const data = await response.json();
      console.log('Login - Response data:', data);

      if (!response.ok) {
        const errorMsg = data.message || `Error en el login (código ${response.status})`;
        setError(errorMsg);
        setLoading(false);
        return { success: false, error: errorMsg };
      }

      // Agregar avatar si no existe, o usar la foto de perfil si tiene
      const userData = {
        ...data.user,
        role: data.user.role || 'operador',
        profile_photo: data.user.profile_photo || null,
        avatar: data.user.profile_photo 
          ? `${API_URL.replace('/api', '')}/storage/profile_photos/${data.user.profile_photo}`
          : getProfileImage(null, data.user.name),
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setLoading(false);
      return { success: true, error: null };
    } catch (err) {
      const errorMsg = err.name === 'AbortError'
        ? 'El servidor tardó demasiado en responder. Verifica que el backend esté activo.'
        : (err.message || 'Error de conexión con el servidor');
      setError(errorMsg);
      console.error('Error de login:', err);
      console.error('Error stack:', err.stack);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const hasPermission = (module, action) => {
    if (!user) return false;

    if (user.role === 'desarrollador') return true;

    const perms = user.effective_permissions;
    if (!perms) return false;

    if (module?.startsWith('dynamic-')) {
      return perms[module]?.includes(action) ?? false;
    }

    if (!perms[module]) return false;
    return perms[module].includes(action);
  };

  const canAccess = (module) => {
    return hasPermission(module, 'view');
  };

  const refreshUser = async () => {
    await refreshUserData();
  };

  const logout = async () => {
    try {
      // Llamar al backend para registrar el logout
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user'))?.session_token}`,
        },
      });

      // No mostrar notificación al usuario, solo limpiar estado local
      setUser(null);
      setError(null);
      localStorage.removeItem('user');
      localStorage.removeItem('activeMenu');
    } catch (err) {
      // Si hay error, igual limpiar estado local
      setUser(null);
      setError(null);
      localStorage.removeItem('user');
      localStorage.removeItem('activeMenu');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, refreshUser, loading, error, setError, hasPermission, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}
