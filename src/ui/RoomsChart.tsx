import { useMemo, useState } from 'react';
import { featuresInView, groupSumTop, propNum } from '../core/analytics';
import { useAppStore } from '../core/store';
import { CategoricalChart, ChartCard, COOL_PALETTE, Segmented, useLayerData } from './chart-kit';

type Mode = 'area' | 'capacity';

const LAYERS = ['bld_rooms'];

export default function RoomsChart() {
  const locale = useAppStore((s) => s.locale);
  const collections = useAppStore((s) => s.collections);
  const extent = useAppStore((s) => s.extent);
  const loading = useLayerData(LAYERS);
  const [mode, setMode] = useState<Mode>('area');
  const ar = locale === 'ar';

  const features = useMemo(
    () => featuresInView(collections, 'bld_rooms', extent),
    [collections, extent],
  );
  const metric = useMemo(
    () =>
      mode === 'area'
        ? groupSumTop(features, 'floor_no', propNum('area_sqm'), 8, ar ? 'أخرى' : 'Other')
        : groupSumTop(features, 'department', propNum('capacity'), 10, ar ? 'أخرى' : 'Other'),
    [features, mode, ar],
  );

  return (
    <ChartCard
      title={ar ? 'الغرف' : 'Rooms'}
      subtitle={`${features.length} ${ar ? 'غرفة في النطاق' : 'rooms in view'}`}
      empty={ar ? 'لا توجد غرف في النطاق' : 'No rooms in the current extent'}
      hasData={metric.values.some((v) => v > 0)}
      loading={loading}
      actions={
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { id: 'area', label: ar ? 'المساحة/الدور' : 'Area by floor' },
            { id: 'capacity', label: ar ? 'السعة/القسم' : 'Capacity by dept' },
          ]}
        />
      }
    >
      <CategoricalChart
        kind={mode === 'area' ? 'pie' : 'bar'}
        metric={metric}
        unit={mode === 'area' ? 'm²' : ar ? 'مقعد' : 'seats'}
        colors={COOL_PALETTE}
        datasetLabel={mode === 'area' ? (ar ? 'المساحة' : 'Area') : ar ? 'السعة' : 'Capacity'}
      />
    </ChartCard>
  );
}
