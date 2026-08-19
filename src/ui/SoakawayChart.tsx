import { useMemo, useState } from 'react';
import { featuresInView, groupSum, propNum } from '../core/analytics';
import { useAppStore } from '../core/store';
import { CategoricalChart, ChartCard, Segmented, SOAK_PALETTE } from './chart-kit';

type Mode = 'area' | 'capacity';

export default function SoakawayChart() {
  const locale = useAppStore((s) => s.locale);
  const collections = useAppStore((s) => s.collections);
  const extent = useAppStore((s) => s.extent);
  const loading = !useAppStore((s) => s.dataReady);
  const [mode, setMode] = useState<Mode>('area');

  const features = useMemo(
    () => featuresInView(collections, 'env_soakaways', extent),
    [collections, extent],
  );
  const metric = useMemo(
    () => groupSum(features, 'type', propNum(mode === 'area' ? 'area_sqm' : 'capacity_m3')),
    [features, mode],
  );
  const ar = locale === 'ar';

  return (
    <ChartCard
      title={ar ? 'مناطق التصريف' : 'Soakaways'}
      subtitle={`${features.length} ${ar ? 'منشأة في النطاق' : 'facilities in view'}`}
      empty={ar ? 'لا توجد مناطق تصريف في النطاق' : 'No soakaways in the current extent'}
      hasData={metric.values.some((v) => v > 0)}
      loading={loading}
      actions={
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { id: 'area', label: ar ? 'المساحة' : 'Area' },
            { id: 'capacity', label: ar ? 'السعة' : 'Capacity' },
          ]}
        />
      }
    >
      <CategoricalChart
        kind={mode === 'area' ? 'pie' : 'bar'}
        metric={metric}
        unit={mode === 'area' ? 'm²' : 'm³'}
        colors={SOAK_PALETTE}
        datasetLabel={mode === 'area' ? (ar ? 'المساحة' : 'Area') : ar ? 'السعة' : 'Capacity'}
      />
    </ChartCard>
  );
}
