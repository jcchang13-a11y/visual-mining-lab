import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Twelfth-domain held-out transfer: legal docket / case metadata.
// Unrelated to geography, transport, archives, markets, biology, package graphs, and standards.
// Attacks docket-page refresh, old orders re-uploaded today, partial document sets,
// unknown coverage, malformed dates, and provenance disagreement without legal-domain hints.
const capture='2026-09-21T09:17:00+08:00';
const cases=[
  // A docket page refreshed today must not make an old underlying order fresh.
  [{sourceObservedAt:capture,recordObservedAt:'2018-03-12T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // A current docket export may explicitly contain only a subset of filings.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // A current page timestamp alone says nothing about whether every filing is present.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Conflicting court/mirror provenance remains conflicted despite explicit coverage.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // A completeness flag without explicit coverage evidence is not accepted.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']],
  // Malformed record dates must not be guessed into a freshness state.
  [{sourceObservedAt:capture,recordObservedAt:'not-a-date',coverage:{explicit:true,partial:true}},['UNKNOWN','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction twelfth-domain legal-docket adversarial transfer: PASS');
