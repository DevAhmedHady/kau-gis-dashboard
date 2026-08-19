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
  /**
   * Layers load lazily: data is fetched the first time a layer becomes visible.
   * Only the layers marked here are fetched at startup — the full geodatabase
   * extract is ~75 MB, so turning everything on eagerly would stall the map.
   */
  defaultVisible?: boolean;
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

/** Pipe diameter drives line width across every utility network. */
const DIAMETER_WIDTH = [
  'interpolate',
  ['linear'],
  ['zoom'],
  13,
  ['case', ['>', ['coalesce', ['get', 'diameter_mm'], 0], 300], 1.4, 0.6],
  17,
  ['case', ['>', ['coalesce', ['get', 'diameter_mm'], 0], 300], 4, 1.8],
];

export const LAYER_REGISTRY: LayerDef[] = [
  // ── adm ────────────────────────────────────────────────────────────────────
  {
    id: 'adm_campus_boundary',
    group: 'adm',
    title: { ar: 'حدود الحرم الجامعي', en: 'Campus Boundary' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/adm_campus_boundary.geojson', promoteId: 'campus_id' },
    paint: { 'line-color': '#06b6d4', 'line-width': 3, 'line-dasharray': [8, 4] },
    interactive: false,
    defaultVisible: true,
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
        ['get', 'zone_code'],
        1000,
        '#dbeafe',
        2000,
        '#ffe4d6',
        3000,
        '#f3e8ff',
        4000,
        '#dcfce7',
        5000,
        '#fce7f3',
        6000,
        '#fef3c7',
        7000,
        '#cffafe',
        8000,
        '#ede9fe',
        '#e5e7eb',
      ],
      'fill-opacity': 0.35,
      'fill-outline-color': '#06b6d4',
    },
    interactive: true,
    defaultVisible: true,
    metadata: { searchableFields: ['name_ar', 'zone_code', 'branch'], metrics: ['area_sqm'] },
  },
  {
    id: 'adm_parcels',
    group: 'adm',
    title: { ar: 'قطع الأراضي', en: 'Land Parcels' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/adm_parcels.geojson', promoteId: 'parcel_id' },
    paint: {
      'fill-color': '#cbd5e1',
      'fill-opacity': 0.28,
      'fill-outline-color': '#64748b',
    },
    minzoom: 14,
    interactive: true,
    defaultVisible: true,
    metadata: { searchableFields: ['parcel_id', 'description', 'name_ar'], metrics: ['area_sqm'] },
  },
  {
    id: 'adm_investment',
    group: 'adm',
    title: { ar: 'الأملاك الاستثمارية', en: 'Investment Property' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/adm_investment.geojson', promoteId: 'investment_id' },
    paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.45, 'fill-outline-color': '#b45309' },
    interactive: true,
    metadata: { searchableFields: ['investment_id', 'description'], metrics: ['area_sqm'] },
  },

  // ── bld ────────────────────────────────────────────────────────────────────
  {
    id: 'bld_footprints',
    group: 'bld',
    title: { ar: 'مباني الحرم', en: 'Buildings' },
    geometryType: 'fill-extrusion',
    source: { type: 'geojson', url: '/data/bld_footprints.geojson', promoteId: 'building_id' },
    paint: {
      'fill-extrusion-color': [
        'match',
        ['get', 'category'],
        'Faculty Housing',
        '#ec4899',
        'Female Housing',
        '#f472b6',
        'Services',
        '#64748b',
        'Administrative & Academic Male',
        '#06b6d4',
        'Administrative & Academic Female',
        '#22d3ee',
        'Male classrooms',
        '#3b82f6',
        'female classrooms',
        '#60a5fa',
        'Male medical complex',
        '#10b981',
        'Female medical complex',
        '#34d399',
        'Sports',
        '#f59e0b',
        'Investment',
        '#8b5cf6',
        '#94a3b8',
      ],
      // Measured height wins; otherwise fall back to 3.5 m per floor. floors_count
      // carries -1 as a null sentinel in the GDB, hence the max().
      'fill-extrusion-height': [
        'case',
        ['>', ['coalesce', ['get', 'height_m'], 0], 0],
        ['get', 'height_m'],
        ['*', ['max', ['coalesce', ['get', 'floors_count'], 1], 1], 3.5],
      ],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.85,
    },
    minzoom: 13,
    interactive: true,
    defaultVisible: true,
    metadata: {
      searchableFields: ['building_id', 'building_no', 'name_ar', 'name_en', 'category', 'branch'],
      popupTemplate: (p) =>
        `<strong>${p.name_en ?? p.name_ar ?? p.building_id}</strong><br/>No: ${p.building_no ?? '—'} | Category: ${p.category ?? '—'}<br/>Floors: ${p.floors_count ?? '—'} | Area: ${(((p.area_sqm as number) ?? 0) / 1000).toFixed(1)}k m²<br/>Status: ${p.status ?? '—'} | Branch: ${p.branch ?? '—'}`,
      metrics: ['area_sqm', 'floors_count'],
    },
  },
  {
    id: 'bld_rooms',
    group: 'bld',
    title: { ar: 'تصنيف الغرف', en: 'Room Classification' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/bld_rooms.geojson', promoteId: 'room_id' },
    paint: {
      'fill-color': [
        'match',
        ['get', 'floor_no'],
        -1,
        '#475569',
        0,
        '#8b5cf6',
        1,
        '#06b6d4',
        2,
        '#10b981',
        3,
        '#f59e0b',
        4,
        '#f43f5e',
        '#6366f1',
      ],
      'fill-opacity': 0.7,
      'fill-outline-color': '#ffffff',
    },
    minzoom: 16,
    interactive: true,
    metadata: {
      searchableFields: ['room_id', 'room_no', 'name_ar', 'name_en', 'department', 'building_no'],
      popupTemplate: (p) =>
        `<strong>${p.name_en ?? p.name_ar ?? p.room_id}</strong><br/>Building: ${p.building_no ?? '—'} | Floor: ${p.floor_no ?? '—'}<br/>Department: ${p.department ?? '—'}<br/>Capacity: ${p.capacity ?? '—'} | Area: ${p.area_sqm ?? '—'} m²`,
      metrics: ['area_sqm', 'capacity'],
    },
  },
  {
    id: 'bld_gates',
    group: 'bld',
    title: { ar: 'البوابات', en: 'Gates' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/bld_gates.geojson', promoteId: 'gate_id' },
    paint: {
      'circle-radius': 6,
      'circle-color': '#10b981',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['gate_id', 'branch'] },
  },
  {
    id: 'bld_landmarks',
    group: 'bld',
    title: { ar: 'المعالم', en: 'Landmarks' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/bld_landmarks.geojson', promoteId: 'landmark_id' },
    paint: {
      'circle-radius': 7,
      'circle-color': '#8b5cf6',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 14,
    interactive: true,
    metadata: { searchableFields: ['landmark_id', 'name_ar', 'name_en', 'branch'] },
  },

  // ── net ────────────────────────────────────────────────────────────────────
  {
    id: 'net_roads',
    group: 'net',
    title: { ar: 'شبكة الطرق', en: 'Road Network' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/net_roads.geojson', promoteId: 'road_id' },
    paint: {
      // speed_limit is the only populated hierarchy signal in the GDB.
      'line-color': [
        'step',
        ['coalesce', ['get', 'speed_limit'], 30],
        '#94a3b8',
        30,
        '#64748b',
        40,
        '#334155',
        60,
        '#0f172a',
      ],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12,
        ['step', ['coalesce', ['get', 'speed_limit'], 30], 0.4, 40, 1.2],
        16,
        ['step', ['coalesce', ['get', 'speed_limit'], 30], 2, 40, 4],
        19,
        ['step', ['coalesce', ['get', 'speed_limit'], 30], 5, 40, 9],
      ],
      'line-opacity': 0.9,
    },
    interactive: true,
    defaultVisible: true,
    metadata: {
      searchableFields: ['road_id', 'name_ar', 'name_en', 'street_no', 'branch'],
      metrics: ['length_m'],
    },
  },
  {
    id: 'net_walking_paths',
    group: 'net',
    title: { ar: 'ممرات المشاة', en: 'Pedestrian Paths' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/net_walking_paths.geojson', promoteId: 'path_id' },
    paint: {
      'line-color': '#a3e635',
      'line-width': 2.5,
      'line-dasharray': [4, 3],
      'line-opacity': 0.9,
    },
    minzoom: 14,
    interactive: true,
    metadata: { searchableFields: ['path_id'], metrics: ['length_m'] },
  },
  {
    id: 'net_bike_paths',
    group: 'net',
    title: { ar: 'مسارات الدراجات', en: 'Bike Paths' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/net_bike_paths.geojson', promoteId: 'path_id' },
    paint: { 'line-color': '#14b8a6', 'line-width': 2.5, 'line-opacity': 0.9 },
    minzoom: 14,
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
        'step',
        ['coalesce', ['get', 'capacity'], 0],
        '#94a3b8',
        1,
        '#166534',
        10,
        '#1e40af',
        30,
        '#9a3412',
        100,
        '#7c2d12',
      ],
      'fill-opacity': 0.65,
      'fill-outline-color': '#ffffff',
    },
    minzoom: 14,
    interactive: true,
    defaultVisible: true,
    metadata: {
      searchableFields: ['parking_id', 'parking_no', 'name_ar', 'name_en', 'description'],
      popupTemplate: (p) =>
        `<strong>${p.name_en ?? p.name_ar ?? p.parking_id}</strong><br/>No: ${p.parking_no ?? '—'} | Capacity: ${p.capacity ?? '—'}<br/>Area: ${p.area_sqm ?? '—'} m² | Branch: ${p.branch ?? '—'}`,
      metrics: ['capacity', 'area_sqm'],
    },
  },
  {
    id: 'net_sidewalks',
    group: 'net',
    title: { ar: 'الأرصفة', en: 'Sidewalks' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/net_sidewalks.geojson', promoteId: 'sidewalk_id' },
    paint: {
      'fill-color': [
        'match',
        ['get', 'surface_type'],
        'Asphalt',
        '#475569',
        'اسمنت',
        '#94a3b8',
        'بلاط',
        '#d6d3d1',
        'كونكريت',
        '#a8a29e',
        '#cbd5e1',
      ],
      'fill-opacity': 0.75,
    },
    minzoom: 16,
    interactive: true,
    metadata: { searchableFields: ['sidewalk_id', 'surface_type'], metrics: ['area_sqm'] },
  },
  {
    id: 'net_road_islands',
    group: 'net',
    title: { ar: 'الجزر المرورية', en: 'Road Islands' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/net_road_islands.geojson', promoteId: 'island_id' },
    paint: { 'fill-color': '#84cc16', 'fill-opacity': 0.5, 'fill-outline-color': '#4d7c0f' },
    minzoom: 16,
    interactive: true,
    metadata: { searchableFields: ['island_id', 'description'], metrics: ['area_sqm'] },
  },
  {
    id: 'net_road_signs',
    group: 'net',
    title: { ar: 'اللوحات المرورية', en: 'Road Signs' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/net_road_signs.geojson', promoteId: 'sign_id' },
    paint: {
      'circle-radius': 4,
      'circle-color': '#f97316',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 17,
    interactive: true,
    metadata: { searchableFields: ['sign_id', 'description'] },
  },

  // ── utl ────────────────────────────────────────────────────────────────────
  {
    id: 'utl_lighting',
    group: 'utl',
    title: { ar: 'أعمدة الإنارة', en: 'Lighting Poles' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/utl_lighting.geojson', promoteId: 'pole_id' },
    paint: {
      'circle-radius': 4,
      'circle-color': ['match', ['get', 'subtype'], 1, '#fbbf24', 9, '#f59e0b', 6, '#fb923c', '#94a3b8'],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#0f172a',
    },
    minzoom: 16,
    interactive: true,
    metadata: { searchableFields: ['pole_id', 'description', 'branch'] },
  },
  {
    id: 'utl_water_lines',
    group: 'utl',
    title: { ar: 'شبكة المياه', en: 'Water Network' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/utl_water_lines.geojson', promoteId: 'line_id' },
    paint: { 'line-color': '#0ea5e9', 'line-width': DIAMETER_WIDTH, 'line-opacity': 0.85 },
    minzoom: 14,
    interactive: true,
    metadata: { searchableFields: ['line_id', 'material', 'name_ar', 'name_en'], metrics: ['length_m'] },
  },
  {
    id: 'utl_sewer_lines',
    group: 'utl',
    title: { ar: 'شبكة الصرف الصحي', en: 'Sewer Network' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/utl_sewer_lines.geojson', promoteId: 'line_id' },
    paint: { 'line-color': '#a16207', 'line-width': DIAMETER_WIDTH, 'line-opacity': 0.85 },
    minzoom: 14,
    interactive: true,
    metadata: { searchableFields: ['line_id', 'material'], metrics: ['length_m'] },
  },
  {
    id: 'utl_irrigation_lines',
    group: 'utl',
    title: { ar: 'شبكة الري', en: 'Irrigation Network' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/utl_irrigation_lines.geojson', promoteId: 'line_id' },
    paint: { 'line-color': '#10b981', 'line-width': DIAMETER_WIDTH, 'line-opacity': 0.8 },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['line_id', 'material'], metrics: ['length_m'] },
  },
  {
    id: 'utl_chilled_water_lines',
    group: 'utl',
    title: { ar: 'شبكة التبريد', en: 'Chilled / Hot Water' },
    geometryType: 'line',
    source: {
      type: 'geojson',
      url: '/data/utl_chilled_water_lines.geojson',
      promoteId: 'line_id',
    },
    paint: {
      // network_type is Arabic in the source: بارد = cold, حار / ساخن = hot.
      'line-color': [
        'match',
        ['get', 'network_type'],
        'بارد',
        '#06b6d4',
        'حار',
        '#f43f5e',
        'ساخن',
        '#dc2626',
        '#78716c',
      ],
      'line-width': DIAMETER_WIDTH,
      'line-opacity': 0.85,
    },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['line_id', 'material', 'network_type'], metrics: ['length_m'] },
  },
  {
    id: 'utl_electric_cables',
    group: 'utl',
    title: { ar: 'كابلات الكهرباء', en: 'Electric Cables' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/utl_electric_cables.geojson', promoteId: 'cable_id' },
    paint: {
      'line-color': ['match', ['get', 'subtype'], 2, '#eab308', 3, '#f97316', '#a3a3a3'],
      'line-width': 1.6,
      'line-opacity': 0.85,
    },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['cable_id'], metrics: ['length_m'] },
  },
  {
    id: 'utl_telecom_ducts',
    group: 'utl',
    title: { ar: 'قنوات الاتصالات', en: 'Telecom Ducts' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/utl_telecom_ducts.geojson', promoteId: 'duct_id' },
    paint: { 'line-color': '#8b5cf6', 'line-width': 1.6, 'line-opacity': 0.85 },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['duct_id', 'duct_type'], metrics: ['length_m'] },
  },
  {
    id: 'utl_fire_hydrants',
    group: 'utl',
    title: { ar: 'حنفيات الحريق', en: 'Fire Hydrants' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/utl_fire_hydrants.geojson', promoteId: 'hydrant_id' },
    paint: {
      'circle-radius': 5,
      'circle-color': [
        'match',
        ['get', 'hydrant_type'],
        'Wet Barrel',
        '#f43f5e',
        'Dry Barrel',
        '#fb7185',
        'Pillar',
        '#e11d48',
        '#94a3b8',
      ],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['hydrant_id', 'hydrant_type', 'description'] },
  },
  {
    id: 'utl_security_nodes',
    group: 'utl',
    title: { ar: 'نقاط المراقبة', en: 'Security Nodes' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/utl_security_nodes.geojson', promoteId: 'node_id' },
    paint: {
      'circle-radius': 6,
      'circle-color': '#f43f5e',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
    minzoom: 13,
    interactive: true,
    metadata: { searchableFields: ['node_id', 'name_ar', 'name_en', 'node_type'] },
  },

  // ── env ────────────────────────────────────────────────────────────────────
  {
    id: 'env_green_areas',
    group: 'env',
    title: { ar: 'المساحات الخضراء', en: 'Green Areas' },
    geometryType: 'fill',
    source: { type: 'geojson', url: '/data/env_green_areas.geojson', promoteId: 'green_id' },
    paint: { 'fill-color': '#16a34a', 'fill-opacity': 0.55, 'fill-outline-color': '#14532d' },
    minzoom: 13,
    interactive: true,
    defaultVisible: true,
    metadata: { searchableFields: ['green_id', 'description', 'branch'], metrics: ['area_sqm'] },
  },
  {
    id: 'env_trees',
    group: 'env',
    title: { ar: 'الأشجار', en: 'Trees' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/env_trees.geojson', promoteId: 'tree_id' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 2, 19, 6],
      'circle-color': [
        'match',
        ['get', 'species'],
        'Shade',
        '#15803d',
        'Phoenix Dactylifera Palm',
        '#a16207',
        'Washingtonia Robusta Palm',
        '#ca8a04',
        'Cocos Nucifera Palm',
        '#84cc16',
        'Tabebuia Tree',
        '#f59e0b',
        'Samania Saman Tree',
        '#166534',
        '#22c55e',
      ],
      'circle-stroke-width': 0.5,
      'circle-stroke-color': '#052e16',
    },
    minzoom: 16,
    interactive: true,
    metadata: { searchableFields: ['tree_id', 'species'] },
  },
  {
    id: 'env_drainage_lines',
    group: 'env',
    title: { ar: 'شبكة تصريف الأمطار', en: 'Storm Drainage' },
    geometryType: 'line',
    source: { type: 'geojson', url: '/data/env_drainage_lines.geojson', promoteId: 'line_id' },
    paint: { 'line-color': '#3b82f6', 'line-width': DIAMETER_WIDTH, 'line-opacity': 0.85 },
    minzoom: 15,
    interactive: true,
    metadata: { searchableFields: ['line_id', 'material'], metrics: ['length_m'] },
  },
  {
    id: 'env_catch_basins',
    group: 'env',
    title: { ar: 'مصارف الأمطار', en: 'Catch Basins' },
    geometryType: 'circle',
    source: { type: 'geojson', url: '/data/env_catch_basins.geojson', promoteId: 'basin_id' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 3, 19, 7],
      'circle-color': '#1e40af',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#bfdbfe',
    },
    minzoom: 15,
    interactive: true,
    metadata: {
      searchableFields: ['basin_id', 'description', 'branch'],
      popupTemplate: (p) =>
        `<strong>${p.basin_id}</strong><br/>Depth: ${p.depth_m ?? '—'} m | Invert: ${p.invert_level_m ?? '—'} m<br/>Branch: ${p.branch ?? '—'}`,
      metrics: ['depth_m'],
    },
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
