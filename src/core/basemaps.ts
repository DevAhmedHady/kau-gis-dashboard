import type { StyleSpecification } from 'maplibre-gl';

const MAPTILER = import.meta.env.VITE_MAPTILER_KEY;

const SATELLITE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri',
    },
  },
  layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
};

export interface BasemapDef {
  id: string;
  label: string;
  style: string | StyleSpecification;
}

export const BASEMAPS: BasemapDef[] = MAPTILER
  ? [
      { id: 'light', label: 'Light', style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER}` },
      { id: 'dark', label: 'Dark', style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER}` },
      { id: 'satellite', label: 'Satellite', style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER}` },
    ]
  : [
      { id: 'light', label: 'Light', style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
      { id: 'dark', label: 'Dark', style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
      { id: 'satellite', label: 'Satellite', style: SATELLITE },
    ];
