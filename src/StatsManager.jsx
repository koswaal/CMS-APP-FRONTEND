import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import * as LucideIcons from 'lucide-react';

export default function StatsManager({ onStatsChanged }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Estado para filtros dinámicos
  const [availableFields, setAvailableFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadingValues, setLoadingValues] = useState(false);
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
    show_timeline: false,
    filters: [], // Nuevo campo para filtros
  });

  // Estado para drag and drop
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Tipos de entidad disponibles (cargados dinámicamente desde el backend)
  const [entityTypes, setEntityTypes] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Resetear a página 1 cuando cambian las stats
  useEffect(() => {
    setCurrentPage(1);
  }, [stats]);

  // Calcular estadísticas paginadas
  const totalPages = Math.ceil(stats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStats = stats.slice(startIndex, endIndex);

  // Iconos disponibles (subset de Lucide)
  const availableIcons = [
    // Gráficos y estadísticas
    'bar-chart', 'bar-chart-2', 'pie-chart', 'line-chart', 'trending-up', 'trending-down',
    'activity', 'gauge', 'percent', 'target', 'award', 'trophy',

    // Usuarios y personas
    'users', 'user', 'user-plus', 'user-minus', 'user-check', 'user-x',

    // Negocios y oficina
    'briefcase', 'building', 'landmark', 'store', 'store-front',
    'wallet', 'coins', 'banknote', 'receipt', 'calculator',

    // Documentos y archivos
    'file-text', 'file', 'file-plus', 'file-minus', 'files',
    'clipboard', 'clipboard-list', 'clipboard-check', 'folder', 'folder-open',
    'archive', 'database', 'save', 'download', 'upload',

    // Configuración y herramientas
    'settings', 'tool', 'wrench', 'sliders', 'filter', 'search',
    'cog', 'toggle-right', 'toggle-left', 'power', 'zap',

    // UI y navegación
    'home', 'menu', 'grid', 'grid-3x3', 'layout', 'list',
    'layers', 'tag', 'tags', 'hash', 'link', 'anchor',

    // Compras y transporte
    'shopping-cart', 'shopping-bag', 'truck', 'warehouse', 'package',
    'credit-card', 'dollar-sign',

    // Calendario y tiempo
    'calendar', 'calendar-days', 'calendar-check', 'clock', 'watch', 'timer',

    // Alertas y estados
    'alert-circle', 'alert-triangle', 'alert-octagon', 'info', 'help-circle',
    'bell', 'bell-ring', 'check-circle', 'x-circle',

    // Seguridad
    'shield', 'shield-check', 'shield-alert', 'lock', 'lock-open', 'key',

    // Otros
    'box', 'star', 'heart', 'thumbs-up', 'smile',
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

  // Cargar tipos de entidad disponibles
  const loadEntityTypes = async () => {
    try {
      setLoadingEntities(true);
      const response = await fetch(`${API_URL}/stats/entity-types`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setEntityTypes(data.entity_types || []);
      }
    } catch {
      // Silenciar error - las entidades hardcodeadas ya no existen
    } finally {
      setLoadingEntities(false);
    }
  };

  // Cargar campos disponibles para una entidad específica
  const loadEntityFields = async (entityTypeSlug) => {
    console.log('Cargando campos para entityTypeSlug:', entityTypeSlug);
    if (!entityTypeSlug) {
      setAvailableFields([]);
      return;
    }

    try {
      setLoadingFields(true);
      // Usar el endpoint completo que incluye los IDs y campos
      console.log('Haciendo fetch a:', `${API_URL}/entity-types`);
      const entityTypesResponse = await fetch(`${API_URL}/entity-types`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });
      const entityTypesData = await entityTypesResponse.json();
      
      console.log('Respuesta completa de entity-types:', entityTypesData);
      
      if (entityTypesData.success) {
        console.log('Buscando entity type con slug:', entityTypeSlug);
        console.log('Entity types disponibles:', entityTypesData.entity_types.map(et => ({ slug: et.slug, name: et.menu_name, hasFields: !!et.fields, fieldCount: et.fields?.length || 0 })));
        
        const entityType = entityTypesData.entity_types.find(et => et.slug === entityTypeSlug);
        if (entityType) {
          console.log('Entity type encontrado:', entityType);
          // Usar directamente los campos del entity type encontrado
          if (entityType.fields && entityType.fields.length > 0) {
            console.log('Campos encontrados para', entityTypeSlug, ':', entityType.fields);
            console.log('Detalle de campos:', entityType.fields.map(f => ({ name: f.name, label: f.label, type: f.type })));
            setAvailableFields(entityType.fields);
          } else {
            console.log('El entity type no tiene campos definidos:', entityTypeSlug);
            console.log('Propiedades del entity type:', Object.keys(entityType));
            setAvailableFields([]);
          }
        } else {
          console.log('No se encontró la entidad con slug:', entityTypeSlug);
          console.log('Slugs disponibles:', entityTypesData.entity_types.map(et => et.slug));
          setAvailableFields([]);
        }
      } else {
        console.log('Error obteniendo entity types:', entityTypesData.message);
        setAvailableFields([]);
      }
    } catch (error) {
      console.error('Error loading entity fields:', error);
      setAvailableFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  // Cargar valores únicos para un campo específico
  const loadFieldValues = async (entityType, fieldName) => {
    console.log('Cargando valores para campo:', fieldName, 'en entidad:', entityType);
    console.log('Campos disponibles para esta entidad:', availableFields.map(f => ({ name: f.name, label: f.label, type: f.type })));
    
    if (!entityType || !fieldName) {
      setFieldValues(prev => ({ ...prev, [fieldName]: [] }));
      return;
    }

    try {
      setLoadingValues(true);
      const url = `${API_URL}/dynamic/${encodeURIComponent(entityType)}/field-values?field=${encodeURIComponent(fieldName)}`;
      console.log('URL completa:', url);
      console.log('Parámetros:', { entityType, fieldName });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });
      
      console.log('Status response:', response.status);
      const data = await response.json();
      console.log('Respuesta completa de valores:', data);
      console.log('¿Success?', data.success);
      console.log('Values array:', data.values);
      console.log('Message:', data.message);

      if (data.success) {
        console.log('Valores encontrados:', data.values);
        console.log('Cantidad de valores:', data.values?.length || 0);
        setFieldValues(prev => ({ ...prev, [fieldName]: data.values || [] }));
      } else {
        console.log('Error en respuesta de valores:', data.message);
        console.log('Error details:', data);
        setFieldValues(prev => ({ ...prev, [fieldName]: [] }));
      }
    } catch (error) {
      console.error('Error loading field values:', error);
      setFieldValues(prev => ({ ...prev, [fieldName]: [] }));
    } finally {
      setLoadingValues(false);
    }
  };

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
    loadEntityTypes();
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

      console.log('Guardando estadística con datos:', formData);
      console.log('URL:', url);
      console.log('Método:', method);
      
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
          show_timeline: false,
          filters: [],
        });
        loadStats();
        if (onStatsChanged) onStatsChanged();
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
        // Notificar cambios para refrescar estadísticas en dashboard
        if (onStatsChanged) onStatsChanged();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar la estadística');
    }
  };

  
  const startEdit = (stat) => {
    console.log('Iniciando edición de estadística:', stat);
    console.log('Entity_type de la estadística:', stat.entity_type);
    setEditingId(stat.id);
    setFormData({
      label: stat.label,
      entity_type: stat.entity_type,
      icon: stat.icon,
      order: stat.order,
      active: stat.active,
      show_timeline: !!stat.show_timeline,
      filters: stat.filters || [],
    });
    setShowForm(true);
    // Cargar campos para la entidad seleccionada
    if (stat.entity_type) {
      console.log('Cargando campos para la entidad en edición:', stat.entity_type);
      loadEntityFields(stat.entity_type);
    }
  };

  // Funciones para drag and drop
  const handleDragStart = (e, stat, index) => {
    setDraggedItem({ stat, index });
    e.dataTransfer.effectAllowed = 'move';
    // Agregar estilo visual al elemento being dragged
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedItem) return;

    const { stat: draggedStat, index: draggedIndex } = draggedItem;
    
    if (draggedIndex === dropIndex) return;

    // Crear nueva lista de estadísticas activas
    const activeStats = stats.filter(s => s.active).sort((a, b) => a.order - b.order);
    const newActiveStats = [...activeStats];
    
    // Mover el elemento arrastrado a la nueva posición
    newActiveStats.splice(draggedIndex, 1);
    newActiveStats.splice(dropIndex, 0, draggedStat);

    // Actualizar órdenes en todas las estadísticas
    const allStats = [...stats];
    newActiveStats.forEach((stat, newIndex) => {
      const statIndex = allStats.findIndex(s => s.id === stat.id);
      if (statIndex !== -1) {
        allStats[statIndex].order = newIndex;
      }
    });

    setStats(allStats);

    // Guardar cambio en backend
    fetch(`${API_URL}/stats/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
      },
      body: JSON.stringify({ 
        stats: allStats.map(s => ({ id: s.id, order: s.order })) 
      }),
    }).catch(console.error);

    if (onStatsChanged) onStatsChanged();
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
                show_timeline: false,
                filters: [],
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
                onChange={(e) => {
                  const newEntityType = e.target.value;
                  console.log('Cambiando entity_type de', formData.entity_type, 'a', newEntityType);
                  setFormData({ ...formData, entity_type: newEntityType, filters: [] });
                  loadEntityFields(newEntityType);
                  console.log('Después de setFormData, formData.entity_type debería ser:', newEntityType);
                }}
                disabled={loadingEntities}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                  isDark
                    ? 'bg-[#0f0f0f] border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } ${loadingEntities ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">{loadingEntities ? 'Cargando entidades...' : 'Seleccionar entidad...'}</option>
                {/* Agrupar por categoría */}
                {Array.from(new Set(entityTypes.map(t => t.category))).map(category => (
                  <optgroup key={category} label={category}>
                    {entityTypes.filter(t => t.category === category).map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Campo de filtros */}
          {(
            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Filtros de conteo:
              </label>
              <div className={`rounded-lg border p-4 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Agregar campo de filtro
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          filters: [...formData.filters, { field: '', operator: '=', value: '' }]
                        });
                      }}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        isDark
                          ? 'bg-[#c8f135] text-black hover:bg-[#d4f54d]'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      + Agregar filtro
                    </button>
                  </div>

                  {formData.filters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={filter.field}
                        onChange={(e) => {
                          const newFilters = [...formData.filters];
                          const newField = e.target.value;
                          console.log('Cambio de campo:', { newField, entityType: formData.entity_type });
                          newFilters[index].field = newField;
                          newFilters[index].value = ''; // Reset value when field changes
                          setFormData({ ...formData, filters: newFilters });
                          // Load values for the new field
                          if (newField && formData.entity_type) {
                            console.log('Llamando a loadFieldValues con:', formData.entity_type, newField);
                            loadFieldValues(formData.entity_type, newField);
                          }
                        }}
                        className={`flex-1 px-3 py-1.5 rounded text-sm border outline-none ${
                          isDark
                            ? 'bg-[#0f0f0f] border-gray-700 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">{loadingFields ? 'Cargando campos...' : 'Seleccionar campo...'}</option>
                        {availableFields.map((field) => (
                          <option key={field.name} value={field.name}>
                            {field.label || field.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => {
                          const newFilters = [...formData.filters];
                          newFilters[index].operator = e.target.value;
                          setFormData({ ...formData, filters: newFilters });
                        }}
                        className={`px-3 py-1.5 rounded text-sm border outline-none ${
                          isDark
                            ? 'bg-[#0f0f0f] border-gray-700 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="=">Igual a (=)</option>
                        <option value="!=">Diferente de (!=)</option>
                        <option value="&gt;">Mayor que (&gt;)</option>
                        <option value="&gt;=">Mayor o igual (&gt;=)</option>
                        <option value="&lt;">Menor que (&lt;)</option>
                        <option value="&lt;=">Menor o igual (&lt;=)</option>
                        <option value="LIKE">Contiene (LIKE)</option>
                      </select>

                      {fieldValues[filter.field] && fieldValues[filter.field].length > 0 ? (
                        <select
                          value={filter.value}
                          onChange={(e) => {
                            const newFilters = [...formData.filters];
                            newFilters[index].value = e.target.value;
                            setFormData({ ...formData, filters: newFilters });
                          }}
                          className={`flex-1 px-3 py-1.5 rounded text-sm border outline-none ${
                            isDark
                              ? 'bg-[#0f0f0f] border-gray-700 text-white'
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">{loadingValues ? 'Cargando valores...' : 'Seleccionar valor...'}</option>
                          {fieldValues[filter.field].map((value) => (
                            <option key={value.id} value={value.id}>
                              {value.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => {
                            const newFilters = [...formData.filters];
                            newFilters[index].value = e.target.value;
                            setFormData({ ...formData, filters: newFilters });
                          }}
                          placeholder="Valor del filtro..."
                          className={`flex-1 px-3 py-1.5 rounded text-sm border outline-none ${
                            isDark
                              ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const newFilters = formData.filters.filter((_, i) => i !== index);
                          setFormData({ ...formData, filters: newFilters });
                        }}
                        className={`p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors`}
                        title="Eliminar filtro"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]"
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer max-w-md">
                <input
                  type="checkbox"
                  checked={formData.show_timeline}
                  onChange={(e) => setFormData({ ...formData, show_timeline: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]"
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Mostrar evolución en el dashboard (gráfico por día)
                </span>
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
                  show_timeline: false,
                  filters: [],
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
        <>
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
              {paginatedStats.map((stat) => (
                <tr key={stat.id} className={!stat.active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="text-center">
                      <span className="text-xs font-mono">{stat.order + 1}</span>
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
                    {entityTypes.find(t => t.value === stat.entity_type)?.category && (
                      <span className="block text-xs text-gray-500">
                        {entityTypes.find(t => t.value === stat.entity_type)?.category}
                      </span>
                    )}
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

        {/* Controles de paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Página {currentPage} de {totalPages} ({stats.length} estadísticas)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'hover:bg-[#c8f135]/20 text-[#c8f135]'
                      : 'hover:bg-green-100 text-green-700'
                }`}
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    currentPage === pageNum
                      ? isDark
                        ? 'bg-[#c8f135] text-[#0f0f0f] font-semibold'
                        : 'bg-green-500 text-white font-semibold'
                      : isDark
                        ? 'hover:bg-[#c8f135]/20 text-gray-300'
                        : 'hover:bg-green-100 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'hover:bg-[#c8f135]/20 text-[#c8f135]'
                      : 'hover:bg-green-100 text-green-700'
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Vista previa */}
      {!loading && stats.filter(s => s.active).length > 0 && (
        <div className="mt-8">
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>
            Vista Previa (Dashboard) - Arrastra y suelta para reordenar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats
              .filter(s => s.active)
              .sort((a, b) => a.order - b.order)
              .map((stat, index) => (
                <div
                  key={stat.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, stat, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`rounded-lg shadow-lg p-4 border cursor-move transition-all ${
                    isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'
                  } ${
                    dragOverIndex === index 
                      ? 'ring-2 ring-[#c8f135] ring-opacity-50 transform scale-105' 
                      : 'hover:shadow-xl'
                  } ${
                    draggedItem?.index === index ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stat.label}
                        </p>
                      </div>
                      <p className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {/* Este número se obtendrá dinámicamente del backend */}
                        --
                      </p>
                    </div>
                    <span className="text-3xl text-[#c8f135] ml-3">
                      {renderIcon(stat.icon, 'w-8 h-8')}
                    </span>
                  </div>
                  <div className={`mt-3 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Arrastra para reordenar
                  </div>
                </div>
              ))}
          </div>
          <div className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>
            💡 Tip: Arrastra y suelta las tarjetas para cambiar el orden de las estadísticas en el dashboard
          </div>
        </div>
      )}
    </div>
  );
}
