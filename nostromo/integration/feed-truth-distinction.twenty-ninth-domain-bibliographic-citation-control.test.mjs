import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Twenty-ninth-domain held-out transfer: bibliographic/citation records.
// A citation export generated now must not refresh the cited work itself;
// declared record coverage stays independent from observation freshness.
// No geospatial, transport, archive, publication-feed, market, sensor, lab,
// catalogue, provenance-manifest, or software-release labels are supplied.
const capture='2026-09-21T20:45:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'1987-10-19T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T20:45:01Z',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:false,completeAtCapture:true}},['FRESH','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true},provenanceConflict:true},['CONFLICTED','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction twenty-ninth-domain bibliographic-citation control: PASS');
