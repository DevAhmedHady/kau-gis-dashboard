import type { FeatureCollection } from 'geojson';
import { create } from 'zustand';
import type { BBox } from './geo';
import type { LayerGroup } from '../types/kau-spatial-types';

export interface LayerState {
  id: string;
  visible: boolean;
  opacity: number;
  group: LayerGroup;
}

export interface MetricsState {
  buildingCount: number;
  totalArea: number;
  parkingCapacity: number;
  greenArea: number;
}

export interface SearchHit {
  id: string;
  layerId: string;
  title: string;
  meta: string;
  center: [number, number];
  properties: Record<string, unknown>;
}

export interface SelectedFeature {
  layerId: string;
  properties: Record<string, unknown>;
}

export type ThemeMode = 'dark' | 'light';

export interface MapViewState {
  lng: number;
  lat: number;
  zoom: number;
}

interface AppState {
  layers: LayerState[];
  groups: Record<LayerGroup, boolean>;
  metrics: MetricsState;
  collections: Partial<Record<string, FeatureCollection>>;
  dataReady: boolean;
  extent: BBox | null;
  mapView: MapViewState | null;
  analyticsOpen: boolean;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  theme: ThemeMode;
  selected: SelectedFeature | null;
  searchQuery: string;
  searchHits: SearchHit[];
  locale: 'en' | 'ar';
  basemap: string;
  flyTo: { center: [number, number]; zoom: number } | null;
  zoomDelta: number | null;

  setLayers: (layers: LayerState[]) => void;
  setLayerVisible: (id: string, visible: boolean) => void;
  setOpacity: (id: string, opacity: number) => void;
  toggleGroup: (group: LayerGroup) => void;
  setMetrics: (metrics: Partial<MetricsState>) => void;
  setCollections: (collections: Partial<Record<string, FeatureCollection>>) => void;
  setDataReady: (ready: boolean) => void;
  setExtent: (extent: BBox | null) => void;
  setMapView: (view: MapViewState) => void;
  setAnalyticsOpen: (open: boolean) => void;
  toggleAnalytics: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  selectFeature: (feature: SelectedFeature | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchHits: (hits: SearchHit[]) => void;
  setLocale: (locale: 'en' | 'ar') => void;
  setBasemap: (id: string) => void;
  requestFlyTo: (center: [number, number], zoom?: number) => void;
  clearFlyTo: () => void;
  requestZoom: (delta: number) => void;
  clearZoomDelta: () => void;
}

const GROUPS: Record<LayerGroup, boolean> = {
  adm: true,
  bld: true,
  net: true,
  utl: true,
  env: true,
};

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota */
  }
}

const initialTheme = readStored<ThemeMode>('kau-theme', 'light');
const initialCollapsed = readStored<boolean>('kau-sidebar', false);

export const useAppStore = create<AppState>((set) => ({
  layers: [],
  groups: GROUPS,
  metrics: { buildingCount: 0, totalArea: 0, parkingCapacity: 0, greenArea: 0 },
  collections: {},
  dataReady: false,
  extent: null,
  mapView: null,
  analyticsOpen: false,
  sidebarCollapsed: initialCollapsed,
  commandOpen: false,
  theme: initialTheme,
  selected: null,
  searchQuery: '',
  searchHits: [],
  locale: 'en',
  basemap: initialTheme === 'light' ? 'light' : 'dark',
  flyTo: null,
  zoomDelta: null,

  setLayers: (layers) => set({ layers }),
  setLayerVisible: (id, visible) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, visible } : l)) })),
  setOpacity: (id, opacity) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, opacity } : l)) })),
  toggleGroup: (group) =>
    set((s) => {
      const visible = !s.groups[group];
      return {
        groups: { ...s.groups, [group]: visible },
        layers: s.layers.map((l) => (l.group === group ? { ...l, visible } : l)),
      };
    }),
  setMetrics: (metrics) => set((s) => ({ metrics: { ...s.metrics, ...metrics } })),
  setCollections: (collections) => set({ collections }),
  setDataReady: (dataReady) => set({ dataReady }),
  setExtent: (extent) => set({ extent }),
  setMapView: (mapView) => set({ mapView }),
  setAnalyticsOpen: (analyticsOpen) => set({ analyticsOpen }),
  toggleAnalytics: () => set((s) => ({ analyticsOpen: !s.analyticsOpen })),
  setSidebarCollapsed: (sidebarCollapsed) => {
    persist('kau-sidebar', sidebarCollapsed);
    set({ sidebarCollapsed });
  },
  toggleSidebar: () =>
    set((s) => {
      const sidebarCollapsed = !s.sidebarCollapsed;
      persist('kau-sidebar', sidebarCollapsed);
      return { sidebarCollapsed };
    }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setTheme: (theme) => {
    persist('kau-theme', theme);
    set((s) => ({
      theme,
      basemap: s.basemap === 'satellite' ? 'satellite' : theme,
    }));
  },
  toggleTheme: () =>
    set((s) => {
      const theme: ThemeMode = s.theme === 'dark' ? 'light' : 'dark';
      persist('kau-theme', theme);
      return { theme, basemap: s.basemap === 'satellite' ? 'satellite' : theme };
    }),
  selectFeature: (selected) => set({ selected }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchHits: (searchHits) => set({ searchHits }),
  setLocale: (locale) => set({ locale }),
  setBasemap: (basemap) => set({ basemap }),
  requestFlyTo: (center, zoom = 18) => set({ flyTo: { center, zoom } }),
  clearFlyTo: () => set({ flyTo: null }),
  requestZoom: (delta) => set({ zoomDelta: delta }),
  clearZoomDelta: () => set({ zoomDelta: null }),
}));
