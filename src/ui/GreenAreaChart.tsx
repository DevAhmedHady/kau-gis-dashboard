import { useMemo, useState } from 'react';
import { featuresInView, groupSumTop, propNum } from '../core/analytics';
import { useAppStore } from '../core/store';
import { CategoricalChart, ChartCard, GREEN_PALETTE, Segmented, useLayerData } from './chart-kit';

type Source = 'green' | 'trees';

const LAYERS = ['env_green_areas', 'env_trees'];

export default function GreenAreaChart() {
  const locale = useAppStore((s) => s.locale);
  const collections = useAppStore((s) => s.collections);
  const extent = useAppStore((s) => s.extent);
  const loading = useLayerData(LAYERS);
  const [source, setSource] = useState<Source>('green');
  const ar = locale === 'ar';

  const features = useMemo(
    () => featuresInView(collections, source === 'green' ? 'env_green_areas' : 'env_trees', extent),
    [collections, extent, source],
  );
  const metric = useMemo(
    () =>
      source === 'green'
        ? groupSumTop(features, 'branch', propNum('area_sqm'), 8, ar ? 'أخرى' : 'Other')
        : groupSumTop(features, 'species', () => 1, 8, ar ? 'أخرى' : 'Other'),
    [features, source, ar],
  );

  return (
    <ChartCard
      title={ar ? 'الغطاء الأخضر' : 'Green Cover'}
      subtitle={
        source === 'green'
          ? `${features.length} ${ar ? 'منطقة في النطاق' : 'areas in view'}`
          : `${features.length} ${ar ? 'شجرة في النطاق' : 'trees in view'}`
      }
      empty={ar ? 'لا توجد بيانات خضراء في النطاق' : 'Nothing green in the current extent'}
      hasData={metric.values.some((v) => v > 0)}
      loading={loading}
      actions={
        <Segmented
          value={source}
          onChange={setSource}
          options={[
            { id: 'green', label: ar ? 'المساحات' : 'Areas' },
            { id: 'trees', label: ar ? 'الأشجار' : 'Trees' },
          ]}
        />
      }
    >
      <CategoricalChart
        kind="pie"
        metric={metric}
        unit={source === 'green' ? 'm²' : ar ? 'شجرة' : 'trees'}
        colors={GREEN_PALETTE}
        datasetLabel={source === 'green' ? (ar ? 'المساحة' : 'Area') : ar ? 'العدد' : 'Count'}
      />
    </ChartCard>
  );
}
