import type { FilterSpecification } from 'maplibre-gl';
import type { LayerFilter } from './store';

/**
 * MapLibre's native filter is the equivalent of ArcGIS `definitionExpression`.
 * Applied with `setFilter` so the source is not re-fetched or copied.
 */
export function toDefinitionFilter(filter: LayerFilter | undefined): FilterSpecification | null {
  if (!filter?.field || !filter.values.length) return null;
  return ['in', ['get', filter.field], ['literal', filter.values]] as FilterSpecification;
}

export function combineFilters(
  base: FilterSpecification | undefined,
  user: FilterSpecification | null,
): FilterSpecification | null {
  if (base && user) return ['all', base, user] as FilterSpecification;
  return user ?? base ?? null;
}

export const LABEL_LAYER_SUFFIX = '__labels';

export function labelLayerId(layerId: string): string {
  return `${layerId}${LABEL_LAYER_SUFFIX}`;
}
