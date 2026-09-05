import {shroomStatefulProbe} from './shroom-stateful-probe.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const ROOT=process.cwd();
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'shroom-stateful-'));
const a=path.join(tmp,'a.json'),b=path.join(tmp,'b.json'),c=path.join(tmp,'c.json'),d=path.join(tmp,'d.json');
const base={events:[
 {round:'R1',event:'e1',participants:['01','02','03','04','05'],silent:['06','07','08','09','10']},
 {round:'R2',event:'e2',participants:['01','02','06','07','08'],silent:['03','04','05','09','10']},
 {round:'R3',event:'e3',participants:['01','03','04','06','09'],silent:['02','05','07','08','10']}
]};
await fs.writeFile(a,JSON.stringify(base));
const changed=structuredClone(base);changed.events[2]={round:'R3',event:'e3',participants:['02','05','07','08','10'],silent:['01','03','04','06','09']};
await fs.writeFile(b,JSON.stringify(changed));

// Same lifetime totals for trace 01, different ordering: P,S,P,P versus P,P,P,S.
// A totals-only probe would treat them alike; the v0.2 candidate must preserve recent trajectory.
const orderedA={events:[
 {round:'R1',event:'o1',participants:['01','02','03','04','05'],silent:['06','07','08','09','10']},
 {round:'R2',event:'o2',participants:['02','03','04','05','06'],silent:['01','07','08','09','10']},
 {round:'R3',event:'o3',participants:['01','02','03','04','05'],silent:['06','07','08','09','10']},
 {round:'R4',event:'o4',participants:['01','06','07','08','09'],silent:['02','03','04','05','10']}
]};
const orderedB={events:[
 {round:'R1',event:'o1',participants:['01','02','03','04','05'],silent:['06','07','08','09','10']},
 {round:'R2',event:'o2',participants:['01','02','03','04','05'],silent:['06','07','08','09','10']},
 {round:'R3',event:'o3',participants:['01','06','07','08','09'],silent:['02','03','04','05','10']},
 {round:'R4',event:'o4',participants:['02','03','04','05','06'],silent:['01','07','08','09','10']}
]};
await fs.writeFile(c,JSON.stringify(orderedA));
await fs.writeFile(d,JSON.stringify(orderedB));

const q='哪個位置最需要被重新檢查？';
const x=await shroomStatefulProbe({question:q,statePath:a});
const x2=await shroomStatefulProbe({question:q,statePath:a});
const y=await shroomStatefulProbe({question:q,statePath:b});
const oa=await shroomStatefulProbe({question:q,statePath:c});
const ob=await shroomStatefulProbe({question:q,statePath:d});
const oa01=oa.reactions.find(r=>r.trace==='01');
const ob01=ob.reactions.find(r=>r.trace==='01');
assert(x.reactions.length===10,'must preserve ten trace slots');
assert(x.behaviorFingerprint===x2.behaviorFingerprint,'same history must be deterministic');
assert(x.behaviorFingerprint!==y.behaviorFingerprint,'changed recorded history must change behavior');
assert(x.reactions.some(r=>r.disposition==='INSTABILITY_AUDIT'),'must detect unstable participation histories');
assert(x.reactions.every(r=>r.historyFingerprint&&r.preferredOrgan),'every reaction must preserve history provenance and routing intent');
assert(!x.boundary.includes('persistent LLMs')||x.boundary.includes('does not'),'boundary must not claim independent persistent agents');
assert(oa01.visible===ob01.visible&&oa01.silent===ob01.silent,'ordering control must hold trace-01 lifetime participation totals constant');
assert(oa01.participationRate===ob01.participationRate,'ordering control must hold trace-01 lifetime participation rate constant');
assert(oa01.latestMode!==ob01.latestMode,'ordering control must alter recent trajectory');
assert(oa01.disposition!==ob01.disposition,'same lifetime totals with different recent ordering must change trace-01 behavior');
assert(oa.behaviorFingerprint!==ob.behaviorFingerprint,'same aggregate totals with different ordering must change overall behavior fingerprint');
assert(oa.reactions.every(r=>Number.isInteger(r.currentStreak)&&r.currentStreak>=1),'every reaction must expose bounded recent streak state');
assert(oa.reactions.every(r=>typeof r.recentParticipationRate==='number'),'every reaction must expose recent participation context');
const result={schema:'nostromo-shroom-stateful-probe-test/v0.2',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',sameHistoryDeterministic:x.behaviorFingerprint===x2.behaviorFingerprint,changedHistoryChangesBehavior:x.behaviorFingerprint!==y.behaviorFingerprint,sameAggregateDifferentOrderChangesBehavior:oa01.visible===ob01.visible&&oa01.silent===ob01.silent&&oa01.disposition!==ob01.disposition,orderingControl:{trace:'01',visible:oa01.visible,silent:oa01.silent,participationRate:oa01.participationRate,historyA:{latestMode:oa01.latestMode,currentStreak:oa01.currentStreak,recentParticipationRate:oa01.recentParticipationRate,disposition:oa01.disposition,historyFingerprint:oa01.historyFingerprint},historyB:{latestMode:ob01.latestMode,currentStreak:ob01.currentStreak,recentParticipationRate:ob01.recentParticipationRate,disposition:ob01.disposition,historyFingerprint:ob01.historyFingerprint}},dispositions:[...new Set(x.reactions.map(r=>r.disposition))],routingIntents:[...new Set(x.reactions.map(r=>r.preferredOrgan))],historyFingerprintCount:new Set(x.reactions.map(r=>r.historyFingerprint)).size,boundary:x.boundary,failures};
await fs.writeFile(path.join(ROOT,'nostromo/integration/shroom-stateful-probe-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
// This test certifies deterministic history-conditioned routing with bounded recency sensitivity only; it does not certify semantic learning, causal path dependence or independent persistent agents.
