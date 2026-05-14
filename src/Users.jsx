import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { AuthContext } from './AuthContext';
import DynamicFormFields from './DynamicFormFields';
import { API_URL } from './config';
import { getProfileImage } from './avatarUtils';

export default function Users() {
  const { theme } = useContext(ThemeContext);
  const { hasPermission } = useContext(AuthContext);
  const isDark = theme === 'dark';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'operador',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);
  const [customFields, setCustomFields] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
  });
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Auto-limpiar mensaje de éxito después de 3 segundos
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
    loadCustomFieldDefinitions();
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  }, []);

  // Cargar definiciones de campos personalizados
  const loadCustomFieldDefinitions = async () => {
    try {
      const response = await fetch(`${API_URL}/custom-fields?entity_type=user`);
      const data = await response.json();
      if (data.success) {
        setCustomFieldDefinitions(data.data);
      }
    } catch (err) {
      console.error('Error al cargar campos personalizados:', err);
    }
  };

  // Abrir modal para crear usuario
  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', email: '', password: '', role: 'operador' });
    setPhotoFile(null);
    setPreviewFoto(null);
    setCustomFields({});
    setShowModal(true);
  };

  // Abrir modal para editar usuario
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, username: user.username || '', email: user.email, password: '', role: user.role || 'operador' });
    setPhotoFile(null);
    setPreviewFoto(user.profile_photo ? `${API_URL.replace('/api', '')}/storage/profile_photos/${user.profile_photo}` : null);
    // Cargar valores de campos personalizados
    const customValues = {};
    user.custom_fields?.forEach(field => {
      if (field.value !== null && field.value !== undefined) {
        customValues[field.key] = field.value;
      }
    });
    setCustomFields(customValues);
    setShowModal(true);
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Manejar cambios de foto
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  // Eliminar foto
  const handleRemoveFoto = () => {
    setPhotoFile(null);
    setPreviewFoto(null);
  };

  // Guardar usuario
  const handleSave = async () => {
    try {
      if (!formData.name || !formData.username || !formData.email) {
        setError('nombre, usuario y email son requeridos');
        return;
      }

      if (!editingUser && !formData.password) {
        setError('La contraseña es requerida');
        return;
      }

      if (!editingUser && formData.password && formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/register`;
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser
        ? { ...formData, custom_fields: customFields }
        : {
            ...formData,
            password_confirmation: formData.password,
            custom_fields: customFields,
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        // Si hay foto para subir
        if (photoFile) {
          const userId = editingUser ? editingUser.id : data.user.id;
          const formDataPhoto = new FormData();
          formDataPhoto.append('photo', photoFile);

          const photoResponse = await fetch(`${API_URL}/users/${userId}/upload-photo`, {
            method: 'POST',
            body: formDataPhoto,
          });

          const photoData = await photoResponse.json();
          if (!photoData.success) {
            setError('Usuario guardado pero error al subir foto: ' + photoData.message);
          }
        }

        setError(null);
        setPhotoFile(null);
        setPreviewFoto(null);
        setShowModal(false);
        setSuccessMessage(editingUser ? 'Usuario actualizado correctamente' : 'Usuario registrado correctamente');
        loadUsers();
        setPagination(prev => ({ ...prev, current_page: 1 }));
      } else {
        // Mostrar errores de validación específicos si existen
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(', ');
          setError(errorMessages || data.message || 'Error al guardar usuario');
        } else {
          setError(data.message || 'Error al guardar usuario');
        }
      }
    } catch (err) {
      setError('Error al guardar usuario');
      console.error(err);
    }
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(term) ||
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.id?.toString().includes(term)
    );
  });

  // Paginación del lado del cliente
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (pagination.current_page - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
  }, [searchTerm]);

  // Eliminar usuario
  const handleDelete = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setError(null);
        setDeleteConfirm(null);
        setSuccessMessage('Usuario eliminado correctamente');
        loadUsers();
        // Ajustar página si eliminamos el último item de la página
        const newTotalPages = Math.ceil((filteredUsers.length - 1) / itemsPerPage);
        if (pagination.current_page > newTotalPages && newTotalPages > 0) {
          setPagination(prev => ({ ...prev, current_page: newTotalPages }));
        }
      } else {
        setError(data.message || 'Error al eliminar usuario');
      }
    } catch (err) {
      setError('Error al eliminar usuario');
      console.error(err);
    }
  };

  // Activar/Desactivar usuario
  const handleToggleActivo = async (user) => {
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/toggle-activo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message);
        loadUsers();
        // Ajustar página si toggle en última página con pocos items
        const newTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);
        if (pagination.current_page > newTotalPages && newTotalPages > 0) {
          setPagination(prev => ({ ...prev, current_page: newTotalPages }));
        }
      } else {
        setError(data.message || 'Error al cambiar estado del usuario');
      }
    } catch (err) {
      setError('Error al cambiar estado del usuario');
      console.error(err);
    }
  };

  const handleItemsPerPageChange = (value) => {
    const newValue = parseInt(value, 10);
    if (Number.isNaN(newValue) || newValue < 1) return;
    setItemsPerPage(newValue);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Gestión de Usuarios</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Administra todos los usuarios del sistema</p>
        </div>
        {hasPermission('create', 'users') && (
          <button
            onClick={handleCreate}
            className="group bg-[#c8f135] hover:bg-[#d4f74e] text-black font-semibold py-2 px-6 rounded-lg transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-[0_0_20px_rgba(200,241,53,0.4)]"
          >
            <span className="inline-flex items-center gap-2">
              <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Usuario
            </span>
          </button>
        )}
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

      {/* Search Bar */}
      <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="relative">
          <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, usuario, email o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            {searchTerm && ` para "${searchTerm}"`}
            {filteredUsers.length > itemsPerPage && ` • Mostrando página ${pagination.current_page} de ${totalPages}`}
          </div>
          {!loading && filteredUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className={`pl-3 pr-10 py-1.5 min-w-[4.75rem] rounded-lg text-sm border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#1a1a1a] border-gray-700 text-gray-100'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {[5, 10, 20, 50].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          )}
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
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nombre</th>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Usuario</th>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                  {customFieldDefinitions.map(field => (
                    <th key={field.id} className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {field.field_label}
                    </th>
                  ))}
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Registrado</th>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Estado</th>
                  <th className={`px-6 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7 + customFieldDefinitions.length} className="px-6 py-4 text-center text-gray-500">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-[#c8f135]/10' : 'border-gray-200 hover:bg-[#c8f135]/10'}`}>
                      <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>#{user.id}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        <div className="flex items-center gap-3">
                          <img
                            src={getProfileImage(user.profile_photo, user.name, API_URL.replace('/api', ''))}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = getProfileImage(null, user.name);
                            }}
                          />
                          {user.name}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm font-mono ${isDark ? 'text-[#c8f135]' : 'text-[#8ba328]'}`}>{user.username || '-'}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</td>
                      {customFieldDefinitions.map(field => {
                        const customField = user.custom_fields?.find(cf => cf.key === field.field_key);
                        const value = customField?.value;
                        return (
                          <td key={field.id} className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {value !== null && value !== undefined ? String(value) : '-'}
                          </td>
                        );
                      })}
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4">
                        {hasPermission('edit', 'users') ? (
                          <button
                            onClick={() => handleToggleActivo(user)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              user.activo
                                ? isDark ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-800 hover:bg-green-200'
                                : isDark ? 'bg-gray-700 text-gray-400 hover:bg-[#c8f135]/20' : 'bg-gray-200 text-gray-600 hover:bg-[#c8f135]/20'
                            }`}
                          >
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.activo
                              ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                              : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {hasPermission('edit', 'users') && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium mr-4 transition-all duration-200 ease-out transform hover:scale-105 hover:translate-x-0.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                        )}
                        {hasPermission('delete', 'users') && (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium transition-all duration-200 ease-out transform hover:scale-105 hover:translate-x-0.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación - solo si hay más registros que los mostrados por página */}
          {filteredUsers.length > itemsPerPage && (
            <div className={`flex justify-center items-center gap-2 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                disabled={pagination.current_page === 1}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Anterior
              </button>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Página {pagination.current_page} de {totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                disabled={pagination.current_page === totalPages}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 animate-fade-in ${isDark ? 'bg-black bg-opacity-75' : 'bg-black bg-opacity-50'}`}>
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-md border transition-all duration-300 ease-out transform scale-100 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Usuario</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                  placeholder="juanperez"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                  placeholder="juan@example.com"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contraseña {editingUser && '(dejar vacío si no deseas cambiarla)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rol
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                >
                  <option value="operador">Operador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="administrador">Administrador</option>
                  <option value="desarrollador">Desarrollador</option>
                </select>
              </div>

              {/* Campo de Foto de Perfil */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Foto de Perfil</label>
                <div className={`border-2 border-dashed rounded-lg p-4 ${isDark ? 'border-gray-600 hover:border-[#c8f135]' : 'border-gray-300 hover:border-[#c8f135]'}`}>
                  {previewFoto ? (
                    <div className="relative">
                      <img
                        src={previewFoto}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={handleRemoveFoto}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <svg className={`w-8 h-8 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Haz clic para subir foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Campos personalizados dinámicos */}
              <DynamicFormFields
                entityType="user"
                values={customFields}
                onChange={setCustomFields}
                isDark={isDark}
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 px-4 py-2 border font-medium rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-[#c8f135]/10' : 'border-gray-300 text-gray-700 hover:bg-[#c8f135]/10'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-[#c8f135] text-black font-medium rounded-lg hover:bg-[#d4f74e] transition-colors"
              >
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 animate-fade-in ${isDark ? 'bg-black bg-opacity-75' : 'bg-black bg-opacity-50'}`}>
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-sm border transition-all duration-300 ease-out transform scale-100 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Eliminar Usuario</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 border font-medium rounded-lg transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-[#c8f135]/10' : 'border-gray-300 text-gray-700 hover:bg-[#c8f135]/10'}`}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-700 text-white font-medium rounded-lg hover:bg-red-800 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
