import { useMemo } from 'react';
import { NETWORK_LAYERS, networkLengthByType } from '../core/analytics';
import { useAppStore } from '../core/store';
import { CategoricalChart, ChartCard, NET_PALETTE, useLayerData } from './chart-kit';

const LAYERS = NETWORK_LAYERS.map((l) => l.id);

export default function NetworkLengthChart() {
  const locale = useAppStore((s) => s.locale);
  const collections = useAppStore((s) => s.collections);
  const extent = useAppStore((s) => s.extent);
  const loading = useLayerData(LAYERS);
  const metric = useMemo(
    () => networkLengthByType(collections, extent, locale),
    [collections, extent, locale],
  );
  const ar = locale === 'ar';

  return (
    <ChartCard
      title={ar ? 'أطوال الشبكات' : 'Network Length'}
      subtitle={ar ? 'طرق ومرافق خطية في النطاق' : 'Roads and linear utilities in view'}
      empty={ar ? 'لا توجد شبكات في النطاق' : 'No network features in the current extent'}
      hasData={metric.values.some((v) => v > 0)}
      loading={loading}
    >
      <CategoricalChart
        kind="bar"
        metric={metric}
        unit="m"
        colors={NET_PALETTE}
        datasetLabel={ar ? 'الطول' : 'Length'}
      />
    </ChartCard>
  );
}
