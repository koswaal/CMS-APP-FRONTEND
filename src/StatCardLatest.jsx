import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import * as LucideIcons from 'lucide-react';

export default function StatCardLatest({ records, fields, label, icon, entitySlug, onNavigate, fieldLabels, canNavigate }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const IconComponent = LucideIcons[icon
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')] || LucideIcons.BarChart;

  return (
    <div className={`rounded-lg shadow-lg p-4 border h-full flex flex-col ${
      isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {label}
        </p>
        <IconComponent className="w-6 h-6 text-[#c8f135] shrink-0" />
      </div>

      <div className="flex-1 space-y-2 min-h-0">
        {(!records || records.length === 0) ? (
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Sin registros
          </p>
        ) : (
          records.map((record, idx) => (
            <div
              key={record.id || idx}
              className={`text-xs p-2 rounded ${
                isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'
              }`}
            >
              {fields && fields.length > 0
                ? fields.map((fieldName) => (
                    <span key={fieldName} className="block leading-tight">
                      <span className={`${isDark ? 'text-[#c8f135]' : 'text-gray-400'}`}>
                        {capitalize(fieldLabels?.[fieldName] || fieldName)}:{' '}
                      </span>
                      <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                        {record.data?.[fieldName] ?? record[fieldName] ?? '-'}
                      </span>
                    </span>
                  ))
                : (
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    {record.data?.[Object.keys(record.data || {})[0]] || record[Object.keys(record)[0]] || '-'}
                  </span>
                )}
            </div>
          ))
        )}
      </div>

      {canNavigate !== false && onNavigate && (
        <button
          onClick={() => onNavigate(entitySlug)}
          className={`mt-3 text-xs font-medium text-[#c8f135] hover:underline text-left ${
            isDark ? 'hover:text-[#d4f54d]' : ''
          }`}
        >
          Ver más →
        </button>
      )}
    </div>
  );
}
