/* VAJRA evidence-contract guard v0.1 — deterministic anti-false-closure layer.
   Adds a missing lens-specific adequacy check for `evidence` handoffs.
   It does NOT judge truth or source quality; it only refuses closure when a return
   contains a SUPPORTS/REFUTES label but no auditable evidence-bearing material. */
(function(root){
  const engine=root.VajraEngine;
  if(!engine||typeof engine.applyHandoffResults!=='function') throw new Error('VAJRA_ENGINE_REQUIRED_BEFORE_EVIDENCE_CONTRACT_GUARD');
  if(engine.evidenceContractGuardVersion==='0.1') return;
  const baseApply=engine.applyHandoffResults.bind(engine);
  const clean=x=>String(x||'').normalize('NFKC').replace(/\s+/g,' ').trim();
  const evidenceMarker=/\b(?:source|citation|document|record|dataset|data|study|report|measurement|measured|observed|observation|result|statistic|table|figure|quote|transcript|archive|doi|isbn|url|http|published|survey|experiment)\b|來源|引文|文獻|文件|紀錄|資料集|數據|研究|報告|測量|觀察|結果|統計|表格|圖表|逐字稿|檔案|出版|調查|實驗/i;
  function materialOf(r){return clean(r?.material||r?.summary||r?.evidence||r?.result);}
  function relationOf(r){return clean(r?.relation||r?.relationToTarget||r?.assessment);}
  function provenanceOf(r){return clean(r?.provenance||r?.provenanceFingerprint||r?.sourceFingerprint||r?.fingerprint);}
  function isEvidenceLens(r){return clean(r?.lens).toLowerCase()==='evidence';}
  function hasEvidenceBearingMaterial(r){
    const material=materialOf(r), provenance=provenanceOf(r);
    if(!material||!provenance) return false;
    return evidenceMarker.test(material);
  }
  function audit(r){return {targetRef:clean(r?.targetRef),clauseRef:clean(r?.clauseRef),lens:clean(r?.lens),organ:clean(r?.organ||r?.sourceOrgan),status:clean(r?.status),provenance:provenanceOf(r),material:materialOf(r),relation:relationOf(r),reasons:['EVIDENCE_LENS_MISSING_EVIDENCE_BEARING_MATERIAL'],adequacyTopology:'EVIDENCE_CONTRACT_MATERIAL_MARKER_MISSING'};}
  function apply(vajraResult,receipts=[]){
    const list=Array.isArray(receipts)?receipts:[];
    const blocked=[],eligible=[];
    for(const r of list){if(isEvidenceLens(r)&&!hasEvidenceBearingMaterial(r)) blocked.push(r); else eligible.push(r);}
    const out=baseApply(vajraResult,eligible);
    if(!out||typeof out!=='object') return out;
    const hr=out.handoffResolution||{received:0,resolved:0,contested:0,open:0,rejected:0,resolvedBranches:[],contestedBranches:[],rejectedReceipts:[]};
    hr.received=(Number(hr.received)||0)+blocked.length;
    hr.rejected=(Number(hr.rejected)||0)+blocked.length;
    hr.evidenceContractBlocked=blocked.length;
    hr.rejectedReceipts=[...(hr.rejectedReceipts||[]),...blocked.map(audit)];
    out.handoffResolution=hr;
    out.version='0.3.9';
    out.boundary=`${out.boundary||''} Evidence-contract guard v0.1 additionally requires evidence-lens receipts to contain provenance plus an explicit bounded evidence-bearing material marker before they can participate in closure. This is a lexical/auditable adequacy floor, not semantic validation, source-quality scoring, independence proof, or truth certification.`;
    return out;
  }
  engine.applyHandoffResults=apply;
  engine.evidenceContractGuardVersion='0.1';
})(typeof window!=='undefined'?window:globalThis);
