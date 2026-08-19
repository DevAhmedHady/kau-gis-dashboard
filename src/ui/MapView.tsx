import { useEffect, useRef } from 'react';
import {
  FullscreenControl,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
} from 'maplibre-gl';
import { BASEMAPS } from '../core/basemaps';
import { KAU_CENTER, KAU_ZOOM, type BBox } from '../core/geo';
import { useAppStore } from '../core/store';
import { loadRegistry, queryInteractive, detachStoreSync } from '../layers/layer-controller';
import { clearSourceCache, registerPmtiles } from '../layers/vector-source';

registerPmtiles();

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const appliedBasemap = useRef<string | null>(null);
  const basemap = useAppStore((s) => s.basemap);
  const flyTo = useAppStore((s) => s.flyTo);
  const zoomDelta = useAppStore((s) => s.zoomDelta);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const def = BASEMAPS.find((b) => b.id === useAppStore.getState().basemap) ?? BASEMAPS[0];
    const map = new MapLibreMap({
      container: containerRef.current,
      style: def.style,
      center: KAU_CENTER,
      zoom: KAU_ZOOM,
      pitch: 45,
      canvasContextAttributes: { antialias: true },
      hash: true,
      cooperativeGestures: true,
    });
    map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new FullscreenControl(), 'bottom-right');
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');
    mapRef.current = map;
    appliedBasemap.current = def.id;

    const onStyle = () => {
      void loadRegistry(map);
    };
    map.on('style.load', onStyle);

    const publishExtent = () => {
      const b = map.getBounds();
      const next: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      useAppStore.getState().setExtent(next);
    };
    const publishCenter = () => {
      const c = map.getCenter();
      useAppStore.getState().setMapView({ lng: c.lng, lat: c.lat, zoom: map.getZoom() });
    };
    const onLoad = () => {
      publishExtent();
      publishCenter();
    };
    map.on('load', onLoad);
    map.on('move', publishCenter);
    map.on('moveend', publishExtent);

    map.on('click', (e) => {
      const features = queryInteractive(map, e.point);
      if (!features.length) {
        useAppStore.getState().selectFeature(null);
        return;
      }
      const feature = features[0];
      useAppStore.getState().selectFeature({
        layerId: feature.layer.id,
        properties: (feature.properties ?? {}) as Record<string, unknown>,
      });
    });
    map.on('mousemove', (e) => {
      map.getCanvas().style.cursor = queryInteractive(map, e.point).length ? 'pointer' : '';
    });

    return () => {
      map.off('style.load', onStyle);
      map.off('load', onLoad);
      map.off('move', publishCenter);
      map.off('moveend', publishExtent);
      detachStoreSync();
      map.remove();
      mapRef.current = null;
      clearSourceCache();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || appliedBasemap.current === basemap) return;
    const def = BASEMAPS.find((b) => b.id === basemap);
    if (!def) return;
    appliedBasemap.current = basemap;
    clearSourceCache();
    map.setStyle(def.style);
  }, [basemap]);

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({ center: flyTo.center, zoom: flyTo.zoom, essential: true });
    useAppStore.getState().clearFlyTo();
  }, [flyTo]);

  useEffect(() => {
    if (!zoomDelta || !mapRef.current) return;
    mapRef.current.zoomTo(mapRef.current.getZoom() + zoomDelta, { duration: 280 });
    useAppStore.getState().clearZoomDelta();
  }, [zoomDelta]);

  return <div ref={containerRef} className="map" />;
}
