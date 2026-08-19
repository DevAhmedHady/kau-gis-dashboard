export type GeometryType =
  | 'Point'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon';

export interface BaseFeature<T extends GeometryType, P> {
  type: 'Feature';
  geometry: { type: T; coordinates: unknown };
  properties: P;
  id?: string | number;
}

export interface AdmCampusBoundaryProps {
  campus_id: string;
  name_ar: string;
  name_en: string;
  area_sqm: number;
  established_year: number;
}

export interface AdmZoneProps {
  zone_id: string;
  sector_name_ar: string;
  sector_name_en: string;
  zone_type: 'Academic' | 'Residential' | 'Administrative' | 'Research' | 'Recreational';
  area_sqm: number;
}

export interface AdmParcelProps {
  parcel_id: string;
  zone_id: string;
  land_use: 'Academic' | 'Housing' | 'Commercial' | 'Green' | 'Utility';
  ownership: 'University' | 'Leased' | 'Government';
  area_sqm: number;
}

export interface BldFootprintProps {
  building_id: string;
  name_ar: string;
  name_en: string;
  faculty: string;
  floors_count: number;
  usage_type:
    | 'Academic'
    | 'Administrative'
    | 'Laboratory'
    | 'Library'
    | 'Sports'
    | 'Residential'
    | 'Mixed';
  gross_area_sqm: number;
  year_built: number;
  status: 'Active' | 'Under Construction' | 'Renovation' | 'Decommissioned';
}

export interface BldEntranceProps {
  entrance_id: string;
  building_id: string;
  access_type: 'Main' | 'Secondary' | 'Service' | 'Emergency Only';
  emergency_exit: boolean;
  floor_level: number;
  accessible: boolean;
}

export interface BldAmenityProps {
  amenity_id: string;
  building_id: string;
  type:
    | 'Classroom'
    | 'Lab'
    | 'Office'
    | 'Auditorium'
    | 'Cafeteria'
    | 'Prayer Room'
    | 'Restroom'
    | 'Elevator'
    | 'Stairs';
  floor_level: number;
  room_number?: string;
  capacity?: number;
  status: 'Operational' | 'Maintenance' | 'Out of Service';
}

export interface NetRoadProps {
  road_id: string;
  name_ar?: string;
  name_en?: string;
  hierarchy: 'Primary' | 'Secondary' | 'Service' | 'Pedestrian Only';
  speed_limit_kmh: number;
  one_way: boolean;
  surface_type: 'Asphalt' | 'Concrete' | 'Pavers' | 'Gravel';
  length_m: number;
}

export interface NetPedestrianPathProps {
  path_id: string;
  path_type: 'Sidewalk' | 'Plaza' | 'Bridge' | 'Tunnel' | 'Crosswalk';
  width_m: number;
  lighting: boolean;
  accessible: boolean;
  length_m: number;
}

export interface NetParkingLotProps {
  parking_id: string;
  name_ar: string;
  name_en: string;
  type: 'Faculty' | 'Student' | 'VIP' | 'Visitor' | 'Accessible' | 'Mixed';
  capacity: number;
  occupied?: number;
  ev_charging: boolean;
  ev_charging_count: number;
  floors: number;
  covered: boolean;
  hourly_rate_sar?: number;
}

export interface NetTransitStopProps {
  stop_id: string;
  name_ar: string;
  name_en: string;
  lines: string[];
  shelter: boolean;
  real_time_display: boolean;
  accessible: boolean;
}

export interface UtlLightingProps {
  pole_id: string;
  type: 'Street' | 'Pathway' | 'Flood' | 'Decorative' | 'Solar';
  height_m: number;
  wattage: number;
  status: 'Operational' | 'Faulty' | 'Maintenance';
  last_maintenance: string;
}

export interface UtlSecurityNodeProps {
  node_id: string;
  type: 'CCTV' | 'Emergency Phone' | 'Access Control' | 'Gate Barrier';
  coverage_angle?: number;
  resolution?: string;
  recording: boolean;
  status: 'Active' | 'Inactive' | 'Maintenance';
}

export interface UtlWaterLineProps {
  line_id: string;
  network_type: 'Potable' | 'Irrigation' | 'Fire Protection' | 'Chilled Water' | 'Sewage';
  diameter_mm: number;
  material: 'HDPE' | 'Ductile Iron' | 'PVC' | 'Steel';
  flow_direction?: 'Forward' | 'Reverse';
  status: 'Active' | 'Isolated' | 'Under Repair';
  length_m: number;
}

export interface EnvGreenAreaProps {
  green_id: string;
  name_ar: string;
  name_en: string;
  type: 'Park' | 'Garden' | 'Sports Field' | 'Plaza' | 'Courtyard' | 'Green Roof' | 'Buffer Zone';
  area_sqm: number;
  irrigation: 'Automated' | 'Manual' | 'None';
  native_species_pct: number;
  maintenance_level: 'High' | 'Medium' | 'Low';
}

export interface EnvContourProps {
  contour_id: string;
  elevation_m: number;
  index_contour: boolean;
  length_m: number;
}

export type SoakawayType =
  | 'Infiltration Basin'
  | 'Swale'
  | 'Retention Pond'
  | 'Permeable Pavement'
  | 'French Drain'
  | 'Detention Tank';

export interface EnvSoakawayProps {
  soakaway_id: string;
  name_ar: string;
  name_en: string;
  type: SoakawayType;
  area_sqm: number;
  capacity_m3: number;
  depth_m: number;
  infiltration_rate_mmh: number;
  catchment_area_sqm: number;
  status: 'Operational' | 'Silted' | 'Maintenance' | 'Planned';
}

export type AdmFeature =
  | BaseFeature<'Polygon' | 'MultiPolygon', AdmCampusBoundaryProps>
  | BaseFeature<'Polygon' | 'MultiPolygon', AdmZoneProps>
  | BaseFeature<'Polygon' | 'MultiPolygon', AdmParcelProps>;

export type BldFeature =
  | BaseFeature<'Polygon' | 'MultiPolygon', BldFootprintProps>
  | BaseFeature<'Point', BldEntranceProps>
  | BaseFeature<'Point', BldAmenityProps>;

export type NetFeature =
  | BaseFeature<'LineString' | 'MultiLineString', NetRoadProps>
  | BaseFeature<'LineString' | 'MultiLineString', NetPedestrianPathProps>
  | BaseFeature<'Polygon' | 'MultiPolygon', NetParkingLotProps>
  | BaseFeature<'Point', NetTransitStopProps>;

export type UtlFeature =
  | BaseFeature<'Point', UtlLightingProps>
  | BaseFeature<'Point', UtlSecurityNodeProps>
  | BaseFeature<'LineString' | 'MultiLineString', UtlWaterLineProps>;

export type EnvFeature =
  | BaseFeature<'Polygon' | 'MultiPolygon', EnvGreenAreaProps>
  | BaseFeature<'Polygon' | 'MultiPolygon', EnvSoakawayProps>
  | BaseFeature<'LineString' | 'MultiLineString', EnvContourProps>;

export type KauFeature = AdmFeature | BldFeature | NetFeature | UtlFeature | EnvFeature;
export type KauFeatureCollection = { type: 'FeatureCollection'; features: KauFeature[] };

export type LayerGroup = 'adm' | 'bld' | 'net' | 'utl' | 'env';
