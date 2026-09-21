import assert from 'node:assert/strict';
import {distinguishFeedTruth} from './feed-truth-distinction.mjs';

// Sixteenth-domain held-out transfer: historical market-tape metadata.
// This is provenance stress only, not trading/prediction logic and uses no real account or funds.
// Event labels are intentionally absent so the candidate cannot key on named crises.
const capture='2008-10-10T16:00:00-04:00';
const cases=[
  // A trade timestamp after the tape capture is impossible evidence for that capture.
  [{sourceObservedAt:capture,recordObservedAt:'2008-10-10T16:05:00-04:00',coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']],
  // Exact capture-time tape evidence may be fresh while explicitly partial.
  [{sourceObservedAt:capture,recordObservedAt:capture,coverage:{explicit:true,partial:true}},['FRESH','PARTIAL']],
  // An older record stays stale even if a vendor republishes it at capture time.
  [{sourceObservedAt:capture,recordObservedAt:'2008-10-09T16:00:00-04:00',republishedAt:capture},['STALE','UNKNOWN']],
  // A provenance conflict must dominate a superficially current timestamp.
  [{sourceObservedAt:capture,recordObservedAt:capture,provenanceConflict:true,coverage:{explicit:true,completeAtCapture:true}},['CONFLICTED','COMPLETE_AT_CAPTURE']]
];
for(const [input,expected] of cases){
  const out=distinguishFeedTruth(input);
  assert.equal(out.authority,'GROWING_ONLY');
  assert.deepEqual([out.freshness,out.completeness],expected);
  assert.equal(out.independence,true);
}
console.log('feed-truth-distinction sixteenth-domain market-tape adversarial transfer: PASS');
