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
  const fc = collections[layerId];
  if (!fc) {
    console.warn(`[Analytics] No collection found for layer: ${layerId}`);
    return [];
  }
  const features = fc.features ?? [];
  console.log(`[Analytics] Layer ${layerId}: ${features.length} features total, extent:`, extent);
  const filtered = extent ? features.filter((f) => featureInExtent(f, extent)) : features;
  console.log(`[Analytics] Layer ${layerId}: ${filtered.length} features in extent`);
  return filtered;
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

export function propNum(key: string) {
  return (f: Feature) => num(f.properties?.[key]);
}

export const NETWORK_LAYERS = [
  { id: 'net_roads', key: 'roads', en: 'Roads', ar: 'طرق' },
  { id: 'net_pedestrian_paths', key: 'paths', en: 'Paths', ar: 'ممرات' },
  { id: 'utl_water_lines', key: 'water', en: 'Water', ar: 'مياه' },
  { id: 'env_contours', key: 'contours', en: 'Contours', ar: 'كنتور' },
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
