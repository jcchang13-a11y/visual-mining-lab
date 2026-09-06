import fs from 'node:fs/promises';
import vm from 'node:vm';

vm.runInThisContext(await fs.readFile('nostromo/gut/gut-engine.js','utf8'),{filename:'nostromo/gut/gut-engine.js'});
const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const repeatedObjectTextA={evidence:'Evidence: repeated Set member text must retain its own member path.'};
const repeatedObjectTextB={evidence:'Evidence: repeated Set member text must retain its own member path.'};
const input={
  evidenceSet:new Set([
    'Evidence: first Set member reaches MUTHER.',
    7,
    repeatedObjectTextA,
    repeatedObjectTextB,
    new Error('synthetic Set-contained failure')
  ]),
  ordinaryDuplicateA:'ordinary textual duplicate remains suppressible',
  ordinaryDuplicateB:'ordinary textual duplicate remains suppressible'
};
const gut=globalThis.GutEngine.digest(input,{source:'NOSTROMO/gut-set-test'});
const setAtoms=gut.nutrients.filter(x=>x.provenance?.containerKind==='set');
const setPaths=setAtoms.map(x=>x.path);
const repeatedSetEvidence=setAtoms.filter(x=>x.text==='Evidence: repeated Set member text must retain its own member path.');
const setQuarantine=gut.quarantine.filter(x=>x.provenance?.containerKind==='set');

check(gut.version==='0.2.34','GUT_SET_VERSION',gut.version);
check(setAtoms.length>=5,'SET_MEMBERS_DISAPPEARED',{setAtoms,quarantine:setQuarantine});
check(setPaths.some(p=>p==='root.evidenceSet<0>'),'SET_FIRST_MEMBER_PATH_LOST',setPaths);
check(setPaths.some(p=>p==='root.evidenceSet<1>'),'SET_NUMERIC_MEMBER_PATH_LOST',setPaths);
check(repeatedSetEvidence.length===2,'SET_DISTINCT_OBJECT_MEMBERS_COLLAPSED',repeatedSetEvidence);
check(repeatedSetEvidence.every(x=>x.provenance?.containerKind==='set'&&x.provenance?.setMember!==undefined),'SET_MEMBER_PROVENANCE_LOST',repeatedSetEvidence);
check(gut.routes?.MUTHER?.items?.some(x=>x.path==='root.evidenceSet<0>'),'SET_EVIDENCE_NOT_ROUTED_TO_MUTHER',gut.routes?.MUTHER);
check(gut.routes?.HOLD?.items?.some(x=>x.path==='root.evidenceSet<1>'&&x.type==='NUMERIC_MATERIAL'),'SET_NUMERIC_MEMBER_NOT_HELD',gut.routes?.HOLD);
check(setQuarantine.some(x=>x.path==='root.evidenceSet<4>'&&x.type==='ERROR_OBJECT'),'SET_ERROR_MEMBER_NOT_QUARANTINED',setQuarantine);
check(gut.waste?.some(x=>x.path==='root.ordinaryDuplicateB'&&x.type==='DUPLICATE'),'ORDINARY_DUPLICATE_GUARD_DISABLED',gut.waste);
check(setAtoms.every(x=>x.provenance?.inputSource==='NOSTROMO/gut-set-test'),'SET_INPUT_PROVENANCE_LOST',setAtoms);

const result={
  schema:'nostromo-gut-set-test/v0.1',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  engineVersion:gut.version,
  capability:'PATH_SCOPED_SET_MEMBER_PRESERVATION_WITH_CONTAINER_PROVENANCE',
  observations:{setNutrients:setAtoms.length,setQuarantined:setQuarantine.length,repeatedTextMembers:repeatedSetEvidence.length,ordinaryDuplicateStillSuppressed:gut.waste?.some(x=>x.path==='root.ordinaryDuplicateB'&&x.type==='DUPLICATE')||false},
  failures,
  boundary:'This test verifies deterministic structural preservation of JavaScript Set members, member-index provenance, path-scoped multiplicity, ordinary GUT routing, quarantine behavior and continued non-Set duplicate containment. It does not infer semantic set membership, ontology, source independence, evidence quality, novelty or factual truth.'
};
await fs.writeFile('nostromo/integration/gut-set-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
