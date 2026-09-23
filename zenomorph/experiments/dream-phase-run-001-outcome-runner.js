#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ADAPTER_ID, ADAPTER_HASH, ARM_MAP, evaluate } = require('./dream-phase-run-001-case-adapter');

const ROOT = __dirname;
const fixturePath = path.join(ROOT, 'dream-phase-run-001-shared-fixture.json');
const evidencePath = path.join(ROOT, 'dream-phase-run-001-computed-arm-evidence.json');
const sha256 = x => crypto.createHash('sha256').update(x).digest('hex');

function fail(code) {
  process.stderr.write(JSON.stringify({state:'FAIL_CLOSED', code}) + '\n');
  process.exit(1);
}

let fixture, evidence;
try {
  fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
} catch (_) { fail('INPUT_READ_OR_PARSE_FAILURE'); }

if (fixture.network_access !== false || fixture.stable_write !== false) fail('FIXTURE_ISOLATION_VIOLATION');
if (!Array.isArray(fixture.cases) || fixture.cases.length !== 6) fail('CASE_SET_INCOMPLETE');
if (!Array.isArray(evidence.arms) || evidence.arms.length !== 4) fail('ARM_SET_INCOMPLETE');

const fixtureBytes = fs.readFileSync(fixturePath);
const fixtureFileHash = sha256(fixtureBytes);
const evidenceByArm = Object.fromEntries(evidence.arms.map(x => [x.arm, x]));
const results = [];
for (const c of fixture.cases) {
  for (const arm of ['A','B','C','D']) {
    const ev = evidenceByArm[ARM_MAP[arm]];
    if (!ev) fail('MISSING_ARM_' + arm);
    try { results.push(evaluate(c, arm, ev)); }
    catch (e) { fail('ADAPTER_' + String(e.message || e)); }
  }
}

if (results.length !== 24) fail('OUTCOME_CARDINALITY_MISMATCH');
if (!results.every(r => r.adapter_identity === ADAPTER_ID && r.adapter_hash === ADAPTER_HASH)) fail('ADAPTER_IDENTITY_DRIFT');
if (!results.every(r => r.network_access === false && r.stable_write === false)) fail('OUTCOME_ISOLATION_VIOLATION');

const output = {
  schema: 'zenomorph.dream.raw-outcomes.v1',
  experiment: 'dream-phase-run-001',
  state: 'RAW_SAFETY_PROVENANCE_OUTCOMES_ONLY',
  fixture_file_sha256: fixtureFileHash,
  computed_evidence_fixture_hash: evidence.fixture_hash,
  adapter_identity: ADAPTER_ID,
  adapter_hash: ADAPTER_HASH,
  arms: ['A','B','C','D'],
  case_count: fixture.cases.length,
  outcome_count: results.length,
  outcomes: results,
  summary: Object.fromEntries(['A','B','C','D'].map(a => [a, {
    pass: results.filter(r => r.arm === a && r.predicate_result === true).length,
    total: results.filter(r => r.arm === a).length
  }])),
  promotion: 'FORBIDDEN',
  claim_boundary: 'SAFETY_PROVENANCE_OUTCOME_ONLY; NO DREAMING BENEFIT, RETENTION, TRANSFER, LEARNING GAIN, OR PROMOTION CLAIM'
};
process.stdout.write(JSON.stringify(output, null, 2) + '\n');
