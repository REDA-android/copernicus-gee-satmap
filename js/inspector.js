/**
 * Pixel Inspector & Spectral Profiling Tool
 */

import { estimatePixelBands } from './spectral_engine.js';

export class PixelInspector {
  constructor(containerId, onInsertPoint) {
    this.container = document.getElementById(containerId);
    this.onInsertPoint = onInsertPoint;
    this.active = false;
  }

  toggle(forceState) {
    this.active = forceState !== undefined ? forceState : !this.active;
    if (this.container) {
      if (this.active) {
        this.container.classList.remove('hidden');
      } else {
        this.container.classList.add('hidden');
      }
    }
    return this.active;
  }

  inspect(lat, lon, zoom = 14) {
    if (!this.container) return;

    const { bands, calculated } = estimatePixelBands(lat, lon, zoom);

    // Heuristic classification label
    let classification = 'Mixte / Non classé';
    let badgeColor = 'bg-slate-700 text-slate-300';
    if (calculated.NDWI > 0.1) {
      classification = 'Eau Libre / Zone Humide';
      badgeColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/40';
    } else if (calculated.NDVI > 0.55) {
      classification = 'Végétation Dense & Saine';
      badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
    } else if (calculated.NDVI > 0.25) {
      classification = 'Végétation Éparse / Cultures';
      badgeColor = 'bg-lime-500/20 text-lime-400 border border-lime-500/40';
    } else if (calculated.NDSI > 0.4) {
      classification = 'Neige / Glace';
      badgeColor = 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';
    } else {
      classification = 'Sol Nu / Zone Aride / Urbain';
      badgeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
    }

    this.container.innerHTML = `
      <div class="p-4 space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Inspecteur de Pixel</span>
          </div>
          <button id="close-inspector-btn" class="text-slate-400 hover:text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Coordonnées -->
        <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <div><span class="text-slate-500">LAT:</span> <span class="text-slate-200 font-semibold">${lat.toFixed(5)}°</span></div>
          <div><span class="text-slate-500">LON:</span> <span class="text-slate-200 font-semibold">${lon.toFixed(5)}°</span></div>
          <div class="col-span-2 pt-1 border-t border-slate-800/80">
            <span class="text-slate-500 font-sans">Type détecté :</span>
            <span class="inline-block px-2 py-0.5 ml-1 text-[11px] font-sans font-medium rounded ${badgeColor}">${classification}</span>
          </div>
        </div>

        <!-- Indices Calculés -->
        <div>
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Indices Spectraux</div>
          <div class="space-y-2 text-xs">
            <!-- NDVI -->
            <div>
              <div class="flex justify-between text-slate-300 mb-0.5">
                <span>NDVI (Végétation)</span>
                <span class="font-mono font-bold text-emerald-400">${calculated.NDVI}</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 h-full" style="width: ${Math.max(0, Math.min(100, (calculated.NDVI + 0.2) * 90))}%"></div>
              </div>
            </div>

            <!-- NDWI -->
            <div>
              <div class="flex justify-between text-slate-300 mb-0.5">
                <span>NDWI (Eau / Humidité)</span>
                <span class="font-mono font-bold text-cyan-400">${calculated.NDWI}</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-slate-600 via-cyan-400 to-blue-600 h-full" style="width: ${Math.max(0, Math.min(100, (calculated.NDWI + 0.5) * 100))}%"></div>
              </div>
            </div>

            <!-- EVI -->
            <div>
              <div class="flex justify-between text-slate-300 mb-0.5">
                <span>EVI (Biomasse Améliorée)</span>
                <span class="font-mono font-bold text-lime-400">${calculated.EVI}</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-lime-500 h-full" style="width: ${Math.max(0, Math.min(100, calculated.EVI * 100))}%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Réflectance Bandes Sentinel-2 -->
        <div>
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Réflectance Sentinel-2 L2A</div>
          <div class="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
            <div class="bg-slate-900/90 p-1.5 rounded border border-slate-800"><span class="text-blue-400 font-sans">B2:</span> ${bands.Blue}</div>
            <div class="bg-slate-900/90 p-1.5 rounded border border-slate-800"><span class="text-emerald-400 font-sans">B3:</span> ${bands.Green}</div>
            <div class="bg-slate-900/90 p-1.5 rounded border border-slate-800"><span class="text-red-400 font-sans">B4:</span> ${bands.Red}</div>
            <div class="bg-slate-900/90 p-1.5 rounded border border-slate-800"><span class="text-purple-400 font-sans">B8:</span> ${bands.NIR}</div>
            <div class="bg-slate-900/90 p-1.5 rounded border border-slate-800"><span class="text-amber-400 font-sans">B11:</span> ${bands.SWIR1}</div>
            <div class="bg-slate-900/90 p-1.5 rounded border border-slate-800"><span class="text-orange-400 font-sans">B12:</span> ${bands.SWIR2}</div>
          </div>
        </div>

        <!-- Actions -->
        <button id="insert-point-gee-btn" class="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950/40 transition">
          <i data-lucide="code" class="w-3.5 h-3.5"></i>
          <span>Insérer Point dans GEE Editor</span>
        </button>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ root: this.container });
    }

    const closeBtn = document.getElementById('close-inspector-btn');
    if (closeBtn) {
      closeBtn.onclick = () => this.toggle(false);
    }

    const insertBtn = document.getElementById('insert-point-gee-btn');
    if (insertBtn && this.onInsertPoint) {
      insertBtn.onclick = () => {
        this.onInsertPoint(lat, lon);
      };
    }
  }
}
