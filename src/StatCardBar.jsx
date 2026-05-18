import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import * as LucideIcons from 'lucide-react';

const COLORS = ['#c8f135', '#7dd3fc', '#fbbf24', '#c4b5fd', '#fb7185', '#4ade80', '#fdba74', '#38bdf8'];

export default function StatCardBar({ data, label, icon }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const IconComponent = LucideIcons[icon
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')] || LucideIcons.BarChart;

  const getLabel = (d) => d.label || d.name || d.nombre || d.text || d.title || JSON.stringify(d);
  const getCount = (d) => d.count || d.value || d.total || d.cantidad || 0;

  const items = data || [];
  const maxCount = Math.max(...items.map(d => getCount(d)), 1);
  const sum = items.reduce((acc, d) => acc + getCount(d), 0);

  return (
    <div className={`rounded-lg shadow-lg p-4 border h-full flex flex-col ${
      isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {label}
        </p>
        <IconComponent className="w-6 h-6 text-[#c8f135] shrink-0" />
      </div>

      {sum > 0 && (
        <p className={`text-2xl font-bold mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {sum}
        </p>
      )}

      <div className="flex-1 space-y-1.5 min-h-0">
          {items.slice(0, 8).map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`w-20 truncate text-right ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {getLabel(d)}
              </span>
              <div className={`flex-1 h-4 rounded overflow-hidden ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-100'}`}>
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(getCount(d) / maxCount * 100, 2)}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              </div>
              <span className={`w-8 text-right font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {getCount(d)}
              </span>
            </div>
          ))}
        {items.length > 8 && (
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>+{items.length - 8} más</p>
        )}
      </div>
    </div>
  );
}
