import type { Feature, FeatureCollection } from 'geojson';
import { type BBox, featureInExtent, featureLengthM, num } from './geo';

export interface GroupedMetric {
  labels: string[];
  values: number[];
}

export function featuresInView(
  collections: Partial<Record<string, FeatureCollection>>,
  layerId: string,
  extent: BBox | null,
): Feature[] {
  const features = collections[layerId]?.features ?? [];
  return extent ? features.filter((f) => featureInExtent(f, extent)) : features;
}

export function groupSum(
  features: Feature[],
  groupKey: string,
  valueFn: (f: Feature) => number,
): GroupedMetric {
  const map = new Map<string, number>();
  for (const f of features) {
    const key = String(f.properties?.[groupKey] ?? 'Unknown');
    map.set(key, (map.get(key) ?? 0) + valueFn(f));
  }
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return { labels: entries.map(([k]) => k), values: entries.map(([, v]) => v) };
}

/** Same as groupSum but keeps only the top `limit` groups, folding the rest into "Other". */
export function groupSumTop(
  features: Feature[],
  groupKey: string,
  valueFn: (f: Feature) => number,
  limit: number,
  otherLabel: string,
): GroupedMetric {
  const { labels, values } = groupSum(features, groupKey, valueFn);
  if (labels.length <= limit) return { labels, values };
  const rest = values.slice(limit).reduce((sum, v) => sum + v, 0);
  return {
    labels: [...labels.slice(0, limit), otherLabel],
    values: [...values.slice(0, limit), rest],
  };
}

export function propNum(key: string) {
  return (f: Feature) => num(f.properties?.[key]);
}

/** Linear networks charted side by side; also the set the analytics panel preloads. */
export const NETWORK_LAYERS = [
  { id: 'net_roads', en: 'Roads', ar: 'طرق' },
  { id: 'utl_water_lines', en: 'Water', ar: 'مياه' },
  { id: 'utl_sewer_lines', en: 'Sewer', ar: 'صرف صحي' },
  { id: 'utl_irrigation_lines', en: 'Irrigation', ar: 'ري' },
  { id: 'utl_chilled_water_lines', en: 'Chilled/Hot', ar: 'تبريد' },
  { id: 'utl_electric_cables', en: 'Electric', ar: 'كهرباء' },
  { id: 'utl_telecom_ducts', en: 'Telecom', ar: 'اتصالات' },
  { id: 'env_drainage_lines', en: 'Storm', ar: 'أمطار' },
] as const;

export function networkLengthByType(
  collections: Partial<Record<string, FeatureCollection>>,
  extent: BBox | null,
  locale: 'en' | 'ar',
): GroupedMetric {
  const labels: string[] = [];
  const values: number[] = [];
  for (const layer of NETWORK_LAYERS) {
    const features = featuresInView(collections, layer.id, extent);
    labels.push(layer[locale]);
    values.push(features.reduce((sum, f) => sum + featureLengthM(f), 0));
  }
  return { labels, values };
}
