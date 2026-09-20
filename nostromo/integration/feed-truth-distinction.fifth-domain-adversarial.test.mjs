import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Fifth-domain adversarial transfer: financial time-series metadata.
// Labels intentionally avoid naming any historical crash/event. This tests the
// candidate outside geospatial, software-release, archive, and specimen domains.
// No Stable authority is granted by this test.
const capture='2026-09-21T01:10:00Z';
const cases=[
  // Current partial trading window: fresh does not imply complete.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // Old full session mirrored today: republication must not refresh underlying observations.
  [{sourceObservedAt:capture,recordObservedAt:'2008-10-10T20:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // Current quote with no defensible statement about session coverage.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Conflicting vendor provenance remains conflicted even when timestamps are current.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // Claimed completeness without explicit coverage evidence is not accepted.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction fifth-domain financial adversarial transfer: PASS');
