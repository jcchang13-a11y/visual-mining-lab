import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';

const specimens = [
  {
    id: 'theme-01',
    kind: 'theme',
    traits: [
      { dimension: 'typography', value: 'compressed-sans', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } },
      { dimension: 'layout', value: 'dense-grid', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } }
    ]
  },
  {
    id: 'text-01',
    kind: 'text',
    traits: [
      { dimension: 'cadence', value: 'abrupt-fragment', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } },
      { dimension: 'voice', value: 'unstable-first-person', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } }
    ]
  },
  {
    id: 'failure-01',
    kind: 'failure',
    traits: [
      { dimension: 'failure-mode', value: 'over-cleaning', provenance: { artifactRef: 'public:failure-01', versionRef: 'case-2' } }
    ]
  }
];

const valid = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'mutation-11',
    traits: [
      {
        dimension: 'typography',
        value: 'compressed-sans-with-rupture',
        operation: 'distort',
        derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }]
      },
      {
        dimension: 'reading-rhythm',
        value: 'visual-breaks-follow-abrupt-fragments',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'anti-polish',
        value: 'retain-productive-roughness',
        operation: 'synthesize',
        derivedFrom: [
          { specimenId: 'text-01', sourceDimension: 'voice' },
          { specimenId: 'failure-01', sourceDimension: 'failure-mode' }
        ]
      }
    ]
  }
});
assert.equal(valid.status, 'SANDBOX_CANDIDATE');
assert.equal(valid.sourceMode, 'MULTI_SPECIMEN_RECOMBINATION');
assert.equal(valid.incorporationAuthorized, false);
assert.equal(valid.bodyMutationApplied, false);
assert.equal(valid.provenancePreserved, true);
assert.equal(valid.crossModal, true);
assert.equal(valid.crossModalPressureDemonstrated, true);
assert.equal(valid.operationSemanticsVerified, true);
assert.deepEqual(new Set(valid.sourceSpecimenIds), new Set(['theme-01', 'text-01', 'failure-01']));
assert.equal(valid.transformationHistory.length, 3);

const singleSourceBetrayal = evaluateInternalMutation({
  specimens: [specimens[0]],
  proposal: {
    candidateId: 'theme-01-betrayed',
    traits: [
      { dimension: 'typography', value: 'anti-compressed-discontinuous-type', operation: 'invert', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'layout', value: 'broken-asymmetric-fields', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'layout' }] }
    ]
  }
});
assert.equal(singleSourceBetrayal.status, 'SANDBOX_CANDIDATE');
assert.equal(singleSourceBetrayal.sourceMode, 'SINGLE_SPECIMEN_MUTATION');
assert.deepEqual(singleSourceBetrayal.sourceSpecimenIds, ['theme-01']);
assert.equal(singleSourceBetrayal.crossModal, false);
assert.equal(singleSourceBetrayal.provenancePreserved, true);

const singleSourceCopy = evaluateInternalMutation({
  specimens: [specimens[0]],
  proposal: {
    candidateId: 'theme-01-copy',
    traits: [
      { dimension: 'typography', value: 'compressed-sans', operation: 'copy', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'layout', value: 'dense-grid', operation: 'inherit', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'layout' }] }
    ]
  }
});
assert.equal(singleSourceCopy.status, 'HOLD');
assert.equal(singleSourceCopy.reason, 'MUTHER_RECOMBINATION_WITHOUT_MUTATION');

const renamedCopyWithFakeMutationLabel = evaluateInternalMutation({
  specimens: [specimens[0]],
  proposal: {
    candidateId: 'theme-01-renamed',
    traits: [
      { dimension: 'typography', value: 'compressed-sans', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'layout', value: 'dense-grid', operation: 'invert', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'layout' }] }
    ]
  }
});
assert.equal(renamedCopyWithFakeMutationLabel.status, 'HOLD');
assert.equal(renamedCopyWithFakeMutationLabel.reason, 'MUTHER_RENAMED_COPY_DETECTED');

