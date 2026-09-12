import {assessForeignCapability,assessForeignCapabilityJson,capabilityAdmissionBoundary} from '../gut/capability-admission.mjs';

const failures=[];
const check=(ok,type,detail)=>{if(!ok)failures.push({type,detail});};

const emptyIdentity=assessForeignCapability({
  capabilityName:'   ',
  type:'connector capability',
  provider:'provider-a',
  permissions:['read'],
  inputSchema:{q:'string'}
});
check(emptyIdentity.status==='HOLD'&&emptyIdentity.reason==='nonempty-string-identity-required-before-assimilation','EMPTY_IDENTITY_LAUNDERED',emptyIdentity);

const scalarIdentity=assessForeignCapability({
  capabilityName:false,
  type:'connector capability',
  provider:'provider-a',
  permissions:['read'],
  inputSchema:{q:'string'}
});
check(scalarIdentity.status==='HOLD'&&scalarIdentity.identity===null&&scalarIdentity.reason==='nonempty-string-identity-required-before-assimilation','SCALAR_IDENTITY_LAUNDERED',scalarIdentity);

const emptyProvenance=assessForeignCapability({
  capabilityName:'Empty Provenance Adapter',
  provider:null,
  provenance:'   ',
  permissions:['read'],
  inputSchema:{q:'string'}
});
check(emptyProvenance.status==='HOLD'&&emptyProvenance.reason==='provenance-required-before-assimilation'&&emptyProvenance.hasProvenance===false,'EMPTY_PROVENANCE_LAUNDERED',emptyProvenance);

const scalarProvenance=assessForeignCapability({
  capabilityName:'Scalar Provenance Adapter',
  provider:false,
  permissions:['read'],
  inputSchema:{q:'string'}
});
check(scalarProvenance.status==='HOLD'&&scalarProvenance.reason==='provenance-required-before-assimilation'&&scalarProvenance.hasProvenance===false,'SCALAR_PROVENANCE_LAUNDERED',scalarProvenance);

const emptyPermissions=assessForeignCapability({
  capabilityName:'Empty Permission Adapter',
  provider:'provider-b',
  permissions:[],
  authorization:{},
  inputSchema:{q:'string'}
});
check(emptyPermissions.status==='HOLD'&&emptyPermissions.reason==='permission-boundary-required-before-assimilation'&&emptyPermissions.hasPermissionBoundary===false,'EMPTY_PERMISSION_LAUNDERED',emptyPermissions);

const scalarPermissions=assessForeignCapability({
  capabilityName:'Scalar Permission Adapter',
  provider:'provider-b',
  permissions:false,
  inputSchema:{q:'string'}
});
check(scalarPermissions.status==='HOLD'&&scalarPermissions.reason==='permission-boundary-required-before-assimilation'&&scalarPermissions.hasPermissionBoundary===false,'SCALAR_PERMISSION_LAUNDERED',scalarPermissions);

const emptyContract=assessForeignCapability({
  capabilityName:'Empty Contract Adapter',
  provider:'provider-c',
  permissions:['read'],
  inputSchema:{},
  outputSchema:{},
  contract:[]
});
check(emptyContract.status==='HOLD'&&emptyContract.reason==='input-output-or-interface-contract-required-before-assimilation'&&emptyContract.hasContract===false,'EMPTY_CONTRACT_LAUNDERED',emptyContract);

const scalarContract=assessForeignCapability({
  capabilityName:'Scalar Contract Adapter',
  provider:'provider-c',
  permissions:['read'],
  inputSchema:0,
  outputSchema:false,
  contract:1
});
check(scalarContract.status==='HOLD'&&scalarContract.reason==='input-output-or-interface-contract-required-before-assimilation'&&scalarContract.hasContract===false,'SCALAR_CONTRACT_LAUNDERED',scalarContract);

const nestedEmpty=assessForeignCapabilityJson(JSON.stringify({
  capabilityName:'Nested Empty Adapter',
  provider:{label:'   ',meta:[]},
  permissions:[null,{},[]],
  contract:{input:{},output:[]}
}));
check(nestedEmpty.status==='HOLD'&&nestedEmpty.reason==='provenance-required-before-assimilation','NESTED_EMPTY_METADATA_LAUNDERED',nestedEmpty);

const nestedScalarPlaceholders=assessForeignCapabilityJson(JSON.stringify({
  capabilityName:'Nested Scalar Placeholder Adapter',
  provider:{verified:false,id:0},
  permissions:[false,0],
  contract:{input:false,output:0}
}));
check(nestedScalarPlaceholders.status==='HOLD'&&nestedScalarPlaceholders.reason==='provenance-required-before-assimilation'&&nestedScalarPlaceholders.hasProvenance===false,'NESTED_SCALAR_PLACEHOLDER_LAUNDERED',nestedScalarPlaceholders);

const complete=assessForeignCapability({
  capabilityName:'Meaningful Adapter',
  provider:{name:'provider-d'},
  permissions:[{scope:'public-read'}],
  inputSchema:{q:'string'},
  outputSchema:{items:'array'}
});
check(complete.status==='HOLD'&&complete.assimilationStage==='CANDIDATE_FOR_ISOLATED_TEST'&&complete.hasProvenance&&complete.hasPermissionBoundary&&complete.hasContract,'MEANINGFUL_STRUCTURED_METADATA_REJECTED',complete);
check(capabilityAdmissionBoundary.version==='0.7'&&capabilityAdmissionBoundary.requiresMeaningfulMetadataValues===true&&capabilityAdmissionBoundary.rejectsScalarPlaceholderMetadata===true&&capabilityAdmissionBoundary.identityMustBeNonemptyString===true&&capabilityAdmissionBoundary.emptyFieldPresenceCountsAsEvidence===false,'BOUNDARY_FLAGS_MISSING',capabilityAdmissionBoundary);

const result={schema:'zenomorph-gut-empty-metadata-admission-test/v0.2',status:failures.length?'FAIL':'PASS',cases:{emptyIdentity,scalarIdentity,emptyProvenance,scalarProvenance,emptyPermissions,scalarPermissions,emptyContract,scalarContract,nestedEmpty,nestedScalarPlaceholders,complete},failures};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
