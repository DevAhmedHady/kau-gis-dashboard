import type { Feature, FeatureCollection } from 'geojson';
import type { LayerFilter } from './store';

export type FieldValueType = 'text' | 'number' | 'date' | 'coded';

export interface FieldSchema {
  name: string;
  type: FieldValueType;
  uniqueCount: number;
}

export interface FieldAlias {
  en: string;
  ar: string;
}

/** GDB / extract internals that should never appear in popups or filter pickers. */
const SYSTEM_FIELDS = new Set([
  'objectid',
  'objectid_1',
  'globalid',
  'fid',
  'shape',
  'shape_length',
  'shape_area',
  'enabled',
  'ancillaryrole',
  'ruleid',
  'override',
  'created_user',
  'created_date',
  'last_edited_user',
  'last_edited_date',
  'creationdate',
  'creator',
  'editdate',
  'editor',
]);

/**
 * Aliases for properties that actually appear in the extract. Looked up only when
 * the field is present on a feature — this is not a field whitelist for filters.
 */
export const FIELD_ALIASES: Record<string, FieldAlias> = {
  building_id: { en: 'Building ID', ar: 'معرّف المبنى' },
  building_no: { en: 'Building No.', ar: 'رقم المبنى' },
  name_ar: { en: 'Arabic Name', ar: 'الاسم العربي' },
  name_en: { en: 'English Name', ar: 'الاسم الإنجليزي' },
  compound_ar: { en: 'Compound (AR)', ar: 'المجمع' },
  compound_en: { en: 'Compound (EN)', ar: 'المجمع (إنجليزي)' },
  category: { en: 'Category', ar: 'التصنيف' },
  status: { en: 'Status', ar: 'الحالة' },
  floors_count: { en: 'Floors', ar: 'عدد الأدوار' },
  height_m: { en: 'Height (m)', ar: 'الارتفاع (م)' },
  construction_year: { en: 'Construction Year', ar: 'سنة الإنشاء' },
  classrooms: { en: 'Classrooms', ar: 'القاعات' },
  labs: { en: 'Labs', ar: 'المعامل' },
  capacity: { en: 'Capacity', ar: 'السعة' },
  educational_space_sqm: { en: 'Educational Space (m²)', ar: 'المساحة التعليمية (م²)' },
  description: { en: 'Description', ar: 'الوصف' },
  branch: { en: 'Branch', ar: 'الفرع' },
  area_sqm: { en: 'Area (m²)', ar: 'المساحة (م²)' },
  length_m: { en: 'Length (m)', ar: 'الطول (م)' },
  room_id: { en: 'Room ID', ar: 'معرّف الغرفة' },
  room_no: { en: 'Room No.', ar: 'رقم الغرفة' },
  department: { en: 'Department', ar: 'القسم' },
  floor_no: { en: 'Floor', ar: 'الدور' },
  floor_name: { en: 'Floor Name', ar: 'اسم الدور' },
  student_capacity: { en: 'Student Capacity', ar: 'سعة الطلاب' },
  classification: { en: 'Classification', ar: 'التصنيف' },
  usage_ar: { en: 'Usage', ar: 'الاستخدام' },
  door_id: { en: 'Door ID', ar: 'معرّف الباب' },
  wall_id: { en: 'Wall ID', ar: 'معرّف الجدار' },
  zone_id: { en: 'Zone ID', ar: 'معرّف القطاع' },
  zone_code: { en: 'Zone Code', ar: 'رمز القطاع' },
  parcel_id: { en: 'Parcel ID', ar: 'معرّف القطعة' },
  land_use: { en: 'Land Use', ar: 'الاستخدام' },
  investment_id: { en: 'Investment ID', ar: 'معرّف الاستثمار' },
  land_tenure: { en: 'Land Tenure', ar: 'الحيازة' },
  ownership: { en: 'Ownership', ar: 'الملكية' },
  usage_status: { en: 'Usage Status', ar: 'حالة الاستخدام' },
  contract_status: { en: 'Contract Status', ar: 'حالة العقد' },
  contract_type: { en: 'Contract Type', ar: 'نوع العقد' },
  investment_type: { en: 'Investment Type', ar: 'نوع الاستثمار' },
  gate_id: { en: 'Gate ID', ar: 'معرّف البوابة' },
  landmark_id: { en: 'Landmark ID', ar: 'معرّف المعلم' },
  road_id: { en: 'Road ID', ar: 'معرّف الطريق' },
  subtype: { en: 'Subtype', ar: 'النوع الفرعي' },
  speed_limit: { en: 'Speed Limit', ar: 'السرعة' },
  traffic_direction: { en: 'Traffic Direction', ar: 'اتجاه السير' },
  street_no: { en: 'Street No.', ar: 'رقم الشارع' },
  path_id: { en: 'Path ID', ar: 'معرّف المسار' },
  surface_type: { en: 'Surface', ar: 'السطح' },
  width_m: { en: 'Width (m)', ar: 'العرض (م)' },
  accessible: { en: 'Accessible', ar: 'إمكانية الوصول' },
  shaded: { en: 'Shaded', ar: 'مظلل' },
  path_class: { en: 'Path Class', ar: 'فئة المسار' },
  stage: { en: 'Stage', ar: 'المرحلة' },
  parking_id: { en: 'Parking ID', ar: 'معرّف الموقف' },
  parking_no: { en: 'Parking No.', ar: 'رقم الموقف' },
  owner_ar: { en: 'Owner (AR)', ar: 'المالك' },
  owner_en: { en: 'Owner (EN)', ar: 'المالك (إنجليزي)' },
  sidewalk_id: { en: 'Sidewalk ID', ar: 'معرّف الرصيف' },
  island_id: { en: 'Island ID', ar: 'معرّف الجزيرة' },
  sign_id: { en: 'Sign ID', ar: 'معرّف اللوحة' },
  pole_id: { en: 'Pole ID', ar: 'معرّف العمود' },
  light_type: { en: 'Light Type', ar: 'نوع الإنارة' },
  lamp_technology: { en: 'Lamp Technology', ar: 'تقنية المصباح' },
  pole_height_m: { en: 'Pole Height (m)', ar: 'ارتفاع العمود (م)' },
  power_watts: { en: 'Power (W)', ar: 'القدرة (واط)' },
  line_id: { en: 'Line ID', ar: 'معرّف الخط' },
  network_type: { en: 'Network Type', ar: 'نوع الشبكة' },
  material: { en: 'Material', ar: 'المادة' },
  diameter_mm: { en: 'Diameter (mm)', ar: 'القطر (مم)' },
  depth_m: { en: 'Depth (m)', ar: 'العمق (م)' },
  cable_id: { en: 'Cable ID', ar: 'معرّف الكابل' },
  duct_id: { en: 'Duct ID', ar: 'معرّف القناة' },
  duct_type: { en: 'Duct Type', ar: 'نوع القناة' },
  hydrant_id: { en: 'Hydrant ID', ar: 'معرّف الحنفية' },
  hydrant_type: { en: 'Hydrant Type', ar: 'نوع الحنفية' },
  node_id: { en: 'Node ID', ar: 'معرّف النقطة' },
  camera_id: { en: 'Camera ID', ar: 'معرّف الكاميرا' },
  node_type: { en: 'Node Type', ar: 'نوع النقطة' },
  brand: { en: 'Brand', ar: 'العلامة' },
  model: { en: 'Model', ar: 'الطراز' },
  resolution: { en: 'Resolution', ar: 'الدقة' },
  range_m: { en: 'Range (m)', ar: 'المدى (م)' },
  green_id: { en: 'Green Area ID', ar: 'معرّف المساحة الخضراء' },
  tree_id: { en: 'Tree ID', ar: 'معرّف الشجرة' },
  species: { en: 'Species', ar: 'النوع' },
  basin_id: { en: 'Basin ID', ar: 'معرّف المصرف' },
  basin_type: { en: 'Basin Type', ar: 'نوع المصرف' },
  invert_level_m: { en: 'Invert Level (m)', ar: 'منسوب القاع (م)' },
  campus_id: { en: 'Campus ID', ar: 'معرّف الحرم' },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/;
const CODED_RE = /^(code|class|subtype|status|type|category|classification)$/i;

export function isSystemField(name: string): boolean {
  return SYSTEM_FIELDS.has(name.toLowerCase());
}

export function fieldAlias(name: string, locale: 'en' | 'ar'): string {
  const alias = FIELD_ALIASES[name];
  return alias ? alias[locale] : name.replace(/_/g, ' ');
}

export function formatFieldValue(key: string, value: unknown, locale: 'en' | 'ar'): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number' && value === -1 && /count|floor|year/i.test(key)) return '—';
  if (typeof value === 'boolean') return value ? (locale === 'ar' ? 'نعم' : 'Yes') : locale === 'ar' ? 'لا' : 'No';
  if (Array.isArray(value)) return value.map((v) => formatFieldValue(key, v, locale)).join(', ');
  if (typeof value === 'number') {
    if (/(area_sqm|educational_space)/i.test(key)) {
      return `${value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en', { maximumFractionDigits: 1 })} m²`;
    }
    if (/(_m|length_m|width_m|height_m|depth_m|range_m)$/i.test(key)) {
      return `${value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en', { maximumFractionDigits: 2 })} m`;
    }
    return Number.isInteger(value)
      ? value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en')
      : value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en', { maximumFractionDigits: 3 });
  }
  return String(value);
}

