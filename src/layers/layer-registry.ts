import type { FilterSpecification, LayerSpecification } from 'maplibre-gl';
import type { LayerGroup } from '../types/kau-spatial-types';

export type LayerGeometryType = Extract<
  LayerSpecification['type'],
  'fill' | 'line' | 'circle' | 'symbol' | 'fill-extrusion'
>;

export interface LayerDef {
  id: string;
  group: LayerGroup;
  title: { ar: string; en: string };
  geometryType: LayerGeometryType;
  source: {
    type: 'geojson' | 'pmtiles' | 'flatgeobuf';
    url: string;
    promoteId?: string;
    sourceLayer?: string;
  };
  paint: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: FilterSpecification;
  minzoom?: number;
  maxzoom?: number;
  interactive: boolean;
  metadata: {
    searchableFields?: string[];
    popupTemplate?: (props: Record<string, unknown>) => string;
    metrics?: string[];
  };
}

export const GROUP_META: Record<LayerGroup, { ar: string; en: string }> = {
  adm: { ar: 'الحدود الإدارية', en: 'Administrative' },
  bld: { ar: 'البيئة المبنية', en: 'Built Environment' },
  net: { ar: 'النقل والحركة', en: 'Transportation' },
  utl: { ar: 'المرافق', en: 'Utilities' },
  env: { ar: 'البيئة', en: 'Environment' },
};

