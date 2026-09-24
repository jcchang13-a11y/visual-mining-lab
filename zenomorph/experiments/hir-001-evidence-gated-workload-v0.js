// HIR-001 evidence-gated workload wrapper. Candidate/isolated only.
// Couples an actual workload result to its evidence record; never grants Stable write authority.
const { runWorkload } = require('./hir-001-capability-workload-v0');
const { makeEvidenceRecord } = require('./hir-001-work-evidence-ledger-v0');

async function runWithEvidence({ task, connectorRegistry = {}, sourceIdentity = null, timestamp }) {
  if (!task || !task.id || !task.payload) throw new Error('INVALID_TASK');
  const result = await runWorkload({ task, connectorRegistry });
  const evidence = makeEvidenceRecord({ task, result, sourceIdentity, timestamp });

  return {
    schema: 'zenomorph.hir001.evidence-gated-workload.v0',
    result,
    evidence,
    display_state: result.action,
    invariants: {
      displayed_state_follows_evidence: evidence.action === result.action,
      stable_write: false,
      source_mutation: false,
      source_move: false,
      source_delete: false
    }
  };
}

module.exports = { runWithEvidence };
