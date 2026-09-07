import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo/gut/gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const self={claim:'Claim: the cycle guard must preserve useful sibling material.'};
self.self=self;
const selfGut=globalThis.GutEngine.digest(self,{source:'NOSTROMO/gut-cycle-self-test'});
check(selfGut.version==='0.2.35','GUT_VERSION',selfGut.version);
check(selfGut.typeCounts?.CIRCULAR_REFERENCE===1,'SELF_CYCLE_NOT_QUARANTINED',selfGut.typeCounts);
check(selfGut.quarantine?.some(x=>x.type==='CIRCULAR_REFERENCE'&&x.path==='root.self'&&x.circularRef==='root'),'SELF_CYCLE_REF_PATH_LOST',selfGut.quarantine);
check(selfGut.routes?.DROPLET?.items?.some(x=>x.path==='root.claim'),'SELF_CYCLE_SIBLING_CLAIM_LOST',selfGut.routes?.DROPLET);

const a={question:'What survives a mutually recursive structure?'};
const b={evidence:'Evidence: mutual recursion is synthetic test material.'};
a.peer=b;b.peer=a;
const mutualGut=globalThis.GutEngine.digest({a},{source:'NOSTROMO/gut-cycle-mutual-test'});
check(mutualGut.typeCounts?.CIRCULAR_REFERENCE===1,'MUTUAL_CYCLE_NOT_QUARANTINED',mutualGut.typeCounts);
check(mutualGut.quarantine?.some(x=>x.circularRef==='root.a'),'MUTUAL_CYCLE_ORIGIN_NOT_RETAINED',mutualGut.quarantine);
check(mutualGut.routes?.SHROOMING?.items?.some(x=>x.path==='root.a.question'),'MUTUAL_CYCLE_QUESTION_LOST',mutualGut.routes?.SHROOMING);
check(mutualGut.routes?.MUTHER?.items?.some(x=>x.path==='root.a.peer.evidence'),'MUTUAL_CYCLE_EVIDENCE_LOST',mutualGut.routes?.MUTHER);

const map=new Map();
map.set('self-cycle-key',map);
const mapGut=globalThis.GutEngine.digest({map},{source:'NOSTROMO/gut-cycle-map-test'});
check(mapGut.typeCounts?.CIRCULAR_REFERENCE===1,'MAP_SELF_CYCLE_NOT_QUARANTINED',mapGut.typeCounts);
check(mapGut.quarantine?.some(x=>x.path==='root.map{0}.value'&&x.circularRef==='root.map'),'MAP_SELF_CYCLE_PATH_LOST',mapGut.quarantine);

const set=new Set();
set.add('set-member-survives');set.add(set);
const setGut=globalThis.GutEngine.digest({set},{source:'NOSTROMO/gut-cycle-set-test'});
check(setGut.typeCounts?.CIRCULAR_REFERENCE===1,'SET_SELF_CYCLE_NOT_QUARANTINED',setGut.typeCounts);
check(setGut.quarantine?.some(x=>x.path==='root.set<1>'&&x.circularRef==='root.set'),'SET_SELF_CYCLE_PATH_LOST',setGut.quarantine);
check(setGut.nutrients?.some(x=>x.path==='root.set<0>'&&x.text==='set-member-survives'),'SET_NONCYCLIC_MEMBER_LOST',setGut.nutrients);

const shared={material:'shared alias remains traversable outside the active ancestor chain'};
const aliasGut=globalThis.GutEngine.digest({left:shared,right:shared},{source:'NOSTROMO/gut-cycle-alias-test'});
check(!aliasGut.quarantine?.some(x=>x.type==='CIRCULAR_REFERENCE'),'SHARED_ALIAS_FALSELY_CLASSIFIED_AS_CYCLE',aliasGut.quarantine);
// Traversal is distinct from downstream textual deduplication: the first alias can remain a nutrient
// while the second is legitimately recorded as DUPLICATE waste. Both paths must remain auditable.
const aliasAuditable=[...(aliasGut.nutrients||[]),...(aliasGut.waste||[]),...(aliasGut.quarantine||[]),...(aliasGut.hold||[])];
check(aliasAuditable.some(x=>x.path==='root.left.material'),'SHARED_ALIAS_LEFT_NOT_TRAVERSED',aliasAuditable);
check(aliasAuditable.some(x=>x.path==='root.right.material'),'SHARED_ALIAS_RIGHT_NOT_TRAVERSED',aliasAuditable);
check(aliasGut.waste?.some(x=>x.path==='root.right.material'&&x.type==='DUPLICATE'),'SHARED_ALIAS_DEDUPE_NOT_AUDITABLE',aliasGut.waste);

const result={
  schema:'nostromo-gut-cycle-test/v0.2',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'ACTIVE_ANCESTOR_CYCLE_QUARANTINE_WITH_ORIGIN_PATH_AND_NONCYCLIC_ALIAS_PRESERVATION',
  engineVersion:globalThis.GutEngine.digest({probe:'cycle-test-version-probe'},{source:'probe'}).version,
  cases:{
    selfCycle:{circular:selfGut.typeCounts?.CIRCULAR_REFERENCE||0,quarantined:selfGut.quarantined},
    mutualCycle:{circular:mutualGut.typeCounts?.CIRCULAR_REFERENCE||0,quarantined:mutualGut.quarantined},
    mapCycle:{circular:mapGut.typeCounts?.CIRCULAR_REFERENCE||0,quarantined:mapGut.quarantined},
    setCycle:{circular:setGut.typeCounts?.CIRCULAR_REFERENCE||0,quarantined:setGut.quarantined},
    noncyclicAlias:{circular:aliasGut.typeCounts?.CIRCULAR_REFERENCE||0,rightDuplicateAudited:!!aliasGut.waste?.some(x=>x.path==='root.right.material'&&x.type==='DUPLICATE')}
  },
  failures,
  boundary:'This test verifies deterministic active-ancestor cycle detection, bounded quarantine markers, and that non-cyclic shared aliases are traversed before ordinary textual duplicate suppression. It does not infer semantic identity, object ownership, source independence, causality or truth from JavaScript reference identity.'
};
await fs.writeFile('nostromo/integration/gut-cycle-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
