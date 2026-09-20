import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Delayed adversarial retest: fourth domain = scientific specimen / lab metadata.
// Deliberately unrelated to geospatial feeds, software releases, and archive catalogues.
// No Stable authority is granted by this test.
const capture='2026-09-21T00:00:00Z';
const cases=[
  // Newly catalogued specimen, explicitly incomplete sampling.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // Old complete-at-capture assay imported today: import time must not refresh it.
  [{sourceObservedAt:capture,recordObservedAt:'2019-06-01T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // Current observation with no defensible coverage statement.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Conflicting provenance must not be silently resolved by recency.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,partial:true}},['CONFLICTED','PARTIAL']],
  // A coverage-looking scalar without explicit evidence remains unknown.
  [{coverage:{completeAtCapture:true}},['UNKNOWN','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction delayed adversarial fourth-domain: PASS');
