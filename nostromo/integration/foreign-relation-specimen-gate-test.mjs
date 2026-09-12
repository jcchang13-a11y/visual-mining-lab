import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessRelationBearingSpecimen,deriveConsecutiveRelations} from './foreign-relation-specimen-gate.mjs';

const urban=JSON.parse(fs.readFileSync(new URL('../research/level1-urban-osm-specimen-v0.1.json',import.meta.url),'utf8'));
const relations=deriveConsecutiveRelations(urban.ways);
assert.equal(relations.length,15,'urban specimen relation count must match the preserved OSM way structure');
const urbanAssessment=assessRelationBearingSpecimen(urban);
assert.equal(urbanAssessment.status,'PASS');
assert.equal(urbanAssessment.bodyAdmission,false);
assert.equal(urbanAssessment.relationCount,15);

// Cross-domain held-out case: MaleCNS documentation metadata names two real neurons,
// but names/IDs alone are not connectivity. This must remain HOLD until an actual
// edge/skeleton-parent specimen is acquired. This prevents analogy or labels from
// being upgraded into structural evidence.
const maleCnsMetadataOnly={
  source:{sourceBlobSha:'official-download-page-observation-2026-09-12'},
  neurons:[
    {id:'12781',type:'DNge104_R'},
    {id:'556329',type:'DNge104_L'}
  ],
  relations:[]
};
const heldoutAssessment=assessRelationBearingSpecimen(maleCnsMetadataOnly);
assert.equal(heldoutAssessment.status,'HOLD');
assert.equal(heldoutAssessment.relationCount,0);
assert.equal(heldoutAssessment.behaviorChangeCandidate,'NETWORK_LABELS_DO_NOT_COUNT_AS_NETWORK_EVIDENCE');

// Adversarial self-loop-only payload also cannot pass.
const selfLoopOnly={source:{identity:'synthetic-adversarial'},relations:[{source:'x',target:'x'}]};
const selfAssessment=assessRelationBearingSpecimen(selfLoopOnly,{minimumRelations:1});
assert.equal(selfAssessment.status,'HOLD');
assert.equal(selfAssessment.rejectedSelfRelations,1);

console.log(JSON.stringify({urbanAssessment,heldoutAssessment,selfAssessment},null,2));
