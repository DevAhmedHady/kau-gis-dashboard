import type { FeatureCollection } from 'geojson';
import type { FilterSpecification, Map as MapLibreMap, MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl';
import { combineFilters, labelLayerId, toDefinitionFilter } from '../core/definition-query';
import { num } from '../core/geo';
import { useAppStore, type LayerFilter, type LayerState } from '../core/store';
import {
  defaultOpacity,
  LAYER_BY_ID,
  LAYER_REGISTRY,
  opacityPaintKey,
  type LayerDef,
} from './layer-registry';
import { ensureSource, sourceId } from './vector-source';

let activeMap: MapLibreMap | null = null;
let unsubscribe: (() => void) | null = null;

/** Layers currently added to the live style. Reset whenever the basemap style changes. */
const attached = new Set<string>();
const inflight = new Map<string, Promise<void>>();

const LABEL_FONT = ['Open Sans Regular', 'Noto Sans Regular'];

/**
 * Attach the registry to a freshly loaded style.
 *
 * Only the layers that are meant to be visible are fetched — the geodatabase extract is
 * ~75 MB across 28 layers, so everything else waits until it is switched on.
 */
export async function loadRegistry(map: MapLibreMap): Promise<void> {
  activeMap = map;
  attached.clear();
  inflight.clear();

  const store = useAppStore.getState();
  if (!store.layers.length) {
    store.setLayers(
      LAYER_REGISTRY.map((l) => ({
        id: l.id,
        visible: l.defaultVisible ?? false,
        opacity: defaultOpacity(l),
        group: l.group,
      })),
    );
  }

  const { layers, groups } = useAppStore.getState();
  await Promise.all(
    layers.filter((l) => l.visible && groups[l.group]).map((l) => ensureLoaded(l.id)),
  );

  useAppStore.getState().setDataReady(true);
  unsubscribe?.();
  unsubscribe = syncStore(map);
}

/**
 * Fetch a layer's data and add it to the map if it isn't there yet. Safe to call
 * repeatedly and concurrently; the in-flight promise is shared. Analytics panels use
 * this to pull in layers the user has not switched on.
 */
export function ensureLoaded(layerId: string): Promise<void> {
  const map = activeMap;
  const def = LAYER_BY_ID[layerId];
  if (!map || !def || attached.has(layerId)) return Promise.resolve();

  const pending = inflight.get(layerId);
  if (pending) return pending;

  const promise = attach(map, def).finally(() => inflight.delete(layerId));
  inflight.set(layerId, promise);
  return promise;
}

async function attach(map: MapLibreMap, layer: LayerDef): Promise<void> {
  useAppStore.getState().setLayerLoading(layer.id, true);
  try {
    const fc = await ensureSource(map, layer);
    // The basemap can be swapped mid-fetch, which tears down every source and layer.
    if (map !== activeMap) return;

    addLayer(map, layer);
    attached.add(layer.id);
    if (fc) {
      useAppStore.getState().setCollection(layer.id, fc);
      computeMetrics(useAppStore.getState().collections);
    }
    applyLayerState(map);
  } catch (err) {
    console.warn(`Layer ${layer.id} skipped`, err);
    // Mark it done with an empty collection: without this the store subscription
    // would retry the failed fetch on every change, and charts would sit on a
    // loading skeleton forever instead of showing their empty state.
    attached.add(layer.id);
    useAppStore.getState().setCollection(layer.id, { type: 'FeatureCollection', features: [] });
  } finally {
    useAppStore.getState().setLayerLoading(layer.id, false);
  }
}

export function addLayer(map: MapLibreMap, layer: LayerDef): void {
  if (!map.getLayer(layer.id)) {
    map.addLayer({
      id: layer.id,
      type: layer.geometryType,
      source: sourceId(layer),
      ...(layer.source.type === 'pmtiles'
        ? { 'source-layer': layer.source.sourceLayer ?? layer.id }
        : {}),
      paint: layer.paint,
      ...(layer.layout ? { layout: layer.layout } : {}),
      ...(layer.filter ? { filter: layer.filter } : {}),
      ...(layer.minzoom != null ? { minzoom: layer.minzoom } : {}),
      ...(layer.maxzoom != null ? { maxzoom: layer.maxzoom } : {}),
    } as Parameters<MapLibreMap['addLayer']>[0]);
  }
  addLabelLayer(map, layer);
}

function addLabelLayer(map: MapLibreMap, layer: LayerDef): void {
  const field = layer.metadata.labelField;
  if (!field) return;
  const id = labelLayerId(layer.id);
  if (map.getLayer(id)) return;
  map.addLayer({
    id,
    type: 'symbol',
    source: sourceId(layer),
    minzoom: Math.max(layer.minzoom ?? 0, 15),
    filter: ['has', field],
    layout: {
      'text-field': ['to-string', ['get', field]],
      'text-font': LABEL_FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 15, 10, 18, 14, 20, 16],
      'text-anchor': 'center',
      'text-allow-overlap': false,
      'text-ignore-placement': false,
      'text-padding': 2,
      'text-max-width': 8,
      'text-optional': true,
    },
    paint: {
      'text-color': '#f8fafc',
      'text-halo-color': '#0f172a',
      'text-halo-width': 1.4,
      'text-halo-blur': 0.4,
    },
  });
}

