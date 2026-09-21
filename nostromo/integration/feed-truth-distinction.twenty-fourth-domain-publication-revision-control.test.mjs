import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Twenty-fourth-domain held-out transfer: scholarly publication corrections.
// A correction published now must not make the underlying old observation fresh;
// publication status also must not imply dataset completeness.
// No market/geospatial labels are supplied to the candidate.
const capture='2026-09-21T15:35:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'2021-04-03T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T15:35:01Z',coverage:{explicit:true,partial:true}},['CONFLICTED','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true},['CONFLICTED','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction twenty-fourth-domain publication-revision control: PASS');
