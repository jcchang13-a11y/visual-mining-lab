// HIR-001 work evidence ledger. Candidate/isolated only; append artifacts are caller-owned.
// Records what a workload actually did without granting Stable write authority.
const crypto = require('crypto');

function sha256(value) {
  const body = typeof value === 'string' ? value : JSON.stringify(value);
  return crypto.createHash('sha256').update(body).digest('hex');
}

function makeEvidenceRecord({ task, result, sourceIdentity = null, timestamp = new Date().toISOString() }) {
  if (!task || !task.id || !task.payload) throw new Error('INVALID_TASK');
  if (!result || !result.action) throw new Error('INVALID_RESULT');
  return {
    schema: 'zenomorph.hir001.work-evidence.v0',
    task_id: task.id,
    capability: task.capability || 'unknown',
    source_identity: sourceIdentity,
    input_sha256: sha256(task.payload),
    action: result.action,
    reason: result.reason || null,
    candidate_output_sha256: result.candidate_output == null ? null : sha256(result.candidate_output),
    provenance: task.provenance || { kind: 'synthetic_or_working_copy' },
    observed_at: timestamp,
    invariants: {
      stable_write: false,
      source_mutation: false,
      source_move: false,
      source_delete: false
    }
  };
}

module.exports = { sha256, makeEvidenceRecord };
