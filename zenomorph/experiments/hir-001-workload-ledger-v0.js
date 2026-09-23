// HIR-001 workload evidence ledger. Candidate/isolated only; never writes Stable.
// Adds durable evidence records around real/synthetic capability workloads without mutating source artifacts.
const crypto = require('crypto');
const { runCapabilityWorkload } = require('./hir-001-capability-workload-v0.js');

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function runAndRecord({ task, connectorConfig, connector, clock = () => new Date().toISOString() }) {
  const inputEvidence = {
    task_id: task && task.id ? task.id : null,
    capability: task && task.capability ? task.capability : 'unknown',
    provenance: task && task.provenance ? task.provenance : { kind: 'synthetic_or_working_copy' },
    input_sha256: digest(task && task.payload ? task.payload : null)
  };
  const result = await runCapabilityWorkload({ task, connectorConfig, connector });
  return {
    schema: 'HIR-001_WORKLOAD_EVIDENCE_V0',
    observed_at: clock(),
    input: inputEvidence,
    outcome: {
      action: result.action,
      reason: result.reason || null,
      candidate_output_sha256: digest(result.candidate_output || null),
      stable_write: false
    },
    invariants: {
      source_mutated: false,
      stable_write: false,
      displayed_state_must_follow_evidence: true
    }
  };
}

module.exports = { runAndRecord, digest };
