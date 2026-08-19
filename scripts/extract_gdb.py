"""Extract KAU campus layers from the ArcGIS File Geodatabase into public/data/*.geojson.

Usage:  python scripts/extract_gdb.py [--gdb KUUA_Vr2.4GRF.gdb.zip] [--out public/data]

Requires: pip install geopandas pyogrio

The GDB is EPSG:9357 (KSA-GRF17 / MTM); everything is reprojected to WGS84 for MapLibre.
SHAPE_Area / SHAPE_Length are kept (as area_sqm / length_m) because they were measured in
the projected CRS and so are more accurate than anything recomputed from lon/lat.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import date, datetime
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely import set_precision

# ponytail: 1e-6 deg ~= 0.11 m. Plenty for a campus map, and it roughly halves file size.
COORD_PRECISION = 1e-6

# out_id: property name the layer registry uses as promoteId.
# fields: {source field: output property}. SHAPE_Area/SHAPE_Length are mapped like any other.
# Any GDB field not listed here is dropped -- most of the rest is per-row audit metadata.
SPECS: list[dict] = [
    # ---- adm: administrative ------------------------------------------------
    {
        "out": "adm_zones", "layer": "BZoneBoundary", "out_id": "zone_id",
        "where": lambda g: g["ZoneOne"].notna(),
        "fields": {
            "ZoneOne": "zone_code", "Description": "name_ar", "Branches": "branch",
            "SHAPE_Area": "area_sqm",
        },
    },
    {
        "out": "adm_campus_boundary", "layer": "BZoneBoundary", "out_id": "campus_id",
        "dissolve": True,
        "fields": {"SHAPE_Area": "area_sqm"},
    },
    {
        "out": "adm_parcels", "layer": "BParcel", "out_id": "parcel_id",
        "fields": {
            "BParcelID": "parcel_id", "الاسم": "name_ar",
            "الاستخدام": "land_use",
            "الحالة": "status",
            "Description": "description", "Branches": "branch", "SHAPE_Area": "area_sqm",
        },
    },
    {
        "out": "adm_investment", "layer": "VInvestmentProperty", "out_id": "investment_id",
        "fields": {
            "VLeasedLandID": "investment_id", "Description": "description",
            "LandTenure": "land_tenure", "OwnershipEntity": "ownership",
            "LandUsageStatus": "usage_status", "ContractStatus": "contract_status",
            "ContractType": "contract_type", "InvestmentType": "investment_type",
            "SHAPE_Area": "area_sqm",
        },
    },
    # ---- bld: built environment --------------------------------------------
    {
        "out": "bld_footprints", "layer": "BBuilding", "out_id": "building_id",
        "fields": {
            "BBuildingID": "building_id", "BuildingNo": "building_no",
            "ArabicName": "name_ar", "EnglishName": "name_en",
            "CompoundArabicName": "compound_ar", "CompoundEnglishName": "compound_en",
            "BuildingCategory": "category", "BuildingStatus": "status",
            "NoOfFloor": "floors_count", "Height": "height_m",
            "ConstructionDate": "construction_year",
            "NoOfClassroom": "classrooms", "NoOfLab": "labs",
            "TotalCapacity": "capacity", "EducationalSpace": "educational_space_sqm",
            "Description": "description", "Branches": "branch", "SHAPE_Area": "area_sqm",
        },
    },
    {
        "out": "bld_rooms", "layer": "PRoomClassification", "out_id": "room_id",
        "fields": {
            "PRoomID": "room_id", "PBuildingID": "building_id", "BuildingNo": "building_no",
            "ArabicRoomName": "name_ar", "EnglishRoomName": "name_en",
            "Department": "department", "FloorNo": "floor_no", "FloorName": "floor_name",
            "RoomNo": "room_no", "Capacity": "capacity", "StudentCapacity": "student_capacity",
            "RoomClassification": "classification", "ArabicRoomUsage": "usage_ar",
            "SHAPE_Area": "area_sqm",
        },
    },
    {
        "out": "bld_gates", "layer": "BIronGate", "out_id": "gate_id",
        "fields": {"BIronGateID": "gate_id", "Description": "description", "Branches": "branch"},
    },
    {
        "out": "bld_landmarks", "layer": "BLandmark", "out_id": "landmark_id",
        "fields": {
            "BLandmarkID": "landmark_id", "ArabicName": "name_ar", "EnglishName": "name_en",
            "Description": "description", "Branches": "branch",
        },
    },
    # ---- net: transportation ------------------------------------------------
    {
        "out": "net_roads", "layer": "BStreetCenterline", "out_id": "road_id",
        "fields": {
            "BStreetCenterlineID": "road_id", "ArabicName": "name_ar", "EnglishName": "name_en",
            "Subtype": "subtype", "SpeedLimit": "speed_limit",
            "TrafficDirection": "traffic_direction", "StreeetNo": "street_no",
            "Description": "description", "Branches": "branch", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "net_walking_paths", "layer": "BWalkingPath", "out_id": "path_id",
        "fields": {
            "BWalkingPathID": "path_id", "PathStatus": "status", "SurfaceType": "surface_type",
            "Path_Width": "width_m", "Accessibility": "accessible", "Shaded": "shaded",
            "Description": "description", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "net_bike_paths", "layer": "BBikePath", "out_id": "path_id",
        "fields": {
            "BBikePathID": "path_id", "PathClass": "path_class", "PathStatus": "status",
            "SurfaceType": "surface_type", "Path_Width": "width_m", "Stage": "stage",
            "Description": "description", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "net_parking_lots", "layer": "BParking", "out_id": "parking_id",
        "fields": {
            "BParkingID": "parking_id", "ParkingArabicName": "name_ar",
            "ParkingEnglishName": "name_en", "ParkingOwnerArabicName": "owner_ar",
            "ParkingOwnerEnglishName": "owner_en", "ParkingNo": "parking_no",
            "Capacity": "capacity", "Height": "height_m", "Subtype": "subtype",
            "Description": "description", "Branches": "branch", "SHAPE_Area": "area_sqm",
        },
    },
    {
        "out": "net_sidewalks", "layer": "BSideWalk", "out_id": "sidewalk_id",
        "fields": {
            "BSideWalkID": "sidewalk_id", "Type": "surface_type", "Status": "status",
            "Description": "description", "Branches": "branch", "SHAPE_Area": "area_sqm",
        },
    },
    {
        "out": "net_road_islands", "layer": "BRoadIsland", "out_id": "island_id",
        "fields": {
            "BRoadIslandID": "island_id", "Description": "description",
            "Branches": "branch", "SHAPE_Area": "area_sqm",
        },
    },
    {
        "out": "net_road_signs", "layer": "BRoadSign", "out_id": "sign_id",
        "fields": {
            "BRoadSignID": "sign_id", "Description": "description", "Branches": "branch",
        },
    },
    # ---- utl: utilities -----------------------------------------------------
    {
        "out": "utl_lighting", "layer": "EStreetLight", "out_id": "pole_id",
        "fields": {
            "EStreetLightID": "pole_id", "ArabicName": "name_ar", "EnglishName": "name_en",
            "Subtype": "subtype", "EStreetLightType": "light_type", "Status": "status",
            "LampTechnology": "lamp_technology", "PoleHeightMeters": "pole_height_m",
            "PowerWatts": "power_watts", "Description": "description", "Branches": "branch",
        },
    },
    {
        "out": "utl_water_lines", "layer": "WMainPipe", "out_id": "line_id",
        "fields": {
            "WMainPipeID": "line_id", "ArabicName": "name_ar", "EnglishName": "name_en",
            "Type": "network_type", "Status": "status", "Material": "material",
            "Diameter": "diameter_mm", "Depth": "depth_m",
            "Branches": "branch", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "utl_sewer_lines", "layer": "WWGravityPipe", "out_id": "line_id",
        "fields": {
            "WWGravityPipeID": "line_id", "Type": "network_type", "Status": "status",
            "Material": "material", "Diameter": "diameter_mm",
            "Branches": "branch", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "utl_irrigation_lines", "layer": "IMainPipe", "out_id": "line_id",
        "fields": {
            "IMainPipeID": "line_id", "Type": "network_type", "Status": "status",
            "Material": "material", "Diameter": "diameter_mm",
            "Branches": "branch", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "utl_chilled_water_lines", "layer": "CWPipe", "out_id": "line_id",
        "fields": {
            "CWPipeID": "line_id", "Type": "network_type", "Status": "status",
            "Material": "material", "Diameter": "diameter_mm",
            "Branches": "branch", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "utl_electric_cables", "layer": "EPrimaryElectricCable", "out_id": "cable_id",
        "fields": {
            "EPrimaryElectricCableID": "cable_id", "Subtype": "subtype", "Status": "status",
            "Branches": "branch", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "utl_telecom_ducts", "layer": "TDuct", "out_id": "duct_id",
        "fields": {
            "TDuctID": "duct_id", "Type": "duct_type", "Status": "status",
            "Branches": "branch", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "utl_fire_hydrants", "layer": "WFireHydrant", "out_id": "hydrant_id",
        "fields": {
            "WFireHydrantID": "hydrant_id", "Type": "hydrant_type", "Status": "status",
            "Description": "description", "Branches": "branch",
        },
    },
    {
        "out": "utl_security_nodes", "layer": "SSSpeedRadar", "out_id": "node_id",
        "fields": {
            "SSSpeedRadarID": "node_id", "CameraId": "camera_id",
            "ArabicName": "name_ar", "EnglishName": "name_en",
            "Type": "node_type", "Status": "status", "BrandName": "brand",
            "ModelNo": "model", "Resolution": "resolution", "Range": "range_m",
            "Branches": "branch",
        },
    },
    # ---- env: environment ---------------------------------------------------
    {
        "out": "env_green_areas", "layer": "BGreenArea", "out_id": "green_id",
        "fields": {
            "BGreenAreaID": "green_id", "Description": "description",
            "Branches": "branch", "SHAPE_Area": "area_sqm",
        },
    },
    {
        "out": "env_trees", "layer": "BTree", "out_id": "tree_id",
        "fields": {
            "BTreeID": "tree_id", "Subtype": "subtype", "TypeDescription": "species",
            "Branches": "branch",
        },
    },
    {
        "out": "env_drainage_lines", "layer": "DMainPipe", "out_id": "line_id",
        "fields": {
            "DMainPipeID": "line_id", "Type": "network_type", "Status": "status",
            "Material": "material", "Diameter": "diameter_mm",
            "Branches": "branch", "SHAPE_Length": "length_m",
        },
    },
    {
        "out": "env_catch_basins", "layer": "DCatchBasin", "out_id": "basin_id",
        "fields": {
            "DCatchBasinID": "basin_id", "ArabicName": "name_ar", "EnglishName": "name_en",
            "Subtype": "subtype", "Type": "basin_type", "Status": "status",
            "Depth": "depth_m", "InvertLevel": "invert_level_m",
            "Description": "description", "Branches": "branch",
        },
    },
]


def clean(value):
    """GDB null sentinels ('-1', '', NaN, NaT) become None so the UI can skip the key entirely."""
    if value is None:
        return None
    if isinstance(value, np.generic):
        value = value.item()
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass  # arrays / unhashables are never null sentinels here
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return round(value, 3)
    if isinstance(value, str):
        s = value.strip()
        return None if s in ("", "-1", "<Null>") else s
    if isinstance(value, (pd.Timestamp, datetime, date)):
        # A handful of GDB fields are mistyped as dates (e.g. BBikePath.Path_Width).
        return value.isoformat()
    return value


def build(spec: dict, gdb: str) -> tuple[dict, int]:
    gdf = gpd.read_file(gdb, layer=spec["layer"], engine="pyogrio")

    if "where" in spec:
        gdf = gdf[spec["where"](gdf)]
    gdf = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]

    features: list[dict] = []
    if not gdf.empty:
        if spec.get("dissolve"):
            merged = gdf.geometry.union_all()
            parts = list(getattr(merged, "geoms", [merged]))
            gdf = gpd.GeoDataFrame(
                {"SHAPE_Area": [p.area for p in parts]}, geometry=parts, crs=gdf.crs
            )

        keep = {src: out for src, out in spec["fields"].items() if src in gdf.columns}
        props = gdf[list(keep)].rename(columns=keep)

        # ConstructionDate is the one datetime worth keeping, and only as a year.
        if "construction_year" in props.columns:
            props["construction_year"] = props["construction_year"].dt.year

        # pointwise: plain coordinate rounding. The default mode tries to keep the output
        # topologically valid and throws on the self-touching polygons this GDB contains.
        geoms = set_precision(gdf.geometry.to_crs(4326).values, COORD_PRECISION, mode="pointwise")

        id_key = spec["out_id"]
        for i, (geom, record) in enumerate(zip(geoms, props.to_dict("records"))):
            if geom is None or geom.is_empty:
                continue
            cleaned = {k: v for k, v in ((k, clean(v)) for k, v in record.items()) if v is not None}
            fid = cleaned.get(id_key) or f"{spec['out'].upper()}-{i:06d}"
            cleaned[id_key] = fid
            features.append({
                "type": "Feature",
                "id": fid,
                "geometry": geom.__geo_interface__,
                "properties": cleaned,
            })

    return {
        "type": "FeatureCollection",
        "name": spec["out"],
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features,
    }, len(features)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gdb", default="KUUA_Vr2.4GRF.gdb.zip")
    ap.add_argument("--out", default="public/data")
    ap.add_argument("--only", nargs="*", help="restrict to these output layer names")
    args = ap.parse_args()

    src = Path(args.gdb)
    if not src.exists():
        print(f"geodatabase not found: {src}", file=sys.stderr)
        return 1
    if src.suffix == ".zip":
        gdb = f"/vsizip/{src.as_posix()}/{src.name[: -len('.zip')]}"
    else:
        gdb = str(src)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    total = 0
    for spec in SPECS:
        if args.only and spec["out"] not in args.only:
            continue
        fc, n = build(spec, gdb)
        path = out_dir / f"{spec['out']}.geojson"
        path.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        size = path.stat().st_size
        total += size
        print(f"{spec['out']:26} <- {spec['layer']:22} {n:7} features  {size / 1e6:6.2f} MB")

    print(f"{'TOTAL':26}    {total / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
