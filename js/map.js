/**
 * Leaflet Satellite Map Controller
 * Integrates Copernicus tile layers, Leaflet Draw, Swipe comparison, and GEE sync.
 */

import { COPERNICUS_LAYERS } from './copernicus.js';

export class SatelliteMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.activeBaseLayer = null;
    this.secondaryLayer = null;
    this.sideBySideControl = null;
    this.drawnItems = null;
    this.isSplitView = false;
    this.activeFilter = null;
    this.init();
  }

  init() {
    // Initial center: North Africa / Mediterranean / Morocco (Domain of agricultural & spatial interest)
    const initialLat = this.options.initialLat || 32.89;
    const initialLon = this.options.initialLon || -5.48;
    const initialZoom = this.options.initialZoom || 11;

    this.map = L.map(this.containerId, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true
    });

    // Custom positioned controls
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(this.map);

    // Feature group for drawn geometries (AOI)
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Initialize default base layer (Sentinel-2 Cloudless)
    this.setBaseLayer('s2_cloudless_2021');

    // Setup Leaflet Draw tools
    this.setupDrawControls();

    // Map click and movement listeners
    this.setupEvents();
  }

  setBaseLayer(layerId) {
    const config = COPERNICUS_LAYERS[layerId];
    if (!config) return;

    if (this.activeBaseLayer) {
      this.map.removeLayer(this.activeBaseLayer);
    }

    this.activeBaseLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom || 18,
      minZoom: config.minZoom || 1,
      attribution: config.attribution,
      subdomains: config.subdomains || 'abc'
    });

    this.activeBaseLayer.addTo(this.map);

    // Apply CSS filter if false color or radar
    if (config.filter) {
      const container = this.activeBaseLayer.getContainer();
      if (container) container.style.filter = config.filter;
    }

    this.activeBaseLayerId = layerId;

    if (this.options.onLayerChange) {
      this.options.onLayerChange(layerId, config);
    }
  }

  toggleSplitView(enable, secondaryLayerId = 's2_false_color') {
    this.isSplitView = enable;
    if (enable) {
      const secConfig = COPERNICUS_LAYERS[secondaryLayerId] || COPERNICUS_LAYERS.s2_false_color;
      this.secondaryLayer = L.tileLayer(secConfig.url, {
        maxZoom: 18,
        attribution: secConfig.attribution
      }).addTo(this.map);

      if (secConfig.filter) {
        setTimeout(() => {
          const container = this.secondaryLayer.getContainer();
          if (container) container.style.filter = secConfig.filter;
        }, 50);
      }

      if (L.control.sideBySide) {
        this.sideBySideControl = L.control.sideBySide(this.activeBaseLayer, this.secondaryLayer).addTo(this.map);
      }
    } else {
      if (this.sideBySideControl) {
        this.map.removeControl(this.sideBySideControl);
        this.sideBySideControl = null;
      }
      if (this.secondaryLayer) {
        this.map.removeLayer(this.secondaryLayer);
        this.secondaryLayer = null;
      }
    }
  }

  applySpectralFilter(filterCss) {
    this.activeFilter = filterCss;
    if (this.activeBaseLayer) {
      const container = this.activeBaseLayer.getContainer();
      if (container) {
        container.style.filter = filterCss || '';
      }
    }
  }

  setupDrawControls() {
    const drawOptions = {
      position: 'topleft',
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: {
          icon: L.divIcon({
            className: 'custom-gee-marker',
            html: '<div class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg animate-ping"></div>',
            iconSize: [16, 16]
          })
        },
        polygon: {
          shapeOptions: {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 2
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#06b6d4',
            fillColor: '#06b6d4',
            fillOpacity: 0.2,
            weight: 2
          }
        }
      },
      edit: {
        featureGroup: this.drawnItems
      }
    };

    if (L.Control.Draw) {
      const drawControl = new L.Control.Draw(drawOptions);
      this.map.addControl(drawControl);

      this.map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        this.drawnItems.clearLayers();
        this.drawnItems.addLayer(layer);

        // Extract geometry for GEE
        const geoJson = layer.toGeoJSON();
        if (this.options.onGeometryCreated) {
          this.options.onGeometryCreated(geoJson, layer);
        }
      });
    }
  }

  setupEvents() {
    this.map.on('click', (e) => {
      if (this.options.onMapClick) {
        this.options.onMapClick(e.latlng.lat, e.latlng.lng, this.map.getZoom());
      }
    });

    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();
      if (this.options.onMapMove) {
        this.options.onMapMove({ lat: center.lat, lon: center.lng, zoom });
      }
    });
  }

  getCenterAndZoom() {
    const center = this.map.getCenter();
    return {
      lat: center.lat,
      lon: center.lng,
      zoom: this.map.getZoom()
    };
  }

  getBounds() {
    const bounds = this.map.getBounds();
    return {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth()
    };
  }
}
