import type { Feature, FeatureCollection } from 'geojson';
import { addProtocol, type Map as MapLibreMap } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import type { LayerDef } from './layer-registry';

let pmtilesRegistered = false;

export function registerPmtiles(): void {
  if (pmtilesRegistered) return;
  const protocol = new Protocol();
  addProtocol('pmtiles', protocol.tilev4);
  pmtilesRegistered = true;
}

const sourceCache = new Map<string, FeatureCollection | true>();

export function sourceId(layer: LayerDef): string {
  return layer.id;
}

export async function ensureSource(map: MapLibreMap, layer: LayerDef): Promise<FeatureCollection | null> {
  const id = sourceId(layer);
  if (map.getSource(id)) {
    const cached = sourceCache.get(id);
    return cached && cached !== true ? cached : null;
  }

  if (layer.source.type === 'pmtiles') {
    map.addSource(id, {
      type: 'vector',
      url: `pmtiles://${layer.source.url}`,
    });
    sourceCache.set(id, true);
    return null;
  }

  const fc = await loadFeatures(layer);
  map.addSource(id, {
    type: 'geojson',
    data: fc,
    promoteId: layer.source.promoteId,
  });
  sourceCache.set(id, fc);
  return fc;
}

export async function loadFeatures(layer: LayerDef): Promise<FeatureCollection> {
  const cached = sourceCache.get(layer.id);
  if (cached && cached !== true) return cached;

  if (layer.source.type === 'flatgeobuf') {
    const fc = await loadFlatGeobuf(layer.source.url);
    sourceCache.set(layer.id, fc);
    return fc;
  }

  const res = await fetch(layer.source.url);
  if (!res.ok) throw new Error(`Failed to load ${layer.source.url}: ${res.status}`);
  const fc = (await res.json()) as FeatureCollection;
  sourceCache.set(layer.id, fc);
  return fc;
}

async function loadFlatGeobuf(url: string): Promise<FeatureCollection> {
  const { deserialize } = await import('flatgeobuf/lib/mjs/geojson.js');
  const features: Feature[] = [];
  for await (const feature of deserialize(url)) features.push(feature);
  return { type: 'FeatureCollection', features };
}

export function clearSourceCache(): void {
  sourceCache.clear();
}
