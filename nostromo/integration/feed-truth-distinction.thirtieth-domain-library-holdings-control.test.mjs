import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Thirtieth-domain held-out transfer: library holdings / accession records.
// A catalogue sync or accession event must not refresh the age of the held object;
// explicit holdings coverage remains independent from observation freshness.
// No geospatial, transport, archive, market, sensor, software-release,
// provenance-manifest, or bibliographic-citation labels are supplied to the organ.
const capture='2026-09-21T22:25:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'1968-01-01T00:00:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T22:25:01Z',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:false,partial:true}},['FRESH','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true},provenanceConflict:true},['CONFLICTED','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction thirtieth-domain library-holdings control: PASS');
