/**
 * Mini línea temporal para tarjetas de estadística (sin dependencias).
 */
function sameId(a, b) {
  return String(a) === String(b);
}

export default function StatCardSparkline({ points, stroke = '#c8f135' }) {
  if (!points?.length) return null;

  const w = 160;
  const h = 32;
  const counts = points.map((p) => Number(p.count) || 0);
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts);
  const range = max - min || 1;
  const n = points.length;

  if (n === 1) {
    const y = h / 2;
    return (
      <div className="mt-3 -mx-1" aria-hidden>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 block" preserveAspectRatio="none">
          <circle cx={w / 2} cy={y} r="3" fill={stroke} />
        </svg>
      </div>
    );
  }

  const step = w / (n - 1);

  const xy = points.map((p, i) => {
    const x = i * step;
    const norm = (Number(p.count) - min) / range;
    const y = h - 4 - norm * (h - 8);
    return [x, y];
  });

  const d = xy
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`)
    .join(' ');

  return (
    <div className="mt-3 -mx-1" aria-hidden>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-8 block"
        preserveAspectRatio="none"
      >
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export { sameId };
