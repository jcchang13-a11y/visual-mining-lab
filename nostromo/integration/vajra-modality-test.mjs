import fs from 'node:fs/promises';
import path from 'node:path';
import {auditReceiptAmbiguity} from './vajra-ambiguity-guard.mjs';

const root=process.cwd();
const resultPath=path.join(root,'nostromo','integration','vajra-modality-last-result.json');
const failures=[];

const common={
  targetRef:'modality-target-001',
  clauseRef:'modality-clause-001',
  lens:'evidence',
  status:'EXECUTED',
  material:'Bounded receipt material retained for audit.'
};

function polarityFor(audit,provenance){
  return audit.ambiguous?.flatMap(x=>x.receipts||[]).find(x=>x.provenance===provenance)?.polarity||null;
}
function expectAmbiguous(name,receipts,expectedProvenance){
  const audit=auditReceiptAmbiguity(receipts);
  const polarity=polarityFor(audit,expectedProvenance);
  if(audit.status!=='AMBIGUITY_FOUND')failures.push({type:`${name}_AMBIGUITY_MISSING`,audit});
  if(polarity!=='UNSPECIFIED')failures.push({type:`${name}_NOT_UNSPECIFIED`,actual:polarity,audit});
  return {status:audit.status,polarity,distinctOrgans:audit.ambiguous?.[0]?.distinctOrganCount||0};
}

const explicitSupport={...common,organ:'DROPLET',provenance:'droplet-explicit-support',relation:'This evidence supports the scoped target claim.'};
const explicitSupport2={...common,organ:'MU/TH/UR',provenance:'muther-explicit-support',relation:'This independently returned evidence supports the scoped target claim.'};
const explicitRefute={...common,organ:'DROPLET',provenance:'droplet-explicit-refute',relation:'This evidence refutes the scoped target claim.'};

const modalSupport={...common,organ:'MU/TH/UR',provenance:'muther-modal-support',relation:'This evidence may support the scoped target claim.'};
const modalRefute={...common,organ:'MU/TH/UR',provenance:'muther-modal-refute',relation:'This evidence might refute the scoped target claim.'};
const notNecessarilySupport={...common,organ:'SHROOMING',provenance:'shroom-not-necessarily-support',relation:'This evidence does not necessarily support the scoped target claim.'};
const notNecessarilyRefute={...common,organ:'SHROOMING',provenance:'shroom-not-necessarily-refute',relation:'This evidence does not necessarily refute the scoped target claim.'};
const zhModalSupport={...common,organ:'MU/TH/UR',provenance:'muther-zh-modal-support',relation:'這份證據可能支持目標命題。'};
const zhModalRefute={...common,organ:'SHROOMING',provenance:'shroom-zh-modal-refute',relation:'這份證據未必反駁目標命題。'};

const findings={
  englishMaySupport:expectAmbiguous('EN_MAY_SUPPORT',[explicitSupport,modalSupport],'muther-modal-support'),
  englishMightRefute:expectAmbiguous('EN_MIGHT_REFUTE',[explicitRefute,modalRefute],'muther-modal-refute'),
  englishNotNecessarilySupport:expectAmbiguous('EN_NOT_NECESSARILY_SUPPORT',[explicitSupport,notNecessarilySupport],'shroom-not-necessarily-support'),
  englishNotNecessarilyRefute:expectAmbiguous('EN_NOT_NECESSARILY_REFUTE',[explicitRefute,notNecessarilyRefute],'shroom-not-necessarily-refute'),
  chineseMaySupport:expectAmbiguous('ZH_MAY_SUPPORT',[explicitSupport,zhModalSupport],'muther-zh-modal-support'),
  chineseMayRefute:expectAmbiguous('ZH_MAY_REFUTE',[explicitRefute,zhModalRefute],'shroom-zh-modal-refute')
};

const sameDirectionControl=auditReceiptAmbiguity([explicitSupport,explicitSupport2]);
if(sameDirectionControl.status!=='NO_AMBIGUITY_FOUND')failures.push({type:'EXPLICIT_SAME_DIRECTION_FALSE_AMBIGUITY',audit:sameDirectionControl});

const crossOrganAudit=auditReceiptAmbiguity([explicitSupport,modalSupport]);
const crossOrganFinding=crossOrganAudit.ambiguous?.[0]||null;
if(crossOrganFinding?.distinctOrganCount!==2)failures.push({type:'CROSS_ORGAN_MODALITY_PROVENANCE_LOST',actual:crossOrganFinding?.distinctOrganCount});
if(!crossOrganFinding?.organs?.includes('DROPLET')||!crossOrganFinding?.organs?.includes('MU/TH/UR'))failures.push({type:'CROSS_ORGAN_MODALITY_ORGANS_MISSING',organs:crossOrganFinding?.organs});

const result={
  schema:'nostromo-vajra-modality-test/v0.4.3',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  finding:{
    ...findings,
    sameDirectionControl:sameDirectionControl.status,
    crossOrganDistinctOrgans:crossOrganFinding?.distinctOrganCount||0,
    interpretation:'Bounded modal or non-committal support/refute phrases remain UNSPECIFIED, so cross-organ receipt order cannot manufacture directional certainty from may/might/not-necessarily/可能/未必 wording.'
  },
  failures,
  boundary:'This is deterministic lexical modality containment for a narrow English/Chinese phrase set. It does not perform general modality scope, probabilistic reasoning, factual adjudication, source-quality scoring, derivative-source detection or proof of source independence.'
};
await fs.writeFile(resultPath,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
