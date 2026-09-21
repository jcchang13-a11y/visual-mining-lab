import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Fourteenth-domain held-out transfer: laboratory sensor/calibration metadata.
// Unrelated to geography, transport, archives, markets, biology, package graphs,
// standards, legal dockets, and bibliographic metadata. Attacks recalibration time,
// partial channel coverage, unknown coverage, malformed sample time, and provenance conflict.
const capture='2026-09-21T11:11:00+08:00';
const cases=[
  // Recalibrating today cannot make an old measurement fresh.
  [{sourceObservedAt:capture,recordObservedAt:'2024-02-01T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // A current acquisition can explicitly cover only some channels.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // A current sensor packet does not establish channel completeness by itself.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Conflicting calibration provenance remains conflicted despite complete coverage evidence.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // Completeness without explicit coverage evidence remains unknown.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']],
  // Malformed measurement time must not be guessed into freshness.
  [{sourceObservedAt:capture,recordObservedAt:'after recalibration maybe',coverage:{explicit:true,partial:true}},['UNKNOWN','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction fourteenth-domain sensor calibration adversarial transfer: PASS');
