import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Eighteenth-domain held-out transfer: biobank specimen metadata.
// This deliberately avoids geography, transport, markets, and sensors.
// It attacks whether collection/record time and coverage claims remain independently evidenced.
const registryCapture='2026-09-21T08:00:00Z';
const cases=[
  // A specimen timestamp after the registry snapshot is impossible provenance even if the batch claims completeness.
  [{sourceObservedAt:registryCapture,recordObservedAt:'2026-09-21T08:00:01Z',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // A current registry snapshot may explicitly contain only a partial specimen cohort.
  [{sourceObservedAt:registryCapture,recordObservedAt:registryCapture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // Re-consenting/re-publishing an older specimen today must not make the specimen observation fresh.
  [{sourceObservedAt:registryCapture,recordObservedAt:'2024-05-10T12:00:00Z',republishedAt:registryCapture},['STALE','UNKNOWN']],
  // A current specimen without explicit cohort coverage evidence remains coverage-unknown.
  [{sourceObservedAt:registryCapture,recordObservedAt:registryCapture},['FRESH','UNKNOWN']],
  // Explicit provenance conflict dominates a current timestamp without inventing coverage.
  [{sourceObservedAt:registryCapture,recordObservedAt:registryCapture,provenanceConflict:true},['CONFLICTED','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction eighteenth-domain biobank consent/provenance adversarial transfer: PASS');
