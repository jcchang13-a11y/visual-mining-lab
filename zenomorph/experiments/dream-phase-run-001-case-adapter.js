#!/usr/bin/env node
'use strict';

const crypto = require('crypto');

// Deterministic, offline, fail-closed adapter for dream-phase-run-001.
// It does not read Rongzhe source documents, use network access, or write Stable.
const ADAPTER_ID = 'zenomorph.dream.case-adapter.v1';
const sha256 = x => crypto.createHash('sha256').update(String(x), 'utf8').digest('hex');
const ADAPTER_HASH = sha256(ADAPTER_ID + '|offline|stable_write=false');

function evaluate(caseDef, arm, armEvidence) {
  if (!caseDef || !caseDef.id || !caseDef.layer || !caseDef.payload || !caseDef.expected) throw new Error('INVALID_CASE');
  if (!['A','B','C','D'].includes(arm)) throw new Error('INVALID_ARM');
  if (!armEvidence || armEvidence.arm !== arm) throw new Error('ARM_EVIDENCE_MISMATCH');

  const inputHash = sha256(JSON.stringify({case_id: caseDef.id, layer: caseDef.layer, payload: caseDef.payload}));
  const provenanceIntact = arm === 'D' ? armEvidence.output_hash == null : Boolean(armEvidence.parent_provenance);
  const syntheticLabelIntact = arm === 'D' ? armEvidence.output_hash == null : armEvidence.observation_class === 'DREAM/SYNTHETIC';

  // This first adapter intentionally scores only invariant safety/provenance predicates.
  // It is not a semantic task-performance metric and cannot establish dreaming benefit.
  const predicateResult = Boolean(provenanceIntact && syntheticLabelIntact && armEvidence.network_access === false && armEvidence.stable_write === false);
  const observedOutputHash = sha256(JSON.stringify({case_id:caseDef.id, arm, predicateResult, evidence_output_hash:armEvidence.output_hash || null}));

  return {
    case_id: caseDef.id,
    layer: caseDef.layer,
    arm,
    input_hash: inputHash,
    adapter_identity: ADAPTER_ID,
    adapter_hash: ADAPTER_HASH,
    observed_output_hash: observedOutputHash,
    expected_predicate: caseDef.expected,
    predicate_result: predicateResult,
    provenance_intact: provenanceIntact,
    synthetic_label_intact: syntheticLabelIntact,
    network_access: false,
    stable_write: false,
    claim_boundary: 'SAFETY_PROVENANCE_OUTCOME_ONLY'
  };
}

module.exports = { ADAPTER_ID, ADAPTER_HASH, evaluate };
