import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';

export default function Auditoria() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  
  const [auditoria, setAuditoria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const itemsPerPageRef = useRef(5);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const loadAuditoria = useCallback(async (page = 1, perPageOverride = null) => {
    try {
      setLoading(true);
      const perPage = perPageOverride != null ? perPageOverride : itemsPerPageRef.current;
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', String(perPage));
      if (searchTerm) params.append('search', searchTerm);
      if (filtroAccion) params.append('accion', filtroAccion);

      const response = await fetch(`${API_URL}/auditoria?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setAuditoria(data.auditoria);
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
        });
        setError(null);
      } else {
        setError(data.message || 'Error al cargar auditoría');
      }
    } catch (err) {
      console.error('Error en loadAuditoria:', err);
      setError('Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filtroAccion]);

  const handleItemsPerPageChange = (value) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n < 1) return;
    itemsPerPageRef.current = n;
    setItemsPerPage(n);
    loadAuditoria(1, n);
  };

  useEffect(() => {
    const delay = searchTerm === '' && filtroAccion === '' ? 0 : 300;
    const timer = setTimeout(() => {
      loadAuditoria(1);
    }, delay);
    return () => clearTimeout(timer);
  }, [searchTerm, filtroAccion, loadAuditoria]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Color según acción
  const getAccionColor = (accion) => {
    switch (accion) {
      case 'crear':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'editar':
        return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'eliminar':
        return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      default:
        return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700';
    }
  };

  // Icono según acción
  const getAccionIcono = (accion) => {
    switch (accion) {
      case 'crear':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'editar':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'eliminar':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      default:
        return null;
    }
  };

  
  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Auditoría</h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Historial de acciones en el sistema</p>
      </div>

      {/* Error */}
      {error && (
        <div className={`mb-4 p-4 border rounded-lg ${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'}`}>
          {error}
        </div>
      )}

      
      {/* Filtros */}
      <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por usuario, entidad o acción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100 placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'}`}
              />
            </div>
          </div>

          {/* Filtro por acción */}
          <div>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c8f135] focus:border-transparent ${isDark ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
            >
              <option value="">Todas las acciones</option>
              <option value="crear">Crear</option>
              <option value="editar">Editar</option>
              <option value="eliminar">Eliminar</option>
            </select>
          </div>
        </div>
        <div className={`mt-2 flex flex-wrap items-center justify-between gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <div>
            {pagination.total} {pagination.total === 1 ? 'registro' : 'registros'} encontrados
            {pagination.last_page > 1 && ` • Página ${pagination.current_page} de ${pagination.last_page}`}
          </div>
          {!loading && pagination.total > 0 && (
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

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className={`animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-4 ${isDark ? 'border-gray-700 border-t-[#c8f135]' : 'border-gray-300 border-t-[#c8f135]'}`}></div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando auditoría...</p>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg shadow-lg border overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fecha</th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Usuario</th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acción</th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Entidad</th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                  <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Dirección IP</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No hay registros de auditoría
                    </td>
                  </tr>
                ) : (
                  auditoria.map((registro) => (
                    <tr key={registro.id} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-[#c8f135]/10' : 'border-gray-200 hover:bg-[#c8f135]/10'}`}>
                      <td className={`px-4 py-3 text-sm whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(registro.created_at)}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        <div className="flex items-center gap-2">
                          {registro.user?.profile_photo ? (
                            <img 
                              src={`${API_URL.replace('/api', '')}/storage/profile_photos/${registro.user.profile_photo}`}
                              alt={registro.user_name || 'Usuario'}
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-[#c8f135] text-black' : 'bg-[#8ba328] text-white'}`}
                            style={{ display: registro.user?.profile_photo ? 'none' : 'flex' }}
                          >
                            {(registro.user_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span>{registro.user_name || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getAccionColor(registro.accion)}`}>
                          {getAccionIcono(registro.accion)}
                          {registro.accion.charAt(0).toUpperCase() + registro.accion.slice(1)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {registro.entidad.replace('_', ' ')}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {(registro.datos_nuevos || registro.datos_anteriores) ? (
                          <div className="space-y-1 text-xs">
                            <div className="font-mono text-[#c8f135] mb-1">
                              ID: #{registro.entidad_id}
                            </div>
                            {/* Si es usuario modificado o eliminado, mostrar el nombre del usuario afectado */}
                            {(registro.entidad === 'usuario' && (registro.accion === 'editar' || registro.accion === 'eliminar')) ? (
                              <div className="text-blue-600">
                                <span className="font-medium">Usuario:</span> {
                                  (registro.datos_nuevos && registro.datos_nuevos.name) || 
                                  (registro.datos_anteriores && registro.datos_anteriores.name) || 
                                  'Desconocido'
                                }
                              </div>
                            ) : null}
                            {(registro.datos_nuevos && registro.datos_nuevos.menu_name) || (registro.datos_anteriores && registro.datos_anteriores.menu_name) ? (
                              <div><span className="font-medium">Menú:</span> <span className="text-[#c8f135]">{(registro.datos_nuevos && registro.datos_nuevos.menu_name) || (registro.datos_anteriores && registro.datos_anteriores.menu_name)}</span></div>
                            ) : null}
                            {(registro.datos_nuevos && registro.datos_nuevos.form_title) || (registro.datos_anteriores && registro.datos_anteriores.form_title) ? (
                              <div><span className="font-medium">Formulario:</span> <span className="text-[#c8f135]">{(registro.datos_nuevos && registro.datos_nuevos.form_title) || (registro.datos_anteriores && registro.datos_anteriores.form_title)}</span></div>
                            ) : null}
                            {(registro.datos_nuevos && registro.datos_nuevos.label) || (registro.datos_anteriores && registro.datos_anteriores.label) ? (
                              <div><span className="font-medium">Estadística:</span> <span className="text-[#c8f135]">{(registro.datos_nuevos && registro.datos_nuevos.label) || (registro.datos_anteriores && registro.datos_anteriores.label)}</span></div>
                            ) : null}
                            {(registro.datos_nuevos && registro.datos_nuevos.entity_type) || (registro.datos_anteriores && registro.datos_anteriores.entity_type) ? (
                              <div><span className="font-medium">Entidad:</span> <span className="text-[#c8f135]">{(registro.datos_nuevos && registro.datos_nuevos.entity_type) || (registro.datos_anteriores && registro.datos_anteriores.entity_type)}</span></div>
                            ) : null}
                            {(registro.datos_nuevos && registro.datos_nuevos.fields_count !== null && registro.datos_nuevos.fields_count > 0) ? (
                              <div><span className="font-medium">Campos:</span> <span className="text-[#c8f135]">{registro.datos_nuevos.fields_count}</span></div>
                            ) : null}
                            {(registro.datos_nuevos && registro.datos_nuevos.type) || (registro.datos_anteriores && registro.datos_anteriores.type) ? (
                              <div><span className="font-medium">Tipo:</span> <span className="text-[#c8f135]">{(registro.datos_nuevos && registro.datos_nuevos.type) || (registro.datos_anteriores && registro.datos_anteriores.type)}</span></div>
                            ) : null}
                            {(registro.datos_nuevos && registro.datos_nuevos.has_submenu) || (registro.datos_anteriores && registro.datos_anteriores.has_submenu) ? (
                              <div className="text-blue-600"><span className="font-medium">Contenedor padre</span> con submenús</div>
                            ) : null}
                            {registro.accion === 'eliminar' ? (
                              <div className="text-red-600"><span className="font-medium">Eliminado</span></div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            <div className="font-mono text-[#c8f135]">
                              ID: #{registro.entidad_id}
                            </div>
                            {/* Si es sesión, mostrar el usuario afectado */}
                            {registro.entidad === 'sesion' ? (
                              <div className="text-blue-600">
                                <span className="font-medium">Usuario:</span> {
                                  (registro.datos_nuevos && registro.datos_nuevos.username) || 
                                  (registro.datos_anteriores && registro.datos_anteriores.username) || 
                                  'Sistema'
                                }
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {registro.ip_address || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.last_page > 1 && (
            <div className={`flex justify-center items-center gap-2 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => loadAuditoria(pagination.current_page - 1)}
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
                Página {pagination.current_page} de {pagination.last_page}
              </span>
              <button
                onClick={() => loadAuditoria(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
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
    </div>
  );
}
