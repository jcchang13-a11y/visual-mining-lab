import fs from 'node:fs/promises';
import {assessForeignCapability,assessForeignCapabilityJson,capabilityAdmissionBoundary} from '../gut/capability-admission.mjs';

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

const completeDescriptor={
  capabilityName:'Bounded Evidence Adapter',
  type:'connector capability',
  provider:'provider-c',
  provenanceFingerprint:'sha256:redacted-example',
  permissions:['public-read-only'],
  inputSchema:{claim:'string'},
  outputSchema:{evidence:'array',provenance:'array'}
};
const candidate=assessForeignCapability(completeDescriptor);
check(candidate.classification==='FOREIGN_CAPABILITY','COMPLETE_DESCRIPTOR_NOT_RECOGNIZED',candidate);
check(candidate.status==='HOLD','COMPLETE_DESCRIPTOR_PREMATURELY_ABSORBED',candidate);
check(candidate.assimilationStage==='CANDIDATE_FOR_ISOLATED_TEST','COMPLETE_DESCRIPTOR_WRONG_STAGE',candidate);
check(candidate.authorized===false&&candidate.executed===false,'ADMISSION_GRANTED_EXECUTION_OR_AUTHORIZATION',candidate);
check(candidate.hasProvenance&&candidate.hasPermissionBoundary&&candidate.hasContract,'ADMISSION_AUDIT_FLAGS_INCOMPLETE',candidate);
check(candidate.trustBoundary==='TRUSTED_IN_PROCESS_OBJECT_METADATA','OBJECT_API_TRUST_BOUNDARY_MISSING',candidate);

const serializedCandidate=assessForeignCapabilityJson(JSON.stringify(completeDescriptor));
check(serializedCandidate.classification==='FOREIGN_CAPABILITY'&&serializedCandidate.status==='HOLD','SERIALIZED_COMPLETE_DESCRIPTOR_NOT_RECOGNIZED',serializedCandidate);
check(serializedCandidate.assimilationStage==='CANDIDATE_FOR_ISOLATED_TEST','SERIALIZED_COMPLETE_DESCRIPTOR_WRONG_STAGE',serializedCandidate);
check(serializedCandidate.trustBoundary==='UNTRUSTED_SERIALIZED_JSON'&&serializedCandidate.transport==='SERIALIZED_JSON'&&serializedCandidate.proxyTrapExposure===false,'SERIALIZED_TRUST_BOUNDARY_MISSING',serializedCandidate);

const serializedExecutable=assessForeignCapabilityJson(JSON.stringify({
  capabilityName:'Serialized Executable Adapter',
  provider:'provider-json-exec',
  permissions:['read'],
  inputSchema:{q:'string'},
  outputSchema:{r:'array'},
  code:'must remain inert'
}));
check(serializedExecutable.classification==='EXECUTABLE_PAYLOAD_PRESENT'&&serializedExecutable.status==='QUARANTINE','SERIALIZED_EXECUTABLE_NOT_QUARANTINED',serializedExecutable);
check(executionCount===0,'SERIALIZED_EXECUTABLE_SIDE_EFFECT',{executionCount});

const malformedSerialized=assessForeignCapabilityJson('{"capabilityName":');
check(malformedSerialized.classification==='INVALID_SERIALIZED_DESCRIPTOR'&&malformedSerialized.status==='QUARANTINE','MALFORMED_SERIALIZED_INPUT_NOT_QUARANTINED',malformedSerialized);

const unsafeTransport=assessForeignCapabilityJson(completeDescriptor);
check(unsafeTransport.classification==='UNSAFE_TRANSPORT_TYPE'&&unsafeTransport.status==='QUARANTINE','NON_STRING_UNTRUSTED_TRANSPORT_NOT_QUARANTINED',unsafeTransport);

const oversizedSerialized=assessForeignCapabilityJson('x'.repeat(capabilityAdmissionBoundary.maxSerializedChars+1));
check(oversizedSerialized.classification==='TRANSPORT_SIZE_LIMIT'&&oversizedSerialized.status==='QUARANTINE','OVERSIZED_SERIALIZED_INPUT_NOT_QUARANTINED',oversizedSerialized);

check(capabilityAdmissionBoundary.serializedBoundaryMayExecuteForeignCode===false&&capabilityAdmissionBoundary.objectInspectionMayTriggerProxyTraps===true,'BOUNDARY_PROXY_SEMANTICS_INCORRECT',capabilityAdmissionBoundary);
check(capabilityAdmissionBoundary.grantsAuthorization===false&&capabilityAdmissionBoundary.installsCapability===false,'BOUNDARY_ALLOWS_AUTHORIZATION_OR_INSTALLATION',capabilityAdmissionBoundary);
check(capabilityAdmissionBoundary.recursivelyRejectsExecutableMetadata===true&&capabilityAdmissionBoundary.rejectsAccessorPropertiesWithoutInvokingThem===true&&capabilityAdmissionBoundary.rejectsSymbolKeyedMetadata===true,'BOUNDARY_DEEP_SCAN_FLAGS_MISSING',capabilityAdmissionBoundary);

const result={
  schema:'zenomorph-gut-capability-admission-test/v0.4',
  completedAt:new Date().toISOString(),
  status:failures.length?'FAIL':'PASS',
  capability:'FOREIGN_CAPABILITY_PRE_ASSIMILATION_ADMISSION_WITH_SERIALIZED_UNTRUSTED_BOUNDARY',
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
    completeCandidate:candidate,
    serializedCandidate,
    serializedExecutable,
    malformedSerialized,
    unsafeTransport,
    oversizedSerialized
  },
  executionCount,
  getterExecutionCount,
  boundary:'ZENOMORPH now distinguishes trusted in-process object inspection from the untrusted transport boundary. Arbitrary JavaScript object reflection cannot truthfully promise proxy-trap safety, so untrusted foreign capability descriptors must arrive as bounded serialized JSON text. JSON is parsed inside GUT and only then inspected. The serialized path does not execute, import, install, authorize, fetch or absorb the candidate; malformed, oversized and non-string transports are quarantined. The legacy object API remains available only for trusted in-process metadata.',
  failures
};
await fs.writeFile('nostromo/integration/gut-capability-admission-last-result.json',JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
