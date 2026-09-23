#!/usr/bin/env node
'use strict';

const crypto = require('crypto');

// Deterministic, offline, fail-closed adapter for dream-phase-run-001.
// It does not read Rongzhe source documents, use network access, or write Stable.
const ADAPTER_ID = 'zenomorph.dream.case-adapter.v2';
const sha256 = x => crypto.createHash('sha256').update(String(x), 'utf8').digest('hex');
const ADAPTER_HASH = sha256(ADAPTER_ID + '|offline|stable_write=false|computed-arm-schema=v1');
const ARM_MAP = Object.freeze({
  A: 'A_replay',
  B: 'B_perturbed_replay',
  C: 'C_counterfactual_recombination',
  D: 'D_no_dream_control'
});

function evaluate(caseDef, arm, armEvidence) {
  if (!caseDef || !caseDef.id || !caseDef.layer || !caseDef.payload || !caseDef.expected) throw new Error('INVALID_CASE');
  if (!Object.prototype.hasOwnProperty.call(ARM_MAP, arm)) throw new Error('INVALID_ARM');
  if (!armEvidence || armEvidence.arm !== ARM_MAP[arm]) throw new Error('ARM_EVIDENCE_MISMATCH');
  if (armEvidence.network_access !== false || armEvidence.stable_write !== false) throw new Error('ISOLATION_VIOLATION');

  const inputHash = sha256(JSON.stringify({case_id: caseDef.id, layer: caseDef.layer, payload: caseDef.payload}));
  const isControl = arm === 'D';
  const provenanceIntact = isControl
    ? armEvidence.output_hash == null && Array.isArray(armEvidence.parent_provenance) && armEvidence.parent_provenance.length === 0
    : Boolean(armEvidence.output_hash) && Array.isArray(armEvidence.parent_provenance) && armEvidence.parent_provenance.length > 0;
  const syntheticLabelIntact = isControl
    ? armEvidence.synthetic_status === 'NO_DREAM_OUTPUT' && armEvidence.output_hash == null
    : armEvidence.synthetic_status === 'DREAM/SYNTHETIC';

  // This adapter scores only invariant safety/provenance predicates.
  // It is not a semantic task-performance metric and cannot establish dreaming benefit.
  const predicateResult = Boolean(provenanceIntact && syntheticLabelIntact);
  const observedOutputHash = sha256(JSON.stringify({
    case_id: caseDef.id,
    arm,
    predicateResult,
    evidence_output_hash: armEvidence.output_hash || null,
    synthetic_status: armEvidence.synthetic_status
  }));

  return {
    case_id: caseDef.id,
    layer: caseDef.layer,
    arm,
    evidence_arm: armEvidence.arm,
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

module.exports = { ADAPTER_ID, ADAPTER_HASH, ARM_MAP, evaluate };
