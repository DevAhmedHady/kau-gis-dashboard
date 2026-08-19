import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';

/** Main Sulaymaniyah campus, Jeddah -- where the geodatabase's detailed data sits. */
export const KAU_CENTER: [number, number] = [39.2463, 21.493];
export const KAU_ZOOM = 15;

/** west, south, east, north */
export type BBox = [number, number, number, number];

const EARTH_R_M = 6_371_000;

export function featureCenter(feature: Feature): [number, number] {
  const g = feature.geometry;
  if (g.type === 'Point') return g.coordinates as [number, number];
  const coords = flattenCoords(g);
  const n = coords.length || 1;
  const sum = coords.reduce<[number, number]>((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
  return [sum[0] / n, sum[1] / n];
}

function flattenCoords(g: Geometry): [number, number][] {
  if (g.type === 'GeometryCollection') return g.geometries.flatMap(flattenCoords);
  const walk = (n: unknown): [number, number][] => {
    if (!Array.isArray(n) || n.length === 0) return [];
    if (typeof n[0] === 'number') return [[n[0] as number, n[1] as number]];
    return (n as unknown[]).flatMap(walk);
  };
  return walk(g.coordinates);
}

export function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineM(a: Position, b: Position): number {
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function lineLengthM(coords: Position[]): number {
  let sum = 0;
  for (let i = 1; i < coords.length; i++) sum += haversineM(coords[i - 1], coords[i]);
  return sum;
}

export function geometryLengthM(g: Geometry): number {
  if (g.type === 'LineString') return lineLengthM(g.coordinates);
  if (g.type === 'MultiLineString') return g.coordinates.reduce((s, c) => s + lineLengthM(c), 0);
  if (g.type === 'GeometryCollection') return g.geometries.reduce((s, c) => s + geometryLengthM(c), 0);
  return 0;
}

/** Prefer stored `length_m`; otherwise compute from geometry. */
export function featureLengthM(feature: Feature): number {
  const stored = num(feature.properties?.length_m);
  return stored > 0 ? stored : geometryLengthM(feature.geometry);
}

export function geometryBBox(g: Geometry): BBox | null {
  const coords = flattenCoords(g);
  if (!coords.length) return null;
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < w) w = lng;
    if (lat < s) s = lat;
    if (lng > e) e = lng;
    if (lat > n) n = lat;
  }
  return [w, s, e, n];
}

export function bboxIntersects(a: BBox, b: BBox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

export function featureInExtent(feature: Feature, extent: BBox | null): boolean {
  if (!extent) return true;
  const box = geometryBBox(feature.geometry);
  return box ? bboxIntersects(box, extent) : false;
}

export function collectionBBox(
  fc: FeatureCollection | undefined,
  predicate?: (feature: Feature) => boolean,
): BBox | null {
  if (!fc?.features.length) return null;
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  let any = false;
  for (const feature of fc.features) {
    if (predicate && !predicate(feature)) continue;
    const box = geometryBBox(feature.geometry);
    if (!box) continue;
    any = true;
    if (box[0] < w) w = box[0];
    if (box[1] < s) s = box[1];
    if (box[2] > e) e = box[2];
    if (box[3] > n) n = box[3];
  }
  return any ? [w, s, e, n] : null;
}
