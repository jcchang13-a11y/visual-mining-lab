import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Twenty-third-domain held-out transfer: historical market-series revisions.
// Blind attack: a newly published correction/revision must not make an old market
// observation fresh, and revision metadata must not imply complete market coverage.
// No crisis/event labels are supplied to the candidate.
const capture='2026-09-21T14:20:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'2008-10-10T20:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T14:20:01Z',coverage:{explicit:true,partial:true}},['CONFLICTED','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true},['CONFLICTED','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction twenty-third-domain market-revision adversarial transfer: PASS');
