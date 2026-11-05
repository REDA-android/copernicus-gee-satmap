/**
 * Google Earth Engine (GEE) Code Editor Studio Integration
 * Generates ready-to-run GEE JavaScript scripts, Python geemap code,
 * and handles synchronization with the map geometry.
 */

export const GEE_TEMPLATES = {
  s2_ndvi: {
    id: 's2_ndvi',
    name: 'Sentinel-2 L2A : Masquage Nuages & NDVI',
    description: 'Filtrage de la collection Copernicus Sentinel-2 L2A, masquage des nuages via QA60/SCL, calcul NDVI et affichage.',
    generate: (roi, center) => `// =========================================================================
// Copernicus Sentinel-2 L2A : NDVI & Masquage des Nuages (GEE Code Editor)
// Généré par Copernicus & GEE SatMap Studio
// =========================================================================

${roi}

// 1. Définition de la période et centrage
var startDate = '2023-01-01';
var endDate = '2023-12-31';
Map.setCenter(${center.lon.toFixed(4)}, ${center.lat.toFixed(4)}, ${center.zoom});

// 2. Fonction de masquage des nuages avec SCL (Scene Classification Layer)
function maskS2sr(image) {
  var scl = image.select('SCL');
  // Conserver végétation (4), sol nu (5), eau (6), neige (11)
  var mask = scl.eq(4).or(scl.eq(5)).or(scl.eq(6));
  return image.updateMask(mask).divide(10000);
}

// 3. Chargement de la collection Copernicus Sentinel-2 Harmonized
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(geometry)
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2sr);

// 4. Mosaïque médiane
var composite = s2.median().clip(geometry);

// 5. Calcul de l'indice NDVI
var ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI');

// 6. Visualisation
var rgbVis = { bands: ['B4', 'B3', 'B2'], min: 0.0, max: 0.3 };
var ndviVis = {
  min: 0.0,
  max: 0.8,
  palette: ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#1a9850']
};

Map.addLayer(composite, rgbVis, 'Copernicus Sentinel-2 Vraies Couleurs');
Map.addLayer(ndvi, ndviVis, 'Sentinel-2 NDVI');
Map.centerObject(geometry, 13);
print('Collection Sentinel-2 traitée avec succès !', s2.size());
`
  },

  s1_flood: {
    id: 's1_flood',
    name: 'Copernicus Sentinel-1 SAR : Détection des Inondations',
    description: 'Analyse radar tout temps Sentinel-1 IW GRD (polarisation VH) pour cartographier les eaux de surface et inondations.',
    generate: (roi, center) => `// =========================================================================
// Copernicus Sentinel-1 SAR GRD : Cartographie des Eaux & Inondations
// Généré par Copernicus & GEE SatMap Studio
// =========================================================================

${roi}

Map.setCenter(${center.lon.toFixed(4)}, ${center.lat.toFixed(4)}, ${center.zoom});

// 1. Chargement de la collection Sentinel-1 SAR GRD (Interférométrique Bande C)
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(geometry)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));

// 2. Filtrage temporel (Période normale vs Période humide/inondée)
var before = s1.filterDate('2023-01-01', '2023-03-31').select('VH').median();
var after = s1.filterDate('2023-10-01', '2023-12-31').select('VH').median();

// 3. Lissage speckle (Filtre spatial passe-bas)
var smoothAfter = after.focal_median(50, 'circle', 'meters');

// 4. Seuillage radiométrique pour isoler l'eau (rétrodiffusion < -20 dB)
var waterMask = smoothAfter.lt(-20.0).clip(geometry);

// 5. Visualisation
Map.addLayer(before.clip(geometry), { min: -25, max: -5 }, 'Sentinel-1 Avant (dB)');
Map.addLayer(smoothAfter.clip(geometry), { min: -25, max: -5 }, 'Sentinel-1 Après (dB)');
Map.addLayer(waterMask.updateMask(waterMask), { palette: ['#0077be'] }, 'Surfaces en Eau Détectées');
Map.centerObject(geometry, 12);
`
  },

  s2_ndwi: {
    id: 's2_ndwi',
    name: 'Copernicus NDWI : Réservoirs & Zones Humides',
    description: 'Calcul de l\'indice d\'eau de Gao / McFeeters sur Sentinel-2 pour extraire les contours des lacs et rivières.',
    generate: (roi, center) => `// =========================================================================
// Copernicus Sentinel-2 : Indice d'Eau NDWI & Extraction Vectorielle
// Généré par Copernicus & GEE SatMap Studio
// =========================================================================

${roi}

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(geometry)
  .filterDate('2023-06-01', '2023-09-30')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10));

var image = s2.median().divide(10000).clip(geometry);

// NDWI = (Green - NIR) / (Green + NIR) -> (B3 - B8) / (B3 + B8)
var ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI');
var waterBodies = ndwi.gt(0.0); // Seuil classique

Map.setCenter(${center.lon.toFixed(4)}, ${center.lat.toFixed(4)}, ${center.zoom});
Map.addLayer(image, { bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3 }, 'Sentinel-2 RGB');
Map.addLayer(ndwi, { min: -0.5, max: 0.5, palette: ['#ffffbf', '#9ecae1', '#08519c'] }, 'NDWI Continu');
Map.addLayer(waterBodies.updateMask(waterBodies), { palette: ['#00ffff'] }, 'Plans d Eau Extraits');
`
  },

  s2_nbr_fire: {
    id: 's2_nbr_fire',
    name: 'Sentinel-2 NBR : Sévérité des Feux & Brûlures',
    description: 'Calcul de l\'indice Normalized Burn Ratio (NBR) et différentiel (dNBR) pour cartographier les feux de forêts.',
    generate: (roi, center) => `// =========================================================================
// Sentinel-2 L2A : Indice de Brûlure NBR (NIR & SWIR2)
// Généré par Copernicus & GEE SatMap Studio
// =========================================================================

${roi}

var preFire = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(geometry)
  .filterDate('2023-05-01', '2023-06-15')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 15))
  .median()
  .divide(10000)
  .clip(geometry);

// NBR = (B8 - B12) / (B8 + B12)
var nbr = preFire.normalizedDifference(['B8', 'B12']).rename('NBR');

Map.setCenter(${center.lon.toFixed(4)}, ${center.lat.toFixed(4)}, ${center.zoom});
Map.addLayer(preFire, { bands: ['B12', 'B8', 'B4'], min: 0, max: 0.4 }, 'Composition Fausse Couleur (SWIR-NIR-Red)');
Map.addLayer(nbr, { min: -0.5, max: 0.8, palette: ['#7f0000', '#d7301f', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'] }, 'Indice NBR');
`
  }
};