const partialFakeMutationLabel = evaluateInternalMutation({
  specimens: [specimens[0]],
  proposal: {
    candidateId: 'partial-fake-mutation',
    traits: [
      { dimension: 'typography', value: 'compressed-sans', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'layout', value: 'broken-asymmetric-fields', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'layout' }] }
    ]
  }
});
assert.equal(partialFakeMutationLabel.status, 'HOLD');
assert.equal(partialFakeMutationLabel.reason, 'MUTHER_MUTATION_LABEL_WITHOUT_MATERIAL_CHANGE');

const mutationHiddenAsInheritance = evaluateInternalMutation({
  specimens: [specimens[0]],
  proposal: {
    candidateId: 'hidden-mutation',
    traits: [
      { dimension: 'typography', value: 'new-type-system', operation: 'inherit', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'layout', value: 'broken-asymmetric-fields', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'layout' }] }
    ]
  }
});
assert.equal(mutationHiddenAsInheritance.status, 'HOLD');
assert.equal(mutationHiddenAsInheritance.reason, 'MUTHER_NON_MUTATING_OPERATION_CHANGED_VALUE');

const copiedValueWithMultipleSources = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'fake-inherit-multi-source',
    traits: [
      { dimension: 'cadence-copy', value: 'abrupt-fragment', operation: 'inherit', derivedFrom: [
        { specimenId: 'text-01', sourceDimension: 'cadence' },
        { specimenId: 'theme-01', sourceDimension: 'layout' }
      ] },
      { dimension: 'layout', value: 'broken-asymmetric-fields', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'layout' }] }
    ]
  }
});
assert.equal(copiedValueWithMultipleSources.status, 'HOLD');
assert.equal(copiedValueWithMultipleSources.reason, 'MUTHER_NON_MUTATING_OPERATION_CHANGED_VALUE');

const collageOnly = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'collage-only',
    traits: [
      { dimension: 'typography', value: 'compressed-sans', operation: 'inherit', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'cadence', value: 'abrupt-fragment', operation: 'inherit', derivedFrom: [{ specimenId: 'text-01', sourceDimension: 'cadence' }] }
    ]
  }
});
assert.equal(collageOnly.status, 'HOLD');
assert.equal(collageOnly.reason, 'MUTHER_RECOMBINATION_WITHOUT_MUTATION');

const missingProvenance = structuredClone(specimens);
delete missingProvenance[1].traits[0].provenance.versionRef;
assert.throws(
  () => evaluateInternalMutation({ specimens: missingProvenance, proposal: { candidateId: 'bad', traits: [] } }),
  /MUTHER_TRAIT_PROVENANCE_INCOMPLETE/
);

const unknownSource = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'laundered',
    traits: [
      { dimension: 'x', value: 'x2', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'y', value: 'y2', operation: 'synthesize', derivedFrom: [{ specimenId: 'ghost-specimen', sourceDimension: 'voice' }] }
    ]
  }
});
assert.equal(unknownSource.status, 'HOLD');
assert.equal(unknownSource.reason, 'MUTHER_CONTRIBUTION_SOURCE_NOT_FOUND');

const compatibilityAlias = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'alias-source',
    traits: [
      { dimension: 'x', value: 'changed-a', operation: 'distort', derivedFrom: [{ specimenId: ' theme-01 ', sourceDimension: ' typography ' }] },
      { dimension: 'y', value: 'changed-b', operation: 'synthesize', derivedFrom: [{ specimenId: 'ｔｅｘｔ-01', sourceDimension: 'cadence' }] }
    ]
  }
});
assert.equal(compatibilityAlias.status, 'SANDBOX_CANDIDATE');
assert.equal(compatibilityAlias.sourceSpecimenIds.length, 2);

const compatibilityValueAliasIsNotMutation = evaluateInternalMutation({
  specimens: [specimens[0]],
  proposal: {
    candidateId: 'compatibility-value-alias',
    traits: [
      { dimension: 'typography', value: 'ｃｏｍｐｒｅｓｓｅｄ－ｓａｎｓ', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }] },
      { dimension: 'layout', value: 'broken-asymmetric-fields', operation: 'distort', derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'layout' }] }
    ]
  }
});
assert.equal(compatibilityValueAliasIsNotMutation.status, 'HOLD');
assert.equal(compatibilityValueAliasIsNotMutation.reason, 'MUTHER_MUTATION_LABEL_WITHOUT_MATERIAL_CHANGE');

console.log('MUTHER internal mutation sandbox: PASS');
