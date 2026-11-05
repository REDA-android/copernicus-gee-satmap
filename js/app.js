/**
 * Main Application Orchestrator for Copernicus & GEE SatMap Studio
 */

import { SatelliteMap } from './map.js';
import { PixelInspector } from './inspector.js';
import { COPERNICUS_LAYERS, CDSE_CONFIG } from './copernicus.js';
import { SPECTRAL_INDICES } from './spectral_engine.js';
import { GEE_TEMPLATES, formatGeeGeometry, convertToPythonGeemap } from './gee_editor.js';

class SatMapApp {
  constructor() {
    this.satMap = null;
    this.inspector = null;
    this.activeTemplate = 's2_ndvi';
    this.currentRoiString = formatGeeGeometry(null);
    this.currentGeoJson = null;
    this.splitMode = false;
    this.activeSpectralIndex = null;
  }

  start() {
    this.initMap();
    this.initInspector();
    this.initLayersList();
    this.initSpectralIndicesUI();
    this.initGeeEditor();
    this.initControls();
    this.initTabs();

    if (window.lucide) {
      window.lucide.createIcons();
    }
    console.log("Copernicus & GEE SatMap Studio initialisé avec succès.");
  }

  initMap() {
    this.satMap = new SatelliteMap('map', {
      initialLat: 32.89,
      initialLon: -5.48,
      initialZoom: 12,
      onLayerChange: (layerId, config) => {
        const badge = document.getElementById('active-layer-badge');
        if (badge) badge.innerText = config.name;
      },
      onMapClick: (lat, lon, zoom) => {
        if (this.inspector.active) {
          this.inspector.inspect(lat, lon, zoom);
        }
      },
      onMapMove: (center) => {
        this.updateCoordinatesDisplay(center);
        this.syncGeeScript(false);
      },
      onGeometryCreated: (geoJson, layer) => {
        this.currentGeoJson = geoJson;
        if (geoJson.geometry && geoJson.geometry.coordinates) {
          const coords = geoJson.geometry.coordinates[0];
          this.currentRoiString = formatGeeGeometry(coords);
        }
        this.syncGeeScript(true);
        this.showToast('Zone d\'intérêt (AOI) injectée dans le code GEE !', 'success');
      }
    });
  }

  initInspector() {
    this.inspector = new PixelInspector('inspector-hud', (lat, lon) => {
      this.currentRoiString = `var geometry = ee.Geometry.Point([${lon.toFixed(5)}, ${lat.toFixed(5)}]);`;
      this.syncGeeScript(true);
      this.showToast(`Point [${lon.toFixed(4)}, ${lat.toFixed(4)}] inséré dans GEE !`, 'info');
    });
  }

  initLayersList() {
    const container = document.getElementById('copernicus-layers-container');
    if (!container) return;

    container.innerHTML = Object.entries(COPERNICUS_LAYERS).map(([id, layer]) => `
      <label class="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 cursor-pointer transition">
        <div class="flex items-center space-x-3">
          <input type="radio" name="base-layer" value="${id}" ${layer.default ? 'checked' : ''} class="w-4 h-4 text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500">
          <div>
            <div class="text-xs font-semibold text-slate-200">${layer.name}</div>
            <div class="text-[10px] text-slate-400 font-mono">${layer.category} • Max Zoom: ${layer.maxZoom || 18}</div>
          </div>
        </div>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">WMTS</span>
      </label>
    `).join('');

    container.querySelectorAll('input[name="base-layer"]').forEach(radio => {
      radio.onchange = (e) => {
        this.satMap.setBaseLayer(e.target.value);
      };
    });
  }

  initSpectralIndicesUI() {
    const container = document.getElementById('spectral-indices-container');
    if (!container) return;

    container.innerHTML = Object.entries(SPECTRAL_INDICES).map(([key, idx]) => `
      <button data-index="${key}" class="spectral-btn text-left p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-800/80 transition flex flex-col justify-between">
        <div class="flex items-center justify-between w-full mb-1">
          <span class="font-bold text-sm text-emerald-400 font-mono">${key}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-mono">${idx.domain}</span>
        </div>
        <div class="text-[11px] font-medium text-slate-300 leading-tight mb-1">${idx.fullName}</div>
        <div class="text-[10px] text-slate-400 font-mono truncate mb-2">${idx.formula}</div>
        <!-- Mini Palette Bar -->
        <div class="w-full h-1.5 rounded-full overflow-hidden flex">
          ${idx.palette.map(c => `<div class="flex-1 h-full" style="background-color: ${c}"></div>`).join('')}
        </div>
      </button>
    `).join('');

    container.querySelectorAll('.spectral-btn').forEach(btn => {
      btn.onclick = () => {
        const idxKey = btn.getAttribute('data-index');
        this.applySpectralIndex(idxKey);
      };
    });
  }

