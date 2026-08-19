import { useMemo, useState } from 'react';
import { featuresInView, groupSum, propNum } from '../core/analytics';
import { useAppStore } from '../core/store';
import { CategoricalChart, ChartCard, Segmented } from './chart-kit';

type GroupBy = 'faculty' | 'usage_type';

export default function BuildingAreaChart() {
  const locale = useAppStore((s) => s.locale);
  const collections = useAppStore((s) => s.collections);
  const extent = useAppStore((s) => s.extent);
  const loading = !useAppStore((s) => s.dataReady);
  const [groupBy, setGroupBy] = useState<GroupBy>('faculty');

  const features = useMemo(
    () => featuresInView(collections, 'bld_footprints', extent),
    [collections, extent],
  );
  const metric = useMemo(() => groupSum(features, groupBy, propNum('gross_area_sqm')), [features, groupBy]);
  const ar = locale === 'ar';

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
            { id: 'faculty', label: ar ? 'الكلية' : 'Faculty' },
            { id: 'usage_type', label: ar ? 'الاستخدام' : 'Usage' },
          ]}
        />
      }
    >
      <CategoricalChart kind="bar" metric={metric} unit="m²" datasetLabel={ar ? 'المساحة' : 'Area'} />
    </ChartCard>
  );
}
