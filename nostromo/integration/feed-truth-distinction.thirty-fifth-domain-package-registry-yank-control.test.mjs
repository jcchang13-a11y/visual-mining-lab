import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Thirty-fifth-domain held-out transfer: package-registry/yank metadata.
// A yank/deprecation event may be newly observed while referring to an older
// package release. Coverage authority remains independent of freshness.
// No domain hint is supplied. GROWING_ONLY: this test cannot affect Stable.
const capture='2026-09-22T03:35:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'2021-06-14T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:false,completeAtCapture:true}},['FRESH','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-22T03:35:01Z',coverage:{explicit:true,partial:true}},['CONFLICTED','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true},provenanceConflict:true},['CONFLICTED','COMPLETE_AT_CAPTURE']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction thirty-fifth-domain package-registry-yank control: PASS');
