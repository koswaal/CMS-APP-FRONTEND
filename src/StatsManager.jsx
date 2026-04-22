import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import * as LucideIcons from 'lucide-react';

export default function StatsManager() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado para formulario
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    entity_type: '',
    icon: 'bar-chart',
    order: 0,
    active: true,
  });

  // Tipos de entidad disponibles
  const entityTypes = [
    { value: 'inmuebles', label: 'Inmuebles' },
    { value: 'users', label: 'Usuarios' },
    { value: 'tipos-inmuebles', label: 'Tipos de Inmuebles' },
    { value: 'ubicaciones', label: 'Ubicaciones' },
    { value: 'entity-types', label: 'Módulos Personalizados' },
    { value: 'auditoria', label: 'Registros de Auditoría' },
  ];

  // Iconos disponibles
  const availableIcons = [
    'bar-chart', 'pie-chart', 'trending-up', 'users', 'box',
    'folder', 'file-text', 'database', 'home', 'building',
    'clipboard', 'settings', 'activity', 'layers', 'grid',
  ];

  // Búsqueda de iconos
  const [iconSearch, setIconSearch] = useState('');
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  const renderIcon = (iconName, className = 'w-5 h-5') => {
    const pascalCase = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const IconComponent = LucideIcons[pascalCase] || LucideIcons.BarChart;
    return <IconComponent className={className} />;
  };

  const filteredIcons = availableIcons.filter(icon =>
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.stats || []);
      } else {
        setError('Error al cargar estadísticas');
      }
    } catch {
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Guardar estadística
  const handleSave = async () => {
    if (!formData.label || !formData.entity_type) {
      setError('El título y el tipo de entidad son requeridos');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const url = editingId
        ? `${API_URL}/stats/${editingId}`
        : `${API_URL}/stats`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingId ? 'Estadística actualizada correctamente' : 'Estadística creada correctamente');
        setShowForm(false);
        setEditingId(null);
        setFormData({
          label: '',
          entity_type: '',
          icon: 'bar-chart',
          order: 0,
          active: true,
        });
        loadStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error al guardar');
      }
    } catch {
      setError('Error al guardar la estadística');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar estadística
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta estadística?')) return;

    try {
      const response = await fetch(`${API_URL}/stats/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Estadística eliminada correctamente');
        loadStats();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar la estadística');
    }
  };

  // Mover estadística
  const moveStat = (index, direction) => {
    if ((direction === 'up' && index === 0) ||
        (direction === 'down' && index === stats.length - 1)) {
      return;
    }

    const newStats = [...stats];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Intercambiar
    [newStats[index], newStats[targetIndex]] = [newStats[targetIndex], newStats[index]];

    // Actualizar órdenes
    const updatedStats = newStats.map((stat, i) => ({ ...stat, order: i }));

    setStats(updatedStats);

    // Guardar cambio en backend
    fetch(`${API_URL}/stats/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
      },
      body: JSON.stringify({ stats: updatedStats.map(s => ({ id: s.id, order: s.order })) }),
    }).catch(console.error);
  };

  const startEdit = (stat) => {
    setEditingId(stat.id);
    setFormData({
      label: stat.label,
      entity_type: stat.entity_type,
      icon: stat.icon,
      order: stat.order,
      active: stat.active,
    });
    setShowForm(true);
  };

  return (
    <div className={`p-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>
            Gestión de Estadísticas
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Personaliza los paneles de estadísticas del inicio
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setFormData({
                label: '',
                entity_type: '',
                icon: 'bar-chart',
                order: stats.length,
                active: true,
              });
            }
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showForm
              ? isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-[#c8f135] text-black hover:bg-[#d4f54d]'
          }`}
        >
          {showForm ? 'Cancelar' : '+ Nueva Estadística'}
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className={`rounded-lg border p-6 mb-6 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Estadística' : 'Nueva Estadística'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Título:
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ej: Total de Módulos"
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                  isDark
                    ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Entidad a contar:
              </label>
              <select
                value={formData.entity_type}
                onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                  isDark
                    ? 'bg-[#0f0f0f] border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Seleccionar entidad...</option>
                {entityTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Icono:
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowIconDropdown(!showIconDropdown)}
                  className={`w-full px-4 py-2 rounded-lg border cursor-pointer flex items-center justify-between ${
                    isDark
                      ? 'bg-[#0f0f0f] border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {renderIcon(formData.icon, 'w-5 h-5')}
                    <span>{formData.icon}</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${showIconDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {showIconDropdown && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-auto ${
                    isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'
                  }`}>
                    <div className="p-2">
                      <input
                        type="text"
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        placeholder="Buscar icono..."
                        className={`w-full px-3 py-1.5 rounded text-sm border outline-none ${
                          isDark
                            ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <div className="divide-y divide-gray-700/50">
                      {filteredIcons.map((icon) => (
                        <div
                          key={icon}
                          onClick={() => {
                            setFormData({ ...formData, icon });
                            setShowIconDropdown(false);
                            setIconSearch('');
                          }}
                          className={`px-4 py-2 cursor-pointer flex items-center gap-3 hover:bg-[#c8f135]/10 ${
                            formData.icon === icon ? 'bg-[#c8f135]/20 text-[#c8f135]' : isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {renderIcon(icon, `w-5 h-5 ${formData.icon === icon ? 'text-[#c8f135]' : ''}`)}
                          <span className="text-sm">{icon}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]"
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Activo</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                saving
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-[#c8f135] text-black hover:bg-[#d4f54d]'
              }`}
            >
              {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear')}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  label: '',
                  entity_type: '',
                  icon: 'bar-chart',
                  order: stats.length,
                  active: true,
                });
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de estadísticas */}
      {loading ? (
        <div className="text-center py-8">
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cargando estadísticas...</p>
        </div>
      ) : stats.length === 0 ? (
        <div className={`text-center py-8 rounded-lg border ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No hay estadísticas configuradas. Crea una nueva para comenzar.
          </p>
        </div>
      ) : (
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Orden</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Icono</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Entidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700 bg-[#1a1a1a]' : 'divide-gray-200 bg-white'}`}>
              {stats.map((stat, index) => (
                <tr key={stat.id} className={!stat.active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveStat(index, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${index === 0 ? 'opacity-30' : 'hover:bg-gray-700 text-gray-400 hover:text-[#c8f135]'}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className="text-xs text-center font-mono">{stat.order + 1}</span>
                      <button
                        onClick={() => moveStat(index, 'down')}
                        disabled={index === stats.length - 1}
                        className={`p-1 rounded ${index === stats.length - 1 ? 'opacity-30' : 'hover:bg-gray-700 text-gray-400 hover:text-[#c8f135]'}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-2xl text-[#c8f135]">
                      {renderIcon(stat.icon, 'w-6 h-6')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{stat.label}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {entityTypes.find(t => t.value === stat.entity_type)?.label || stat.entity_type}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      stat.active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {stat.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(stat)}
                        className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(stat.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista previa */}
      {!loading && stats.filter(s => s.active).length > 0 && (
        <div className="mt-8">
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>
            Vista Previa (Dashboard)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats
              .filter(s => s.active)
              .sort((a, b) => a.order - b.order)
              .map((stat) => (
                <div
                  key={stat.id}
                  className={`rounded-lg shadow-lg p-4 border ${
                    isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {/* Este número se obtendrá dinámicamente del backend */}
                        --
                      </p>
                    </div>
                    <span className="text-3xl text-[#c8f135]">
                      {renderIcon(stat.icon, 'w-8 h-8')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
