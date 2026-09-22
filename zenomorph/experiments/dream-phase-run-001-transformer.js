#!/usr/bin/env node
'use strict';

// Isolated deterministic transformation runner for Dream Phase run-001.
// Reads only the shared fixture; no network; no Stable writes; source immutable.
const fs = require('fs');
const crypto = require('crypto');
const sha256 = x => crypto.createHash('sha256').update(x).digest('hex');
const die = reason => { console.error(JSON.stringify({state:'FAIL_CLOSED',reason})); process.exit(2); };
const fixturePath = process.argv[2];
if (!fixturePath) die('missing_shared_fixture');
let fixture;
try { fixture = JSON.parse(fs.readFileSync(fixturePath,'utf8')); } catch (_) { die('unreadable_fixture'); }
if (fixture.schema !== 'zenomorph.dream.shared-fixture.v1' || !Array.isArray(fixture.cases)) die('wrong_fixture');
const canonical = JSON.stringify(fixture.cases);
const fixtureHash = sha256(canonical);
const reverse = s => [...s].reverse().join('');
const rotate = a => a.length < 2 ? a : a.slice(1).concat(a[0]);
const mk = (arm, identity, payload) => ({arm,fixture_hash:fixtureHash,transformation_identity:identity,output_hash:sha256(JSON.stringify(payload)),synthetic_status:'DREAM/SYNTHETIC',parent_provenance:[`sha256:${fixtureHash}`],network_access:false,stable_write:false});
const A = mk('A_replay','deterministic-replay-v1',fixture.cases);
const B = mk('B_perturbed_replay','deterministic-perturbation-v1',fixture.cases.map((c,i)=>({...c,dream_perturbation:reverse(`${i}:${c.layer||''}`)})));
const C = mk('C_counterfactual_recombination','deterministic-counterfactual-recombination-v1',rotate(fixture.cases).map((c,i)=>({left:fixture.cases[i],right:c})));
const D = {arm:'D_no_dream_control',fixture_hash:fixtureHash,transformation_identity:'no-dream-control-v1',output_hash:null,synthetic_status:'NO_DREAM_OUTPUT',parent_provenance:[],network_access:false,stable_write:false};
console.log(JSON.stringify({schema:'zenomorph.dream.computed-arm-evidence.v1',experiment:'dream-phase-run-001',state:'COMPUTED_NOT_EVALUATED',fixture_hash:fixtureHash,arms:[A,B,C,D],promotion:'FORBIDDEN',claim:'deterministic transformations computed; no learning, retention, transfer, or promotion claim'},null,2));
