import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap, MapGeoJSONFeature, MapLayerMouseEvent } from 'maplibre-gl';
import { num } from '../core/geo';
import { useAppStore } from '../core/store';
import {
  defaultOpacity,
  LAYER_BY_ID,
  LAYER_REGISTRY,
  opacityPaintKey,
  type LayerDef,
} from './layer-registry';
import { ensureSource, sourceId } from './vector-source';

let unsubscribe: (() => void) | null = null;

export async function loadRegistry(map: MapLibreMap): Promise<void> {
  const current = useAppStore.getState().layers;
  if (!current.length) {
    useAppStore.getState().setLayers(
      LAYER_REGISTRY.map((l) => ({
        id: l.id,
        visible: true,
        opacity: defaultOpacity(l),
        group: l.group,
      })),
    );
  }

  const collections: Partial<Record<string, FeatureCollection>> = {};
  for (const layer of LAYER_REGISTRY) {
    try {
      const fc = await ensureSource(map, layer);
      if (fc) collections[layer.id] = fc;
      addLayer(map, layer);
    } catch (err) {
      console.warn(`Layer ${layer.id} skipped`, err);
    }
  }

  useAppStore.getState().setCollections(collections);
  computeMetrics(collections);
  useAppStore.getState().setDataReady(true);
  unsubscribe?.();
  unsubscribe = syncStore(map);
}

export function addLayer(map: MapLibreMap, layer: LayerDef): void {
  if (map.getLayer(layer.id)) return;
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

export function applyLayerState(map: MapLibreMap): void {
  const { layers, groups } = useAppStore.getState();
  for (const state of layers) {
    if (!map.getLayer(state.id)) continue;
    const def = LAYER_BY_ID[state.id];
    const visible = state.visible && groups[state.group];
    map.setLayoutProperty(state.id, 'visibility', visible ? 'visible' : 'none');
    if (!def) continue;
    map.setPaintProperty(state.id, opacityPaintKey(def.geometryType), state.opacity);
  }
}

export function queryInteractive(map: MapLibreMap, point: MapLayerMouseEvent['point']): MapGeoJSONFeature[] {
  const ids = LAYER_REGISTRY.filter((l) => l.interactive && map.getLayer(l.id)).map((l) => l.id);
  return ids.length ? map.queryRenderedFeatures(point, { layers: ids }) : [];
}

export function detachStoreSync(): void {
  unsubscribe?.();
  unsubscribe = null;
}

function syncStore(map: MapLibreMap): () => void {
  applyLayerState(map);
  return useAppStore.subscribe(() => applyLayerState(map));
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
