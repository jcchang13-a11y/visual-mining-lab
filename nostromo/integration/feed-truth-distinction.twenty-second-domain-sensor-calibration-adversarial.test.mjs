import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Twenty-second-domain held-out transfer: sensor calibration metadata.
// Attack: a newly issued calibration certificate must not make old observations fresh,
// and calibration evidence must not imply complete observation coverage.
const capture='2026-09-21T12:18:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'2024-06-01T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T12:18:01Z',coverage:{explicit:true,partial:true}},['CONFLICTED','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true},['CONFLICTED','UNKNOWN']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction twenty-second-domain sensor-calibration adversarial transfer: PASS');
