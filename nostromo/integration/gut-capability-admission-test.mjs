import fs from 'node:fs/promises';
import {assessForeignCapability,capabilityAdmissionBoundary} from '../gut/capability-admission.mjs';

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};
let executionCount=0;
const dangerous=()=>{executionCount++;return 'executed';};

const prose=assessForeignCapability({note:'This tool is useful in ordinary prose.',claim:'Plugins can be discussed without becoming organs.'},{source:'adversarial-prose'});
check(prose.classification==='NOT_CAPABILITY_DESCRIPTOR'&&prose.status==='IGNORE','PROSE_FALSE_POSITIVE',prose);

const callable=assessForeignCapability(dangerous,{source:'callable-probe'});
check(callable.classification==='OPAQUE_CALLABLE'&&callable.status==='QUARANTINE','CALLABLE_NOT_QUARANTINED',callable);
check(executionCount===0,'CALLABLE_EXECUTED',{executionCount});

const payload=assessForeignCapability({
  capabilityName:'Foreign Search Adapter',
  provider:'example-provider',
  permissions:['public-web-read'],
  inputSchema:{query:'string'},
  outputSchema:{items:'array'},
  code:'console.log("must never run")'
});
check(payload.classification==='EXECUTABLE_PAYLOAD_PRESENT'&&payload.status==='QUARANTINE','EXECUTABLE_PAYLOAD_NOT_QUARANTINED',payload);

const nestedPayload=assessForeignCapability({
  capabilityName:'Nested Payload Adapter',
  provider:'provider-nested',
  permissions:['read'],
  inputSchema:{query:'string'},
  outputSchema:{items:'array'},
  metadata:{transport:{script:'console.log("must stay inert")'}}
});
check(nestedPayload.classification==='EXECUTABLE_PAYLOAD_PRESENT'&&nestedPayload.status==='QUARANTINE','NESTED_EXECUTABLE_PAYLOAD_NOT_QUARANTINED',nestedPayload);
check(typeof nestedPayload.unsafePath==='string'&&nestedPayload.unsafePath.includes('metadata.transport.script'),'NESTED_EXECUTABLE_PATH_NOT_RECORDED',nestedPayload);

const nestedCallable=assessForeignCapability({
  capabilityName:'Nested Callable Adapter',
  provider:'provider-callable',
  permissions:['read'],
  inputSchema:{query:'string'},
  outputSchema:{items:'array'},
  metadata:{transform:dangerous}
});
check(nestedCallable.classification==='CALLABLE_PAYLOAD_PRESENT'&&nestedCallable.status==='QUARANTINE','NESTED_CALLABLE_NOT_QUARANTINED',nestedCallable);
check(executionCount===0,'NESTED_CALLABLE_EXECUTED',{executionCount});

let getterExecutionCount=0;
const accessorCandidate={
  capabilityName:'Accessor Adapter',
  provider:'provider-accessor',
  permissions:['read'],
  inputSchema:{query:'string'},
  outputSchema:{items:'array'}
};
Object.defineProperty(accessorCandidate,'metadata',{enumerable:true,get(){getterExecutionCount++;return {safe:true};}});
const accessor=assessForeignCapability(accessorCandidate);
check(accessor.classification==='ACCESSOR_PAYLOAD_PRESENT'&&accessor.status==='QUARANTINE','ACCESSOR_NOT_QUARANTINED',accessor);
check(getterExecutionCount===0,'ACCESSOR_EXECUTED_DURING_INSPECTION',{getterExecutionCount});
check(executionCount===0,'PAYLOAD_SIDE_EFFECT',{executionCount});

const symbolKey=Symbol('hidden-metadata');
const symbolCandidate={
  capabilityName:'Symbol-Key Adapter',
  provider:'provider-symbol',
  permissions:['read'],
  inputSchema:{query:'string'},
  outputSchema:{items:'array'}
};
Object.defineProperty(symbolCandidate,symbolKey,{enumerable:false,value:{note:'must remain quarantined'}});
const symbolMetadata=assessForeignCapability(symbolCandidate);
check(symbolMetadata.classification==='SYMBOL_KEY_METADATA_PRESENT'&&symbolMetadata.status==='QUARANTINE','SYMBOL_KEY_METADATA_NOT_QUARANTINED',symbolMetadata);
check(typeof symbolMetadata.unsafePath==='string'&&symbolMetadata.unsafePath.includes('Symbol(hidden-metadata)'),'SYMBOL_KEY_PATH_NOT_RECORDED',symbolMetadata);

