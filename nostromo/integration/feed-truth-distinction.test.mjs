import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

const observed='2026-09-20T00:00:00Z';
const cases=[
  [{sourceObservedAt:observed,recordObservedAt:'2026-09-20T00:00:00Z',coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:observed,recordObservedAt:'2025-03-20T00:00:00Z',coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:observed,recordObservedAt:'2026-09-20T00:00:00Z'},['FRESH','UNKNOWN']],
  [{sourceObservedAt:observed,recordObservedAt:'2026-09-20T00:00:00Z',provenanceConflict:true},['CONFLICTED','UNKNOWN']],
  [{sourceObservedAt:observed,recordObservedAt:'2024-01-01T00:00:00Z',republishedAt:'2026-09-20T00:00:00Z',coverage:{explicit:true,partial:true}},['STALE','PARTIAL']]
];

for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.equal(out.freshness,expected[0]);
  assert.equal(out.completeness,expected[1]);
  assert.equal(out.independence,true);
}

// Coverage claims without explicit evidence cannot be promoted into completeness.
assert.equal(distinguishFeedTruth({coverage:{completeAtCapture:true}}).completeness,'UNKNOWN');
console.log('feed-truth-distinction: PASS');
