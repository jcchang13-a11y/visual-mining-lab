import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Thirty-first-domain held-out transfer: research repository / dataset deposit records.
// A fresh repository deposit, DOI mint, or metadata revision must not refresh the
// observation time of the deposited object; declared coverage remains independent.
// No geospatial, transport, archive, market, sensor, software-release,
// bibliographic, or library-holdings labels are supplied to the organ.
const capture='2026-09-22T00:00:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'2014-06-01T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-22T00:00:01Z',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:false,completeAtCapture:true}},['FRESH','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true},provenanceConflict:true},['CONFLICTED','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction thirty-first-domain research-repository control: PASS');
