/**
 * Property schemas for the layers produced by `scripts/extract_gdb.py` from
 * KUUA_Vr2.4GRF.gdb. These document the extract's contract with the layer registry —
 * the runtime paths work with plain `Feature`/`FeatureCollection` from @types/geojson.
 *
 * Every field is optional: the extractor drops keys whose geodatabase value was null or
 * one of its null sentinels ('-1', ''), so features carry only what is actually populated.
 */

export type LayerGroup = 'adm' | 'bld' | 'net' | 'utl' | 'env';

/** Attribution present on nearly every layer. `branch` names the KAU campus/branch. */
export interface CommonProps {
  description?: string;
  branch?: string;
}

/** Polygon layers carry the geodatabase's projected (EPSG:9357) area, in m². */
export interface AreaProps {
  area_sqm?: number;
}

/** Line layers carry the geodatabase's projected length, in metres. */
export interface LengthProps {
  length_m?: number;
}

/** Shared by every pipe/cable network layer. */
export interface PipeProps extends CommonProps, LengthProps {
  line_id: string;
  network_type?: string;
  status?: string;
  material?: string;
  diameter_mm?: number;
}

// ── adm ──────────────────────────────────────────────────────────────────────

/** Dissolved union of BZoneBoundary — one feature per contiguous site. */
export interface AdmCampusBoundaryProps extends AreaProps {
  campus_id: string;
}

export interface AdmZoneProps extends CommonProps, AreaProps {
  zone_id: string;
  /** 1000…8000. The geodatabase has no zone names; `name_ar` holds its label. */
  zone_code?: number;
  name_ar?: string;
}

export interface AdmParcelProps extends CommonProps, AreaProps {
  parcel_id: string;
  name_ar?: string;
  land_use?: string;
  status?: string;
}

export interface AdmInvestmentProps extends CommonProps, AreaProps {
  investment_id: string;
  land_tenure?: string;
  ownership?: string;
  usage_status?: string;
  contract_status?: string;
  contract_type?: string;
  investment_type?: string;
}

// ── bld ──────────────────────────────────────────────────────────────────────

export interface BldFootprintProps extends CommonProps, AreaProps {
  building_id: string;
  building_no?: string;
  name_ar?: string;
  name_en?: string;
  compound_ar?: string;
  compound_en?: string;
  /** e.g. 'Faculty Housing', 'Services', 'Administrative & Academic Male', 'Sports'. */
  category?: string;
  /** OCC = occupied, CNS = under construction, REN = renovation. */
  status?: string;
  /** Carries -1 as a null sentinel for a handful of rows. */
  floors_count?: number;
  /** Measured height; populated for only ~65 buildings. */
  height_m?: number;
  construction_year?: number;
  classrooms?: string;
  labs?: string;
  capacity?: string;
  educational_space_sqm?: number;
}

export interface BldRoomProps extends AreaProps {
  room_id: string;
  building_id?: string;
  building_no?: string;
  name_ar?: string;
  name_en?: string;
  department?: string;
  floor_no?: number;
  floor_name?: string;
  room_no?: string;
  capacity?: number;
  student_capacity?: number;
  classification?: string;
  usage_ar?: string;
}

export interface BldGateProps extends CommonProps {
  gate_id: string;
}

export interface BldLandmarkProps extends CommonProps {
  landmark_id: string;
  name_ar?: string;
  name_en?: string;
}

// ── net ──────────────────────────────────────────────────────────────────────

export interface NetRoadProps extends CommonProps, LengthProps {
  road_id: string;
  name_ar?: string;
  name_en?: string;
  /** 1, 2 or 3. Geodatabase subtype codes; the domain labels are not in the GDB. */
  subtype?: number;
  /** 20–100 km/h. The only populated road-hierarchy signal, so the paint uses it. */
  speed_limit?: number;
  traffic_direction?: string;
  street_no?: string;
}

export interface NetPathProps extends LengthProps {
  path_id: string;
  description?: string;
  status?: string;
  surface_type?: string;
  width_m?: number;
  /** Pedestrian paths only. */
  accessible?: string;
  shaded?: string;
  /** Bike paths only. */
  path_class?: string;
  stage?: string;
}

export interface NetParkingProps extends CommonProps, AreaProps {
  parking_id: string;
  parking_no?: string;
  name_ar?: string;
  name_en?: string;
  owner_ar?: string;
  owner_en?: string;
  capacity?: number;
  height_m?: number;
  subtype?: number;
}

