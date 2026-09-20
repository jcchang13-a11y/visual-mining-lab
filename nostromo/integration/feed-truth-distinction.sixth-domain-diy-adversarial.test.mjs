import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Sixth-domain adversarial transfer: heterogeneous DIY/making records.
// This deliberately leaves geospatial, software-release, archive, specimen,
// and financial domains. No Stable authority is granted by this test.
const capture='2026-09-21T01:40:00Z';
const cases=[
  // A freshly edited project can still expose only part of its build evidence.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // An old complete build mirrored today remains old at the underlying-record level.
  [{sourceObservedAt:capture,recordObservedAt:'2014-06-12T09:30:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // A current project page with no explicit bill-of-materials/step coverage stays unknown.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Conflicting authorship/source provenance must survive even with explicit complete coverage.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // A 'complete' badge without explicit coverage evidence is not promoted into completeness.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction sixth-domain DIY adversarial transfer: PASS');