export const LAYER_REGISTRY: LayerDef[] = [
  {
    id: 'adm_campus_boundary',
    group: 'adm',
    title: { ar: 'حدود الحرم الجامعي', en: 'Campus Boundary' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/adm_campus_boundary.geojson', promoteId: 'campus_id' },
    paint: { 'line-color': '#06b6d4', 'line-width': 3, 'line-dasharray': [8, 4] },
    interactive: false,
    metadata: { metrics: ['area_sqm'] },
  },
  {
    id: 'adm_zones',
    group: 'adm',
    title: { ar: 'قطاعات الحرم', en: 'Campus Zones' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/adm_zones.geojson', promoteId: 'zone_id' },
    paint: {
      'fill-color': [
        'match',
        ['get', 'zone_type'],
        'Academic',
        '#dbeafe',
        'Residential',
        '#ffe4d6',
        'Administrative',
        '#f3e8ff',
        'Research',
        '#dcfce7',
        'Recreational',
        '#fce7f3',
        '#e5e7eb',
      ],
      'fill-opacity': 0.5,
      'fill-outline-color': '#06b6d4',
    },
    interactive: true,
    metadata: { searchableFields: ['sector_name_ar', 'sector_name_en', 'zone_id'], metrics: ['area_sqm'] },
  },
  {
    id: 'adm_parcels',
    group: 'adm',
    title: { ar: 'قطع الأراضي', en: 'Land Parcels' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/adm_parcels.geojson', promoteId: 'parcel_id' },
    paint: {
      'fill-color': [
        'match',
        ['get', 'land_use'],
        'Academic',
        '#bfdbfe',
        'Housing',
        '#fed7aa',
        'Commercial',
        '#e9d5ff',
        'Green',
        '#bbf7d0',
        'Utility',
        '#d1d5db',
        '#e5e7eb',
      ],
      'fill-opacity': 0.4,
      'fill-outline-color': '#64748b',
    },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['parcel_id'], metrics: ['area_sqm'] },
  },
  {
    id: 'bld_footprints',
    group: 'bld',
    title: { ar: 'مباني الحرم', en: 'Buildings' },
    geometryType: 'fill-extrusion',
    source: { type: 'geojson', url: '/data/bld_footprints.geojson', promoteId: 'building_id' },
    paint: {
      'fill-extrusion-color': [
        'match',
        ['get', 'usage_type'],
        'Academic',
        '#06b6d4',
        'Laboratory',
        '#8b5cf6',
        'Library',
        '#10b981',
        'Sports',
        '#f59e0b',
        'Residential',
        '#ec4899',
        'Administrative',
        '#6366f1',
        'Mixed',
        '#64748b',
        '#64748b',
      ],
      'fill-extrusion-height': ['*', ['get', 'floors_count'], 3.5],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.85,
    },
    minzoom: 14,
    interactive: true,
    metadata: {
      searchableFields: ['building_id', 'name_ar', 'name_en', 'faculty'],
      popupTemplate: (p) =>
        `<strong>${p.name_en} / ${p.name_ar}</strong><br/>ID: ${p.building_id} | Faculty: ${p.faculty}<br/>Floors: ${p.floors_count} | Area: ${(((p.gross_area_sqm as number) ?? 0) / 1000).toFixed(1)}k m²<br/>Type: ${p.usage_type} | Status: ${p.status}`,
      metrics: ['gross_area_sqm', 'floors_count'],
    },
  },
  {
    id: 'bld_entrances',
    group: 'bld',
    title: { ar: 'مداخل المباني', en: 'Building Entrances' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/bld_entrances.geojson', promoteId: 'entrance_id' },
    paint: {
      'circle-radius': 6,
      'circle-color': [
        'match',
        ['get', 'access_type'],
        'Main',
        '#10b981',
        'Emergency Only',
        '#f43f5e',
        '#06b6d4',
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 16,
    interactive: true,
    metadata: { searchableFields: ['entrance_id', 'building_id'] },
  },
  {
    id: 'bld_amenities',
    group: 'bld',
    title: { ar: 'المرافق الداخلية', en: 'Amenities' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/bld_amenities.geojson', promoteId: 'amenity_id' },
    paint: {
      'circle-radius': 5,
      'circle-color': '#8b5cf6',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 17,
    interactive: true,
    metadata: { searchableFields: ['amenity_id', 'room_number', 'building_id'] },
  },
  {
    id: 'net_roads',
    group: 'net',
    title: { ar: 'شبكة الطرق', en: 'Road Network' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/net_roads.geojson', promoteId: 'road_id' },
    paint: {
      'line-color': [
        'match',
        ['get', 'hierarchy'],
        'Primary',
        '#0f172a',
        'Secondary',
        '#334155',
        '#64748b',
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1.5, 16, 3, 19, 6],
      'line-opacity': 0.9,
    },
    interactive: true,
    metadata: { searchableFields: ['name_ar', 'name_en', 'road_id'], metrics: ['length_m'] },
  },
  {
    id: 'net_pedestrian_paths',
    group: 'net',
    title: { ar: 'ممرات المشاة', en: 'Pedestrian Paths' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/net_pedestrian_paths.geojson', promoteId: 'path_id' },
    paint: {
      'line-color': '#a3e635',
      'line-width': 2,
      'line-dasharray': [4, 3],
      'line-opacity': 0.85,
    },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['path_id'], metrics: ['length_m'] },
  },
  {
    id: 'net_parking_lots',
    group: 'net',
    title: { ar: 'مواقف السيارات', en: 'Parking Lots' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/net_parking_lots.geojson', promoteId: 'parking_id' },
    paint: {
      'fill-color': [
        'match',
        ['get', 'type'],
        'Faculty',
        '#1e40af',
        'Student',
        '#166534',
        'VIP',
        '#9a3412',
        'Visitor',
        '#b45309',
        'Accessible',
        '#065f46',
        '#374151',
      ],
      'fill-opacity': 0.7,
      'fill-outline-color': '#ffffff',
    },
    minzoom: 15,
    interactive: true,
    metadata: {
      searchableFields: ['name_ar', 'name_en', 'parking_id'],
      popupTemplate: (p) =>
        `<strong>${p.name_en} / ${p.name_ar}</strong><br/>Type: ${p.type} | Capacity: ${p.capacity}${p.occupied != null ? ` (${p.occupied} occupied)` : ''}<br/>EV Charging: ${p.ev_charging ? `Yes (${p.ev_charging_count} ports)` : 'No'}<br/>Floors: ${p.floors} | Covered: ${p.covered ? 'Yes' : 'No'}`,
      metrics: ['capacity', 'ev_charging_count'],
    },
  },
  {
    id: 'net_transit_stops',
    group: 'net',
    title: { ar: 'محطات النقل', en: 'Transit Stops' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/net_transit_stops.geojson', promoteId: 'stop_id' },
    paint: {
      'circle-radius': 7,
      'circle-color': '#f97316',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 14,
    interactive: true,
    metadata: { searchableFields: ['stop_id', 'name_ar', 'name_en'] },
  },
  {
    id: 'utl_lighting',
    group: 'utl',
    title: { ar: 'أعمدة الإنارة', en: 'Lighting Poles' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/utl_lighting.geojson', promoteId: 'pole_id' },
    paint: {
      'circle-radius': 4,
      'circle-color': ['match', ['get', 'status'], 'Operational', '#fbbf24', 'Faulty', '#f43f5e', '#94a3b8'],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#0f172a',
    },
    minzoom: 17,
    interactive: true,
    metadata: { searchableFields: ['pole_id'] },
  },
  {
    id: 'utl_security_nodes',
    group: 'utl',
    title: { ar: 'نقاط الأمن', en: 'Security Nodes' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/utl_security_nodes.geojson', promoteId: 'node_id' },
    paint: {
      'circle-radius': 5,
      'circle-color': ['match', ['get', 'status'], 'Active', '#f43f5e', 'Inactive', '#94a3b8', '#f97316'],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 16,
    interactive: true,
    metadata: { searchableFields: ['node_id'] },
  },
  {
    id: 'utl_water_lines',
    group: 'utl',
    title: { ar: 'شبكة المياه', en: 'Water Network' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/utl_water_lines.geojson', promoteId: 'line_id' },
    paint: {
      'line-color': [
        'match',
        ['get', 'network_type'],
        'Potable',
        '#0ea5e9',
        'Irrigation',
        '#10b981',
        'Fire Protection',
        '#f43f5e',
        'Chilled Water',
        '#06b6d4',
        '#78716c',
      ],
      'line-width': 2,
      'line-opacity': 0.8,
    },
    minzoom: 16,
    interactive: true,
    metadata: { searchableFields: ['line_id'], metrics: ['length_m'] },
  },
  {
      id: 'env_green_areas',
      group: 'env',
      title: { ar: 'المساحات الخضراء', en: 'Green Areas' },
      geometryType: 'fill',
      source: { type: 'geojson', url: '/data/env_green_areas.geojson', promoteId: 'green_id' },
      paint: {
        'fill-color': [
          'match',
          ['get', 'type'],
          'Park',
          '#052e16',
          'Garden',
          '#14532d',
          'Sports Field',
          '#166534',
          'Plaza',
          '#365314',
          'Courtyard',
          '#3f6212',
          'Green Roof',
          '#4d7c0f',
          'Buffer Zone',
          '#5f900d',
          '#78716c',
        ],
        'fill-opacity': 0.6,
      },
      interactive: true,
      metadata: { searchableFields: ['name_ar', 'name_en', 'green_id'], metrics: ['area_sqm'] },
    },
  {
    id: 'env_soakaways',
    group: 'env',
    title: { ar: 'مناطق التصريف', en: 'Soakaways' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/env_soakaways.geojson', promoteId: 'soakaway_id' },
    paint: {
      'fill-color': [
        'match',
        ['get', 'type'],
        'Infiltration Basin',
        '#1e3a8a',
        'Swale',
        '#164e63',
        'Retention Pond',
        '#1e40af',
        'Permeable Pavement',
        '#4c1d95',
        'French Drain',
        '#581c87',
        'Detention Tank',
        '#1e293b',
        '#64748b',
      ],
      'fill-opacity': 0.6,
      'fill-outline-color': '#1e40af',
    },
    interactive: true,
    metadata: {
      searchableFields: ['soakaway_id', 'name_ar', 'name_en', 'type'],
      popupTemplate: (p) =>
        `<strong>${p.name_en} / ${p.name_ar}</strong><br/>Type: ${p.type} | Status: ${p.status}<br/>Area: ${p.area_sqm} m² | Capacity: ${p.capacity_m3} m³<br/>Depth: ${p.depth_m} m | Infiltration: ${p.infiltration_rate_mmh} mm/h`,
      metrics: ['area_sqm', 'capacity_m3'],
    },
  },
  {
    id: 'env_contours',
    group: 'env',
    title: { ar: 'خطوط الكنتور', en: 'Contours' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/env_contours.geojson', promoteId: 'contour_id' },
    paint: {
      'line-color': '#64748b',
      'line-width': ['case', ['get', 'index_contour'], 1.6, 0.8],
      'line-opacity': 0.55,
    },
    minzoom: 15,
    interactive: false,
    metadata: {},
  },
];

export const LAYER_BY_ID = Object.fromEntries(LAYER_REGISTRY.map((l) => [l.id, l]));

export function opacityPaintKey(type: LayerGeometryType): string {
  if (type === 'fill-extrusion') return 'fill-extrusion-opacity';
  if (type === 'symbol') return 'icon-opacity';
  return `${type}-opacity`;
}

export function defaultOpacity(layer: LayerDef): number {
  const value = layer.paint[opacityPaintKey(layer.geometryType)];
  return typeof value === 'number' ? value : 1;
}
