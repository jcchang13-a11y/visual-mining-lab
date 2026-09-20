import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Seventh-domain adversarial transfer: dead-data / memorial reconstruction records.
// Tests whether the Growing candidate keeps observation freshness independent
// from record age and evidence completeness. No Stable authority is granted.
const capture='2026-09-21T02:55:00+08:00';
const cases=[
  // A newly generated memorial representation can be based on old, partial records.
  [{sourceObservedAt:capture,recordObservedAt:'2008-04-12T00:00:00Z',republishedAt:capture,coverage:{explicit:true,partial:true}},['STALE','PARTIAL']],
  // A current capture with explicit complete-at-capture evidence remains current and complete.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  // A newly surfaced record without explicit coverage cannot inherit completeness.
  [{sourceObservedAt:capture,recordObservedAt:'1999-11-03T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  // Conflicting identity/provenance must survive regardless of apparent completeness.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // A completeness assertion without explicit evidence stays unknown.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction seventh-domain dead-data adversarial transfer: PASS');
