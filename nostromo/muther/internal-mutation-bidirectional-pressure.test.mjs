import assert from 'node:assert/strict';
import { evaluateBidirectionalPhenotypePressure } from './internal-mutation-bidirectional-pressure.mjs';

const theme = {
  id: 'theme-01', kind: 'theme', traits: [
    { dimension: 'layout', value: 'dense-grid', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } },
    { dimension: 'typography', value: 'compressed-sans', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } }
  ]
};
const text = {
  id: 'text-01', kind: 'text', traits: [
    { dimension: 'cadence', value: 'abrupt-fragment', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } },
    { dimension: 'voice', value: 'unstable-first-person', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } }
  ]
};

const bidirectional = evaluateBidirectionalPhenotypePressure({
  specimens: [theme, text],
  proposal: {
    candidateId: 'bidirectional-01',
    traits: [
      {
        dimension: 'shell-rhythm', value: 'grid-breaks-triggered-by-fragment-cadence', operation: 'cross-pressure', phenotypeTarget: 'visual',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'narrative-breath', value: 'sentences-lengthen-where-grid-opens', operation: 'cross-pressure', phenotypeTarget: 'linguistic',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'typography' },
          { specimenId: 'text-01', sourceDimension: 'voice' }
        ]
      }
    ]
  }
});
assert.equal(bidirectional.status, 'SANDBOX_CANDIDATE');
assert.equal(bidirectional.bidirectionalPhenotypePressureDemonstrated, true);
assert.equal(bidirectional.visualPhenotypePressureSteps.length, 1);
assert.equal(bidirectional.linguisticPhenotypePressureSteps.length, 1);
assert.equal(bidirectional.incorporationAuthorized, false);
assert.equal(bidirectional.bodyMutationApplied, false);

const oneWayOnly = evaluateBidirectionalPhenotypePressure({
  specimens: [theme, text],
  proposal: {
    candidateId: 'one-way-01',
    traits: [
      {
        dimension: 'shell-rhythm', value: 'grid-breaks-triggered-by-fragment-cadence', operation: 'cross-pressure', phenotypeTarget: 'visual',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'typography', value: 'compressed-sans-with-rupture', operation: 'distort',
        derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }]
      }
    ]
  }
});
assert.equal(oneWayOnly.status, 'HOLD');
assert.equal(oneWayOnly.reason, 'MUTHER_BIDIRECTIONAL_PRESSURE_INCOMPLETE');

const fakeVisualTarget = evaluateBidirectionalPhenotypePressure({
  specimens: [theme, text],
  proposal: {
    candidateId: 'fake-target-01',
    traits: [
      {
        dimension: 'shell-rhythm', value: 'grid-breaks-triggered-by-fragment-cadence', operation: 'cross-pressure', phenotypeTarget: 'visual',
        derivedFrom: [
          { specimenId: 'text-01', sourceDimension: 'cadence' },
          { specimenId: 'text-01', sourceDimension: 'voice' }
        ]
      },
      {
        dimension: 'narrative-breath', value: 'sentences-lengthen-where-grid-opens', operation: 'cross-pressure', phenotypeTarget: 'linguistic',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'voice' }
        ]
      }
    ]
  }
});
assert.equal(fakeVisualTarget.status, 'HOLD');
assert.equal(fakeVisualTarget.reason, 'MUTHER_BIDIRECTIONAL_PRESSURE_TARGET_WITHOUT_CROSS_FAMILY_SOURCE');

const invalidTarget = evaluateBidirectionalPhenotypePressure({
  specimens: [theme, text],
  proposal: {
    candidateId: 'invalid-target-01',
    traits: [
      {
        dimension: 'shell-rhythm', value: 'grid-breaks-triggered-by-fragment-cadence', operation: 'cross-pressure', phenotypeTarget: 'surface-ish',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'narrative-breath', value: 'sentences-lengthen-where-grid-opens', operation: 'cross-pressure', phenotypeTarget: 'linguistic',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'typography' },
          { specimenId: 'text-01', sourceDimension: 'voice' }
        ]
      }
    ]
  }
});
assert.equal(invalidTarget.status, 'HOLD');
assert.equal(invalidTarget.reason, 'MUTHER_BIDIRECTIONAL_PRESSURE_TARGET_INVALID');

console.log(JSON.stringify({
  schema: 'zenomorph-muther-bidirectional-pressure-test/v0.1',
  status: 'PASS',
  capability: 'TEXT_PRESSURES_VISUAL_PHENOTYPE_AND_VISUAL_PRESSURES_LINGUISTIC_PHENOTYPE_ARE_SEPARATELY_TRACEABLE',
  boundary: 'PASS proves a structural bidirectional pressure gate only. It does not prove aesthetic quality, semantic improvement, autonomous approval, assimilation, or body mutation.'
}, null, 2));
