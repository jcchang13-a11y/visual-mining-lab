import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Eighth-domain adversarial transfer: blinded historical market-window records.
// Event labels are intentionally absent: this tests evidence handling, not crisis recognition.
// The Growing candidate must keep observation freshness independent from series coverage.
const capture='2026-09-21T03:56:00+08:00';
const cases=[
  // A newly downloaded historical window remains stale even when the archive is complete for that window.
  [{sourceObservedAt:capture,recordObservedAt:'2008-10-10T20:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // A current observation can still be explicitly partial (for example, one venue or truncated symbols).
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // A mirrored historical series without coverage evidence stays stale and coverage-unknown.
  [{sourceObservedAt:capture,recordObservedAt:'1987-10-19T20:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  // Conflicting provenance cannot be washed away by apparent completeness.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // A completeness claim without explicit evidence is not accepted.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction eighth-domain blinded-financial adversarial transfer: PASS');