export interface NetSidewalkProps extends CommonProps, AreaProps {
  sidewalk_id: string;
  /** Mixed English/Arabic in the source: 'Asphalt', 'اسمنت', 'بلاط', 'كونكريت'. */
  surface_type?: string;
  status?: string;
}

export interface NetRoadIslandProps extends CommonProps, AreaProps {
  island_id: string;
}

export interface NetRoadSignProps extends CommonProps {
  sign_id: string;
}

// ── utl ──────────────────────────────────────────────────────────────────────

export interface UtlLightingProps extends CommonProps {
  pole_id: string;
  name_ar?: string;
  name_en?: string;
  subtype?: number;
  light_type?: string;
  status?: string;
  lamp_technology?: string;
  pole_height_m?: number;
  power_watts?: number;
}

export interface UtlWaterLineProps extends PipeProps {
  name_ar?: string;
  name_en?: string;
  depth_m?: number;
}

export type UtlSewerLineProps = PipeProps;
export type UtlIrrigationLineProps = PipeProps;

export interface UtlChilledWaterLineProps extends PipeProps {
  /** Arabic in the source: بارد = chilled, حار / ساخن = hot. */
  network_type?: string;
}

export interface UtlElectricCableProps extends CommonProps, LengthProps {
  cable_id: string;
  subtype?: number;
  status?: string;
}

export interface UtlTelecomDuctProps extends CommonProps, LengthProps {
  duct_id: string;
  duct_type?: string;
  status?: string;
}

export interface UtlFireHydrantProps extends CommonProps {
  hydrant_id: string;
  /** 'Wet Barrel' | 'Dry Barrel' | 'Pillar'. */
  hydrant_type?: string;
  status?: string;
}

export interface UtlSecurityNodeProps extends CommonProps {
  node_id: string;
  camera_id?: string;
  name_ar?: string;
  name_en?: string;
  node_type?: string;
  status?: string;
  brand?: string;
  model?: string;
  resolution?: string;
  range_m?: number;
}

// ── env ──────────────────────────────────────────────────────────────────────

export interface EnvGreenAreaProps extends CommonProps, AreaProps {
  green_id: string;
}

export interface EnvTreeProps extends CommonProps {
  tree_id: string;
  subtype?: number;
  /** 'Shade', 'Phoenix Dactylifera Palm', 'Tabebuia Tree', … */
  species?: string;
}

export type EnvDrainageLineProps = PipeProps;

export interface EnvCatchBasinProps extends CommonProps {
  basin_id: string;
  name_ar?: string;
  name_en?: string;
  subtype?: number;
  basin_type?: string;
  status?: string;
  depth_m?: number;
  invert_level_m?: number;
}

/** Registry layer id → its property schema. */
export interface LayerPropsMap {
  adm_campus_boundary: AdmCampusBoundaryProps;
  adm_zones: AdmZoneProps;
  adm_parcels: AdmParcelProps;
  adm_investment: AdmInvestmentProps;
  bld_footprints: BldFootprintProps;
  bld_rooms: BldRoomProps;
  bld_gates: BldGateProps;
  bld_landmarks: BldLandmarkProps;
  net_roads: NetRoadProps;
  net_walking_paths: NetPathProps;
  net_bike_paths: NetPathProps;
  net_parking_lots: NetParkingProps;
  net_sidewalks: NetSidewalkProps;
  net_road_islands: NetRoadIslandProps;
  net_road_signs: NetRoadSignProps;
  utl_lighting: UtlLightingProps;
  utl_water_lines: UtlWaterLineProps;
  utl_sewer_lines: UtlSewerLineProps;
  utl_irrigation_lines: UtlIrrigationLineProps;
  utl_chilled_water_lines: UtlChilledWaterLineProps;
  utl_electric_cables: UtlElectricCableProps;
  utl_telecom_ducts: UtlTelecomDuctProps;
  utl_fire_hydrants: UtlFireHydrantProps;
  utl_security_nodes: UtlSecurityNodeProps;
  env_green_areas: EnvGreenAreaProps;
  env_trees: EnvTreeProps;
  env_drainage_lines: EnvDrainageLineProps;
  env_catch_basins: EnvCatchBasinProps;
}