function layerFilterSpec(layerId: string, base: FilterSpecification | undefined): FilterSpecification | null {
  const user = toDefinitionFilter(useAppStore.getState().filters[layerId]);
  return combineFilters(base, user);
}

export function applyLayerState(map: MapLibreMap): void {
  const { layers, groups } = useAppStore.getState();
  for (const state of layers) {
    if (!map.getLayer(state.id)) continue;
    const def = LAYER_BY_ID[state.id];
    const visible = state.visible && groups[state.group];
    map.setLayoutProperty(state.id, 'visibility', visible ? 'visible' : 'none');
    if (!def) continue;
    map.setPaintProperty(state.id, opacityPaintKey(def.geometryType), state.opacity);
    map.setFilter(state.id, layerFilterSpec(state.id, def.filter));

    const labels = labelLayerId(state.id);
    if (!map.getLayer(labels)) continue;
    map.setLayoutProperty(labels, 'visibility', visible ? 'visible' : 'none');
    map.setPaintProperty(labels, 'text-opacity', state.opacity);
    const labelBase: FilterSpecification | undefined = def.metadata.labelField
      ? (['has', def.metadata.labelField] as FilterSpecification)
      : undefined;
    const labelFilter = combineFilters(labelBase, toDefinitionFilter(useAppStore.getState().filters[state.id]));
    map.setFilter(labels, labelFilter);
  }
}

export function queryInteractive(
  map: MapLibreMap,
  point: MapLayerMouseEvent['point'],
): MapGeoJSONFeature[] {
  const ids = LAYER_REGISTRY.filter(
    (l) => l.interactive && attached.has(l.id) && map.getLayer(l.id),
  ).map((l) => l.id);
  return ids.length ? map.queryRenderedFeatures(point, { layers: ids }) : [];
}

export function detachStoreSync(): void {
  unsubscribe?.();
  unsubscribe = null;
  activeMap = null;
  attached.clear();
  inflight.clear();
}

function syncStore(map: MapLibreMap): () => void {
  applyLayerState(map);

  // `move` republishes the view on every frame; only react when the layer slices
  // themselves are replaced, which the store does on any visibility/opacity change.
  let lastLayers: LayerState[] | null = null;
  let lastGroups: Record<string, boolean> | null = null;
  let lastFilters: Record<string, LayerFilter> | null = null;

  return useAppStore.subscribe(() => {
    if (map !== activeMap) return;
    const { layers, groups, filters } = useAppStore.getState();
    if (layers === lastLayers && groups === lastGroups && filters === lastFilters) return;
    lastLayers = layers;
    lastGroups = groups;
    lastFilters = filters;

    for (const state of layers) {
      if (state.visible && groups[state.group] && !attached.has(state.id)) {
        void ensureLoaded(state.id);
      }
    }
    applyLayerState(map);
  });
}

function computeMetrics(collections: Partial<Record<string, FeatureCollection>>): void {
  const buildings = collections.bld_footprints?.features ?? [];
  const campus = collections.adm_campus_boundary?.features ?? [];
  const parking = collections.net_parking_lots?.features ?? [];
  const green = collections.env_green_areas?.features ?? [];

  useAppStore.getState().setMetrics({
    buildingCount: buildings.length,
    totalArea: campus.reduce((sum, f) => sum + num(f.properties?.area_sqm), 0),
    parkingCapacity: parking.reduce((sum, f) => sum + num(f.properties?.capacity), 0),
    greenArea: green.reduce((sum, f) => sum + num(f.properties?.area_sqm), 0),
  });
}
