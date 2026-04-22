import { useState, useRef, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import { getProfileImage } from './avatarUtils';

export default function UserCard() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inicializar formulario con datos del usuario cuando se abre el modal
  useEffect(() => {
    if (showProfileModal && user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
      });
      setPreviewFoto(user?.profile_photo ? `${API_URL.replace('/api', '')}/storage/profile_photos/${user.profile_photo}` : null);
      setProfilePhoto(null);
    }
  }, [showProfileModal, user]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    setShowProfileModal(true);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validar que las contraseñas coincidan si se proporciona una
      if (formData.password && formData.password !== formData.password_confirmation) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      const updateData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(', ')
          : data.message || 'Error al actualizar perfil';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Si hay foto de perfil, subirla
      if (profilePhoto) {
        const formDataPhoto = new FormData();
        formDataPhoto.append('profile_photo', profilePhoto);

        const photoResponse = await fetch(`${API_URL}/users/${user.id}/upload-photo`, {
          method: 'POST',
          body: formDataPhoto,
        });

        const photoData = await photoResponse.json();
        if (photoResponse.ok && photoData.profile_photo) {
          data.user.profile_photo = photoData.profile_photo;
        }
      }

      setProfilePhoto(null);
      setPreviewFoto(null);

      // Actualizar el usuario en el contexto
      const updatedUser = {
        ...data.user,
        avatar: getProfileImage(data.user.profile_photo, data.user.name, API_URL.replace('/api', '')),
      };

      // Actualizar localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Recargar la página para actualizar el contexto
      window.location.reload();
      
      setSuccessMessage('Perfil actualizado exitosamente');
      setShowProfileModal(false);
      setLoading(false);
    } catch (err) {
      const errorMsg = err.message || 'Error de conexión con el servidor';
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  // Eliminar foto
  const handleRemoveFoto = () => {
    setProfilePhoto(null);
    setPreviewFoto(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 rounded-lg transition-colors hover:bg-[#c8f135]/10"
      >
        <img
          src={getProfileImage(user?.profile_photo, user?.name || 'User', API_URL.replace('/api', ''))}
          alt={user?.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-[#c8f135] transition-transform hover:scale-105"
          onError={(e) => {
            e.target.src = getProfileImage(null, user?.name || 'User');
          }}
        />
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {user?.name}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-72 rounded-lg shadow-xl border z-50 animate-fade-in ${
          isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* Header del dropdown con información del usuario */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <img
                src={getProfileImage(user?.profile_photo, user?.name || 'User', API_URL.replace('/api', ''))}
                alt={user?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#c8f135]"
                onError={(e) => {
                  e.target.src = getProfileImage(null, user?.name || 'User');
                }}
              />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'} truncate`}>
                  {user?.name}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                  {user?.email}
                </p>
                {user?.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[#c8f135] text-black text-xs font-bold rounded uppercase">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-2">
            <button
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                isDark ? 'text-gray-300 hover:bg-[#c8f135]/10 hover:text-[#c8f135]' : 'text-gray-700 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
              }`}
              onClick={handleProfileClick}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Configuración de Perfil</span>
            </button>

            <button
              onClick={() => {
                toggleTheme();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                isDark ? 'text-gray-300 hover:bg-[#c8f135]/10 hover:text-[#c8f135]' : 'text-gray-700 hover:bg-[#c8f135]/10 hover:text-[#c8f135]'
              }`}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>

            <div className={`my-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>
            
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                isDark ? 'text-red-400 hover:bg-[#c8f135]/10' : 'text-red-600 hover:bg-[#c8f135]/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de edición de perfil */}
      {showProfileModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 animate-fade-in ${isDark ? 'bg-black bg-opacity-75' : 'bg-black bg-opacity-50'}`}>
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-md border transition-all duration-300 ease-out transform scale-100 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Editar Perfil</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#c8f135]/10 text-gray-400' : 'hover:bg-[#c8f135]/10 text-gray-500'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                  {successMessage}
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Usuario *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nueva Contraseña (opcional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                  placeholder="Dejar en blanco para mantener la actual"
                />
              </div>

              {formData.password && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confirmar Contraseña *</label>
                  <input
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                    required
                  />
                </div>
              )}

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
                        type="button"
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-[#c8f135]/10' : 'bg-gray-200 text-gray-700 hover:bg-[#c8f135]/10'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''} bg-[#c8f135] text-black font-medium hover:bg-[#c8f135]/80`}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
