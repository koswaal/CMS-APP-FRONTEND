import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import * as LucideIcons from 'lucide-react';

const COLORS = ['#c8f135', '#7dd3fc', '#fbbf24', '#c4b5fd', '#fb7185', '#4ade80', '#fdba74', '#38bdf8'];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function pieSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const angleDiff = (startAngle - endAngle + 360) % 360;
  const largeArc = angleDiff > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function StatCardPie({ data, label, icon, total }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const IconComponent = LucideIcons[icon
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')] || LucideIcons.BarChart;

  const getLabel = (d) => d.label || d.name || d.nombre || d.text || d.title || JSON.stringify(d);
  const getCount = (d) => d.count || d.value || d.total || d.cantidad || 0;

  const items = data || [];
  const sum = total || items.reduce((acc, d) => acc + getCount(d), 0);

  const cx = 60, cy = 60, r = 50;
  let currentAngle = 0;
  const slices = items.map((d) => {
    const portion = getCount(d) / (sum || 1);
    const angle = portion * 360;
    const slice = { ...d, startAngle: currentAngle, endAngle: currentAngle + angle };
    currentAngle += angle;
    return slice;
  });

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

      <div className="flex-1 flex items-center gap-4">
        <svg width="100" height="100" viewBox="0 0 120 120" className="shrink-0">
          {sum > 0 ? slices.map((slice, i) => {
            const angleDiff = slice.endAngle - slice.startAngle;
            if (angleDiff >= 359.9) {
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={COLORS[i % COLORS.length]}
                  stroke={isDark ? '#1a1a1a' : '#fff'}
                  strokeWidth="1"
                />
              );
            }
            return (
              <path
                key={i}
                d={pieSlicePath(cx, cy, r, slice.startAngle, slice.endAngle)}
                fill={COLORS[i % COLORS.length]}
                stroke={isDark ? '#1a1a1a' : '#fff'}
                strokeWidth="1"
              />
            );
          }) : (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? '#374151' : '#d1d5db'} strokeWidth="2" />
          )}
        </svg>

        <div className="space-y-1 min-w-0 flex-1">
          {items.slice(0, 5).map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{getLabel(d)}</span>
              <span className={`ml-auto font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{getCount(d)}</span>
            </div>
          ))}
          {items.length > 5 && (
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>+{items.length - 5} más</p>
          )}
        </div>
      </div>
    </div>
  );
}
