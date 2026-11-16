// Build static SVG paths for the 16 Karing4Life regions of New York State.
// Source: US Census cartographic boundary file cb_2023_us_county_500k (shoreline-clipped).
// Pipeline: mapshaper (filter NY, tag region, topology-aware simplify) ->
//           topojson-client merge per region (shared borders line up) ->
//           d3-geo geoConicConformal -> SVG path strings.
import mapshaper from 'mapshaper';
import * as topo from 'topojson-client';
import { geoConicConformal, geoPath } from 'd3-geo';
import fs from 'node:fs';

const [, , zipPath, outPath] = process.argv;

const GROUPS = {
  'Adirondacks': ['Clinton', 'Essex', 'Franklin', 'Hamilton', 'Warren', 'Fulton', 'Lewis'],
  'Thousand Islands': ['Jefferson', 'St. Lawrence', 'Oswego'],
  'Central New York': ['Broome', 'Chenango', 'Herkimer', 'Madison', 'Montgomery', 'Oneida', 'Otsego'],
  'Finger Lakes': ['Cayuga', 'Chemung', 'Cortland', 'Livingston', 'Monroe', 'Onondaga', 'Ontario', 'Schuyler', 'Seneca', 'Steuben', 'Tioga', 'Tompkins', 'Wayne', 'Yates'],
  'Niagara': ['Erie', 'Niagara', 'Orleans', 'Genesee', 'Wyoming'],
  'Chautauqua-Allegheny': ['Chautauqua', 'Cattaraugus', 'Allegany'],
  'Capital Region': ['Albany', 'Rensselaer', 'Saratoga', 'Schenectady', 'Washington'],
  'Catskills': ['Delaware', 'Greene', 'Schoharie', 'Sullivan'],
  'Hudson Valley': ['Columbia', 'Dutchess', 'Orange', 'Putnam', 'Rockland', 'Ulster', 'Westchester'],
  'Suffolk': ['Suffolk'], 'Nassau': ['Nassau'],
  'Manhattan': ['New York'], 'Brooklyn': ['Kings'], 'Queens': ['Queens'],
  'Bronx': ['Bronx'], 'Staten Island': ['Richmond'],
};
const county2region = {};
for (const [r, cs] of Object.entries(GROUPS)) for (const c of cs) county2region[c] = r;

const input = { 'county.zip': fs.readFileSync(zipPath) };
const cmd = [
  '-i county.zip',
  // NY plus neighbours (for faint context): PA 42, NJ 34, CT 09, MA 25, VT 50
  `-filter "['36','42','34','09','25','50'].indexOf(STATEFP) > -1"`,
  '-proj wgs84',
  // uniform detail: ~110 m everywhere, so NYC and upstate read the same
  '-simplify interval=110 keep-shapes',
  '-filter-slivers min-area=0.15km2',
  '-o format=topojson quantization=1e6 out.json',
].join(' ');
const out = await mapshaper.applyCommands(cmd, input);
const topology = JSON.parse(out['out.json']);
const objName = Object.keys(topology.objects)[0];
const geoms = topology.objects[objName].geometries;

const ny = geoms.filter(g => g.properties.STATEFP === '36');
const missing = ny.filter(g => !county2region[g.properties.NAME]).map(g => g.properties.NAME);
if (missing.length) throw new Error('Unassigned counties: ' + missing);
console.log('NY counties', ny.length);

const W = 1000;
const nyAll = topo.merge(topology, ny);
const proj = geoConicConformal().parallels([40.6, 44.4]).rotate([75.8, 0]);
proj.fitWidth(W - 40, nyAll);
const b0 = geoPath(proj).bounds(nyAll);
const H = Math.ceil(b0[1][1] - b0[0][1] + 40);
proj.fitExtent([[20, 20], [W - 20, H - 20]], nyAll);
const path = geoPath(proj).digits(1);

const regions = [];
for (const [name, cs] of Object.entries(GROUPS)) {
  const parts = ny.filter(g => county2region[g.properties.NAME] === name);
  const f = { type: 'Feature', geometry: topo.merge(topology, parts) };
  const d = path(f);
  const [[x0, y0], [x1, y1]] = path.bounds(f);
  // label point: centroid of largest polygon
  let best = null, bestA = -1;
  for (const poly of f.geometry.coordinates) {
    const pf = { type: 'Polygon', coordinates: poly };
    const a = path.area(pf); if (a > bestA) { bestA = a; best = pf; }
  }
  const [cx, cy] = path.centroid(best);
  regions.push({ name, counties: cs, d, bbox: [x0, y0, x1, y1].map(v => +v.toFixed(1)), c: [+cx.toFixed(1), +cy.toFixed(1)], area: Math.round(path.area(f)) });
}

// neighbours: separate, coarser simplification (context only, drawn under NY)
const out2 = await mapshaper.applyCommands([
  '-i county.zip',
  `-filter "['42','34','09','25','50'].indexOf(STATEFP) > -1"`,
  '-proj wgs84', '-clip bbox=-80.6,39.9,-71.2,45.3', '-simplify interval=700 keep-shapes', '-dissolve STATEFP',
  '-o format=topojson quantization=1e5 ctx.json'].join(' '), input);
const ctxT = JSON.parse(out2['ctx.json']);
const ctxG = ctxT.objects[Object.keys(ctxT.objects)[0]].geometries;
const STATES = { '42': 'PA', '34': 'NJ', '09': 'CT', '25': 'MA', '50': 'VT' };
const ctx = ctxG.map(g => ({ ab: STATES[g.properties.STATEFP], d: path(topo.merge(ctxT, [g])) }));
// region border mesh (interior borders only) for crisp shared lines
const meshNY = path(topo.mesh(topology, { type: 'GeometryCollection', geometries: ny },
  (a, b) => a !== b && county2region[a.properties.NAME] !== county2region[b.properties.NAME]));

const data = { w: W, h: H, regions, ctx, mesh: meshNY };
fs.writeFileSync(outPath, JSON.stringify(data));
const kb = s => (s.length / 1024).toFixed(1);
console.log('viewBox', W, H, 'regions KB', kb(regions.map(r => r.d).join('')), 'ctx KB', kb(ctx.map(c => c.d).join('')), 'mesh KB', kb(meshNY), 'total KB', kb(JSON.stringify(data)));
for (const r of regions) console.log(r.name.padEnd(22), r.bbox.join(','), 'area', r.area);
