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
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

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

  // Funciones de permisos basadas en el rol
  const hasPermission = (action, module = null) => {
    if (!user || !user.role) return false;
    
    const role = user.role;
    
    // Desarrollador: todo
    if (role === 'desarrollador') return true;
    
    // Operador: solo consulta
    if (role === 'operador') {
      return action === 'view';
    }
    
    // Supervisor: consulta y carga (excepto usuarios)
    if (role === 'supervisor') {
      if (module === 'users') return action === 'view';
      return ['view', 'create'].includes(action);
    }
    
    // Administrador: consulta, carga, edición y eliminación (incluye usuarios)
    if (role === 'administrador') {
      return ['view', 'create', 'edit', 'delete'].includes(action);
    }
    
    return false;
  };

  // Verificar si puede acceder a un módulo específico
  const canAccess = (module) => {
    if (!user || !user.role) return false;
    
    const role = user.role;
    
    // Desarrollador: todo
    if (role === 'desarrollador') return true;
    
    // Todos pueden ver el dashboard y sus propios datos
    if (module === 'dashboard' || module === 'profile') return true;
    
    // Solo desarrollador puede acceder a Roles
    if (module === 'roles') return role === 'desarrollador';

    // Solo desarrollador y administrador pueden gestionar usuarios, campos personalizados y auditoría
    if (['users', 'custom-fields', 'auditoria'].includes(module)) {
      return role === 'desarrollador' || role === 'administrador';
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('activeMenu');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading, error, setError, hasPermission, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}
