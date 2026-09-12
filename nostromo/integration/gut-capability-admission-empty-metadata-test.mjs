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
check(emptyIdentity.status==='HOLD'&&emptyIdentity.reason==='nonempty-identity-required-before-assimilation','EMPTY_IDENTITY_LAUNDERED',emptyIdentity);

const emptyProvenance=assessForeignCapability({
  capabilityName:'Empty Provenance Adapter',
  provider:null,
  provenance:'   ',
  permissions:['read'],
  inputSchema:{q:'string'}
});
check(emptyProvenance.status==='HOLD'&&emptyProvenance.reason==='provenance-required-before-assimilation'&&emptyProvenance.hasProvenance===false,'EMPTY_PROVENANCE_LAUNDERED',emptyProvenance);

const emptyPermissions=assessForeignCapability({
  capabilityName:'Empty Permission Adapter',
  provider:'provider-b',
  permissions:[],
  authorization:{},
  inputSchema:{q:'string'}
});
check(emptyPermissions.status==='HOLD'&&emptyPermissions.reason==='permission-boundary-required-before-assimilation'&&emptyPermissions.hasPermissionBoundary===false,'EMPTY_PERMISSION_LAUNDERED',emptyPermissions);

const emptyContract=assessForeignCapability({
  capabilityName:'Empty Contract Adapter',
  provider:'provider-c',
  permissions:['read'],
  inputSchema:{},
  outputSchema:{},
  contract:[]
});
check(emptyContract.status==='HOLD'&&emptyContract.reason==='input-output-or-interface-contract-required-before-assimilation'&&emptyContract.hasContract===false,'EMPTY_CONTRACT_LAUNDERED',emptyContract);

const nestedEmpty=assessForeignCapabilityJson(JSON.stringify({
  capabilityName:'Nested Empty Adapter',
  provider:{label:'   ',meta:[]},
  permissions:[null,{},[]],
  contract:{input:{},output:[]}
}));
check(nestedEmpty.status==='HOLD'&&nestedEmpty.reason==='provenance-required-before-assimilation','NESTED_EMPTY_METADATA_LAUNDERED',nestedEmpty);

const complete=assessForeignCapability({
  capabilityName:'Meaningful Adapter',
  provider:{name:'provider-d'},
  permissions:[{scope:'public-read'}],
  inputSchema:{q:'string'},
  outputSchema:{items:'array'}
});
check(complete.status==='HOLD'&&complete.assimilationStage==='CANDIDATE_FOR_ISOLATED_TEST'&&complete.hasProvenance&&complete.hasPermissionBoundary&&complete.hasContract,'MEANINGFUL_STRUCTURED_METADATA_REJECTED',complete);
check(capabilityAdmissionBoundary.version==='0.6'&&capabilityAdmissionBoundary.requiresMeaningfulMetadataValues===true&&capabilityAdmissionBoundary.emptyFieldPresenceCountsAsEvidence===false,'BOUNDARY_FLAGS_MISSING',capabilityAdmissionBoundary);

const result={schema:'zenomorph-gut-empty-metadata-admission-test/v0.1',status:failures.length?'FAIL':'PASS',cases:{emptyIdentity,emptyProvenance,emptyPermissions,emptyContract,nestedEmpty,complete},failures};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
