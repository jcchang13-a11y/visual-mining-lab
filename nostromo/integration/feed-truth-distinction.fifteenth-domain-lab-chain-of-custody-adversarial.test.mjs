import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Fifteenth-domain held-out transfer: laboratory specimen chain-of-custody metadata.
// Attacks impossible future observations without importing geography/transport semantics.
const capture='2026-09-21T11:50:00+08:00';
const cases=[
  // A specimen result timestamp after the capture that supposedly contains it is conflicting provenance.
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T12:05:00+08:00',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // Exact capture-time evidence remains fresh.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // Older assay evidence remains stale even if mirrored now.
  [{sourceObservedAt:capture,recordObservedAt:'2025-09-21T11:50:00+08:00',republishedAt:capture},['STALE','UNKNOWN']],
  // Explicit provenance conflict dominates otherwise current evidence.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction fifteenth-domain lab chain-of-custody adversarial transfer: PASS');
