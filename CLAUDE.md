# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc --noEmit (typecheck) + vite build
npm run preview   # serve dist/
docker compose up --build   # nginx on :8080, /health endpoint

python scripts/extract_gdb.py            # regenerate public/data/*.geojson from the GDB
python scripts/extract_gdb.py --only net_roads bld_footprints   # just these layers
```

No test framework and no linter are configured — `npm run build` is the only gate. `tsconfig.json` sets `strict`, `noUnusedLocals`, and `noUnusedParameters`, so unused imports fail the build.

The extract script needs `pip install geopandas pyogrio` and the geodatabase zip at the repo root; both are absent from a fresh clone (see **Data** below).

## Architecture

React 19 + MapLibre GL SPA visualizing King Abdulaziz University campus GIS data. Bilingual (en/ar with RTL), dark/light theming.

**The layer registry is the center of the app.** `src/layers/layer-registry.ts` declares all 28 map layers as a `LayerDef`: id, group (`adm`/`bld`/`net`/`utl`/`env`), bilingual title, MapLibre geometry type + paint expressions, source URL, `defaultVisible`, and `metadata` (searchable fields, popup template, metric field names). Adding or changing a layer is almost always a registry edit only — the controller, sidebar, search index, and inspector all derive from it. Layer ids double as MapLibre source ids, as keys into `store.collections`, and as the `public/data/<id>.geojson` filename the extract script writes.

**Layers load lazily, and this constraint shapes everything.** The full extract is ~75 MB of GeoJSON (~7 MB gzipped) over ~167k features, so `loadRegistry` fetches only the layers marked `defaultVisible`. `ensureLoaded(layerId)` in `layer-controller` fetches-and-attaches one layer on demand, sharing its in-flight promise; the store subscription calls it whenever a layer becomes visible, and charts call it through the `useLayerData` hook in `chart-kit`. A failed fetch records an empty collection and marks the layer attached — without that the subscription would retry forever and charts would sit on a loading skeleton. Anything that reads `store.collections` must tolerate a layer simply not being there yet.

**State:** one Zustand store (`src/core/store.ts`), no context providers. Non-React code calls `useAppStore.getState()` directly. `layer-controller` subscribes to the store and imperatively pushes visibility/opacity onto the map (`applyLayerState`) — visibility is `layer.visible && groups[layer.group]`. That subscription fires on *every* store write including per-frame `setMapView`, so it early-returns unless the `layers` or `groups` object identity actually changed. Map→UI intents are one-shot fields the consumer clears: `flyTo`/`clearFlyTo`, `zoomDelta`/`clearZoomDelta`. Theme and sidebar-collapsed persist to localStorage (`kau-theme`, `kau-sidebar`); changing theme also swaps the basemap unless satellite is selected.

**Extent-driven analytics:** the map publishes its bounds to `store.extent` on `moveend`. Every chart filters through `featuresInView(collections, layerId, extent)` (`src/core/analytics.ts`), so all analytics are "what's currently on screen". `src/core/geo.ts` holds the dependency-free geometry helpers (haversine length, bbox, centroid) — there is no turf.js; add helpers there rather than a dependency. `featureLengthM` prefers the extract's stored `length_m` (measured in the projected CRS) over recomputing from lon/lat.

**Basemap switching destroys layers.** `map.setStyle()` wipes sources and layers, so `style.load` re-runs `loadRegistry`, which clears `attached`/`inflight` and re-attaches. The parsed-feature `sourceCache` in `vector-source.ts` is deliberately *not* cleared on a style swap — features are style-independent, so re-attaching costs no refetch and no re-parse. Anything added to the map outside the registry must be re-added on `style.load`.

**Charts:** each chart is a thin component (`BuildingAreaChart`, `RoomsChart`, `GreenAreaChart`, `NetworkLengthChart`) that declares the layers it needs via `useLayerData`, computes a `GroupedMetric` via `groupSum`/`groupSumTop`/`networkLengthByType`, and renders `<CategoricalChart>` from `src/ui/chart-kit.tsx`. chart-kit owns all Chart.js registration, palettes, tooltip/axis styling, and the `ChartCard`/`Segmented` shells. It reads theme colors from CSS custom properties via `cssVar()` and remounts charts with `key={theme}` on theme change — chart colors belong in chart-kit, not in individual charts. Set Chart.js defaults field-by-field (`ChartJS.defaults.animation.duration = …`); replacing `defaults.animation` wholesale strips resolver metadata and makes `Animation.tick` throw when a chart is destroyed.

**Search:** `Search.tsx` builds a FlexSearch document index incrementally — an effect on `store.collections` indexes each searchable layer as its data lands, so search never forces a fetch. Cmd/Ctrl+K opens the palette; global keybindings live in `App.tsx`.

**Styling:** a single hand-written `src/styles.css` (~1200 lines) with CSS custom properties under `:root`/`[data-theme='light']` and `[data-theme='dark']`. No CSS framework, no CSS modules. `App` sets `data-theme` and `dir` on the root element.

## Data

Everything in `public/data/` is generated by `scripts/extract_gdb.py` from `KUUA_Vr2.4GRF.gdb.zip`, KAU's ArcGIS File Geodatabase (130 layers, ~490 MB uncompressed). **The zip is gitignored** — it exceeds GitHub's file limit, so a fresh clone can build and run from the committed GeoJSON but cannot re-extract without obtaining the geodatabase separately.

The script's `SPECS` list is the mapping: one entry per output layer, naming the source GDB layer, a `{source field: output property}` rename map, and the `out_id` used as the registry's `promoteId`. Reprojection is EPSG:9357 (KSA-GRF17 / MTM) → WGS84. `SHAPE_Area`/`SHAPE_Length` become `area_sqm`/`length_m` — keep them, they were measured in the projected CRS. Coordinates are rounded to 1e-6° with `mode="pointwise"`, because the default precision mode throws on this GDB's self-touching polygons. Null sentinels (`-1`, `''`, `NaN`, `NaT`) are dropped, so **every property except the id is optional** — `src/types/kau-spatial-types.ts` documents the per-layer schemas.

Things the geodatabase does not have, which matter when picking paint expressions: most `Status`/`Type` columns are a single constant or entirely null, and subtype codes are bare integers (the GDB's domain labels are not readable through GDAL). Discriminating attributes that *are* populated: `BBuilding.BuildingCategory`, `BStreetCenterline.SpeedLimit` (the only road-hierarchy signal), pipe `Material` and `Diameter`, `BTree.TypeDescription`, `BSideWalk.Type`, `CWPipe.Type` (Arabic: بارد cold / حار, ساخن hot). The GDB has no transit-stop, contour, or soakaway layer.

Data spans all KAU branches (~145 km across Jeddah, Rabigh, Khulais, Kamil, Asfan, Abhur), tagged by the `branch` property; the main Sulaymaniyah campus around `KAU_CENTER` holds nearly all the detail.

Sources support `geojson`, `pmtiles` (protocol registered in `vector-source.ts`), and `flatgeobuf` (dynamically imported), but only `geojson` is currently used — it gzips ~10x, which beats FlatGeobuf over the wire. `nginx.conf` maps `.geojson` to `application/geo+json` so gzip actually applies; without that mapping nginx serves it as `application/octet-stream` and skips compression.

`VITE_MAPTILER_KEY` is optional — when set, MapTiler basemaps are used; otherwise it falls back to CARTO styles and Esri World Imagery.