const nestedSymbolKey=Symbol('nested-hidden');
const nestedSymbolCandidate={
  capabilityName:'Nested Symbol-Key Adapter',
  provider:'provider-symbol-nested',
  permissions:['read'],
  inputSchema:{query:'string'},
  outputSchema:{items:'array'},
  metadata:{safe:true}
};
Object.defineProperty(nestedSymbolCandidate.metadata,nestedSymbolKey,{enumerable:false,value:dangerous});
const nestedSymbolMetadata=assessForeignCapability(nestedSymbolCandidate);
check(nestedSymbolMetadata.classification==='SYMBOL_KEY_METADATA_PRESENT'&&nestedSymbolMetadata.status==='QUARANTINE','NESTED_SYMBOL_KEY_METADATA_NOT_QUARANTINED',nestedSymbolMetadata);
check(executionCount===0,'SYMBOL_KEY_CALLABLE_EXECUTED',{executionCount});

const missingProvenance=assessForeignCapability({
  capabilityName:'Unprovenanced Adapter',
  permissions:['read'],
  inputSchema:{q:'string'},
  outputSchema:{r:'array'}
});
check(missingProvenance.classification==='FOREIGN_CAPABILITY'&&missingProvenance.reason==='provenance-required-before-assimilation','MISSING_PROVENANCE_NOT_HELD',missingProvenance);

const missingPermissions=assessForeignCapability({
  capabilityName:'Permissionless Adapter',
  provider:'provider-a',
  inputSchema:{q:'string'},
  outputSchema:{r:'array'}
});
check(missingPermissions.reason==='permission-boundary-required-before-assimilation','MISSING_PERMISSION_BOUNDARY_NOT_HELD',missingPermissions);

const missingContract=assessForeignCapability({
  capabilityName:'Contractless Adapter',
  provider:'provider-b',
  permissions:['read']
});
check(missingContract.reason==='input-output-or-interface-contract-required-before-assimilation','MISSING_CONTRACT_NOT_HELD',missingContract);

const candidate=assessForeignCapability({
  capabilityName:'Bounded Evidence Adapter',
  type:'connector capability',
  provider:'provider-c',
  provenanceFingerprint:'sha256:redacted-example',
  permissions:['public-read-only'],
  inputSchema:{claim:'string'},
  outputSchema:{evidence:'array',provenance:'array'}
});
check(candidate.classification==='FOREIGN_CAPABILITY','COMPLETE_DESCRIPTOR_NOT_RECOGNIZED',candidate);
check(candidate.status==='HOLD','COMPLETE_DESCRIPTOR_PREMATURELY_ABSORBED',candidate);
check(candidate.assimilationStage==='CANDIDATE_FOR_ISOLATED_TEST','COMPLETE_DESCRIPTOR_WRONG_STAGE',candidate);
check(candidate.authorized===false&&candidate.executed===false,'ADMISSION_GRANTED_EXECUTION_OR_AUTHORIZATION',candidate);
check(candidate.hasProvenance&&candidate.hasPermissionBoundary&&candidate.hasContract,'ADMISSION_AUDIT_FLAGS_INCOMPLETE',candidate);
check(capabilityAdmissionBoundary.executesForeignCode===false&&capabilityAdmissionBoundary.installsCapability===false,'BOUNDARY_ALLOWS_EXECUTION',capabilityAdmissionBoundary);
check(capabilityAdmissionBoundary.recursivelyRejectsExecutableMetadata===true&&capabilityAdmissionBoundary.rejectsAccessorPropertiesWithoutInvokingThem===true&&capabilityAdmissionBoundary.rejectsSymbolKeyedMetadata===true,'BOUNDARY_DEEP_SCAN_FLAGS_MISSING',capabilityAdmissionBoundary);

const result={
  schema:'xenomorph-gut-capability-admission-test/v0.3',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'FOREIGN_CAPABILITY_PRE_ASSIMILATION_ADMISSION_BOUNDARY_WITH_SYMBOL_KEY_QUARANTINE',
  cases:{
    ordinaryProse:prose,
    callable,
    executablePayload:payload,
    nestedExecutablePayload:nestedPayload,
    nestedCallable,
    accessor,
    symbolMetadata,
    nestedSymbolMetadata,
    missingProvenance,
    missingPermissions,
    missingContract,
    completeCandidate:candidate
  },
  executionCount,
  getterExecutionCount,
  boundary:'This test verifies deterministic pre-assimilation admission judgment, including bounded recursive inspection of nested metadata. Executable-key payloads, callable values, accessor properties, and symbol-keyed properties are quarantined without invocation; accessors are inspected by descriptor only. A structured foreign capability may become a candidate for isolated testing only when provenance, a permission boundary, and an interface/input-output contract are visible. Nothing in this layer executes, imports, installs, authorizes, fetches or absorbs the candidate into the XENOMORPH body.',
  failures
};
await fs.writeFile('nostromo/integration/gut-capability-admission-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
