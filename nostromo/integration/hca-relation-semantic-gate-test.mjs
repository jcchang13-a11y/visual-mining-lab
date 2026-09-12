import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { assessTypedRelationSpecimen } from './foreign-relation-semantic-gate.mjs';

const sourceUrl='https://raw.githubusercontent.com/Teichlab/TissueImmuneCellAtlas/master/metadata/meta_GEX_VDJ.csv';
const response=await fetch(sourceUrl);
assert.equal(response.ok,true,`HCA supplementary specimen fetch failed: ${response.status} ${response.statusText}`);
const text=await response.text();
const sha256=crypto.createHash('sha256').update(text).digest('hex');
assert.equal(sha256,'06d2f0b2c5de8685b4e55ae554a41fd5739cd1d1e3ead64d016231aac034985c','Source identity changed; re-verify specimen before interpreting it');

const lines=text.trim().split(/\r?\n/);
assert.equal(lines[0],'Sanger_Sample_ID,CBTM_ID,ID,Identity,Sanger Sample ID,sex');
const sampleRows=lines.slice(1,13).map(line=>{
  const [sample,cbtm,id,identity,legacy,sex]=line.split(',');
  return {sample,cbtm,id,identity,legacy,sex};
});
assert.equal(sampleRows.length,12);

const membershipRelations=sampleRows.flatMap(row=>[
  {source:row.sample,target:row.id,type:'sample-donor-membership'},
  {source:row.sample,target:row.cbtm,type:'sample-cohort-membership'}
]);

const hcaAssessment=assessTypedRelationSpecimen({
  source:{identity:`sha256:${sha256}`,provider:'Human Cell Atlas / Teichlab',sourceUrl},
  relations:membershipRelations
});
assert.equal(hcaAssessment.relationStatus,'PASS');
assert.equal(hcaAssessment.topologyStatus,'HOLD');
assert.equal(hcaAssessment.topologicalRelationCount,0);
assert.equal(hcaAssessment.behaviorChangeCandidate,'RELATION_TYPE_PRECEDES_NETWORK_NORMALIZATION');
assert.equal(hcaAssessment.bodyAdmission,false);

const malecnsControl=assessTypedRelationSpecimen({
  source:{identity:'held-out:malecns-swc'},
  relations:[
    {source:'1',target:'2',type:'parent-child'},
    {source:'2',target:'3',type:'parent-child'},
    {source:'2',target:'4',type:'parent-child'}
  ]
});
assert.equal(malecnsControl.relationStatus,'PASS');
assert.equal(malecnsControl.topologyStatus,'PASS');

const urbanControl=assessTypedRelationSpecimen({
  source:{identity:'held-out:osm-way'},
  relations:[
    {source:'n1',target:'n2',type:'adjacency'},
    {source:'n2',target:'n3',type:'adjacency'}
  ]
});
assert.equal(urbanControl.relationStatus,'PASS');
assert.equal(urbanControl.topologyStatus,'PASS');

console.log(JSON.stringify({
  schema:'zenomorph-hca-semantic-relation-challenge/v0.1',
  organism:'ZENOMORPH',
  habitat:'NOSTROMO',
  sourceUrl,
  sha256,
  sampledRows:sampleRows.length,
  explicitTypedRelations:membershipRelations.length,
  hcaAssessment,
  controls:{malecns:malecnsControl,urban:urbanControl},
  interpretationBoundary:'Real membership/provenance relations are not discarded, but they are not normalized into network topology. The candidate remains isolated and does not install a biological analogy.',
  bodyAdmission:false,
  promotion:'NONE'
},null,2));