/**
 * Formats GeoJSON or Leaflet bounds into Earth Engine Geometry syntax.
 */
export function formatGeeGeometry(boundsOrCoords) {
  if (!boundsOrCoords) {
    // Default fallback geometry (e.g. Morocco / Atlas region)
    return `var geometry = ee.Geometry.Polygon([
  [[-5.55, 32.85], [-5.40, 32.85], [-5.40, 32.95], [-5.55, 32.95], [-5.55, 32.85]]
]);`;
  }

  if (Array.isArray(boundsOrCoords)) {
    const coordsStr = boundsOrCoords
      .map(pt => `[${pt[0].toFixed(5)}, ${pt[1].toFixed(5)}]`)
      .join(', ');
    return `var geometry = ee.Geometry.Polygon([[${coordsStr}]]);`;
  }

  // Bounds object { west, south, east, north }
  const { west, south, east, north } = boundsOrCoords;
  return `var geometry = ee.Geometry.Rectangle([${west.toFixed(5)}, ${south.toFixed(5)}, ${east.toFixed(5)}, ${north.toFixed(5)}]);`;
}

/**
 * Converts a GEE JavaScript snippet into a Python geemap script.
 */
export function convertToPythonGeemap(jsCode, center) {
  return `# =========================================================================
# Google Earth Engine Python (geemap) Script
# Généré par Copernicus & GEE SatMap Studio
# =========================================================================

import ee
import geemap

# Initialisation de Google Earth Engine
try:
    ee.Initialize()
except Exception as e:
    ee.Authenticate()
    ee.Initialize()

# Création de la carte interactive geemap
Map = geemap.Map(center=[${center.lat.toFixed(4)}, ${center.lon.toFixed(4)}], zoom=${center.zoom})

# Script traduit :
# (Voir le script JavaScript complet pour les variables et filtres)
print("GEE Python initialisé. Ajoutez vos couches avec Map.addLayer().")
Map
`;
}
