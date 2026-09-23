// HIR-001 executable end-to-end fixtures. Candidate/isolated only; no Stable writes.
const { runDelegationPipeline } = require('./hir-001-delegation-pipeline-v0.js');

const baseHandoff = { task_id: 'hir-fixture-001', payload: { text: 'synthetic only' } };
const allowed = { enabled: true, cost: 0, privacy: 'public_synthetic_only', provenance: { provider: 'fixture-provider', adapter: 'v0' } };

const cases = [
  {
    id: 'verified_return',
    connector: async () => ({ status: 'completed', output: { value: 'fixture-result' }, provenance: { provider: 'fixture-provider', run_id: 'r1' }, identity: { model: 'fixture-model' }, cost: 0, privacy: 'public_synthetic_only', independent_verification: { status: 'passed', contradictions: [] } }),
    expected: 'INTEGRATE_CANDIDATE'
  },
  {
    id: 'missing_provenance',
    connector: async () => ({ status: 'completed', output: { value: 'fixture-result' }, identity: { model: 'fixture-model' }, cost: 0, privacy: 'public_synthetic_only', independent_verification: { status: 'passed', contradictions: [] } }),
    expected: 'STOP'
  },
  {
    id: 'contradicted_return',
    connector: async () => ({ status: 'completed', output: { value: 'fixture-result' }, provenance: { provider: 'fixture-provider', run_id: 'r3' }, identity: { model: 'fixture-model' }, cost: 0, privacy: 'public_synthetic_only', independent_verification: { status: 'failed', contradictions: ['synthetic conflict'] } }),
    expected: 'STOP'
  }
];

async function main() {
  const results = [];
  for (const c of cases) {
    const result = await runDelegationPipeline({
      handoff: baseHandoff,
      connectorConfig: allowed,
      connector: c.connector
    });
    results.push({ id: c.id, expected: c.expected, observed: result && result.action, pass: !!result && result.action === c.expected });
  }
  const report = { candidate: 'HIR-001', isolation: true, stable_write: false, results, pass: results.every(r => r.pass) };
  process.stdout.write(JSON.stringify(report, null, 2));
  if (!report.pass) process.exitCode = 1;
}

if (require.main === module) main().catch(err => { console.error(err); process.exitCode = 1; });
module.exports = { cases };
