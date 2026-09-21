import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Thirteenth-domain held-out transfer: bibliographic / scholarly metadata.
// Unrelated to geography, transport, archives, markets, biology, package graphs,
// standards, and legal dockets. Attacks repository refresh, old works deposited today,
// partial indexes, unknown coverage, malformed dates, and provenance disagreement.
const capture='2026-09-21T09:51:00+08:00';
const cases=[
  // A repository deposit today must not make a 1998 work fresh.
  [{sourceObservedAt:capture,recordObservedAt:'1998-06-01T00:00:00Z',republishedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['STALE','COMPLETE_AT_CAPTURE']],
  // A current export may explicitly state that only part of a corpus is indexed.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // A current API response does not establish corpus completeness by itself.
  [{sourceObservedAt:capture,recordObservedAt:capture},['FRESH','UNKNOWN']],
  // Conflicting DOI/repository provenance remains conflicted despite explicit coverage.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // A completeness flag without explicit coverage evidence is not accepted.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{completeAtCapture:true}},['FRESH','UNKNOWN']],
  // Malformed publication dates must not be guessed into freshness.
  [{sourceObservedAt:capture,recordObservedAt:'forthcoming-ish',coverage:{explicit:true,partial:true}},['UNKNOWN','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction thirteenth-domain bibliographic adversarial transfer: PASS');
