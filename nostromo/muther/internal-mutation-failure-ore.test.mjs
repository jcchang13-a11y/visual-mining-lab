import assert from 'node:assert/strict';
import { evaluateFailureOreActivation } from './internal-mutation-failure-ore.mjs';

const failure = {
  id: 'failure-01',
  kind: 'failure',
  traits: [
    { dimension: 'failure-mode', value: 'template-collapse', provenance: { artifactRef: 'public:failure-01', versionRef: 'v1' } },
    { dimension: 'symptom', value: 'visual-rhythm-flattened', provenance: { artifactRef: 'public:failure-01', versionRef: 'v1' } }
  ]
};
const theme = {
  id: 'theme-04',
  kind: 'theme',
  traits: [
    { dimension: 'layout', value: 'regular-grid', provenance: { artifactRef: 'public:theme-04', versionRef: 'v1' } },
    { dimension: 'typography', value: 'neutral-sans', provenance: { artifactRef: 'public:theme-04', versionRef: 'v1' } }
  ]
};

const active = evaluateFailureOreActivation({
  specimens: [failure, theme],
  proposal: {
    candidateId: 'theme-11-from-failure',
    traits: [
      {
        dimension: 'layout',
        value: 'grid-with-deliberate-rhythm-breaks',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'theme-04', sourceDimension: 'layout' },
          { specimenId: 'failure-01', sourceDimension: 'symptom' }
        ]
      },
      {
        dimension: 'typography',
        value: 'neutral-sans-under-template-collapse-pressure',
        operation: 'synthesize',
        derivedFrom: [
          { specimenId: 'theme-04', sourceDimension: 'typography' },
          { specimenId: 'failure-01', sourceDimension: 'failure-mode' }
        ]
      }
    ]
  }
});
assert.equal(active.status, 'SANDBOX_CANDIDATE');
assert.equal(active.failureOreActivated, true);
assert.equal(active.failurePressureSteps.length, 2);
assert.deepEqual(active.failureOreRecombinationTargets, ['theme-04']);
assert.equal(active.incorporationAuthorized, false);
assert.equal(active.bodyMutationApplied, false);

const decorativeOnly = evaluateFailureOreActivation({
  specimens: [failure, theme],
  proposal: {
    candidateId: 'failure-as-footnote-only',
    traits: [
      {
        dimension: 'failure-mode',
        value: 'template-collapse',
        operation: 'inherit',
        derivedFrom: [{ specimenId: 'failure-01', sourceDimension: 'failure-mode' }]
      },
      {
        dimension: 'layout',
        value: 'irregular-grid',
        operation: 'distort',
        derivedFrom: [{ specimenId: 'theme-04', sourceDimension: 'layout' }]
      }
    ]
  }
});
assert.equal(decorativeOnly.status, 'HOLD');
assert.equal(decorativeOnly.reason, 'MUTHER_FAILURE_ORE_DECORATIVE_ONLY');

const selfRecyclingFailure = evaluateFailureOreActivation({
  specimens: [failure],
  proposal: {
    candidateId: 'failure-only-recycling',
    traits: [
      {
        dimension: 'failure-mode',
        value: 'template-collapse-inverted',
        operation: 'invert',
        derivedFrom: [{ specimenId: 'failure-01', sourceDimension: 'failure-mode' }]
      },
      {
        dimension: 'symptom',
        value: 'rhythm-flattening-exaggerated',
        operation: 'distort',
        derivedFrom: [{ specimenId: 'failure-01', sourceDimension: 'symptom' }]
      }
    ]
  }
});
assert.equal(selfRecyclingFailure.status, 'HOLD');
assert.equal(selfRecyclingFailure.reason, 'MUTHER_FAILURE_ORE_NO_RECOMBINATION_TARGET');

const noFailure = evaluateFailureOreActivation({
  specimens: [theme],
  proposal: {
    candidateId: 'ordinary-theme-mutation',
    traits: [
      { dimension: 'layout', value: 'broken-grid', operation: 'distort', derivedFrom: [{ specimenId: 'theme-04', sourceDimension: 'layout' }] },
      { dimension: 'typography', value: 'neutral-sans-expanded', operation: 'distort', derivedFrom: [{ specimenId: 'theme-04', sourceDimension: 'typography' }] }
    ]
  }
});
assert.equal(noFailure.status, 'HOLD');
assert.equal(noFailure.reason, 'MUTHER_FAILURE_ORE_SPECIMEN_REQUIRED');

console.log(JSON.stringify({
  schema: 'zenomorph-muther-failure-ore-test/v0.1',
  status: 'PASS',
  capability: 'FAILURE_HISTORY_CAN_ACT_AS_PROVENANCE_BOUND_MUTATION_ORE_WITHOUT_BECOMING_DECORATIVE_METADATA',
  boundary: 'PASS proves only that failure artifacts can materially participate in a traceable sandbox mutation and cannot qualify by archival citation alone. It does not prove learning quality, aesthetic improvement, assimilation, or body mutation.'
}, null, 2));
