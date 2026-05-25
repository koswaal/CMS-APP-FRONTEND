import { useEffect, useState, useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { AuthContext } from './AuthContext';
import { API_URL } from './config';
import { getProfileImage } from './avatarUtils';

const ROLES = [
  { id: 'operador', name: 'Operador', description: 'Solo consulta' },
  { id: 'supervisor', name: 'Supervisor', description: 'Consulta y creación (excepto usuarios)' },
  { id: 'administrador', name: 'Administrador', description: 'Consulta, creación, edición y eliminación (todos los módulos)' },
  { id: 'desarrollador', name: 'Desarrollador', description: 'Control total + gestión de roles' },
];

const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'];
const STATIC_MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'profile', name: 'Perfil' },
  { id: 'users', name: 'Usuarios' },
  { id: 'roles', name: 'Permisos' },
  { id: 'auditoria', name: 'Auditoría' },
  { id: 'ai-chat', name: 'Chat IA' },
];

export default function Roles() {
  const { theme } = useContext(ThemeContext);
  const { user: currentUser, refreshUser } = useContext(AuthContext);
  const isDark = theme === 'dark';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1 });
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedUser, setSelectedUser] = useState(null);
  const [dynamicModules, setDynamicModules] = useState([]);
  const [dirtyPermissions, setDirtyPermissions] = useState(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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
    } finally {
      setLoading(false);
    }
  };

  const loadDynamicModules = async () => {
    try {
      const response = await fetch(`${API_URL}/entity-types/menus`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.menus)) {
        setDynamicModules(data.menus.map((et) => ({
          id: `dynamic-${et.slug}`,
          name: et.menu_name || et.slug,
        })));
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    loadUsers();
    loadDynamicModules();
  }, []);

  const allModules = [...STATIC_MODULES, ...dynamicModules];

  const getEffectivePerms = (u) => {
    return u.effective_permissions || {};
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setDirtyPermissions(JSON.parse(JSON.stringify(getEffectivePerms(u) || {})));
  };

  const handleCloseEditor = () => {
    setSelectedUser(null);
    setDirtyPermissions(null);
  };

  const handleToggleAction = (moduleId, action) => {
    setDirtyPermissions((prev) => {
      const updated = { ...prev };
      const current = updated[moduleId] ? [...updated[moduleId]] : [];
      if (current.includes(action)) {
        updated[moduleId] = current.filter((a) => a !== action);
        if (updated[moduleId].length === 0) {
          delete updated[moduleId];
        }
      } else {
        updated[moduleId] = [...current, action];
      }
      return updated;
    });
  };

  const handleToggleAll = (moduleId, checked) => {
    setDirtyPermissions((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[moduleId] = [...ALL_ACTIONS];
      } else {
        delete updated[moduleId];
      }
      return updated;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: dirtyPermissions }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`Permisos actualizados para ${selectedUser.name}`);
        if (currentUser?.id === selectedUser.id) {
          refreshUser();
        }
        setSelectedUser(null);
        setDirtyPermissions(null);
        loadUsers();
      } else {
        setError(data.message || 'Error al guardar permisos');
      }
    } catch (err) {
      setError('Error al guardar permisos');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (pagination.current_page - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  }, [searchTerm]);

  const handleItemsPerPageChange = (value) => {
    const newValue = parseInt(value, 10);
    if (Number.isNaN(newValue) || newValue < 1) return;
    setItemsPerPage(newValue);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'desarrollador': return 'bg-purple-500 text-white';
      case 'administrador': return 'bg-blue-500 text-white';
      case 'supervisor': return 'bg-green-500 text-white';
      case 'operador': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!currentUser || currentUser.role !== 'desarrollador') {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Gestión de Permisos</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Administra los roles y permisos granulares de cada usuario</p>
        </div>
      </div>

      {error && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'}`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {successMessage && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-100 border-green-400 text-green-700'}`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
            {filteredUsers.length > itemsPerPage && ` • Página ${pagination.current_page} de ${totalPages}`}
          </div>
          {!loading && filteredUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className={`pl-3 pr-10 py-1.5 min-w-[4.75rem] rounded-lg text-sm border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none cursor-pointer ${
                  isDark ? 'bg-[#1a1a1a] border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {[5, 10, 20, 50].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className={`animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4 ${isDark ? 'border-gray-700 border-t-[#c8f135]' : 'border-gray-300 border-t-[#c8f135]'}`}></div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando usuarios...</p>
          </div>
        </div>
      ) : (
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
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No hay usuarios registrados</td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b transition-colors cursor-pointer ${
                        isDark ? 'border-gray-700 hover:bg-[#c8f135]/10' : 'border-gray-200 hover:bg-[#c8f135]/10'
                      } ${selectedUser?.id === user.id ? (isDark ? 'bg-[#c8f135]/20' : 'bg-[#c8f135]/20') : ''}`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProfileImage(user.profile_photo, user.name, API_URL.replace('/api', ''))}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => { e.target.src = getProfileImage(null, user.name); }}
                          />
                          <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{user.name}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                            {ROLES.find(r => r.id === user.role)?.name || user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectUser(user); }}
                          className={`inline-flex items-center gap-1 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                            selectedUser?.id === user.id ? 'text-[#c8f135]' : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Permisos
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredUsers.length > itemsPerPage && (
            <div className={`flex justify-center items-center gap-2 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, current_page: prev.current_page - 1 }))}
                disabled={pagination.current_page === 1}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >Anterior</button>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Página {pagination.current_page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, current_page: prev.current_page + 1 }))}
                disabled={pagination.current_page === totalPages}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >Siguiente</button>
            </div>
          )}
        </div>
      )}

      {/* Permissions Editor Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={`rounded-xl shadow-2xl border w-full max-w-4xl max-h-[90vh] flex flex-col ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Permisos: {selectedUser.name}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Rol: {ROLES.find(r => r.id === selectedUser.role)?.name || selectedUser.role}
                  {selectedUser.role === 'desarrollador' && ' — Tiene acceso total, los permisos no aplican'}
                </p>
              </div>
              <button
                onClick={handleCloseEditor}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              {selectedUser.role === 'desarrollador' ? (
                <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Los desarrolladores tienen acceso total al sistema. Los permisos granulares no aplican.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className={`py-2 pr-4 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Módulo</th>
                        {ALL_ACTIONS.map((action) => (
                          <th key={action} className="px-3 py-2 text-center font-semibold capitalize">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{action === 'view' ? 'Ver' : action === 'create' ? 'Crear' : action === 'edit' ? 'Editar' : 'Eliminar'}</span>
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center">
                          <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Todo/Nada</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allModules.map((mod) => {
                        const perms = dirtyPermissions[mod.id] || [];
                        const allChecked = ALL_ACTIONS.every((a) => perms.includes(a));
                        return (
                          <tr key={mod.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <td className={`py-3 pr-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{mod.name}</td>
                            {ALL_ACTIONS.map((action) => (
                              <td key={action} className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.includes(action)}
                                  onChange={() => handleToggleAction(mod.id, action)}
                                  className="w-4 h-4 rounded cursor-pointer accent-[#c8f135]"
                                />
                              </td>
                            ))}
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={() => handleToggleAll(mod.id, !allChecked)}
                                className="w-4 h-4 rounded cursor-pointer accent-[#c8f135]"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedUser.role !== 'desarrollador' && (
              <div className={`flex items-center justify-end gap-3 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={handleCloseEditor}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >Cancelar</button>
                <button
                  onClick={handleSavePermissions}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-[#c8f135] text-black hover:brightness-110"
                >Guardar Permisos</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
