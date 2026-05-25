import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import * as LucideIcons from 'lucide-react';

export default function ModuleBuilder({ onSuccess, onCancel, isModal = false, onEditDashboard }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Tipo de módulo: form, landing, dashboard
  const [moduleType, setModuleType] = useState('form');

  // Búsqueda de iconos
  const [iconSearch, setIconSearch] = useState('');
  const [parentIconSearch, setParentIconSearch] = useState('');
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [showParentIconDropdown, setShowParentIconDropdown] = useState(false);

  // Configuración del menú
  const [menuConfig, setMenuConfig] = useState({
    location: 'after_inicio',
    name: '',
    icon: 'folder-open',
    isSubmenu: false,
    parentName: '',
    parentIcon: 'folder-open',
  });

  // Configuración del formulario
  const [formConfig, setFormConfig] = useState({
    title: '',
    fieldCount: 5,
    fields: Array(5).fill(null).map((_, i) => ({
      name: `campo ${i + 1}`,
      type: 'text',
      required: false,
      max_length: 255,
    })),
  });

// Tipos de campo disponibles
const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Fecha' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'image', label: 'Imagen' },
  { value: 'select-entity', label: 'Select de otra entidad' },
  { value: 'id', label: 'ID del registro' },
  { value: 'correlativo', label: 'Número correlativo' },
];

  // Cargar entidades disponibles para selects
  const [availableEntities, setAvailableEntities] = useState([]);
  useEffect(() => {
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
  }, []);

  // Iconos disponibles (subset de Lucide)
  const availableIconsRaw = [
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

    // Negocios y oficina
    'briefcase', 'building', 'landmark', 'store', 'store-front', 'shop',
    'wallet', 'coins', 'banknote', 'receipt', 'invoice', 'file-spreadsheet',
    'presentation', 'chart-pie', 'chart-bar', 'chart-line', 'chart-area',

    // Seguridad y protección
    'shield', 'shield-check', 'shield-alert', 'shield-off',
    'lock', 'lock-open', 'lock-keyhole', 'unlock', 'key', 'fingerprint',
    'scan-eye', 'scan-face', 'scan-line', 'password', 'passcode',

    // Trabajo industrial y mantenimiento
    'wrench', 'tool', 'hammer', 'axe', 'pickaxe', 'shovel', 'trowel',
    'drill', 'wrench-screwdriver', 'screwdriver', 'nut', 'bolt', 'cog',
    'factory', 'warehouse', 'construction', 'hard-hat', 'helmet',

    // Naturaleza y medio ambiente
    'tree-pine', 'tree-deciduous', 'leaf', 'flower', 'flower-2',
    'mountain', 'mountain-snow', 'sun', 'moon', 'cloud', 'cloud-rain',
    'cloud-sun', 'cloud-moon', 'wind', 'droplets', 'flame', 'snowflake',

    // Animales
    'bug', 'bug-off', 'bug-play', 'cat', 'dog', 'fish', 'bird', 'rabbit',
    'snail', 'turtle', 'worm', 'rat', 'mouse', 'squirrel',

    // Deportes y actividades
    'trophy', 'medal', 'award', 'target', 'crosshair', 'darts',
    'football', 'basketball', 'baseball', 'volleyball', 'soccer-ball',
    'bike', 'ski', 'snowboard', 'surfboard', 'swimming-pool',

    // Ciencia y tecnología
    'atom', 'dna', 'microscope', 'flask-conical', 'flask-round',
    'graduation-cap', 'school', 'library', 'book-open-check',
    'rocket', 'satellite', 'orbit', 'telescope', 'webhook', 'circuit-board',

    // Redes y conectividad
    'network', 'share', 'share-2', 'share-off', 'rss', 'wifi', 'wifi-off',
    'antenna', 'broadcast', 'radio', 'radio-receiver',
    'plug', 'plug-zap', 'unplug', 'usb', 'hdmi-port',

    // Formas y símbolos
    'circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon',
    'star', 'heart', 'sparkles', 'infinity', 'sigma', 'pi', 'omega',
    'copyright', 'registered', 'trademark', 'service-mark',
  ];

  // Eliminar duplicados
  const availableIcons = [...new Set(availableIconsRaw)];

  // Función para renderizar icono dinámico
  const renderIcon = (iconName, className = 'w-5 h-5') => {
    const IconComponent = LucideIcons[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())] || LucideIcons.Box;
    return <IconComponent className={`${className} stroke-current`} />;
  };

  // Filtrar iconos según búsqueda
  const filteredIcons = availableIcons.filter(icon =>
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );
  const filteredParentIcons = availableIcons.filter(icon =>
    icon.toLowerCase().includes(parentIconSearch.toLowerCase())
  );

  // Actualizar cantidad de campos
  const handleFieldCountChange = (count) => {
    const newCount = Math.max(1, Math.min(20, parseInt(count) || 1));
    const newFields = [...formConfig.fields];

    if (newCount > formConfig.fields.length) {
      // Agregar campos
      for (let i = formConfig.fields.length; i < newCount; i++) {
        newFields.push({
          name: `campo ${i + 1}`,
          type: 'text',
          required: false,
          max_length: 255,
        });
      }
    } else {
      // Reducir campos
      newFields.splice(newCount);
    }

    setFormConfig({
      ...formConfig,
      fieldCount: newCount,
      fields: newFields,
    });
  };

  // Actualizar un campo específico
  const handleFieldChange = (index, field, value) => {
    const newFields = [...formConfig.fields];
    newFields[index] = {
      ...newFields[index],
      [field]: value,
    };
    // Si cambia el tipo a select-entity, inicializar entity_source
    if (field === 'type' && value === 'select-entity' && !newFields[index].entity_source) {
      newFields[index].entity_source = '';
    }
    setFormConfig({ ...formConfig, fields: newFields });
  };

  // Guardar el módulo
  const handleSubmit = async () => {
    // Validaciones básicas
    if (!menuConfig.name.trim()) {
      setError('El nombre del menú es requerido');
      return;
    }

    // Para tipo 'form', validar título y campos
    if (moduleType === 'form') {
      if (!formConfig.title.trim()) {
        setError('El título del formulario es requerido');
        return;
      }
      const invalidField = formConfig.fields.find(f => !f.name.trim());
      if (invalidField) {
        setError('Todos los campos deben tener un nombre');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        menu_location: menuConfig.location,
        menu_name: menuConfig.name,
        menu_icon: menuConfig.icon,
        has_submenu: false,
        type: moduleType,
        // Si es submenú, incluir datos del menú padre
        is_submenu: menuConfig.isSubmenu,
        parent_menu_name: menuConfig.isSubmenu ? menuConfig.parentName : null,
        parent_menu_icon: menuConfig.isSubmenu ? menuConfig.parentIcon : null,
      };

      if (moduleType === 'form') {
        payload.form_title = formConfig.title;
        payload.fields = formConfig.fields.map(f => ({
          name: f.name,
          type: f.type,
          required: f.required,
          ...(f.max_length ? { max_length: f.max_length } : {}),
          ...(f.type === 'select-entity' && f.entity_source ? { entity_source: f.entity_source } : {}),
        }));
      } else {
        payload.form_title = menuConfig.name;
        if (moduleType === 'dashboard') {
          payload.layout_data = { sections: [] };
        }
      }

      const response = await fetch(`${API_URL}/entity-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.entity_type);
      } else {
        setError(data.message || 'Error al crear el módulo');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={`${isModal ? 'fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ' + (isDark ? 'bg-black/75' : 'bg-black/50') : 'min-h-screen p-6 ' + (isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100')} ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <div className={`${isModal ? 'w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-300 ease-out transform scale-100' : 'max-w-4xl mx-auto shadow-lg'} rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a] border border-gray-700' : 'bg-white border border-gray-200'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-[#c8f135]/10' : 'border-gray-200 bg-green-50'}`}>
          <h1 className="text-2xl font-bold text-center text-[#c8f135]">
            CONSTRUCTOR DE MÓDULOS
          </h1>
          <p className={`text-center text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Paso {currentStep} de 2
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className={`px-4 py-3 rounded-lg border ${isDark ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* PASO 1: CONFIGURACIÓN DEL MENÚ */}
          {currentStep === 1 && (
            <section>
              <h2 className={`text-lg font-semibold mb-4 pb-2 border-b ${isDark ? 'border-gray-700 text-[#c8f135]' : 'border-gray-300 text-green-700'}`}>
                1. Tipo de Módulo y Menú
              </h2>

              <div className="space-y-4">
                {/* Selector de tipo de módulo */}
                <div className={`grid grid-cols-3 gap-3 mb-4`}>
                  {[
                    { value: 'form', label: 'Formulario', icon: 'file-text', desc: 'CRUD con campos dinámicos, tabla y búsqueda' },
                    { value: 'landing', label: 'Landing Page', icon: 'layout', desc: 'Página visual con bloques editables' },
                    { value: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', desc: 'Panel con secciones que enlazan a otros módulos' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setModuleType(opt.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                        moduleType === opt.value
                          ? 'border-[#c8f135] bg-[#c8f135]/10 shadow-[0_0_10px_rgba(200,241,53,0.1)]'
                          : isDark ? 'border-gray-700 bg-[#0f0f0f] hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        moduleType === opt.value ? 'bg-[#c8f135] text-black' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {renderIcon(opt.icon, 'w-5 h-5')}
                      </div>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{opt.label}</p>
                      <p className={`text-xs leading-tight ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{opt.desc}</p>
                    </button>
                  ))}
                </div>

                <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Checkbox para submenú */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#0f0f0f]/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuConfig.isSubmenu}
                      onChange={(e) => setMenuConfig({ ...menuConfig, isSubmenu: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]"
                    />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Este formulario estará dentro de un menú principal
                    </span>
                  </label>
                  <p className={`text-xs mt-2 ml-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Si marca esta opción, se creará un menú padre que solo sirve para agrupar submenús. El formulario se creará como submenú.
                  </p>
                </div>

                {/* Campos para menú principal (solo si es submenú) */}
                {menuConfig.isSubmenu && (
                  <div className={`p-4 rounded-lg border space-y-4 ${isDark ? 'bg-[#c8f135]/5 border-[#c8f135]/30' : 'bg-green-50 border-green-200'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>
                      Configuración del menú principal (contenedor)
                    </p>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Nombre del menú principal:
                      </label>
                      <input
                        type="text"
                        value={menuConfig.parentName}
                        onChange={(e) => setMenuConfig({ ...menuConfig, parentName: e.target.value })}
                        placeholder="Ej: Catálogo"
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                          isDark
                            ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <div className="relative">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Icono del menú principal:
                      </label>
                      <div className="relative">
                        <div
                          onClick={() => setShowParentIconDropdown(!showParentIconDropdown)}
                          className={`w-full px-4 py-2 rounded-lg border cursor-pointer flex items-center justify-between ${
                            isDark
                              ? 'bg-[#0f0f0f] border-gray-700 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {renderIcon(menuConfig.parentIcon, `w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`)}
                            <span>{menuConfig.parentIcon}</span>
                          </div>
                          <svg className={`w-4 h-4 transition-transform ${showParentIconDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {showParentIconDropdown && (
                          <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-96 overflow-auto ${
                            isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'
                          }`}>
                            <div className="p-2">
                              <input
                                type="text"
                                value={parentIconSearch}
                                onChange={(e) => setParentIconSearch(e.target.value)}
                                placeholder="Buscar icono..."
                                className={`w-full px-3 py-1.5 rounded text-sm border outline-none ${
                                  isDark
                                    ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                                }`}
                              />
                            </div>
                            <div className="divide-y divide-gray-700/50">
                              {filteredParentIcons.map((icon) => (
                                <div
                                  key={icon}
                                  onClick={() => {
                                    setMenuConfig({ ...menuConfig, parentIcon: icon });
                                    setShowParentIconDropdown(false);
                                    setParentIconSearch('');
                                  }}
                                  className={`px-4 py-2 cursor-pointer flex items-center gap-3 hover:bg-[#c8f135]/10 ${
                                    menuConfig.parentIcon === icon ? 'bg-[#c8f135]/20 text-[#c8f135]' : isDark ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  {renderIcon(icon, `w-5 h-5 ${menuConfig.parentIcon === icon ? 'text-[#c8f135]' : isDark ? 'text-white' : 'text-gray-900'}`)}
                                  <span className="text-sm">{icon}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nombre del menú:
                  </label>
                  <input
                    type="text"
                    value={menuConfig.name}
                    onChange={(e) => setMenuConfig({ ...menuConfig, name: e.target.value })}
                    placeholder="Ej: Productos de Almacén"
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                      isDark
                        ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div className="relative">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Icono del menú:
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
                        {renderIcon(menuConfig.icon, `w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`)}
                        <span>{menuConfig.icon}</span>
                      </div>
                      <svg className={`w-4 h-4 transition-transform ${showIconDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {showIconDropdown && (
                      <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-96 overflow-auto ${
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
                                setMenuConfig({ ...menuConfig, icon: icon });
                                setShowIconDropdown(false);
                                setIconSearch('');
                              }}
                              className={`px-4 py-2 cursor-pointer flex items-center gap-3 hover:bg-[#c8f135]/10 ${
                                menuConfig.icon === icon ? 'bg-[#c8f135]/20 text-[#c8f135]' : isDark ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {renderIcon(icon, `w-5 h-5 ${menuConfig.icon === icon ? 'text-[#c8f135]' : isDark ? 'text-white' : 'text-gray-900'}`)}
                              <span className="text-sm">{icon}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Iconos de Lucide React
                  </p>
                </div>
              </div>
            </div>
            </section>
          )}

          {/* PASO 2: CONFIGURACIÓN DEL FORMULARIO */}
          {currentStep === 2 && (
            <section>
              <h2 className={`text-lg font-semibold mb-4 pb-2 border-b ${isDark ? 'border-gray-700 text-[#c8f135]' : 'border-gray-300 text-green-700'}`}>
                2. Configuración del Formulario
              </h2>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Título del formulario */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Título del formulario:
                    </label>
                    <input
                      type="text"
                      value={formConfig.title}
                      onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
                      placeholder="Ej: Nuevo Producto"
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                        isDark
                          ? 'bg-[#0f0f0f] border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  {/* Cantidad de campos */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Cantidad de campos:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formConfig.fieldCount}
                      onChange={(e) => handleFieldCountChange(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none ${
                        isDark
                          ? 'bg-[#0f0f0f] border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Grid de campos */}
                <div className="space-y-2">
                  <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Definición de campos:
                  </h3>

                  <div className="grid md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {formConfig.fields.map((field, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      isDark
                        ? 'bg-[#0f0f0f] border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        isDark ? 'bg-[#c8f135]/20 text-[#c8f135]' : 'bg-green-100 text-green-700'
                      }`}>
                        Campo {index + 1}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Nombre del campo */}
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                        placeholder="Nombre del campo"
                        className={`w-full px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                          isDark
                            ? 'bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />

                      {/* Tipo de dato */}
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        className={`w-full px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                          isDark
                            ? 'bg-[#1a1a1a] border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {fieldTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>

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
                          onChange={(e) => handleFieldChange(index, 'entity_source', e.target.value)}
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
                      {['text', 'email', 'textarea'].includes(field.type) && field.type !== 'id' && (
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Longitud máxima:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            value={field.max_length || 255}
                            onChange={(e) => handleFieldChange(index, 'max_length', parseInt(e.target.value) || 255)}
                            className={`w-full px-3 py-2 rounded border focus:ring-1 focus:ring-[#c8f135] focus:border-[#c8f135] outline-none text-sm ${
                              isDark
                                ? 'bg-[#1a1a1a] border-gray-600 text-white placeholder-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />
                        </div>
                      )}

                      {/* Checkbox requerido (no para tipo ID ni correlativo) */}
                      {field.type !== 'id' && field.type !== 'correlativo' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]"
                          />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Requerido
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </section>
          )}

          {/* Botones de navegación */}
          <div className={`flex gap-4 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } hover:scale-[1.02] active:scale-[0.98]`}
              >
                Anterior
              </button>
            )}

            {currentStep === 1 ? (
              moduleType === 'form' ? (
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!menuConfig.name || loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    !menuConfig.name || loading
                      ? 'opacity-50 cursor-not-allowed bg-gray-400'
                      : 'bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!menuConfig.name || loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    !menuConfig.name || loading
                      ? 'opacity-50 cursor-not-allowed bg-gray-400'
                      : 'bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? 'Creando...' : `Crear ${moduleType === 'dashboard' ? 'Dashboard' : 'Landing Page'}`}
                </button>
              )
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  loading
                    ? 'opacity-50 cursor-not-allowed bg-gray-400'
                    : 'bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando...
                  </span>
                ) : (
                  'Crear Módulo'
                )}
              </button>
            )}

            <button
              onClick={onCancel}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              } hover:scale-[1.02] active:scale-[0.98]`}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return isModal ? createPortal(content, document.body) : content;
}
