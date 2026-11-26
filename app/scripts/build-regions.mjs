// Builds public/maps/ny-regions.geojson (16 Karing4Life regions) and ny-mask.geojson
// from the US Census 1:500k county shapefile (public domain).
//   node scripts/build-regions.mjs <path/to/cb_2023_us_county_500k.shp>
// Download: https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_500k.zip
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import mapshaper from 'mapshaper';

const shp = process.argv[2];
if (!shp) { console.error('Usage: node scripts/build-regions.mjs <county .shp>'); process.exit(1); }

const lite = JSON.parse(readFileSync(new URL('../src/data/regions-lite.json', import.meta.url), 'utf8'));
const KEY = { Suffolk: 'suffolk', Nassau: 'nassau', Manhattan: 'manhattan', Brooklyn: 'brooklyn', Queens: 'queens', Bronx: 'bronx', 'Staten Island': 'staten-island' };
const GROUP = { suffolk: 'li', nassau: 'li', manhattan: 'nyc', brooklyn: 'nyc', queens: 'nyc', bronx: 'nyc', 'staten-island': 'nyc' };
const county = {}, names = {};
lite.regions.forEach((r) => {
  const k = KEY[r.name] || r.name.toLowerCase().replace(/[^a-z]+/g, '-');
  names[k] = r.name;
  r.counties.forEach((c) => { county[c] = k; });
});

const base = { 'in.shp': readFileSync(shp), 'in.dbf': readFileSync(shp.replace(/\.shp$/, '.dbf')), 'in.prj': readFileSync(shp.replace(/\.shp$/, '.prj')) };
// 1) New York counties only, tagged with their region in plain JS (names contain spaces)
const raw = await mapshaper.applyCommands("-i in.shp -filter \"STATEFP=='36'\" -o ny.json format=geojson", base);
const ny = JSON.parse(raw['ny.json']);
ny.features.forEach((f) => {
  const k = county[f.properties.NAME];
  if (!k) throw new Error('No region for county ' + f.properties.NAME);
  f.properties = { key: k, name: names[k], grp: GROUP[k] || 'up' };
});
const src = { 'ny.json': JSON.stringify(ny) };
// 2) dissolve counties into the 16 regions
const out = await mapshaper.applyCommands('-i ny.json -dissolve key copy-fields=name,grp -simplify 45% keep-shapes -clean -o regions.json format=geojson precision=0.00001', src);
const labels = await mapshaper.applyCommands('-i ny.json -dissolve key copy-fields=name,grp -points inner -o labels.json format=geojson precision=0.0001', src);
const outline = await mapshaper.applyCommands('-i ny.json -dissolve -simplify 15% keep-shapes -o state.json format=geojson precision=0.0001', src);

// mask: a big rectangle with New York State cut out, used to dim everything outside the state
const state = JSON.parse(outline['state.json']);
const holes = [];
(state.features ? state.features.map((f) => f.geometry) : state.geometries || [state]).forEach((g) => {
  (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).forEach((poly) => holes.push(poly[0].slice().reverse()));
});
const mask = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-90, 30], [-60, 30], [-60, 55], [-90, 55], [-90, 30]], ...holes] } }] };

const regions = JSON.parse(out['regions.json']);
regions.features.forEach((f, i) => { f.id = i + 1; });
const dir = new URL('../public/maps/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('ny-regions.geojson', dir), JSON.stringify(regions));
writeFileSync(new URL('ny-labels.geojson', dir), labels['labels.json']);
writeFileSync(new URL('ny-mask.geojson', dir), JSON.stringify(mask));
console.log('regions:', regions.features.map((f) => f.properties.key).join(', '));
console.log('sizes KB:', (JSON.stringify(regions).length / 1024).toFixed(0), (labels['labels.json'].length / 1024).toFixed(0), (JSON.stringify(mask).length / 1024).toFixed(0));
