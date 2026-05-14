import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const SERIES_COLORS = [
  '#c8f135',
  '#7dd3fc',
  '#fbbf24',
  '#c4b5fd',
  '#fb7185',
  '#4ade80',
  '#fdba74',
];

function mergeSeriesForChart(series) {
  if (!series?.length) return [];
  const len = series[0].points?.length ?? 0;
  const rows = [];
  for (let i = 0; i < len; i += 1) {
    const row = { date: series[0].points[i].date };
    series.forEach((s) => {
      row[`k_${s.id}`] = s.points[i]?.count ?? 0;
    });
    rows.push(row);
  }
  return rows;
}

export default function DashboardTimelineChart({
  series,
  days,
  onDaysChange,
  isDark,
  loading,
  onClose,
  onShowAll,
  showShowAll,
}) {
  if (!series?.length) {
    return null;
  }

  const chartData = mergeSeriesForChart(series);
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#2a2a2a' : '#e5e7eb';
  const single = series.length === 1;

  return (
    <div
      className={`rounded-lg shadow-lg border p-6 mb-8 ${
        isDark ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Evolución en el tiempo
            </h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`text-sm px-2 py-1 rounded-md border ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-[#0f0f0f]'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cerrar
              </button>
            )}
          </div>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            {single
              ? `Detalle: ${series[0].label}. Registros nuevos por día (fecha de creación), con los mismos filtros que la tarjeta.`
              : 'Registros nuevos por día (según la fecha de creación), con los mismos filtros que cada estadística.'}
          </p>
          {showShowAll && onShowAll && (
            <button
              type="button"
              onClick={onShowAll}
              className="mt-2 text-sm font-medium text-[#c8f135] hover:underline"
            >
              Ver todas las métricas en el gráfico
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Periodo:</span>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDaysChange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-[#c8f135] text-black'
                  : isDark
                    ? 'bg-[#0f0f0f] text-gray-300 border border-gray-700 hover:border-[#c8f135]/50'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:border-[#c8f135]/60'
              }`}
            >
              {d} días
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-12 text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          Cargando gráfico…
        </div>
      ) : (
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: axisColor, fontSize: 11 }}
                tickFormatter={(v) => (typeof v === 'string' ? v.slice(5) : v)}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: axisColor, fontSize: 11 }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: 8,
                }}
                labelStyle={{ color: isDark ? '#e5e7eb' : '#111827' }}
                formatter={(value) => [value, '']}
              />
              <Legend wrapperStyle={{ paddingTop: 16 }} />
              {series.map((s, idx) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={`k_${s.id}`}
                  name={s.label}
                  stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
