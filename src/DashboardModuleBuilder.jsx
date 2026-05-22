import { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ThemeContext } from './ThemeContext';
import { API_URL } from './config';
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, className = 'w-5 h-5' }) {
  const iconName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const IconComponent = LucideIcons[iconName] || LucideIcons.Box;
  return <IconComponent className={className} />;
}

const SECTION_TYPES = [
  { value: 'actions', label: 'Acciones Rápidas', icon: 'zap', desc: 'Botones para crear o ver listados de formularios' },
  { value: 'recent', label: 'Registros Recientes', icon: 'clock', desc: 'Tabla con últimos registros de un formulario' },
  { value: 'stats', label: 'Conteos / Estadísticas', icon: 'bar-chart', desc: 'Tarjetas con cantidad de registros' },
  { value: 'link', label: 'Enlace Directo', icon: 'arrow-right', desc: 'Botón de acceso rápido a un formulario' },
];

const AVAILABLE_ICONS = [
  'plus-circle', 'plus', 'file-plus', 'folder-plus', 'user-plus',
  'list', 'list-checks', 'clipboard-list', 'table', 'grid', 'layout',
  'search', 'eye', 'edit', 'pen-tool', 'settings',
  'bar-chart', 'bar-chart-2', 'pie-chart', 'trending-up', 'activity', 'gauge',
  'package', 'box', 'archive', 'database', 'server',
  'users', 'user', 'briefcase', 'building', 'store', 'landmark',
  'calendar', 'clock', 'bell', 'mail', 'message-square',
  'home', 'layers', 'folder', 'bookmark', 'star', 'heart',
  'shopping-cart', 'truck', 'warehouse', 'dollar-sign',
  'camera', 'image', 'file-text', 'book-open',
  'lock', 'shield', 'key', 'flag', 'tag', 'link',
  'map-pin', 'globe', 'compass', 'navigation',
  'check-circle', 'alert-circle', 'info', 'help-circle',
];

