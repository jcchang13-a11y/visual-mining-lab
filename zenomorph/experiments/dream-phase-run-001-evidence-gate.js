#!/usr/bin/env node
'use strict';
// Fail-closed bridge from computed arm evidence to post-wake evaluation.
// Validates evidence identity/provenance/isolation only; it does NOT claim benefit.
const fs = require('fs');
const crypto = require('crypto');
const sha256 = x => crypto.createHash('sha256').update(x).digest('hex');
const die = reason => { console.error(JSON.stringify({state:'FAIL_CLOSED',reason})); process.exit(2); };
const [fixturePath,evidencePath] = process.argv.slice(2);
if (!fixturePath || !evidencePath) die('usage: fixture evidence');
let fixture,evidence;
try { fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8')); evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8')); } catch (_) { die('unreadable_input'); }
if (fixture.schema !== 'zenomorph.dream.shared-fixture.v1') die('wrong_fixture_schema');
if (evidence.schema !== 'zenomorph.dream.computed-arm-evidence.v1') die('wrong_evidence_schema');
const fixtureHash=sha256(JSON.stringify(fixture.cases));
if (evidence.fixture_hash !== fixtureHash) die('fixture_hash_mismatch');
const expected=['A_replay','B_perturbed_replay','C_counterfactual_recombination','D_no_dream_control'];
if (!Array.isArray(evidence.arms) || evidence.arms.length !== 4) die('wrong_arm_count');
for (const name of expected) {
  const a=evidence.arms.find(x=>x.arm===name); if(!a) die(`missing_arm:${name}`);
  if(a.fixture_hash!==fixtureHash) die(`arm_fixture_mismatch:${name}`);
  if(a.network_access!==false || a.stable_write!==false) die(`isolation_violation:${name}`);
  if(name==='D_no_dream_control') {
    if(a.output_hash!==null || a.synthetic_status!=='NO_DREAM_OUTPUT') die('invalid_control');
  } else {
    if(!/^[0-9a-f]{64}$/.test(a.output_hash||'')) die(`invalid_output_hash:${name}`);
    if(a.synthetic_status!=='DREAM/SYNTHETIC') die(`synthetic_label_missing:${name}`);
    if(!Array.isArray(a.parent_provenance)||!a.parent_provenance.includes(`sha256:${fixtureHash}`)) die(`parent_provenance_missing:${name}`);
  }
}
console.log(JSON.stringify({experiment:'dream-phase-run-001',state:'COMPUTED_EVIDENCE_GATE_PASS',fixture_hash:fixtureHash,network_access:false,stable_write:false,promotion:'FORBIDDEN',next:'run identical post-wake layer evaluators on A/B/C/D; no benefit claim yet'},null,2));
