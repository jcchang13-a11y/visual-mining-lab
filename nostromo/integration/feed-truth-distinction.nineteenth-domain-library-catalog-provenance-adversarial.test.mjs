import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Nineteenth-domain held-out transfer: library catalog metadata.
// This domain is independent of geography, transport, markets, sensors and biobanks.
// Attack: catalog update/republishing must not overwrite edition/item observation time or invent collection coverage.
const catalogCapture='2026-09-21T09:30:00Z';
const cases=[
  [{sourceObservedAt:catalogCapture,recordObservedAt:'2026-09-21T09:30:01Z',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:catalogCapture,recordObservedAt:catalogCapture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:catalogCapture,recordObservedAt:'1998-04-03T00:00:00Z',republishedAt:catalogCapture},['STALE','UNKNOWN']],
  [{sourceObservedAt:catalogCapture,recordObservedAt:catalogCapture},['FRESH','UNKNOWN']],
  [{sourceObservedAt:catalogCapture,recordObservedAt:catalogCapture,provenanceConflict:true},['CONFLICTED','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction nineteenth-domain library catalog provenance adversarial transfer: PASS');
