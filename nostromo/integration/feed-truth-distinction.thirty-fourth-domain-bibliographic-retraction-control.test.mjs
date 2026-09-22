import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Thirty-fourth-domain held-out transfer: bibliographic/retraction metadata.
// A notice can be newly published while referring to an older record; explicit
// coverage remains independent of freshness. No domain hint is supplied.
// This remains GROWING_ONLY and cannot affect Stable.
const capture='2026-09-22T02:20:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'2018-04-12T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:false,completeAtCapture:true}},['FRESH','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-22T02:20:01Z',coverage:{explicit:true,partial:true}},['CONFLICTED','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true},provenanceConflict:true},['CONFLICTED','COMPLETE_AT_CAPTURE']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction thirty-fourth-domain bibliographic-retraction control: PASS');