export function visibleProperties(props: Record<string, unknown>): [string, unknown][] {
  return Object.entries(props).filter(([k, v]) => !isSystemField(k) && v != null && v !== '');
}

function classifyValue(value: unknown): FieldValueType | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'coded';
  if (typeof value === 'string' && DATE_RE.test(value)) return 'date';
  if (typeof value === 'string') return 'text';
  return 'text';
}

/** Inspect a loaded collection — fields and types come from real feature properties. */
export function inspectFields(fc: FeatureCollection | undefined): FieldSchema[] {
  if (!fc?.features.length) return [];
  const present = new Map<string, { types: Set<FieldValueType>; uniques: Set<string | number> }>();

  for (const f of fc.features) {
    const props = f.properties ?? {};
    for (const [key, value] of Object.entries(props)) {
      if (isSystemField(key)) continue;
      const kind = classifyValue(value);
      if (!kind) continue;
      let entry = present.get(key);
      if (!entry) {
        entry = { types: new Set(), uniques: new Set() };
        present.set(key, entry);
      }
      entry.types.add(kind);
      if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
        entry.uniques.add(value as string | number);
      }
    }
  }

  return [...present.entries()]
    .map(([name, entry]) => {
      const types = entry.types;
      let type: FieldValueType = 'text';
      if (types.size === 1) type = [...types][0];
      else if (types.has('number') && !types.has('text')) type = 'number';
      else if (types.has('date') && !types.has('text')) type = 'date';
      const uniqueCount = entry.uniques.size;
      if (type !== 'date' && (CODED_RE.test(name) || (uniqueCount > 1 && uniqueCount <= 24 && type !== 'number'))) {
        type = 'coded';
      }
      return { name, type, uniqueCount };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Unique values for a field, preserving original types for MapLibre `in` filters. */
export function uniqueFieldValues(
  fc: FeatureCollection | undefined,
  field: string,
): Array<string | number> {
  if (!fc?.features.length) return [];
  const seen = new Set<string>();
  const values: Array<string | number> = [];
  for (const f of fc.features) {
    const raw = f.properties?.[field];
    if (raw == null || raw === '') continue;
    if (typeof raw !== 'string' && typeof raw !== 'number' && typeof raw !== 'boolean') continue;
    const value = typeof raw === 'boolean' ? String(raw) : raw;
    const key = `${typeof value}:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(value as string | number);
  }
  values.sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  });
  return values;
}

export function featureMatchesFilter(feature: Feature, filter: LayerFilter | undefined): boolean {
  if (!filter?.values.length) return true;
  const raw = feature.properties?.[filter.field];
  return filter.values.some((v) => v === raw || String(v) === String(raw));
}

export function popupTitle(props: Record<string, unknown>, fallback: string): string {
  const title =
    props.name_en ??
    props.name_ar ??
    props.building_no ??
    props.room_no ??
    props.parking_no ??
    props.description ??
    props.building_id ??
    props.room_id;
  return title == null || title === '' ? fallback : String(title);
}
