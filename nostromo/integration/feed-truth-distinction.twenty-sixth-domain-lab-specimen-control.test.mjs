import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Twenty-sixth-domain held-out transfer: laboratory specimen / assay records.
// A fresh assay, re-analysis, or accession update must not refresh an older specimen;
// assay coverage is independently evidenced and provenance conflict wins over recency.
// No geospatial, transport, archive, publication, market, or sensor labels are supplied.
const capture='2026-09-21T18:30:00Z';
const cases=[
  [{sourceObservedAt:capture,recordObservedAt:'2023-04-02T09:15:00Z',republishedAt:capture},['STALE','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,completeAtCapture:true}},['FRESH','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:'2026-09-21T18:30:01Z',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:false,completeAtCapture:true}},['FRESH','UNKNOWN']],
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true},provenanceConflict:true},['CONFLICTED','PARTIAL']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction twenty-sixth-domain lab-specimen control: PASS');
