import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Tenth-domain held-out transfer: software dependency / package-index metadata.
// This domain is deliberately unrelated to geography, transport, archives, markets, or biology.
// It attacks mirror freshness, partial dependency enumeration, missing coverage evidence,
// and provenance disagreement without teaching the candidate package-specific semantics.
const capture='2026-09-21T07:25:00+08:00';
const cases=[
  // A package mirror refreshed now must not make an older underlying manifest fresh.
  [{sourceObservedAt:capture,recordObservedAt:'2025-02-14T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // A current resolver result can explicitly expose only part of a dependency graph.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // A current index timestamp without graph-coverage evidence cannot imply completeness.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Conflicting registries remain conflicted even when dependency coverage is explicit.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // A claimed complete graph without explicit coverage evidence remains unknown.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction tenth-domain dependency adversarial transfer: PASS');
