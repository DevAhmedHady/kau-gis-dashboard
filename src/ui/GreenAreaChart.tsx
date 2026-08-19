import { useMemo } from 'react';
import { featuresInView, groupSum, propNum } from '../core/analytics';
import { useAppStore } from '../core/store';
import { CategoricalChart, ChartCard, GREEN_PALETTE } from './chart-kit';

export default function GreenAreaChart() {
  const locale = useAppStore((s) => s.locale);
  const collections = useAppStore((s) => s.collections);
  const extent = useAppStore((s) => s.extent);
  const loading = !useAppStore((s) => s.dataReady);

  const features = useMemo(
    () => featuresInView(collections, 'env_green_areas', extent),
    [collections, extent],
  );
  const metric = useMemo(() => groupSum(features, 'type', propNum('area_sqm')), [features]);
  const ar = locale === 'ar';

  return (
    <ChartCard
      title={ar ? 'المساحات الخضراء' : 'Green Areas'}
      subtitle={`${features.length} ${ar ? 'منطقة في النطاق' : 'areas in view'}`}
      empty={ar ? 'لا توجد مساحات خضراء في النطاق' : 'No green areas in the current extent'}
      hasData={metric.values.some((v) => v > 0)}
      loading={loading}
    >
      <CategoricalChart
        kind="pie"
        metric={metric}
        unit="m²"
        colors={GREEN_PALETTE}
        datasetLabel={ar ? 'المساحة' : 'Area'}
      />
    </ChartCard>
  );
}
