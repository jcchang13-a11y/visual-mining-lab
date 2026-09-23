// HIR-001 capability-first workload runner. Candidate/isolated only; no Stable writes.
// Purpose: exercise the existing delegation pipeline as a work capability, not merely a fixture suite.
const { runDelegationPipeline } = require('./hir-001-delegation-pipeline-v0.js');

async function runCapabilityWorkload({ task, connectorConfig, connector }) {
  if (!task || !task.id || !task.payload) {
    return { action: 'STOP', reason: 'INVALID_TASK', stable_write: false };
  }
  const handoff = {
    task_id: task.id,
    capability: task.capability || 'unknown',
    payload: task.payload,
    provenance: task.provenance || { kind: 'synthetic_or_working_copy' }
  };
  const result = await runDelegationPipeline({ handoff, connectorConfig, connector });
  return {
    task_id: task.id,
    capability: handoff.capability,
    action: result && result.action ? result.action : 'STOP',
    reason: result && result.reason ? result.reason : null,
    candidate_output: result && result.output ? result.output : null,
    stable_write: false
  };
}

module.exports = { runCapabilityWorkload };
