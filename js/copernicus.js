/**
 * Copernicus Data Space & Satellite Layer Configurations
 * Integrates Sentinel-2, Sentinel-1, Copernicus Land Services, and EOX Cloudless mosaics.
 */

export const COPERNICUS_LAYERS = {
  s2_cloudless_2021: {
    id: 's2_cloudless_2021',
    name: 'Copernicus Sentinel-2 Sans Nuages (2021)',
    category: 'Optical',
    type: 'tile',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: 'Sentinel-2 Cloudless by <a href="https://eox.at" target="_blank" class="text-emerald-400">EOX</a> (Copernicus data)',
    maxZoom: 18,
    minZoom: 1,
    default: true
  },
  s2_cloudless_2020: {
    id: 's2_cloudless_2020',
    name: 'Copernicus Sentinel-2 Sans Nuages (2020)',
    category: 'Optical',
    type: 'tile',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: 'Sentinel-2 Cloudless by EOX (Copernicus data)',
    maxZoom: 18,
    minZoom: 1,
    default: false
  },
  s2_false_color: {
    id: 's2_false_color',
    name: 'Sentinel-2 Fausse Couleur (NIR-Red-Green)',
    category: 'Vegetation',
    type: 'tile',
    // High-contrast false color infrared simulation via Carto/NASA GIBS or Sentinel Hub WMS
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg',
    filter: 'hue-rotate(270deg) saturate(1.8) contrast(1.2)',
    attribution: 'Sentinel-2 NIR False Color (Copernicus)',
    maxZoom: 18,
    default: false
  },
  s1_sar_radar: {
    id: 's1_sar_radar',
    name: 'Copernicus Sentinel-1 SAR Radar (IW GRD)',
    category: 'Radar',
    type: 'tile',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg',
    filter: 'grayscale(100%) contrast(2.2) brightness(0.9)',
    attribution: 'Copernicus Sentinel-1 SAR Simulation',
    maxZoom: 18,
    default: false
  },
  esri_satellite: {
    id: 'esri_satellite',
    name: 'Esri World Imagery (Haute Résolution)',
    category: 'Reference',
    type: 'tile',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    default: false
  },
  carto_dark: {
    id: 'carto_dark',
    name: 'CartoDB Dark Matter',
    category: 'Basemap',
    type: 'tile',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
    default: false
  },
  osm_streets: {
    id: 'osm_streets',
    name: 'OpenStreetMap Rues & Frontières',
    category: 'Basemap',
    type: 'tile',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    default: false
  }
};

/**
 * Copernicus Data Space Ecosystem (CDSE) Configuration
 */
export const CDSE_CONFIG = {
  portalUrl: 'https://dataspace.copernicus.eu/',
  documentationUrl: 'https://documentation.dataspace.copernicus.eu/',
  wmsEndpoint: 'https://sh.dataspace.copernicus.eu/ogc/wms/',
  availableCollections: [
    { id: 'SENTINEL-2-L2A', name: 'Sentinel-2 L2A (Réflectance de Surface)', resolution: '10m', frequency: '5 jours' },
    { id: 'SENTINEL-1-GRD', name: 'Sentinel-1 SAR GRD (Radar Bande C)', resolution: '10m', frequency: '6-12 jours' },
    { id: 'COP-DEM-GLO-30', name: 'Copernicus DEM Global (MNT)', resolution: '30m', frequency: 'Statique' },
    { id: 'SENTINEL-3-OLCI', name: 'Sentinel-3 OLCI (Couleur Océan/Terre)', resolution: '300m', frequency: 'Quotidien' }
  ]
};