function SectionEditor({ section, index, onChange, entityTypes, isDark }) {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = AVAILABLE_ICONS.filter(ic =>
    ic.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const update = (key, value) => {
    onChange(index, { ...section, [key]: value });
  };

  const renderActionsConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Título de la sección</label>
        <input type="text" value={section.title || ''} onChange={e => update('title', e.target.value)}
          placeholder="Acciones Rápidas"
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
      </div>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Columnas</label>
        <select value={section.columns || 3} onChange={e => update('columns', parseInt(e.target.value))}
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          {[2, 3, 4].map(n => <option key={n} value={n}>{n} columnas</option>)}
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Botones de acción</label>
          <button
            onClick={() => {
              const items = [...(section.items || [])];
              items.push({ label: '', entity_type_id: '', action: 'create', icon: 'plus-circle' });
              update('items', items);
            }}
            className="text-xs text-[#c8f135] hover:underline font-medium"
          >
            + Agregar botón
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {(section.items || []).map((item, i) => (
            <div key={i} className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f0f0f]/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}}`}>Botón {i + 1}</span>
                <button onClick={() => {
                  const items = [...(section.items || [])];
                  items.splice(i, 1);
                  update('items', items);
                }} className="text-red-400 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={item.label} onChange={e => {
                  const items = [...(section.items || [])];
                  items[i] = { ...items[i], label: e.target.value };
                  update('items', items);
                }} placeholder="Nuevo Producto"
                  className={`w-full px-2 py-1.5 rounded border text-xs focus:ring-1 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                <select value={item.action || 'create'} onChange={e => {
                  const items = [...(section.items || [])];
                  items[i] = { ...items[i], action: e.target.value };
                  update('items', items);
                }}
                  className={`w-full px-2 py-1.5 rounded border text-xs focus:ring-1 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="create">Nuevo (+)</option>
                  <option value="list">Ver listado</option>
                </select>
                <select value={item.entity_type_id || ''} onChange={e => {
                  const items = [...(section.items || [])];
                  items[i] = { ...items[i], entity_type_id: parseInt(e.target.value) };
                  update('items', items);
                }}
                  className={`w-full col-span-2 px-2 py-1.5 rounded border text-xs focus:ring-1 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="">Seleccionar formulario...</option>
                  {entityTypes.filter(et => et.type === 'form' || et.type === null).map(et => (
                    <option key={et.id} value={et.id}>{et.menu_name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRecentConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Título de la sección</label>
        <input type="text" value={section.title || ''} onChange={e => update('title', e.target.value)}
          placeholder="Últimos Registros"
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
      </div>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Formulario origen</label>
        <select value={section.entity_type_id || ''} onChange={e => update('entity_type_id', parseInt(e.target.value))}
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="">Seleccionar...</option>
          {entityTypes.filter(et => et.type === 'form' || et.type === null).map(et => (
            <option key={et.id} value={et.id}>{et.menu_name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Registros a mostrar</label>
          <input type="number" min="1" max="20" value={section.limit || 5} onChange={e => update('limit', parseInt(e.target.value) || 5)}
            className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={section.show_view_all !== false} onChange={e => update('show_view_all', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-[#c8f135] focus:ring-[#c8f135]" />
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ver todos</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStatsConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Título de la sección</label>
        <input type="text" value={section.title || ''} onChange={e => update('title', e.target.value)}
          placeholder="Resumen"
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
      </div>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Columnas</label>
        <select value={section.columns || 3} onChange={e => update('columns', parseInt(e.target.value))}
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          {[2, 3, 4].map(n => <option key={n} value={n}>{n} columnas</option>)}
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tarjetas de conteo</label>
          <button
            onClick={() => {
              const items = [...(section.items || [])];
              items.push({ entity_type_id: '', label: '', icon: 'bar-chart' });
              update('items', items);
            }}
            className="text-xs text-[#c8f135] hover:underline font-medium"
          >
            + Agregar tarjeta
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {(section.items || []).map((item, i) => (
            <div key={i} className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f0f0f]/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}}`}>Tarjeta {i + 1}</span>
                <button onClick={() => {
                  const items = [...(section.items || [])];
                  items.splice(i, 1);
                  update('items', items);
                }} className="text-red-400 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={item.label} onChange={e => {
                  const items = [...(section.items || [])];
                  items[i] = { ...items[i], label: e.target.value };
                  update('items', items);
                }} placeholder="Total Productos"
                  className={`w-full px-2 py-1.5 rounded border text-xs focus:ring-1 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                <select value={item.entity_type_id || ''} onChange={e => {
                  const items = [...(section.items || [])];
                  items[i] = { ...items[i], entity_type_id: parseInt(e.target.value) };
                  update('items', items);
                }}
                  className={`w-full px-2 py-1.5 rounded border text-xs focus:ring-1 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#1a1a1a] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="">Seleccionar...</option>
                  {entityTypes.filter(et => et.type === 'form' || et.type === null).map(et => (
                    <option key={et.id} value={et.id}>{et.menu_name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLinkConfig = () => (
    <div className="space-y-3">
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Título del enlace</label>
        <input type="text" value={section.title || ''} onChange={e => update('title', e.target.value)}
          placeholder="Ir a Productos"
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
      </div>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Descripción (opcional)</label>
        <input type="text" value={section.description || ''} onChange={e => update('description', e.target.value)}
          placeholder="Gestiona los productos del almacén"
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
      </div>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Formulario destino</label>
        <select value={section.entity_type_id || ''} onChange={e => update('entity_type_id', parseInt(e.target.value))}
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="">Seleccionar...</option>
          {entityTypes.filter(et => et.type === 'form' || et.type === null).map(et => (
            <option key={et.id} value={et.id}>{et.menu_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Acción al hacer clic</label>
        <select value={section.action || 'list'} onChange={e => update('action', e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-[#c8f135] outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="list">Ver listado</option>
          <option value="create">Crear nuevo</option>
        </select>
      </div>
      <div>
        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Icono</label>
        <div className="relative">
          <button
            onClick={() => setShowIconPicker(!showIconPicker)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <DynamicIcon name={section.icon || 'arrow-right'} className="w-4 h-4 text-[#c8f135]" />
            <span>{section.icon || 'arrow-right'}</span>
          </button>
          {showIconPicker && (
            <div className={`fixed z-[70] w-64 rounded-lg border shadow-xl ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'}`}>
              <div className="p-2">
                <input type="text" value={iconSearch} onChange={e => setIconSearch(e.target.value)}
                  placeholder="Buscar icono..."
                  className={`w-full px-2 py-1.5 rounded text-xs border outline-none ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`} />
              </div>
              <div className="grid grid-cols-6 gap-1 p-2 max-h-48 overflow-auto">
                {filteredIcons.map(ic => (
                  <button key={ic} onClick={() => { update('icon', ic); setShowIconPicker(false); setIconSearch(''); }}
                    className={`p-1.5 rounded hover:bg-[#c8f135]/20 ${section.icon === ic ? 'bg-[#c8f135]/30' : ''}`}
                    title={ic}>
                    <DynamicIcon name={ic} className="w-4 h-4 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  switch (section.type) {
    case 'actions': return renderActionsConfig();
    case 'recent': return renderRecentConfig();
    case 'stats': return renderStatsConfig();
    case 'link': return renderLinkConfig();
    default: return <p className="text-sm text-gray-500">Tipo de sección desconocido</p>;
  }
}

export default function DashboardModuleBuilder({ entityType, entityTypes, onSave, onCancel, isDark: forcedDark }) {
  const { theme } = useContext(ThemeContext);
  const isDark = forcedDark !== undefined ? forcedDark : theme === 'dark';

  const [sections, setSections] = useState(() =>
    entityType?.layout_data?.sections ? JSON.parse(JSON.stringify(entityType.layout_data.sections)) : []
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const addSection = (type) => {
    const newSection = { id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type };
    switch (type) {
      case 'actions': newSection.title = 'Acciones Rápidas'; newSection.columns = 3; newSection.items = []; break;
      case 'recent': newSection.title = 'Últimos Registros'; newSection.entity_type_id = ''; newSection.limit = 5; newSection.show_view_all = true; break;
      case 'stats': newSection.title = 'Resumen'; newSection.columns = 3; newSection.items = []; break;
      case 'link': newSection.title = ''; newSection.entity_type_id = ''; newSection.action = 'list'; newSection.icon = 'arrow-right'; break;
    }
    const newSections = [...sections, newSection];
    setSections(newSections);
    setEditingIndex(newSections.length - 1);
    setShowAddMenu(false);
  };

  const updateSection = (index, data) => {
    const updated = [...sections];
    updated[index] = data;
    setSections(updated);
  };

  const removeSection = (index) => {
    setDeleteConfirm(index);
  };

  const confirmRemoveSection = async () => {
    if (deleteConfirm === null) return;
    const idx = deleteConfirm;
    const currentSections = [...sections];
    const updated = currentSections.filter((_, i) => i !== idx);
    setSections(updated);
    if (editingIndex === idx) setEditingIndex(null);
    else if (editingIndex > idx) setEditingIndex(editingIndex - 1);
    setDeleteConfirm(null);

    // Persistir inmediatamente
    setLoading(true);
    setError(null);
    try {
      const payload = {
        layout_data: { sections: updated },
        type: 'dashboard',
        form_title: entityType?.form_title || entityType?.menu_name || 'Dashboard',
      };
      const response = await fetch(`${API_URL}/entity-types/${entityType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        onSave?.();
      } else {
        setError(data.message || 'Error al guardar');
        setSections(currentSections);
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
      setSections(currentSections);
    } finally {
      setLoading(false);
    }
  };

  const moveSection = (from, to) => {
    if (to < 0 || to >= sections.length) return;
    const updated = [...sections];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    setSections(updated);
    if (editingIndex === from) setEditingIndex(to);
    else if (editingIndex === to) setEditingIndex(from);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        layout_data: { sections },
        type: 'dashboard',
        form_title: entityType?.form_title || entityType?.menu_name || 'Dashboard',
      };

      const response = await fetch(`${API_URL}/entity-types/${entityType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        onSave?.();
      } else {
        setError(data.message || 'Error al guardar');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${isDark ? 'bg-black/75' : 'bg-black/50'}`}>
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border transition-all ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700 bg-[#c8f135]/10' : 'border-gray-200 bg-green-50'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-[#c8f135]' : 'text-green-700'}`}>
              Editor de Dashboard
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {entityType?.menu_name || 'Dashboard'} — Agrega y configura secciones
            </p>
          </div>
          <button onClick={onCancel} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className={`px-4 py-3 rounded-lg border text-sm ${isDark ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* Lista de secciones */}
          {sections.length === 0 ? (
            <div className={`py-12 text-center rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
              <DynamicIcon name="layout-dashboard" className="w-16 h-16 mx-auto mb-3 text-gray-400" />
              <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Este dashboard está vacío</p>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Agrega secciones para empezar a personalizarlo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, idx) => (
                <div key={section.id || idx} className={`rounded-xl border overflow-hidden transition-all ${isDark ? 'border-gray-700' : 'border-gray-200'} ${editingIndex === idx ? 'ring-2 ring-[#c8f135]' : ''}`}>
                  {/* Header de sección */}
                  <div className={`flex items-center gap-3 px-4 py-3 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    <div className="flex flex-col gap-0.5 mr-1">
                      <button onClick={() => moveSection(idx, idx - 1)} disabled={idx === 0}
                        className={`p-1 rounded transition-colors ${idx === 0 ? 'opacity-30 cursor-not-allowed' : isDark ? 'text-gray-400 hover:text-[#c8f135] hover:bg-gray-700' : 'text-gray-500 hover:text-[#c8f135] hover:bg-gray-200'}`}
                        title="Subir">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button onClick={() => moveSection(idx, idx + 1)} disabled={idx === sections.length - 1}
                        className={`p-1 rounded transition-colors ${idx === sections.length - 1 ? 'opacity-30 cursor-not-allowed' : isDark ? 'text-gray-400 hover:text-[#c8f135] hover:bg-gray-700' : 'text-gray-500 hover:text-[#c8f135] hover:bg-gray-200'}`}
                        title="Bajar">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <DynamicIcon name={
                      section.type === 'actions' ? 'zap' :
                      section.type === 'recent' ? 'clock' :
                      section.type === 'stats' ? 'bar-chart' : 'arrow-right'
                    } className="w-5 h-5 text-[#c8f135]" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {SECTION_TYPES.find(t => t.value === section.type)?.label || section.type}
                      </p>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {section.title || 'Sin título'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                        className={`p-2 rounded-lg transition-colors ${editingIndex === idx ? 'text-[#c8f135] hover:bg-[#c8f135]/20' : isDark ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-100'}`}
                        title={editingIndex === idx ? 'Cerrar editor' : 'Editar sección'}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => removeSection(idx)}
                        className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/20"
                        title="Eliminar sección">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Editor de sección */}
                  {editingIndex === idx && (
                    <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-[#0f0f0f]/50' : 'border-gray-200 bg-gray-50/50'}`}>
                      <SectionEditor
                        section={section}
                        index={idx}
                        onChange={updateSection}
                        entityTypes={entityTypes}
                        isDark={isDark}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Botón agregar sección */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`w-full py-3 rounded-xl border-2 border-dashed font-medium transition-all hover:scale-[1.01] ${
                isDark ? 'border-gray-600 text-gray-400 hover:border-[#c8f135]/50 hover:text-[#c8f135]' : 'border-gray-300 text-gray-500 hover:border-[#c8f135]/50 hover:text-[#c8f135]'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Sección
              </span>
            </button>

            {showAddMenu && (
              <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-xl border shadow-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
                {SECTION_TYPES.map(st => (
                  <button
                    key={st.value}
                    onClick={() => addSection(st.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#c8f135]/10 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    <DynamicIcon name={st.icon} className="w-5 h-5 text-[#c8f135]" />
                    <div>
                      <p className="text-sm font-medium">{st.label}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{st.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className={`flex gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button onClick={onCancel}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={loading}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                loading ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-[#c8f135] hover:bg-[#b8e125] text-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98]'
              }`}>
              {loading ? 'Guardando...' : 'Guardar Dashboard'}
            </button>
          </div>
        </div>

        {/* Modal de confirmación para eliminar sección */}
        {deleteConfirm !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => { setDeleteConfirm(null); }}>
            <div className="absolute inset-0 bg-black/50" />
            <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}
              style={{ animation: 'modalIn 200ms ease-out forwards' }}
              onClick={e => e.stopPropagation()}
            >
              <div className={`flex justify-center pt-8 pb-4 ${isDark ? 'bg-[#2c2c2e]' : 'bg-gray-50'}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#3a3a3c]' : 'bg-white shadow-md'}`}>
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="px-6 pb-6 text-center">
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Eliminar sección
                </h3>
                <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  ¿Estás seguro de eliminar esta sección del dashboard?
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => { setDeleteConfirm(null); }}
                    className={`w-full py-3.5 rounded-xl font-medium transition-all duration-200 ${
                      isDark ? 'bg-[#2c2c2e] text-[#0a84ff] hover:bg-[#3a3a3c] active:scale-[0.98]' : 'bg-gray-100 text-blue-600 hover:bg-gray-200 active:scale-[0.98]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmRemoveSection}
                    className={`w-full py-3.5 rounded-xl font-medium transition-all duration-200 bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] shadow-lg shadow-red-500/25`}
                  >
                    Eliminar sección
                  </button>
                </div>
              </div>
              <div className="flex justify-center pb-2">
                <div className={`w-36 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
