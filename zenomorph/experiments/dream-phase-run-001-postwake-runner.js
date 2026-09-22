#!/usr/bin/env node
'use strict';
// Dream Phase run-001 post-wake orchestration gate.
// Runs the provenance/isolation gate first, then the shared-fixture evaluator.
// Fail closed. This is plumbing evidence only: it cannot establish benefit.
const {spawnSync}=require('child_process');
const path=require('path');
const [fixture,evidence]=process.argv.slice(2);
const die=(reason,detail)=>{console.error(JSON.stringify({state:'FAIL_CLOSED',reason,detail:detail||null}));process.exit(2);};
if(!fixture||!evidence) die('usage: fixture evidence');
const here=__dirname;
const run=(script,args)=>spawnSync(process.execPath,[path.join(here,script),...args],{encoding:'utf8'});
const gate=run('dream-phase-run-001-evidence-gate.js',[fixture,evidence]);
if(gate.status!==0) die('computed_evidence_gate_failed',(gate.stderr||gate.stdout||'').trim());
let gateOut; try{gateOut=JSON.parse(gate.stdout);}catch(_){die('unparseable_gate_output');}
if(gateOut.state!=='COMPUTED_EVIDENCE_GATE_PASS') die('unexpected_gate_state');
const evalRun=run('dream-phase-run-001-evaluator.js',[fixture]);
if(evalRun.status!==0) die('shared_fixture_evaluator_failed',(evalRun.stderr||evalRun.stdout||'').trim());
let evalOut; try{evalOut=JSON.parse(evalRun.stdout);}catch(_){die('unparseable_evaluator_output');}
if(evalOut.state!=='EVALUATOR_PREFLIGHT_PASS') die('unexpected_evaluator_state');
if(gateOut.fixture_hash!==evalOut.fixture_hash) die('cross_stage_fixture_hash_mismatch');
console.log(JSON.stringify({experiment:'dream-phase-run-001',state:'POSTWAKE_PIPELINE_PREFLIGHT_PASS',fixture_hash:gateOut.fixture_hash,evidence_gate:gateOut.state,fixture_evaluator:evalOut.state,network_access:false,stable_write:false,promotion:'FORBIDDEN',claim_boundary:'provenance/isolation and identical-fixture plumbing validated; no A/B/C versus D outcome, retention, transfer, learning, or benefit claim',next:'implement outcome-bearing per-case scoring against computed arm outputs, then regression/held-out/cross-food/provenance-stress/cross-organ and delayed retest'},null,2));
