#!/usr/bin/env node
'use strict';

// Deterministic, fail-closed evaluator scaffold for Dream Phase run-001.
// No network access, no Stable writes, no mutation of source artifacts.
const fs = require('fs');
const crypto = require('crypto');

const sha256 = x => crypto.createHash('sha256').update(x).digest('hex');
const die = (reason) => { console.error(JSON.stringify({state:'FAIL_CLOSED', reason})); process.exit(2); };

const fixturePath = process.argv[2];
if (!fixturePath) die('missing_shared_fixture');
let fixture;
try { fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')); } catch (_) { die('unreadable_fixture'); }

const arms = ['A_replay','B_perturbed_replay','C_counterfactual_recombination','D_no_dream_control'];
const layers = ['regression','held_out','cross_food','provenance_stress','cross_organ','delayed_retest'];
if (fixture.schema !== 'zenomorph.dream.shared-fixture.v1') die('wrong_fixture_schema');
if (!Array.isArray(fixture.cases) || fixture.cases.length === 0) die('empty_fixture');

const canonicalCases = JSON.stringify(fixture.cases);
const fixtureHash = sha256(canonicalCases);
const results = {};
for (const arm of arms) {
  results[arm] = {fixture_hash: fixtureHash, layers:{}};
  for (const layer of layers) {
    const cases = fixture.cases.filter(c => c.layer === layer);
    results[arm].layers[layer] = {case_count: cases.length, status: cases.length ? 'READY' : 'MISSING'};
    if (!cases.length) die(`missing_layer:${layer}`);
  }
}

const hashes = new Set(Object.values(results).map(r => r.fixture_hash));
if (hashes.size !== 1) die('arm_uses_different_fixture');

console.log(JSON.stringify({
  experiment:'dream-phase-run-001',
  state:'EVALUATOR_PREFLIGHT_PASS',
  executable_claim_only:'shared deterministic fixture validated; no learning gain claimed',
  network_access:false,
  stable_write:false,
  fixture_hash:fixtureHash,
  arms:results
}, null, 2));
