import { useMemo, useState } from 'react';
import { featuresInView, groupSumTop, propNum } from '../core/analytics';
import { useAppStore } from '../core/store';
import { CategoricalChart, ChartCard, Segmented, useLayerData } from './chart-kit';

type GroupBy = 'category' | 'status' | 'branch';

const LAYERS = ['bld_footprints'];

export default function BuildingAreaChart() {
  const locale = useAppStore((s) => s.locale);
  const collections = useAppStore((s) => s.collections);
  const extent = useAppStore((s) => s.extent);
  const loading = useLayerData(LAYERS);
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const ar = locale === 'ar';

  const features = useMemo(
    () => featuresInView(collections, 'bld_footprints', extent),
    [collections, extent],
  );
  const metric = useMemo(
    () => groupSumTop(features, groupBy, propNum('area_sqm'), 10, ar ? 'أخرى' : 'Other'),
    [features, groupBy, ar],
  );

  return (
    <ChartCard
      title={ar ? 'مساحة المباني' : 'Building Area'}
      subtitle={`${features.length} ${ar ? 'مبنى في النطاق' : 'buildings in view'}`}
      empty={ar ? 'لا توجد مبانٍ في النطاق الحالي' : 'No buildings in the current extent'}
      hasData={metric.values.some((v) => v > 0)}
      loading={loading}
      actions={
        <Segmented
          value={groupBy}
          onChange={setGroupBy}
          options={[
            { id: 'category', label: ar ? 'التصنيف' : 'Category' },
            { id: 'status', label: ar ? 'الحالة' : 'Status' },
            { id: 'branch', label: ar ? 'الفرع' : 'Branch' },
          ]}
        />
      }
    >
      <CategoricalChart kind="bar" metric={metric} unit="m²" datasetLabel={ar ? 'المساحة' : 'Area'} />
    </ChartCard>
  );
}
