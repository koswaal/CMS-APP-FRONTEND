import { useEffect, useState, useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import { getProfileImage } from './avatarUtils';

const ROLES = [
  { id: 'operador', name: 'Operador', description: 'Solo consulta' },
  { id: 'supervisor', name: 'Supervisor', description: 'Consulta y creación (excepto usuarios)' },
  { id: 'administrador', name: 'Administrador', description: 'Consulta, creación, edición y eliminación (todos los módulos)' },
  { id: 'desarrollador', name: 'Desarrollador', description: 'Control total + gestión de roles' },
];

export default function Roles() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-limpiar mensaje de éxito
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Cambiar rol de usuario
  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Rol actualizado exitosamente`);
        setEditingUser(null);
        loadUsers();
      } else {
        setError(data.message || 'Error al actualizar rol');
      }
    } catch (err) {
      setError('Error al actualizar rol');
      console.error(err);
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'desarrollador':
        return 'bg-purple-500 text-white';
      case 'administrador':
        return 'bg-blue-500 text-white';
      case 'supervisor':
        return 'bg-green-500 text-white';
      case 'operador':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Gestión de Roles</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Administra los permisos de los usuarios del sistema</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className={`mb-4 p-4 border rounded-lg animate-fade-in ${isDark ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-100 border-green-400 text-green-700'}`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      {/* Info Cards - Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {ROLES.map((role) => (
          <div key={role.id} className={`rounded-lg shadow-lg p-4 border ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${getRoleColor(role.id)}`}>
              {role.name}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{role.description}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="relative">
          <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}`}
          />
        </div>
        <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className={`animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4 ${isDark ? 'border-gray-700 border-t-[#c8f135]' : 'border-gray-300 border-t-[#c8f135]'}`}></div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando usuarios...</p>
          </div>
        </div>
      ) : (
        /* Data Table */
        <div className={`rounded-lg shadow-lg border overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Usuario</th>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Rol Actual</th>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-[#c8f135]/10' : 'border-gray-200 hover:bg-[#c8f135]/10'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProfileImage(user.profile_photo, user.name, API_URL.replace('/api', ''))}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = getProfileImage(null, user.name);
                            }}
                          />
                          <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{user.name}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {ROLES.find(r => r.id === user.role)?.name || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className={`px-3 py-1 rounded border text-sm ${isDark ? 'bg-gray-900 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                              {ROLES.map((role) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingUser(null)}
                              className={`text-sm px-2 py-1 rounded ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingUser(user.id)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 ease-out transform hover:scale-105"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Cambiar Rol
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
