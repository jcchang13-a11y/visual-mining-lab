import fs from 'node:fs';
import assert from 'node:assert/strict';
import { assessRelationProvenanceAuthority } from './relation-provenance-authority-gate.mjs';

const urban=JSON.parse(fs.readFileSync(new URL('../research/level1-urban-osm-specimen-v0.1.json',import.meta.url),'utf8'));
const seismic=JSON.parse(fs.readFileSync(new URL('../research/level1-usgs-seismic-specimen-v0.1.json',import.meta.url),'utf8'));

const urbanRelations=[];
for(const way of urban.ways){
  for(let i=0;i<way.nodeRefs.length-1;i++){
    urbanRelations.push({
      source:way.nodeRefs[i],
      target:way.nodeRefs[i+1],
      type:'adjacency',
      origin:'source-schema-derived',
      evidenceRef:`ways:${way.wayId}:nodeRefs:${i}-${i+1}`
    });
  }
}
const urbanResult=assessRelationProvenanceAuthority(urban,{relations:urbanRelations,minimumRelations:2});
assert.equal(urbanResult.status,'PASS');
assert.equal(urbanResult.authoritativeRelationCount,15);

// Deliberately tempting but invalid transformation: catalog time order is not a source relation.
const temporalHeuristic=[];
for(let i=0;i<seismic.events.length-1;i++){
  temporalHeuristic.push({
    source:seismic.events[i].id,
    target:seismic.events[i+1].id,
    type:'adjacency',
    origin:'heuristic-temporal-order',
    evidenceRef:`events:${i}->${i+1}:ordered-by-feed`
  });
}
const seismicTemporal=assessRelationProvenanceAuthority(seismic,{relations:temporalHeuristic,minimumRelations:2});
assert.equal(seismicTemporal.status,'HOLD');
assert.equal(seismicTemporal.authoritativeRelationCount,0);
assert.deepEqual(seismicTemporal.rejectedOrigins,['heuristic-temporal-order']);

// Another invalid transformation: geographic proximity is also not a relation encoded by the catalog.
const spatialHeuristic=seismic.events.slice(0,3).map((event,i,arr)=>i<arr.length-1?{
  source:event.id,
  target:arr[i+1].id,
  type:'undirected-connectivity',
  origin:'heuristic-spatial-proximity',
  evidenceRef:`events:${i}-${i+1}:coordinate-distance`
}:null).filter(Boolean);
const seismicSpatial=assessRelationProvenanceAuthority(seismic,{relations:spatialHeuristic,minimumRelations:2});
assert.equal(seismicSpatial.status,'HOLD');
assert.equal(seismicSpatial.authoritativeRelationCount,0);

console.log(JSON.stringify({
  schema:'zenomorph-cross-food-relation-provenance-test/v0.1',
  urban:urbanResult,
  seismicTemporal,
  seismicSpatial,
  conclusion:'OSM source-encoded node order survives; USGS temporal/spatial heuristic edges remain quarantined. Candidate only; no body admission.'
},null,2));
