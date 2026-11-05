/**
 * Spectral Indices Engine (Client-side)
 * Powered by Omni Spectral Indices formulas.
 */

export const SPECTRAL_INDICES = {
  NDVI: {
    name: 'NDVI',
    fullName: 'Normalized Difference Vegetation Index',
    domain: 'vegetation',
    formula: '(NIR - Red) / (NIR + Red)',
    palette: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
    min: -0.2,
    max: 0.9,
    description: 'Vigueur végétale, teneur en chlorophylle et biomasse foliaire.',
    compute: (bands) => {
      const denom = bands.NIR + bands.Red;
      return denom === 0 ? 0 : (bands.NIR - bands.Red) / denom;
    }
  },
  NDWI: {
    name: 'NDWI',
    fullName: 'Normalized Difference Water Index',
    domain: 'water',
    formula: '(Green - NIR) / (Green + NIR)',
    palette: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    min: -0.5,
    max: 0.5,
    description: 'Détection des plans d\'eau, zones humides et humidité des canopées.',
    compute: (bands) => {
      const denom = bands.Green + bands.NIR;
      return denom === 0 ? 0 : (bands.Green - bands.NIR) / denom;
    }
  },
  EVI: {
    name: 'EVI',
    fullName: 'Enhanced Vegetation Index',
    domain: 'vegetation',
    formula: '2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)',
    palette: ['#ffffcc', '#c2e699', '#78c679', '#31a354', '#006837'],
    min: 0,
    max: 1.0,
    description: 'Indice amélioré réduisant les influences du sol et de l\'atmosphère en forte biomasse.',
    compute: (bands) => {
      const denom = bands.NIR + 6 * bands.Red - 7.5 * bands.Blue + 1.0;
      return denom === 0 ? 0 : 2.5 * (bands.NIR - bands.Red) / denom;
    }
  },
  SAVI: {
    name: 'SAVI',
    fullName: 'Soil-Adjusted Vegetation Index',
    domain: 'vegetation',
    formula: '((NIR - Red) / (NIR + Red + 0.5)) * 1.5',
    palette: ['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404'],
    min: 0,
    max: 0.8,
    description: 'Corrige les effets du fond de sol dans les zones à faible couverture végétale.',
    compute: (bands, L = 0.5) => {
      const denom = bands.NIR + bands.Red + L;
      return denom === 0 ? 0 : ((bands.NIR - bands.Red) / denom) * (1.0 + L);
    }
  },
  NBR: {
    name: 'NBR',
    fullName: 'Normalized Burn Ratio',
    domain: 'burn',
    formula: '(NIR - SWIR2) / (NIR + SWIR2)',
    palette: ['#7f0000', '#d7301f', '#ef6548', '#fdbb84', '#fef0d9', '#d9f0a3', '#78c679', '#238443'],
    min: -0.5,
    max: 0.8,
    description: 'Évaluation des surfaces brûlées, sévérité des incendies de forêt.',
    compute: (bands) => {
      const denom = bands.NIR + bands.SWIR2;
      return denom === 0 ? 0 : (bands.NIR - bands.SWIR2) / denom;
    }
  },
  NDSI: {
    name: 'NDSI',
    fullName: 'Normalized Difference Snow Index',
    domain: 'snow',
    formula: '(Green - SWIR1) / (Green + SWIR1)',
    palette: ['#08306b', '#2171b5', '#6baed6', '#c6dbef', '#f7fbff'],
    min: -0.2,
    max: 0.8,
    description: 'Discrimination de la couverture neigeuse et des glaces des nuages.',
    compute: (bands) => {
      const denom = bands.Green + bands.SWIR1;
      return denom === 0 ? 0 : (bands.Green - bands.SWIR1) / denom;
    }
  }
};

/**
 * Generates an estimated spectral signature based on geographical coordinates and tile context.
 */
export function estimatePixelBands(lat, lon, zoom = 14) {
  // Deterministic pseudo-spectral estimation for demonstration and inspector profiling
  const seed = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453;
  const rand = seed - Math.floor(seed);
  
  // Base land type heuristic (water, vegetation, desert/urban, snow)
  let isWater = lat < 36 && lat > 32 && lon > -10 && lon < -7 && rand < 0.2;
  let isVegetation = rand > 0.45;
  let isArid = rand <= 0.45 && !isWater;

  let B2 = 0.08 + rand * 0.05;   // Blue
  let B3 = 0.12 + rand * 0.06;   // Green
  let B4 = 0.10 + rand * 0.08;   // Red
  let B8 = 0.45 + rand * 0.35;   // NIR
  let B11 = 0.22 + rand * 0.10;  // SWIR1
  let B12 = 0.14 + rand * 0.08;  // SWIR2

  if (isWater) {
    B2 = 0.20; B3 = 0.18; B4 = 0.08; B8 = 0.02; B11 = 0.01; B12 = 0.01;
  } else if (isVegetation) {
    B2 = 0.04; B3 = 0.08; B4 = 0.05; B8 = 0.65 + rand * 0.2; B11 = 0.18; B12 = 0.09;
  } else if (isArid) {
    B2 = 0.15; B3 = 0.22; B4 = 0.32; B8 = 0.36; B11 = 0.42; B12 = 0.38;
  }

  const bands = {
    Blue: parseFloat(B2.toFixed(3)),
    Green: parseFloat(B3.toFixed(3)),
    Red: parseFloat(B4.toFixed(3)),
    NIR: parseFloat(B8.toFixed(3)),
    SWIR1: parseFloat(B11.toFixed(3)),
    SWIR2: parseFloat(B12.toFixed(3))
  };

  const calculated = {};
  for (const [key, idx] of Object.entries(SPECTRAL_INDICES)) {
    calculated[key] = parseFloat(idx.compute(bands).toFixed(3));
  }

  return { bands, calculated };
}
