import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Twenty-seventh-domain held-out transfer: library catalogue / bibliographic records.
// A fresh catalogue edit, digitisation event, or reissue must not refresh an older work;
// explicit holding/coverage evidence remains independent from record freshness.
// No geospatial, transport, archive, publication-feed, market, sensor, or lab labels are supplied.
const capture='2026-09-21T19:20:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'1984-06-01T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T19:20:01Z',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:false,completeAtCapture:true}},['FRESH','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true},provenanceConflict:true},['CONFLICTED','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction twenty-seventh-domain library-catalog control: PASS');
