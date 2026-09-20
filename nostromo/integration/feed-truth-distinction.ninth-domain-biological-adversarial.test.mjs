import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Ninth-domain held-out transfer: biological dataset / specimen metadata.
// No geography, transport, archive, dead-data, or market semantics are supplied.
// This attacks the candidate with collection-time vs publication-time and partial sampling.
const capture='2026-09-21T06:26:00+08:00';
const cases=[
  // A specimen measured years ago remains stale even when its metadata was freshly republished.
  [{sourceObservedAt:capture,recordObservedAt:'2024-05-01T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // A current assay can explicitly cover only a subset of cells/specimens.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // A biological mirror without explicit sampling coverage cannot inherit completeness.
  [{sourceObservedAt:capture,recordObservedAt:'2025-11-03T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  // Provenance disagreement remains conflicted even if sampling coverage is explicit.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // Coverage assertion without explicit evidence remains unknown.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction ninth-domain biological adversarial transfer: PASS');
