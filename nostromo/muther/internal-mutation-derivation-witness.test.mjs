import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';
import { verifyMutationDerivation } from './internal-mutation-derivation-witness.mjs';

const specimens = [
  {
    id: 'theme-01', kind: 'theme', traits: [
      { dimension: 'layout', value: 'dense-grid', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } },
      { dimension: 'typography', value: 'compressed-sans', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } }
    ]
  },
  {
    id: 'text-01', kind: 'text', traits: [
      { dimension: 'cadence', value: 'abrupt-fragment', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } },
      { dimension: 'voice', value: 'unstable-first-person', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } }
    ]
  }
];

const candidate = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'mutation-derived-01',
    traits: [
      {
        dimension: 'reading-rhythm',
        value: 'dense-grid/abrupt-fragment',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'voice-shell',
        value: 'compressed-sans/unstable-first-person',
        operation: 'hybridize',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'typography' },
          { specimenId: 'text-01', sourceDimension: 'voice' }
        ]
      }
    ]
  }
});
assert.equal(candidate.status, 'SANDBOX_CANDIDATE');

const witnesses = [
  {
    outputDimension: 'reading-rhythm',
    recipe: {
      type: 'join', parts: [
        { specimenId: 'theme-01', sourceDimension: 'layout' },
        { literal: '/' },
        { specimenId: 'text-01', sourceDimension: 'cadence' }
      ]
    }
  },
  {
    outputDimension: 'voice-shell',
    recipe: {
      type: 'join', parts: [
        { specimenId: 'theme-01', sourceDimension: 'typography' },
        { literal: '/' },
        { specimenId: 'text-01', sourceDimension: 'voice' }
      ]
    }
  }
];

const valid = verifyMutationDerivation({ specimens, candidate, witnesses });
assert.equal(valid.status, 'DERIVATION_WITNESS_VERIFIED');
assert.equal(valid.semanticCausalityClaimed, false);
assert.equal(valid.aestheticJudgmentClaimed, false);
assert.equal(valid.incorporationAuthorized, false);
assert.equal(valid.bodyMutationApplied, false);
assert.equal(valid.verifiedTraits.length, 2);
assert.equal(valid.schema, 'zenomorph-muther-derivation-witness/v0.2');

const arbitraryOutput = structuredClone(candidate);
arbitraryOutput.candidateTraits[0].value = 'totally-unrelated-third-value';
const arbitraryLaundering = verifyMutationDerivation({ specimens, candidate: arbitraryOutput, witnesses });
assert.equal(arbitraryLaundering.status, 'HOLD');
assert.equal(arbitraryLaundering.reason, 'MUTHER_DERIVATION_OUTPUT_MISMATCH');

const sourceLabelSwap = verifyMutationDerivation({
  specimens,
  candidate,
  witnesses: [
    {
      outputDimension: 'reading-rhythm',
      recipe: {
        type: 'join', parts: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { literal: '/' },
          { specimenId: 'text-01', sourceDimension: 'voice', start: 0, end: 15 }
        ]
      }
    },
    witnesses[1]
  ]
});
assert.equal(sourceLabelSwap.status, 'HOLD');
assert.ok(['MUTHER_DERIVATION_OUTPUT_MISMATCH', 'MUTHER_DERIVATION_SOURCE_LABEL_MISMATCH'].includes(sourceLabelSwap.reason));

const provenanceOnlyPressureCandidate = evaluateInternalMutation({
  specimens,
  proposal: {
    candidateId: 'metadata-only-pressure',
    traits: [
      {
        dimension: 'reading-rhythm',
        value: 'invented-cross-modal-claim',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      candidate.candidateTraits[1]
    ]
  }
});
assert.equal(provenanceOnlyPressureCandidate.status, 'SANDBOX_CANDIDATE');
const provenanceOnlyPressure = verifyMutationDerivation({ specimens, candidate: provenanceOnlyPressureCandidate, witnesses });
assert.equal(provenanceOnlyPressure.status, 'HOLD');
assert.equal(provenanceOnlyPressure.reason, 'MUTHER_DERIVATION_OUTPUT_MISMATCH');

const expressiveLiteral = verifyMutationDerivation({
  specimens,
  candidate,
  witnesses: [
    {
      outputDimension: 'reading-rhythm',
      recipe: {
        type: 'join', parts: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { literal: '/NEW/' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      }
    },
    witnesses[1]
  ]
});
assert.equal(expressiveLiteral.status, 'HOLD');
assert.equal(expressiveLiteral.reason, 'MUTHER_DERIVATION_LITERAL_TOO_EXPRESSIVE');

// Adversarial: provenance inflation. A candidate must not cite a source that did not
// materially participate in the reconstructable output.
const inflated = structuredClone(candidate);
inflated.candidateTraits[0].derivedFrom.push({ specimenId: 'theme-01', sourceDimension: 'typography' });
const provenanceInflation = verifyMutationDerivation({ specimens, candidate: inflated, witnesses });
assert.equal(provenanceInflation.status, 'HOLD');
assert.equal(provenanceInflation.reason, 'MUTHER_DERIVATION_SOURCE_LABEL_MISMATCH');

// Adversarial: duplicate citation padding must not masquerade as richer provenance.
const duplicateDeclared = structuredClone(candidate);
duplicateDeclared.candidateTraits[0].derivedFrom.push({ specimenId: 'theme-01', sourceDimension: 'layout' });
const duplicatePadding = verifyMutationDerivation({ specimens, candidate: duplicateDeclared, witnesses });
assert.equal(duplicatePadding.status, 'HOLD');
assert.equal(duplicatePadding.reason, 'MUTHER_DERIVATION_DUPLICATE_DECLARED_SOURCE');

console.log('MUTHER bounded derivation witness v0.2: PASS');
