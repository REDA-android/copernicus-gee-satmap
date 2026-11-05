# Copernicus & GEE SatMap Studio 🛰️🌍

Studio cartographique interactif de télédétection spatiale combinant l'imagerie **Copernicus** (Sentinel-2, Sentinel-1, CDSE) et l'environnement d'analyse **Google Earth Engine (GEE) Code Editor**.

---

## 🌟 Fonctionnalités Clés

1. **Imagerie Satellitaire Copernicus Haute Résolution** :
   - Mosaïque mondiale **Copernicus Sentinel-2 Sans Nuages (2021 & 2020)** par EOX.
   - Composition **Fausse Couleur Infrarouge (NIR-Red-Green)** pour le suivi de la biomasse végétale.
   - Imagerie radar tout temps **Copernicus Sentinel-1 SAR GRD** (polarisation IW VV/VH).
   - Fond de référence **Esri World Imagery** et **CartoDB Dark Matter**.
   - Accès aux métadonnées du **Copernicus Data Space Ecosystem (CDSE)**.

2. **Connexion & Studio Google Earth Engine (GEE Editor)** :
   - Synchronisation bidirectionnelle : tracer un polygone ou un rectangle sur la carte injecte automatiquement `var geometry = ee.Geometry.Polygon(...)` dans le code GEE.
   - Modèles de scripts prêts à l'emploi :
     - *Sentinel-2 L2A : Masquage des nuages SCL & Série temporelle NDVI*
     - *Copernicus Sentinel-1 SAR : Cartographie des inondations & surfaces en eau*
     - *Copernicus NDWI : Extraction des réservoirs et zones humides*
     - *Sentinel-2 NBR : Cartographie de sévérité des incendies*
   - Bouton d'export **"Ouvrir dans GEE Code Editor"** (ouvre directement `code.earthengine.google.com`).
   - Traduction automatique en **Python (`geemap` & `ee.Initialize()`)**.
   - Export de fichiers de script (`.js`) et de la zone d'intérêt en **GeoJSON**.

3. **Moteur d'Indices Spectraux (ASI Engine)** :
   - Calcul et visualisation dynamique des indices : **NDVI**, **NDWI**, **EVI**, **SAVI**, **NBR**, **NDSI**.
   - Palettes de couleurs scientifiques et seuils écologiques.

4. **Inspecteur de Pixels & Signature Spectrale** :
   - Cliquez n'importe où sur la carte pour obtenir :
     - Coordonnées exactes (Latitude, Longitude)
     - Type de sol / couverture détectée (Végétation dense, Eau libre, Sol aride, Neige)
     - Réflectances spectrales simulées Sentinel-2 L2A (B2, B3, B4, B8, B11, B12)
     - Valeurs numériques instantanées de NDVI, NDWI et EVI avec jauges graphiques
     - Bouton d'injection immédiate du point dans le script GEE (`ee.Geometry.Point`)

5. **Mode Comparaison / Swipe (Écran partagé)** :
   - Glissière interactive pour comparer en temps réel l'imagerie True Color RGB avec la composition Fausse Couleur ou l'analyse radar.

---

## 🚀 Lancement Rapide

Vous pouvez ouvrir directement le fichier `index.html` dans n'importe quel navigateur moderne, ou démarrer un serveur local de développement :

```bash
cd "C:\Users\Mr Elkrouchni\.gemini\antigravity\scratch\copernicus-gee-satmap"
npx serve . -l 5173
```

Ouvrez ensuite [http://localhost:5173](http://localhost:5173) dans votre navigateur.
