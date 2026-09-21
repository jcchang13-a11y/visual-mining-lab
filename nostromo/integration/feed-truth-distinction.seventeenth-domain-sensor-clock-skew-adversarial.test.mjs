import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Seventeenth-domain held-out transfer: non-market environmental sensor metadata.
// No geography/traffic semantics are supplied; this attacks timestamp/provenance behavior only.
const capture='2026-09-21T06:00:00Z';
const cases=[
  // Sensor clock ahead of collector capture: impossible evidence, even when coverage claims complete.
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T06:00:30Z',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // Current sensor sample can still be explicitly partial.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // Re-uploading yesterday's sample now must not refresh the underlying observation.
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-20T06:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  // Missing coverage evidence remains unknown even for a current sample.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Explicit provenance conflict dominates a current timestamp.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,partial:true}},['CONFLICTED','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction seventeenth-domain sensor clock-skew adversarial transfer: PASS');
