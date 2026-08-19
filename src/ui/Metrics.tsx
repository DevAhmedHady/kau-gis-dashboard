import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { featuresInView } from '../core/analytics';
import { num } from '../core/geo';
import { useAppStore } from '../core/store';
import { IconTrendDown, IconTrendUp } from './icons';

const ACCENTS = [
  'linear-gradient(#06b6d4, #0891b2)',
  'linear-gradient(#8b5cf6, #7c3aed)',
  'linear-gradient(#10b981, #059669)',
  'linear-gradient(#f59e0b, #d97706)',
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
};

function useDelta(value: number): number {
  const prev = useRef(value);
  const primed = useRef(false);
  const delta = primed.current && prev.current !== 0 ? ((value - prev.current) / prev.current) * 100 : 0;
  useEffect(() => {
    primed.current = true;
    prev.current = value;
  }, [value]);
  return delta;
}

function Trend({ delta }: { delta: number }) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.05) {
    return <div className="metric__trend flat">—</div>;
  }
  const up = delta > 0;
  return (
    <div className={`metric__trend ${up ? 'up' : 'down'}`}>
      {up ? <IconTrendUp /> : <IconTrendDown />}
      {up ? '+' : ''}
      {delta.toFixed(1)}%
    </div>
  );
}

export default function Metrics() {
  const locale = useAppStore((s) => s.locale);
  const collections = useAppStore((s) => s.collections);
  const extent = useAppStore((s) => s.extent);
  const dataReady = useAppStore((s) => s.dataReady);
  const campusArea = useAppStore((s) => s.metrics.totalArea);
  const ar = locale === 'ar';

  const live = useMemo(() => {
    const buildings = featuresInView(collections, 'bld_footprints', extent);
    const parking = featuresInView(collections, 'net_parking_lots', extent);
    const green = featuresInView(collections, 'env_green_areas', extent);
    return {
      buildingCount: buildings.length,
      parkingCapacity: parking.reduce((s, f) => s + num(f.properties?.capacity), 0),
      greenArea: green.reduce((s, f) => s + num(f.properties?.area_sqm), 0),
    };
  }, [collections, extent]);

  const cards = [
    { label: ar ? 'المباني' : 'Buildings', value: live.buildingCount.toLocaleString(), raw: live.buildingCount },
    {
      label: ar ? 'مساحة الحرم' : 'Campus Area',
      value: `${(campusArea / 1e6).toFixed(2)} km²`,
      raw: campusArea,
    },
    {
      label: ar ? 'سعة المواقف' : 'Parking',
      value: live.parkingCapacity.toLocaleString(),
      raw: live.parkingCapacity,
    },
    {
      label: ar ? 'المساحات الخضراء' : 'Green Space',
      value: `${(live.greenArea / 1000).toFixed(1)}k m²`,
      raw: live.greenArea,
    },
  ];

  const d0 = useDelta(cards[0].raw);
  const d1 = useDelta(cards[1].raw);
  const d2 = useDelta(cards[2].raw);
  const d3 = useDelta(cards[3].raw);
  const deltas = [d0, d1, d2, d3];

  return (
    <motion.div className="metrics" variants={stagger} initial="hidden" animate="show">
      {cards.map((card, i) => (
        <motion.article
          key={card.label}
          className="metric"
          variants={item}
          style={{ '--metric-accent': ACCENTS[i] } as CSSProperties}
        >
          <div className="metric__label">{card.label}</div>
          <div className="metric__value">{dataReady ? card.value : '—'}</div>
          <Trend delta={dataReady ? deltas[i] : 0} />
        </motion.article>
      ))}
    </motion.div>
  );
}
