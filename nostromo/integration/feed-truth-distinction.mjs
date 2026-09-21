// ZENOMORPH Growing-only feed truth distinction v0.1.1
// Separates evidence about when a source reflects from evidence about how much it covers.
// This module has NO Stable authority. It is an organ-level implementation target for the
// God’s Eye View-derived candidate and must survive cross-food/delayed/held-out gates before incorporation.

const FRESHNESS = new Set(['FRESH','STALE','CONFLICTED','UNKNOWN']);
const COMPLETENESS = new Set(['COMPLETE_AT_CAPTURE','PARTIAL','UNKNOWN']);

export function distinguishFeedTruth({sourceObservedAt=null, recordObservedAt=null, coverage=null, provenanceConflict=false, republishedAt=null}={}){
  let freshness='UNKNOWN';
  if(provenanceConflict) freshness='CONFLICTED';
  else if(sourceObservedAt && recordObservedAt){
    const source=Date.parse(sourceObservedAt), record=Date.parse(recordObservedAt);
    if(Number.isFinite(source)&&Number.isFinite(record)){
      // A record cannot be observed after the capture/source observation that claims to contain it.
      // Treat this as conflicting temporal provenance rather than silently calling it fresh.
      if(record>source) freshness='CONFLICTED';
      else freshness=record===source?'FRESH':'STALE';
    }
  }

  // Republishing/mirroring is deliberately not freshness evidence for the underlying source.
  void republishedAt;

  let completeness='UNKNOWN';
  if(coverage && coverage.explicit===true){
    if(coverage.completeAtCapture===true) completeness='COMPLETE_AT_CAPTURE';
    else if(coverage.partial===true) completeness='PARTIAL';
  }

  if(!FRESHNESS.has(freshness)||!COMPLETENESS.has(completeness)) throw new Error('FEED_TRUTH_STATE_INVALID');
  return {
    schema:'zenomorph-feed-truth-distinction/v0.1.1',
    authority:'GROWING_ONLY',
    freshness,
    completeness,
    independence:true,
    boundary:'Freshness and completeness are independently evidenced. Future-dated observations conflict with capture provenance; mirror/republication time cannot refresh an older underlying source; missing coverage evidence remains UNKNOWN.'
  };
}
