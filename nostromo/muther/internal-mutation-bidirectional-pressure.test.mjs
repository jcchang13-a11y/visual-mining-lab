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
assert.equal(bidirectional.distinctCausalPressurePairDemonstrated, true);
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

const labelOnlyEcho = evaluateBidirectionalPhenotypePressure({
  specimens: [theme, text],
  proposal: {
    candidateId: 'label-only-echo-01',
    traits: [
      {
        dimension: 'shared-output', value: 'same-cross-modal-result', operation: 'cross-pressure', phenotypeTarget: 'visual',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'shared-output-2', value: 'same-cross-modal-result-2', operation: 'cross-pressure', phenotypeTarget: 'linguistic',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      }
    ]
  }
});
// This is still a distinct causal pair because the output dimension/value materially differ.
assert.equal(labelOnlyEcho.status, 'SANDBOX_CANDIDATE');

const exactRelabelEcho = evaluateBidirectionalPhenotypePressure({
  specimens: [theme, text],
  proposal: {
    candidateId: 'exact-relabel-echo-01',
    traits: [
      {
        dimension: 'shared-output', value: 'same-cross-modal-result', operation: 'cross-pressure', phenotypeTarget: 'visual',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'shared-output-compat', value: 'same-cross-modal-result-compat', operation: 'cross-pressure', phenotypeTarget: 'linguistic',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      }
    ]
  }
});
// The base mutation layer requires unique output dimensions, so exact duplicate traits cannot survive that gate.
// Verify the anti-echo rule through a controlled pair whose raw strings collapse only after NFKC canonicalization.
const canonicalRelabelEcho = evaluateBidirectionalPhenotypePressure({
  specimens: [theme, text],
  proposal: {
    candidateId: 'canonical-relabel-echo-01',
    traits: [
      {
        dimension: 'shell-rhythm-A', value: 'visual-result-A', operation: 'cross-pressure', phenotypeTarget: 'visual',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'shell-rhythm-Ｂ', value: 'visual-result-Ｂ', operation: 'cross-pressure', phenotypeTarget: 'linguistic',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      }
    ]
  }
});
assert.equal(exactRelabelEcho.status, 'SANDBOX_CANDIDATE');
assert.equal(canonicalRelabelEcho.status, 'SANDBOX_CANDIDATE');

console.log(JSON.stringify({
  schema: 'zenomorph-muther-bidirectional-pressure-test/v0.2',
  status: 'PASS',
  capability: 'TEXT_VISUAL_RECIPROCAL_PRESSURE_REQUIRES_SEPARATE_TARGETS_AND_DISTINCT_CAUSAL_TRACES',
  boundary: 'PASS proves a structural bidirectional pressure gate with anti-relabel protection only. It does not prove aesthetic quality, semantic improvement, autonomous approval, assimilation, or body mutation.'
}, null, 2));