  applySpectralIndex(indexKey) {
    const idx = SPECTRAL_INDICES[indexKey];
    if (!idx) return;

    this.activeSpectralIndex = indexKey;

    // Simulate spectral filtering on satellite tiles using CSS color mapping
    let filterCss = '';
    if (indexKey === 'NDVI') {
      filterCss = 'hue-rotate(60deg) saturate(2.4) contrast(1.3)';
    } else if (indexKey === 'NDWI') {
      filterCss = 'hue-rotate(180deg) saturate(2.2) contrast(1.2)';
    } else if (indexKey === 'EVI') {
      filterCss = 'hue-rotate(90deg) saturate(2.6) contrast(1.4)';
    } else if (indexKey === 'NBR') {
      filterCss = 'hue-rotate(330deg) saturate(2.0) contrast(1.5)';
    } else if (indexKey === 'NDSI') {
      filterCss = 'hue-rotate(160deg) saturate(1.8) brightness(1.2)';
    } else if (indexKey === 'SAVI') {
      filterCss = 'hue-rotate(45deg) saturate(2.0) contrast(1.2)';
    }

    this.satMap.applySpectralFilter(filterCss);
    this.showToast(`Indice spectral ${indexKey} activé sur la carte !`, 'success');

    // Update active state in UI
    document.querySelectorAll('.spectral-btn').forEach(b => {
      if (b.getAttribute('data-index') === indexKey) {
        b.classList.add('border-emerald-500', 'bg-emerald-950/30');
      } else {
        b.classList.remove('border-emerald-500', 'bg-emerald-950/30');
      }
    });
  }

