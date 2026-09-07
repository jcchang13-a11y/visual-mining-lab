import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const code=await fs.readFile(path.join(root,'nostromo/gut/gut-engine.js'),'utf8');
vm.runInThisContext(code,{filename:'nostromo/gut/gut-engine.js'});

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const wmKey={id:'weak-map-key'};
const weakMap=new WeakMap([[wmKey,{claim:'hidden weak-map claim must not be fabricated as visible material'}]]);
const weakMapGut=globalThis.GutEngine.digest({weakMap,siblingClaim:'Claim: visible sibling material must survive.'},{source:'NOSTROMO/gut-opaque-weakmap-test'});
check(weakMapGut.version==='0.2.36','GUT_VERSION',weakMapGut.version);
check(weakMapGut.typeCounts?.OPAQUE_CONTAINER===1,'WEAKMAP_NOT_QUARANTINED',weakMapGut.typeCounts);
check(weakMapGut.quarantine?.some(x=>x.type==='OPAQUE_CONTAINER'&&x.path==='root.weakMap'&&x.containerType==='WeakMap'),'WEAKMAP_PATH_OR_TYPE_LOST',weakMapGut.quarantine);
check(weakMapGut.routes?.DROPLET?.items?.some(x=>x.path==='root.siblingClaim'),'WEAKMAP_SIBLING_CLAIM_LOST',weakMapGut.routes?.DROPLET);
check(![...(weakMapGut.nutrients||[]),...(weakMapGut.hold||[]),...(weakMapGut.quarantine||[])].some(x=>String(x.text||'').includes('hidden weak-map claim')),'WEAKMAP_HIDDEN_ENTRY_FABRICATED',weakMapGut);

const wsMember={question:'hidden weak-set question must remain inaccessible'};
const weakSet=new WeakSet([wsMember]);
const weakSetGut=globalThis.GutEngine.digest({weakSet,evidence:'Evidence: visible sibling evidence remains routable.'},{source:'NOSTROMO/gut-opaque-weakset-test'});
check(weakSetGut.typeCounts?.OPAQUE_CONTAINER===1,'WEAKSET_NOT_QUARANTINED',weakSetGut.typeCounts);
check(weakSetGut.quarantine?.some(x=>x.type==='OPAQUE_CONTAINER'&&x.path==='root.weakSet'&&x.containerType==='WeakSet'),'WEAKSET_PATH_OR_TYPE_LOST',weakSetGut.quarantine);
check(weakSetGut.routes?.MUTHER?.items?.some(x=>x.path==='root.evidence'),'WEAKSET_SIBLING_EVIDENCE_LOST',weakSetGut.routes?.MUTHER);
check(![...(weakSetGut.nutrients||[]),...(weakSetGut.hold||[]),...(weakSetGut.quarantine||[])].some(x=>String(x.text||'').includes('hidden weak-set question')),'WEAKSET_HIDDEN_ENTRY_FABRICATED',weakSetGut);

const ordinaryMap=new Map([['claim','Claim: ordinary Map remains inspectable.']]);
const ordinarySet=new Set(['Evidence: ordinary Set remains inspectable.']);
const ordinaryGut=globalThis.GutEngine.digest({ordinaryMap,ordinarySet},{source:'NOSTROMO/gut-opaque-container-regression'});
check(ordinaryGut.typeCounts?.OPAQUE_CONTAINER===undefined,'MAP_OR_SET_FALSELY_OPAQUE',ordinaryGut.typeCounts);
check(ordinaryGut.routes?.DROPLET?.items?.some(x=>x.path==='root.ordinaryMap{0}.value'),'ORDINARY_MAP_REGRESSION',ordinaryGut.routes?.DROPLET);
check(ordinaryGut.routes?.MUTHER?.items?.some(x=>x.path==='root.ordinarySet<0>'),'ORDINARY_SET_REGRESSION',ordinaryGut.routes?.MUTHER);

const result={
  schema:'nostromo-gut-opaque-container-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'OPAQUE_WEAK_CONTAINER_QUARANTINE_WITH_PATH_PROVENANCE',
  engineVersion:globalThis.GutEngine.digest({probe:'opaque-container-version-probe'},{source:'probe'}).version,
  cases:{
    weakMap:{opaque:weakMapGut.typeCounts?.OPAQUE_CONTAINER||0,quarantined:weakMapGut.quarantined},
    weakSet:{opaque:weakSetGut.typeCounts?.OPAQUE_CONTAINER||0,quarantined:weakSetGut.quarantined},
    ordinaryMapSet:{opaque:ordinaryGut.typeCounts?.OPAQUE_CONTAINER||0}
  },
  failures,
  boundary:'This test verifies that non-enumerable WeakMap/WeakSet containers cannot silently disappear from GUT intake: they are preserved as explicit path-scoped quarantine atoms while inaccessible entries remain uninspected. It does not reveal weak-container contents or infer failure, source identity, evidence quality, semantic meaning or truth.'
};
await fs.writeFile('nostromo/integration/gut-opaque-container-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
