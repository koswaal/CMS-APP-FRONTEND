import { useState, useEffect, useContext, useCallback } from 'react';
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

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function getImageUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_URL.replace('/api', '')}/${path.replace(/^\//, '')}`;
}

function SectionActions({ section, entityTypes, onNavigate, isDark }) {
  const [entityType] = useState(() => {
    if (!section.items?.length) return null;
    const firstItem = section.items[0];
    return entityTypes.find(et => et.id === firstItem.entity_type_id) || null;
  });

  return (
    <div className={`rounded-xl shadow-lg border p-5 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {section.title || 'Acciones Rápidas'}
      </h3>
      <div className={`grid gap-3`}
        style={{ gridTemplateColumns: `repeat(${Math.min(section.columns || 3, 4)}, 1fr)` }}>
        {section.items?.map((item, idx) => {
          const targetEntity = entityTypes.find(et => et.id === item.entity_type_id);
          return (
            <button
              key={idx}
              onClick={() => onNavigate(targetEntity, item.action || 'list')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
                isDark
                  ? 'border-gray-700 hover:border-[#c8f135]/40 hover:bg-[#c8f135]/5 text-gray-300'
                  : 'border-gray-200 hover:border-[#c8f135]/40 hover:bg-[#c8f135]/5 text-gray-700'
              }`}
            >
              <span className={`p-2.5 rounded-full ${isDark ? 'bg-[#c8f135]/10' : 'bg-[#c8f135]/10'}`}>
                <DynamicIcon name={item.icon || 'plus-circle'} className={`w-6 h-6 text-[#c8f135]`} />
              </span>
              <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionRecent({ section, entityTypes, onNavigate, isDark }) {
  const [records, setRecords] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState(null);

  useEffect(() => {
    if (!section.entity_type_id) { setLoading(false); return; }
    const et = entityTypes.find(et => et.id === section.entity_type_id);
    setEntityType(et);
    if (!et) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const limit = section.limit || 5;
        const res = await fetch(
          `${API_URL}/dashboard/recent-records/${section.entity_type_id}?limit=${limit}`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` } }
        );
        const data = await res.json();
        if (data.success) {
          setRecords(data.records || []);
          setFields(data.fields || []);
        }
      } catch (err) {
        console.error('Error loading recent records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [section.entity_type_id, section.limit, entityTypes]);

  const getFieldValue = (record, field) => {
    const val = record.data?.[field.name];
    if (val === undefined || val === null || val === '') return '-';
    if (field.type === 'boolean') return val ? 'Sí' : 'No';
    if (field.type === 'image') return '🖼️';
    return String(val);
  };

  const displayFields = fields.filter(f => f.type !== 'image').slice(0, 4);

  return (
    <div className={`rounded-xl shadow-lg border p-5 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {section.title || 'Registros Recientes'}
        </h3>
        {section.show_view_all !== false && entityType && (
          <button
            onClick={() => onNavigate(entityType, 'list')}
            className="text-xs text-[#c8f135] hover:underline font-medium"
          >
            Ver todos →
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin w-6 h-6 border-2 border-[#c8f135] border-t-transparent rounded-full" />
        </div>
      ) : records.length === 0 ? (
        <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          No hay registros aún
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`py-2 pr-2 text-left text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>#</th>
                {displayFields.map(f => (
                  <th key={f.id} className={`py-2 px-2 text-left text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/20">
              {records.map((rec, idx) => (
                <tr
                  key={rec.id}
                  className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-[#c8f135]/5' : 'hover:bg-gray-50'}`}
                  onClick={() => onNavigate(entityType, 'edit', rec)}
                >
                  <td className={`py-2 pr-2 font-mono text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{idx + 1}</td>
                  {displayFields.map(f => (
                    <td key={f.id} className={`py-2 px-2 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {getFieldValue(rec, f)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SectionStats({ section, entityTypes, onNavigate, isDark }) {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!section.items?.length) { setLoading(false); return; }

    const fetchCounts = async () => {
      try {
        const items = section.items.map(item => ({
          entity_type_id: item.entity_type_id,
          filters: item.filters || null,
        }));
        const res = await fetch(`${API_URL}/dashboard/batch-stats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
          },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        if (data.success) {
          const map = {};
          data.results.forEach(r => { map[r.entity_type_id] = r; });
          setCounts(map);
        }
      } catch (err) {
        console.error('Error loading batch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, [section.items]);

  if (loading) {
    return (
      <div className={`rounded-xl shadow-lg border p-5 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-center py-6">
          <div className="animate-spin w-6 h-6 border-2 border-[#c8f135] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-lg border p-5 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {section.title || 'Resumen'}
      </h3>
      {(!section.items || section.items.length === 0) ? (
        <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          No hay tarjetas configuradas. Edita el dashboard para agregar conteos.
        </p>
      ) : (
        <div className={`grid gap-4`}
          style={{ gridTemplateColumns: `repeat(${Math.min(section.columns || 3, 4)}, 1fr)` }}>
          {section.items?.map((item, idx) => {
            const stat = counts[item.entity_type_id];
            const targetEntity = entityTypes.find(et => et.id === item.entity_type_id);
            return (
              <button
                key={idx}
                onClick={() => onNavigate(targetEntity, 'list')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left ${
                  isDark
                    ? 'border-gray-700 hover:border-[#c8f135]/40 hover:bg-[#c8f135]/5'
                    : 'border-gray-200 hover:border-[#c8f135]/40 hover:bg-[#c8f135]/5'
                }`}
              >
                <span className={`p-2.5 rounded-full ${isDark ? 'bg-[#c8f135]/10' : 'bg-[#c8f135]/10'}`}>
                  <DynamicIcon name={item.icon || 'bar-chart'} className={`w-5 h-5 text-[#c8f135]`} />
                </span>
                <div className="min-w-0">
                  <p className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stat?.count ?? '-'}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.label || stat?.menu_name || 'Cargando...'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionLink({ section, entityTypes, onNavigate, isDark }) {
  const targetEntity = entityTypes.find(et => et.id === section.entity_type_id);
  if (!targetEntity) {
    return (
      <div className={`rounded-xl shadow-lg border p-5 ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
        <p className="text-sm text-gray-500 text-center py-4">Entidad no encontrada</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => onNavigate(targetEntity, section.action || 'list')}
      className={`w-full rounded-xl shadow-lg border p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left ${
        isDark
          ? 'bg-[#1a1a1a] border-gray-700 hover:border-[#c8f135]/40 hover:bg-[#c8f135]/5'
          : 'bg-white border-gray-200 hover:border-[#c8f135]/40 hover:bg-[#c8f135]/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`p-2.5 rounded-full ${isDark ? 'bg-[#c8f135]/10' : 'bg-[#c8f135]/10'}`}>
          <DynamicIcon name={section.icon || 'arrow-right'} className={`w-5 h-5 text-[#c8f135]`} />
        </span>
        <div className="min-w-0">
          <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {section.title || targetEntity.menu_name}
          </p>
          {section.description && (
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{section.description}</p>
          )}
        </div>
        <svg className="w-5 h-5 ml-auto text-[#c8f135]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

export default function DashboardModule({ entityType, entityTypes, onNavigate }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const sections = entityType?.layout_data?.sections || [];

  const renderSection = (section, idx) => {
    switch (section.type) {
      case 'actions':
        return <SectionActions key={idx} section={section} entityTypes={entityTypes} onNavigate={onNavigate} isDark={isDark} />;
      case 'recent':
        return <SectionRecent key={idx} section={section} entityTypes={entityTypes} onNavigate={onNavigate} isDark={isDark} />;
      case 'stats':
        return <SectionStats key={idx} section={section} entityTypes={entityTypes} onNavigate={onNavigate} isDark={isDark} />;
      case 'link':
        return <SectionLink key={idx} section={section} entityTypes={entityTypes} onNavigate={onNavigate} isDark={isDark} />;
      default:
        return null;
    }
  };

  if (sections.length === 0) {
    return (
      <div className={`p-6 ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
        <div className={`max-w-4xl mx-auto rounded-xl shadow-lg border p-12 text-center ${isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
          <DynamicIcon name="layout-dashboard" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {entityType?.form_title || 'Dashboard'}
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Este dashboard está vacío. Edítalo desde Gestión de Módulos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {entityType?.form_title || entityType?.menu_name || 'Dashboard'}
          </h1>
        </div>

        {/* Secciones */}
        <div className="space-y-6">
          {sections.map((section, idx) => renderSection(section, idx))}
        </div>
      </div>
    </div>
  );
}