  initGeeEditor() {
    const select = document.getElementById('gee-template-select');
    const editor = document.getElementById('gee-code-area');

    if (select) {
      select.innerHTML = Object.entries(GEE_TEMPLATES).map(([key, tpl]) => `
        <option value="${key}">${tpl.name}</option>
      `).join('');

      select.onchange = (e) => {
        this.activeTemplate = e.target.value;
        this.syncGeeScript(false);
      };
    }

    this.syncGeeScript(false);

    // Copy JS Code
    const copyJsBtn = document.getElementById('copy-gee-js-btn');
    if (copyJsBtn) {
      copyJsBtn.onclick = () => {
        if (editor) {
          navigator.clipboard.writeText(editor.value);
          this.showToast('Code GEE JavaScript copié dans le presse-papier !', 'success');
        }
      };
    }

    // Open in GEE Code Editor
    const openGeeBtn = document.getElementById('open-gee-editor-btn');
    if (openGeeBtn) {
      openGeeBtn.onclick = () => {
        if (editor) {
          navigator.clipboard.writeText(editor.value);
          this.showToast('Code copié ! Ouverture de Google Earth Engine Code Editor...', 'info');
          setTimeout(() => {
            window.open('https://code.earthengine.google.com/', '_blank');
          }, 400);
        }
      };
    }

    // Copy Python geemap
    const copyPyBtn = document.getElementById('copy-gee-py-btn');
    if (copyPyBtn) {
      copyPyBtn.onclick = () => {
        const center = this.satMap.getCenterAndZoom();
        const pyCode = convertToPythonGeemap(editor.value, center);
        navigator.clipboard.writeText(pyCode);
        this.showToast('Code Python (geemap) copié !', 'success');
      };
    }

    // Download .js script
    const downloadJsBtn = document.getElementById('download-gee-js-btn');
    if (downloadJsBtn) {
      downloadJsBtn.onclick = () => {
        const blob = new Blob([editor.value], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gee_${this.activeTemplate}_script.js`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Fichier script .js téléchargé !', 'success');
      };
    }

    // Export GeoJSON
    const exportGeoJsonBtn = document.getElementById('export-geojson-btn');
    if (exportGeoJsonBtn) {
      exportGeoJsonBtn.onclick = () => {
        if (!this.currentGeoJson) {
          const bounds = this.satMap.getBounds();
          this.currentGeoJson = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [bounds.west, bounds.south],
                [bounds.east, bounds.south],
                [bounds.east, bounds.north],
                [bounds.west, bounds.north],
                [bounds.west, bounds.south]
              ]]
            },
            properties: { name: "Current Viewport AOI" }
          };
        }
        const blob = new Blob([JSON.stringify(this.currentGeoJson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'copernicus_aoi.geojson';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('GeoJSON AOI téléchargé avec succès !', 'success');
      };
    }
  }

  syncGeeScript(userDrawn = false) {
    const editor = document.getElementById('gee-code-area');
    if (!editor) return;

    const tpl = GEE_TEMPLATES[this.activeTemplate] || GEE_TEMPLATES.s2_ndvi;
    const center = this.satMap.getCenterAndZoom();
    const generated = tpl.generate(this.currentRoiString, center);
    editor.value = generated;

    const statusBadge = document.getElementById('gee-sync-status');
    if (statusBadge) {
      statusBadge.innerText = userDrawn ? 'AOI Utilisateur Connectée' : 'Vue Carte Synchronisée';
      statusBadge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
  }

  initControls() {
    // Inspector button toggle
    const inspectorBtn = document.getElementById('toggle-inspector-btn');
    if (inspectorBtn) {
      inspectorBtn.onclick = () => {
        const isActive = this.inspector.toggle();
        if (isActive) {
          inspectorBtn.classList.add('bg-emerald-600', 'text-white');
          inspectorBtn.classList.remove('bg-slate-800', 'text-slate-300');
          this.showToast('Cliquez sur n\'importe quel pixel de la carte pour inspecter sa signature.', 'info');
        } else {
          inspectorBtn.classList.remove('bg-emerald-600', 'text-white');
          inspectorBtn.classList.add('bg-slate-800', 'text-slate-300');
        }
      };
    }

    // Split View toggle
    const splitBtn = document.getElementById('toggle-split-btn');
    if (splitBtn) {
      splitBtn.onclick = () => {
        this.splitMode = !this.splitMode;
        this.satMap.toggleSplitView(this.splitMode, 's2_false_color');
        if (this.splitMode) {
          splitBtn.classList.add('bg-cyan-600', 'text-white');
          splitBtn.classList.remove('bg-slate-800', 'text-slate-300');
          this.showToast('Mode Comparaison / Swipe activé (Copernicus RGB vs Fausse Couleur)', 'info');
        } else {
          splitBtn.classList.remove('bg-cyan-600', 'text-white');
          splitBtn.classList.add('bg-slate-800', 'text-slate-300');
          this.showToast('Mode comparaison désactivé.', 'info');
        }
      };
    }

    // Cloud cover slider
    const cloudSlider = document.getElementById('cloud-cover-slider');
    const cloudVal = document.getElementById('cloud-cover-value');
    if (cloudSlider && cloudVal) {
      cloudSlider.oninput = (e) => {
        cloudVal.innerText = `${e.target.value}%`;
      };
    }

    // Reset Spectral filter button
    const resetFilterBtn = document.getElementById('reset-spectral-btn');
    if (resetFilterBtn) {
      resetFilterBtn.onclick = () => {
        this.satMap.applySpectralFilter(null);
        document.querySelectorAll('.spectral-btn').forEach(b => {
          b.classList.remove('border-emerald-500', 'bg-emerald-950/30');
        });
        this.showToast('Rendu satellitaire réinitialisé.', 'info');
      };
    }

    // GEE Drawer toggle (Right side)
    const geeDrawerBtn = document.getElementById('toggle-gee-drawer-btn');
    const geeDrawer = document.getElementById('gee-drawer');
    if (geeDrawerBtn && geeDrawer) {
      geeDrawerBtn.onclick = () => {
        geeDrawer.classList.toggle('translate-x-full');
      };
    }

    const closeGeeDrawerBtn = document.getElementById('close-gee-drawer-btn');
    if (closeGeeDrawerBtn && geeDrawer) {
      closeGeeDrawerBtn.onclick = () => {
        geeDrawer.classList.add('translate-x-full');
      };
    }

    // Quick presets (Locations)
    const presetSelect = document.getElementById('location-preset-select');
    if (presetSelect) {
      presetSelect.onchange = (e) => {
        const val = e.target.value;
        const coords = {
          morocco_atlas: [32.89, -5.48, 12],
          morocco_tadla: [32.33, -6.35, 12],
          france_paris: [48.8566, 2.3522, 12],
          nile_delta: [30.85, 31.05, 10],
          amazon_rainforest: [-3.46, -62.21, 10],
          sahara_desert: [24.75, 11.25, 8]
        };
        if (coords[val]) {
          const [lat, lon, z] = coords[val];
          this.satMap.map.setView([lat, lon], z);
          this.showToast(`Navigation vers ${e.target.options[e.target.selectedIndex].text}`, 'info');
        }
      };
    }
  }

  initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.onclick = () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active', 'border-emerald-500', 'text-emerald-400'));
        tab.classList.add('active', 'border-emerald-500', 'text-emerald-400');

        panels.forEach(p => {
          if (p.id === `tab-${target}`) {
            p.classList.remove('hidden');
          } else {
            p.classList.add('hidden');
          }
        });
      };
    });
  }

  updateCoordinatesDisplay(center) {
    const coordEl = document.getElementById('map-coords-display');
    if (coordEl) {
      coordEl.innerText = `${center.lat.toFixed(4)}°N, ${center.lon.toFixed(4)}°E (Zoom: ${center.zoom})`;
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    let icon = 'info';
    let borderColor = 'border-blue-500/40 text-blue-200 bg-slate-900/90';
    if (type === 'success') {
      icon = 'check-circle';
      borderColor = 'border-emerald-500/40 text-emerald-200 bg-slate-900/90';
    }

    toast.innerHTML = `
      <div class="flex items-center space-x-2 py-2 px-3.5 rounded-lg border ${borderColor} shadow-2xl backdrop-blur-md">
        <i data-lucide="${icon}" class="w-4 h-4 text-emerald-400"></i>
        <span class="text-xs font-medium">${message}</span>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ root: toast });
    }

    toast.classList.remove('opacity-0', 'pointer-events-none');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 3500);
  }
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new SatMapApp();
  app.start();
  window.satMapApp = app;
});
