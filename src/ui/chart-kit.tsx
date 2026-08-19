import { type ReactNode, useEffect, useMemo } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type AnimationSpec,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import type { GroupedMetric } from '../core/analytics';
import { useAppStore } from '../core/store';
import { ensureLoaded } from '../layers/layer-controller';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

ChartJS.defaults.font.family = "'Plus Jakarta Sans', 'IBM Plex Sans Arabic', system-ui, sans-serif";
ChartJS.defaults.font.size = 11;
// Assign the fields, don't replace the object: Chart.js hangs resolver metadata off
// defaults.animation, and overwriting it makes Animation.tick throw on destroy.
// The declared type allows `false`, which the defaults never are.
const animationDefaults = ChartJS.defaults.animation as AnimationSpec<'bar'>;
animationDefaults.duration = 700;
animationDefaults.easing = 'easeOutQuart';
ChartJS.defaults.elements.bar.borderRadius = 8;
ChartJS.defaults.elements.bar.borderSkipped = false;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.pointStyle = 'circle';

/** Wong / Okabe–Ito–inspired categorical palette (colorblind-safe). */
export const PALETTE = [
  '#06b6d4',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#84cc16',
  '#14b8a6',
  '#e11d48',
  '#6366f1',
  '#f97316',
  '#22d3ee',
];

export const GREEN_PALETTE = ['#10b981', '#14b8a6', '#06b6d4', '#84cc16', '#f59e0b', '#8b5cf6', '#3b82f6'];
export const COOL_PALETTE = ['#06b6d4', '#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#64748b'];
export const NET_PALETTE = [
  '#0f172a', '#0ea5e9', '#a16207', '#10b981', '#06b6d4', '#eab308', '#8b5cf6', '#3b82f6',
];

/**
 * Charts can reference layers the user has not switched on, so they pull the data in
 * themselves. Returns true while any of the layers is still missing or in flight.
 */
export function useLayerData(ids: readonly string[]): boolean {
  const key = ids.join(',');
  const loadingLayers = useAppStore((s) => s.loadingLayers);
  const collections = useAppStore((s) => s.collections);

  useEffect(() => {
    for (const id of key.split(',')) void ensureLoaded(id);
  }, [key]);

  return ids.some((id) => loadingLayers.includes(id) || !collections[id]);
}

function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function barFill(color: string) {
  return (ctx: ScriptableContext<'bar'>) => {
    const { chart } = ctx;
    const area = chart.chartArea;
    if (!area) return color;
    const g = chart.ctx.createLinearGradient(0, area.bottom, 0, area.top);
    g.addColorStop(0, hexAlpha(color, 0.28));
    g.addColorStop(1, color);
    return g;
  };
}

export function formatMetric(n: number, unit: string): string {
  if (unit === 'm²' && n >= 1000) return `${(n / 1000).toFixed(1)}k m²`;
  if (unit === 'm' && n >= 1000) return `${(n / 1000).toFixed(2)} km`;
  if (n >= 1000) return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unit}`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

interface CategoricalChartProps {
  kind: 'bar' | 'pie';
  metric: GroupedMetric;
  unit: string;
  colors?: string[];
  datasetLabel: string;
}

export function CategoricalChart({ kind, metric, unit, colors, datasetLabel }: CategoricalChartProps) {
  const theme = useAppStore((s) => s.theme);
  const text = useMemo(() => cssVar('--text-muted', '#94a3b8'), [theme]);
  const grid = useMemo(() => cssVar('--border', 'rgba(148,163,184,0.14)'), [theme]);
  const surface = useMemo(() => cssVar('--surface', '#111827'), [theme]);
  const palette = colors ?? PALETTE;
  const bg = metric.labels.map((_, i) => palette[i % palette.length]);

  const tooltip = {
    backgroundColor: surface,
    titleColor: text,
    bodyColor: text,
    borderColor: grid,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 10,
    callbacks: {
      label: (ctx: { label?: string; raw: unknown }) => `${ctx.label ?? ''}: ${formatMetric(Number(ctx.raw), unit)}`,
    },
  };

  if (kind === 'pie') {
    const data: ChartData<'pie'> = {
      labels: metric.labels,
      datasets: [
        {
          label: datasetLabel,
          data: metric.values,
          backgroundColor: bg,
          borderColor: surface,
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
    const options: ChartOptions<'pie'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: text, padding: 12 } },
        tooltip,
      },
      animation: { animateRotate: true, animateScale: true },
    };
    return <Pie key={theme} data={data} options={options} />;
  }

  const data: ChartData<'bar'> = {
    labels: metric.labels,
    datasets: [
      {
        label: datasetLabel,
        data: metric.values,
        backgroundColor: (ctx) => barFill(bg[ctx.dataIndex % bg.length])(ctx),
        borderColor: bg,
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 36,
      },
    ],
  };
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip },
    scales: {
      x: {
        ticks: { color: text, font: { size: 10 }, maxRotation: 36 },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        ticks: { color: text, font: { size: 10 }, callback: (v) => formatMetric(Number(v), unit) },
        grid: { color: grid },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };
  return <Bar key={theme} data={data} options={options} />;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  empty: string;
  actions?: ReactNode;
  children: ReactNode;
  hasData: boolean;
  loading?: boolean;
}

export function ChartCard({ title, subtitle, empty, actions, children, hasData, loading }: ChartCardProps) {
  return (
    <section className="chart-card">
      <header className="chart-card__head">
        <div>
          <h4>{title}</h4>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </header>
      <div className="chart-card__body">
        {loading ? (
          <div className="skeleton-bars" aria-hidden>
            {[62, 88, 45, 72, 38, 55].map((h, i) => (
              <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : hasData ? (
          children
        ) : (
          <p className="chart-card__empty">{empty}</p>
        )}
      </div>
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="segmented" role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`segmented__btn${value === o.id ? ' active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
