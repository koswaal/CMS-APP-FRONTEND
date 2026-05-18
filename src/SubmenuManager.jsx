import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import * as LucideIcons from 'lucide-react';

export default function SubmenuManager({ isOpen, onClose, containerId, containerName, onSuccess }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [submenus, setSubmenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableEntities, setAvailableEntities] = useState([]);

  // Búsqueda de iconos
  const [iconSearch, setIconSearch] = useState('');
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    menu_name: '',
    menu_icon: 'folder-open',
    form_title: '',
    fields: [
      { name: 'campo 1', type: 'text', required: false, max_length: 255 },
    ],
  });
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const fieldTypes = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Fecha' },
    { value: 'boolean', label: 'Sí/No' },
    { value: 'textarea', label: 'Texto largo' },
    { value: 'select-entity', label: 'Select de otra entidad' },
    { value: 'id', label: 'ID del registro' },
    { value: 'correlativo', label: 'Número correlativo' },
  ];

  // Iconos disponibles (subset de Lucide)
  const availableIcons = [
    // Carpetas y archivos
    'folder-open', 'folder', 'folder-plus', 'folder-minus',
    'file-text', 'file', 'file-plus', 'file-minus', 'files',
    'box', 'archive', 'database', 'save', 'download', 'upload',
    
    // Comunicación
    'mail', 'inbox', 'send', 'message-circle', 'message-square', 'phone', 'at-sign',
    
    // Documentos y escritura
    'clipboard', 'clipboard-list', 'clipboard-check', 'paperclip', 'pen-tool', 'edit',
    'book', 'book-open', 'bookmark', 'book-marked',
    
    // Compras y transporte
    'shopping-cart', 'shopping-bag', 'truck', 'warehouse', 'package',
    'credit-card', 'dollar-sign', 'banknote', 'receipt', 'calculator',
    
    // Usuarios y personas
    'users', 'user', 'user-plus', 'user-minus', 'user-check', 'user-x',
    'heart', 'star', 'thumbs-up', 'smile', 'frown',
    
    // Configuración y herramientas
    'settings', 'tool', 'wrench', 'sliders', 'filter', 'search',
    'cog', 'toggle-right', 'toggle-left', 'power', 'zap', 'flashlight',
    
    // Gráficos y estadísticas
    'bar-chart', 'bar-chart-2', 'pie-chart', 'line-chart', 'trending-up', 'trending-down',
    'activity', 'gauge', 'percent', 'target', 'award', 'trophy',
    
    // Calendario y tiempo
    'calendar', 'calendar-days', 'calendar-check', 'calendar-x',
    'clock', 'watch', 'timer', 'hourglass', 'sun', 'moon',
    
    // UI y navegación
    'home', 'menu', 'grid', 'grid-3x3', 'layout', 'list',
    'plus', 'plus-circle', 'plus-square', 'minus', 'minus-circle', 'minus-square',
    'check', 'check-circle', 'check-square', 'x', 'x-circle', 'x-square',
    'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
    'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
    'corner-up-right', 'corner-up-left', 'maximize', 'minimize',
    
    // Alertas y estados
    'alert-circle', 'alert-triangle', 'alert-octagon', 'info', 'help-circle',
    'bell', 'bell-ring', 'bell-off', 'shield', 'shield-check', 'shield-alert',
    
    // Mapas y ubicación
    'map', 'map-pin', 'navigation', 'compass', 'globe', 'locate',
    'pin', 'flag', 'flag-triangle-right',
    
    // Hardware y dispositivos
    'monitor', 'laptop', 'tablet', 'smartphone', 'printer', 'server',
    'hard-drive', 'cpu', 'wifi', 'bluetooth', 'battery',
    
    // Multimedia
    'camera', 'video', 'mic', 'headphones', 'image', 'images',
    'music', 'play', 'pause', 'skip-forward', 'skip-back',
    
    // Vehículos y transporte
    'car', 'bus', 'train', 'plane', 'ship', 'bike', 'truck',
    
    // Edificios
    'building', 'building-2', 'home', 'store', 'factory', 'landmark',
    
    // Médico y salud
    'heart-pulse', 'stethoscope', 'syringe', 'pill', 'activity',
    
    // Otros objetos
    'briefcase', 'glasses', 'key', 'lock', 'unlock', 'umbrella',
    'coffee', 'utensils', 'wine', 'beer',
    'code', 'terminal', 'github', 'git-branch',
    'layers', 'tag', 'tags', 'hash', 'link', 'anchor',
    'anchor', 'aperture', 'anchor',
  ];

  // Función para renderizar icono dinámico
  const renderIcon = (iconName, className = 'w-5 h-5') => {
    const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const IconComponent = LucideIcons[pascalCase] || LucideIcons.Box;
    return <IconComponent className={`${className} stroke-current`} />;
  };

  // Filtrar iconos según búsqueda
  const filteredIcons = availableIcons.filter(icon =>
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );

  // Cargar submenús del contenedor
  const fetchSubmenus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/entity-types?all=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const children = data.entity_types.filter(et => et.parent_id === containerId);
        setSubmenus(children);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error al cargar submenús: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && containerId) {
      fetchSubmenus();
    }
  }, [isOpen, containerId]);

  // Cargar entidades disponibles para selects
  useEffect(() => {
    if (isOpen) {
      const fetchEntities = async () => {
        try {
          const response = await fetch(`${API_URL}/entity-types?all=true`);
          const data = await response.json();
          if (data.success) {
            setAvailableEntities(data.entity_types || []);
          }
        } catch (error) {
          console.error('Error loading entities:', error);
        }
      };
      fetchEntities();
    }
  }, [isOpen]);

  // Agregar campo al formulario
  const addField = () => {
    setFormData({
      ...formData,
      fields: [
        ...formData.fields,
        { name: `campo ${formData.fields.length + 1}`, type: 'text', required: false, max_length: 255 },
      ],
    });
  };

  // Agregar campo al formulario de edición
  const addFieldToEdit = () => {
    setEditFormData({
      ...editFormData,
      fields: [
        ...editFormData.fields,
        { name: `campo ${editFormData.fields.length + 1}`, type: 'text', required: false, max_length: 255 },
      ],
    });
  };

  // Actualizar campo en formulario de edición
  const updateEditField = (index, field, value) => {
    const newFields = [...editFormData.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setEditFormData({ ...editFormData, fields: newFields });
  };

  // Remover campo en formulario de edición
  const removeEditField = (index) => {
    if (editFormData.fields.length <= 1) return;
    const newFields = [...editFormData.fields];
    newFields.splice(index, 1);
    setEditFormData({ ...editFormData, fields: newFields });
  };

  // Remover campo
  const removeField = (index) => {
    if (formData.fields.length <= 1) return;
    const newFields = [...formData.fields];
    newFields.splice(index, 1);
    setFormData({ ...formData, fields: newFields });
  };

  // Actualizar campo
  const updateField = (index, field, value) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFormData({ ...formData, fields: newFields });
  };

  // Crear nuevo submenú
  const handleCreate = async () => {
    if (!formData.menu_name.trim() || !formData.form_title.trim()) {
      setError('El nombre del menú y título del formulario son requeridos');
      return;
    }

    const invalidField = formData.fields.find(f => !f.name.trim());
    if (invalidField) {
      setError('Todos los campos deben tener un nombre');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/entity-types/${containerId}/submenus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddForm(false);
        setFormData({
          menu_name: '',
          menu_icon: 'folder-open',
          form_title: '',
          fields: [{ name: 'campo 1', type: 'text', required: false }],
        });
        fetchSubmenus();
        onSuccess?.();
      } else {
        setError(data.message || 'Error al crear submenú');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Abrir formulario de edición
  const handleEdit = (submenu) => {
    setEditFormData({
      id: submenu.id,
      menu_name: submenu.menu_name || '',
      menu_icon: submenu.menu_icon || 'folder-open',
      form_title: submenu.form_title || '',
      fields: submenu.fields?.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required || false,
        max_length: f.max_length || 255,
        entity_source: f.config?.entity_source || '',
      })) || [{ name: 'campo 1', type: 'text', required: false, max_length: 255 }],
    });
    setEditFormOpen(true);
    setShowAddForm(false);
  };

  // Guardar edición de submenú
  const saveEdit = async () => {
    if (!editFormData.menu_name.trim()) {
      setError('El nombre del menú es obligatorio');
      return;
    }
    if (!editFormData.form_title.trim()) {
      setError('El título del formulario es obligatorio');
      return;
    }

    const invalidField = editFormData.fields.find(f => !f.name.trim());
    if (invalidField) {
      setError('Todos los campos deben tener un nombre');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/entity-types/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify({
          menu_name: editFormData.menu_name,
          menu_icon: editFormData.menu_icon,
          form_title: editFormData.form_title,
          fields: editFormData.fields.map(f => ({
            name: f.name,
            type: f.type,
            required: f.required,
            max_length: f.max_length,
            entity_source: f.entity_source,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditFormOpen(false);
        setEditFormData(null);
        fetchSubmenus();
        onSuccess?.();
      } else {
        setError(data.message || 'Error al actualizar submenú');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar submenú
  const handleDelete = async (submenuId) => {
    if (!confirm('¿Estás seguro de eliminar este submenú? Se perderán todos los datos.')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/entity-types/${submenuId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchSubmenus();
        onSuccess?.();
      } else {
        setError(data.message || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/80' : 'bg-black/60'}`}>
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700 bg-[#c8f135]/10' : 'border-gray-200 bg-green-50'}`}>
          <div>
            <h2 className="text-xl font-bold text-[#c8f135]">
              Gestión de Submenús
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Contenedor: <span className="font-medium">{containerName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Error */}
          {error && (
            <div className={`px-4 py-3 rounded-lg border mb-4 ${isDark ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* Lista de submenús existentes */}
          {!showAddForm && !editFormOpen && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Submenús existentes ({submenus.length})
                </h3>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar submenú
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c8f135]" />
                </div>
              ) : submenus.length === 0 ? (
                <div className={`text-center py-8 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-500'}`}>
                  <p className="mb-2">No hay submenús en este contenedor</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-[#c8f135] hover:underline"
                  >
                    Crear el primero →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {submenus.map((submenu) => (
                    <div
                      key={submenu.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-[#0f0f0f] border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xl ${isDark ? 'text-[#c8f135]' : 'text-green-600'}`}>
                          {renderIcon(submenu.menu_icon, 'w-6 h-6')}
                        </span>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {submenu.menu_name}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {submenu.fields?.length || 0} campos • {submenu.form_title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(submenu)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-100 text-blue-600'}`}
                          title="Editar submenú"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(submenu.id)}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                          title="Eliminar submenú"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Formulario para agregar submenú */}
          {showAddForm && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                  }}
                  className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver a la lista
                </button>
              </div>

              <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>
                Nuevo Submenú
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nombre del menú:
                  </label>
                  <input
                    type="text"
                    value={formData.menu_name}
                    onChange={(e) => setFormData({ ...formData, menu_name: e.target.value })}
                    placeholder="Ej: Productos"
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                      isDark
                        ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
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
                        {renderIcon(formData.menu_icon, `w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`)}
                        <span>{formData.menu_icon}</span>
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
                                setFormData({ ...formData, menu_icon: icon });
                                setShowIconDropdown(false);
                                setIconSearch('');
                              }}
                              className={`px-4 py-2 cursor-pointer flex items-center gap-3 hover:bg-[#c8f135]/10 ${
                                formData.menu_icon === icon ? 'bg-[#c8f135]/20 text-[#c8f135]' : isDark ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {renderIcon(icon, `w-5 h-5 ${formData.menu_icon === icon ? 'text-[#c8f135]' : isDark ? 'text-white' : 'text-gray-900'}`)}
                              <span className="text-sm">{icon}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Título del formulario:
                </label>
                <input
                  type="text"
                  value={formData.form_title}
                  onChange={(e) => setFormData({ ...formData, form_title: e.target.value })}
                  placeholder="Ej: Nuevo Producto"
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                    isDark
                      ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Campos del formulario */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Campos del formulario:
                  </label>
                  <button
                    onClick={addField}
                    className="text-sm text-[#c8f135] hover:underline"
                  >
                    + Agregar campo
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {formData.fields.map((field, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f0f0f] border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${isDark ? 'bg-[#c8f135]/20 text-[#c8f135]' : 'bg-green-100 text-green-700'}`}>
                          Campo {index + 1}
                        </span>
                        {formData.fields.length > 1 && (
                          <button
                            onClick={() => removeField(index)}
                            className={`text-xs px-2 py-1 rounded ${isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-100'}`}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="grid md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(index, 'name', e.target.value)}
                            placeholder="Nombre del campo"
                            className={`px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                              isDark
                                ? 'bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />

                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, 'type', e.target.value)}
                            className={`px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                              isDark
                                ? 'bg-[#1a1a1a] border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>

                          {field.type !== 'id' && field.type !== 'correlativo' && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(index, 'required', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]"
                              />
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Requerido</span>
                            </label>
                          )}
                        </div>

                        {/* Mensaje para campo ID */}
                        {field.type === 'id' && (
                          <div className={`text-xs px-3 py-2 rounded border ${isDark ? 'bg-[#c8f135]/10 border-[#c8f135]/30 text-[#c8f135]' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            Este campo mostrará automáticamente el número de registro (ID)
                          </div>
                        )}

                        {/* Mensaje para campo Correlativo */}
                        {field.type === 'correlativo' && (
                          <div className={`text-xs px-3 py-2 rounded border ${isDark ? 'bg-[#c8f135]/10 border-[#c8f135]/30 text-[#c8f135]' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            Se asignará automáticamente el siguiente número secuencial para este módulo (1, 2, 3...)
                          </div>
                        )}

                        {/* Selector de entidad (solo para tipo select-entity) */}
                        {field.type === 'select-entity' && (
                          <select
                            value={field.entity_source || ''}
                            onChange={(e) => updateField(index, 'entity_source', e.target.value)}
                            className={`w-full px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                              isDark
                                ? 'bg-[#1a1a1a] border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Seleccionar entidad...</option>
                            {availableEntities.map((entity) => (
                              <option key={entity.id} value={entity.slug}>
                                {entity.menu_name}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Longitud máxima (solo para text, email, textarea) */}
                        {['text', 'email', 'textarea'].includes(field.type) && (
                          <div className="flex items-center gap-2">
                            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Longitud máxima:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={field.max_length || 255}
                              onChange={(e) => updateField(index, 'max_length', parseInt(e.target.value) || 255)}
                              className={`w-20 px-2 py-1 rounded border text-sm ${
                                isDark
                                  ? 'bg-[#1a1a1a] border-gray-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className={`flex gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                    loading
                      ? 'opacity-50 cursor-not-allowed bg-gray-400'
                      : 'bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? 'Creando...' : 'Crear Submenú'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                    setFormData({
                      menu_name: '',
                      menu_icon: 'folder-open',
                      form_title: '',
                      fields: [{ name: 'campo 1', type: 'text', required: false, max_length: 255 }],
                    });
                  }}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Formulario para editar submenú */}
          {editFormOpen && editFormData && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setEditFormOpen(false);
                    setEditFormData(null);
                    setError(null);
                  }}
                  className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Volver a la lista
                </button>
              </div>

              <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>
                Editar Submenú
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nombre del menú:
                  </label>
                  <input
                    type="text"
                    value={editFormData.menu_name}
                    onChange={(e) => setEditFormData({ ...editFormData, menu_name: e.target.value })}
                    placeholder="Ej: Productos"
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                      isDark
                        ? 'bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Icono:
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowIconDropdown(!showIconDropdown)}
                      className={`w-full px-4 py-2 rounded-lg border flex items-center justify-between gap-2 ${
                        isDark
                          ? 'bg-[#1a1a1a] border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {renderIcon(editFormData.menu_icon, `w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`)}
                        {editFormData.menu_icon}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showIconDropdown && (
                      <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                        isDark ? 'bg-[#1a1a1a] border-gray-600' : 'bg-white border-gray-300'
                      }`}>
                        <div className="p-2">
                          <input
                            type="text"
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            placeholder="Buscar icono..."
                            className={`w-full px-3 py-2 rounded border mb-2 text-sm ${
                              isDark
                                ? 'bg-[#0f0f0f] border-gray-600 text-white placeholder-gray-500'
                                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />
                          <div className="grid grid-cols-5 gap-1">
                            {availableIcons
                              .filter(icon => icon.includes(iconSearch.toLowerCase()))
                              .map((icon) => (
                                <button
                                  key={icon}
                                  onClick={() => {
                                    setEditFormData({ ...editFormData, menu_icon: icon });
                                    setShowIconDropdown(false);
                                    setIconSearch('');
                                  }}
                                  className={`p-2 rounded flex items-center justify-center ${
                                    editFormData.menu_icon === icon
                                      ? 'bg-[#c8f135] text-[#1a1a1a]'
                                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                  }`}
                                  title={icon}
                                >
                                  {renderIcon(icon, `w-5 h-5 ${editFormData.menu_icon === icon ? '' : isDark ? 'text-white' : 'text-gray-900'}`)}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Título del formulario:
                </label>
                <input
                  type="text"
                  value={editFormData.form_title}
                  onChange={(e) => setEditFormData({ ...editFormData, form_title: e.target.value })}
                  placeholder="Ej: Nuevo Producto"
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                    isDark
                      ? 'bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Campos del formulario */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Campos del formulario:
                  </label>
                  <button
                    onClick={addFieldToEdit}
                    className="text-sm text-[#c8f135] hover:underline"
                  >
                    + Agregar campo
                  </button>
                </div>

                <div className="space-y-3">
                  {editFormData.fields.map((field, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f0f0f] border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${isDark ? 'bg-[#c8f135]/20 text-[#c8f135]' : 'bg-green-100 text-green-700'}`}>
                          Campo {index + 1}
                        </span>
                        {editFormData.fields.length > 1 && (
                          <button
                            onClick={() => removeEditField(index)}
                            className={`text-xs px-2 py-1 rounded ${isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-100'}`}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="grid md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateEditField(index, 'name', e.target.value)}
                            placeholder="Nombre del campo"
                            className={`px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                              isDark
                                ? 'bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />

                          <select
                            value={field.type}
                            onChange={(e) => updateEditField(index, 'type', e.target.value)}
                            className={`px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                              isDark
                                ? 'bg-[#1a1a1a] border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>

                          {field.type !== 'id' && field.type !== 'correlativo' && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateEditField(index, 'required', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]"
                              />
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Requerido</span>
                            </label>
                          )}
                        </div>

                        {/* Mensaje para campo ID */}
                        {field.type === 'id' && (
                          <div className={`text-xs px-3 py-2 rounded border ${isDark ? 'bg-[#c8f135]/10 border-[#c8f135]/30 text-[#c8f135]' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            Este campo mostrará automáticamente el número de registro (ID)
                          </div>
                        )}

                        {/* Mensaje para campo Correlativo */}
                        {field.type === 'correlativo' && (
                          <div className={`text-xs px-3 py-2 rounded border ${isDark ? 'bg-[#c8f135]/10 border-[#c8f135]/30 text-[#c8f135]' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            Se asignará automáticamente el siguiente número secuencial para este módulo (1, 2, 3...)
                          </div>
                        )}

                        {/* Selector de entidad (solo para tipo select-entity) */}
                        {field.type === 'select-entity' && (
                          <select
                            value={field.entity_source || ''}
                            onChange={(e) => updateEditField(index, 'entity_source', e.target.value)}
                            className={`w-full px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                              isDark
                                ? 'bg-[#1a1a1a] border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Seleccionar entidad...</option>
                            {availableEntities.map((entity) => (
                              <option key={entity.id} value={entity.slug}>
                                {entity.menu_name}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Longitud máxima (solo para text, email, textarea) */}
                        {['text', 'email', 'textarea'].includes(field.type) && (
                          <div className="flex items-center gap-2">
                            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Longitud máxima:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={field.max_length || 255}
                              onChange={(e) => updateEditField(index, 'max_length', parseInt(e.target.value) || 255)}
                              className={`w-20 px-2 py-1 rounded border text-sm ${
                                isDark
                                  ? 'bg-[#1a1a1a] border-gray-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className={`flex gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                <button
                  onClick={saveEdit}
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                    loading
                      ? 'opacity-50 cursor-not-allowed bg-gray-400'
                      : 'bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  onClick={() => {
                    setEditFormOpen(false);
                    setEditFormData(null);
                    setError(null);
                  }}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
