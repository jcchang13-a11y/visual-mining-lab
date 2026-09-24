#!/usr/bin/env node
'use strict';

/*
 * Gangchibao visual digestion executor v0.1
 * Purpose: turn a read-only intake artifact plus externally supplied semantic round
 * outputs into a verifiable ten-round experiment ledger.
 * IMPORTANT: this runner does not pretend deterministic string transforms are
 * autonomous aesthetic judgment. A semantic generator must supply each round.
 */
const fs=require('fs');
const crypto=require('crypto');
const sha256=x=>crypto.createHash('sha256').update(String(x)).digest('hex');
const fail=reason=>{process.stderr.write(JSON.stringify({state:'FAIL_CLOSED',reason})+'\n');process.exit(2);};

const [intakePath,roundsPath]=process.argv.slice(2);
if(!intakePath||!roundsPath) fail('usage: executor <intake.json> <semantic-rounds.json>');

let intake,rounds;
try{intake=JSON.parse(fs.readFileSync(intakePath,'utf8'));rounds=JSON.parse(fs.readFileSync(roundsPath,'utf8'));}catch(e){fail('unreadable_input');}

if(intake?.schema!=='zenomorph.ingestion.gangchibao.v1') fail('wrong_intake_schema');
if(intake?.source?.source_mutation!==false) fail('source_not_immutable');
if(intake?.ingestion?.stable_write!==false) fail('stable_write_not_forbidden');
if(rounds?.schema!=='zenomorph.gangchibao.visual-semantic-rounds.v1') fail('wrong_round_schema');
if(!Array.isArray(rounds.rounds)||rounds.rounds.length!==10) fail('requires_exactly_10_rounds');

const banned=new Set();
const out=[];
for(let i=0;i<10;i++){
 const r=rounds.rounds[i];
 if(r.round!==i+1) fail('round_order_error');
 if(!Array.isArray(r.candidates)||r.candidates.length<1) fail('empty_round');
 const accepted=[];
 for(const c of r.candidates){
   const feeling=String(c.feeling||'').trim();
   const image=String(c.image||'').trim();
   const placement=String(c.placement||'').trim();
   const type=String(c.type||'').trim();
   if(!feeling||!image||!placement||!['cover','insert'].includes(type)) fail('candidate_incomplete');
   const sig=sha256([feeling,image,placement,type].join('|'));
   if(banned.has(sig)) continue;
   banned.add(sig);
   accepted.push({...c,signature:sig,status:'DREAM/SYNTHETIC'});
 }
 if(!accepted.length) fail('round_has_no_novel_candidate');
 out.push({round:i+1,candidates:accepted});
}
const result={
 schema:'zenomorph.gangchibao.visual-digestion-ledger.v1',
 experiment:'gangchibao-visual-digestion-10r',
 state:'SEMANTIC_ROUNDS_VERIFIED_NOT_PROMOTED',
 source:{document_id:intake.source.document_id,revision_id:intake.source.revision_id,observation_fingerprint_fnv1a32:intake.source.observation_fingerprint_fnv1a32},
 round_count:10,
 rounds:out,
 network_access:false,
 stable_write:false,
 promotion:'FORBIDDEN',
 claim_boundary:'Verifies cardinality, completeness, source binding and exact duplicate exclusion for ten externally generated semantic digestion rounds. It does not itself generate aesthetic ideas or prove aesthetic quality.'
};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
