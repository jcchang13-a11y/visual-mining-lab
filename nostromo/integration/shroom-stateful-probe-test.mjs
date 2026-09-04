import {shroomStatefulProbe} from './shroom-stateful-probe.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const ROOT=process.cwd();
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'shroom-stateful-'));
const a=path.join(tmp,'a.json'),b=path.join(tmp,'b.json');
const base={events:[
 {round:'R1',event:'e1',participants:['01','02','03','04','05'],silent:['06','07','08','09','10']},
 {round:'R2',event:'e2',participants:['01','02','06','07','08'],silent:['03','04','05','09','10']},
 {round:'R3',event:'e3',participants:['01','03','04','06','09'],silent:['02','05','07','08','10']}
]};
await fs.writeFile(a,JSON.stringify(base));
const changed=structuredClone(base);changed.events[2]={round:'R3',event:'e3',participants:['02','05','07','08','10'],silent:['01','03','04','06','09']};
await fs.writeFile(b,JSON.stringify(changed));
const q='哪個位置最需要被重新檢查？';
const x=await shroomStatefulProbe({question:q,statePath:a});
const x2=await shroomStatefulProbe({question:q,statePath:a});
const y=await shroomStatefulProbe({question:q,statePath:b});
assert(x.reactions.length===10,'must preserve ten trace slots');
assert(x.behaviorFingerprint===x2.behaviorFingerprint,'same history must be deterministic');
assert(x.behaviorFingerprint!==y.behaviorFingerprint,'changed recorded history must change behavior');
assert(x.reactions.some(r=>r.disposition==='INSTABILITY_AUDIT'),'must detect unstable participation histories');
assert(x.reactions.every(r=>r.historyFingerprint&&r.preferredOrgan),'every reaction must preserve history provenance and routing intent');
assert(!x.boundary.includes('persistent LLMs')||x.boundary.includes('does not'),'boundary must not claim independent persistent agents');
const result={schema:'nostromo-shroom-stateful-probe-test/v0.1',completedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',sameHistoryDeterministic:x.behaviorFingerprint===x2.behaviorFingerprint,changedHistoryChangesBehavior:x.behaviorFingerprint!==y.behaviorFingerprint,dispositions:[...new Set(x.reactions.map(r=>r.disposition))],routingIntents:[...new Set(x.reactions.map(r=>r.preferredOrgan))],historyFingerprintCount:new Set(x.reactions.map(r=>r.historyFingerprint)).size,boundary:x.boundary,failures};
await fs.writeFile(path.join(ROOT,'nostromo/integration/shroom-stateful-probe-last-result.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
