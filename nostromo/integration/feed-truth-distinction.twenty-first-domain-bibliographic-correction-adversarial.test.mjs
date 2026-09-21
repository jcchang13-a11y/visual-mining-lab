import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Twenty-first-domain held-out transfer: bibliographic correction / erratum metadata.
// Attack: a correction published now must not make the corrected historical work newly observed,
// and presence of an erratum must not imply complete correction coverage.
const capture='2026-09-21T11:00:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'1998-03-01T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T11:00:01Z',coverage:{explicit:true,partial:true}},['CONFLICTED','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true},['CONFLICTED','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction twenty-first-domain bibliographic-correction adversarial transfer: PASS');
