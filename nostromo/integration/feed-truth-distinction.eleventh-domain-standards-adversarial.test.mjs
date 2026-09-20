import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Eleventh-domain held-out transfer: standards / protocol registry metadata.
// Deliberately unrelated to geography, transport, archives, markets, biology, and package graphs.
// Attacks revision publication, superseded normative content, partial conformance coverage,
// unknown coverage, and provenance disagreement without teaching standards-specific semantics.
const capture='2026-09-21T07:43:00+08:00';
const cases=[
  // A registry page updated now must not make an old normative revision fresh.
  [{sourceObservedAt:capture,recordObservedAt:'2019-06-01T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // A current conformance report may explicitly cover only part of a specification.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // A current registry timestamp alone says nothing about conformance coverage.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Conflicting registries stay conflicted even when coverage is explicit.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // A completeness claim without explicit coverage evidence is not accepted.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction eleventh-domain standards adversarial transfer: PASS');
