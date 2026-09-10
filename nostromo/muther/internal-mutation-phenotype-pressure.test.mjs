import assert from 'node:assert/strict';
import { evaluateInternalMutation } from './internal-mutation.mjs';

const theme = {
  id: 'theme-01',
  kind: 'theme',
  traits: [
    { dimension: 'layout', value: 'dense-grid', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } },
    { dimension: 'typography', value: 'compressed-sans', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } }
  ]
};
const text = {
  id: 'text-01',
  kind: 'text',
  traits: [
    { dimension: 'cadence', value: 'abrupt-fragment', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } },
    { dimension: 'voice', value: 'unstable-first-person', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } }
  ]
};
const dialogue = {
  id: 'dialogue-01',
  kind: 'dialogue',
  traits: [
    { dimension: 'turn-taking', value: 'interruptive', provenance: { artifactRef: 'public:dialogue-01', versionRef: 'v2' } },
    { dimension: 'address', value: 'second-person', provenance: { artifactRef: 'public:dialogue-01', versionRef: 'v2' } }
  ]
};
const visual = {
  id: 'visual-01',
  kind: 'visual',
  traits: [
    { dimension: 'framing', value: 'cropped-edge', provenance: { artifactRef: 'public:visual-01', versionRef: 'v1' } },
    { dimension: 'contrast', value: 'low-key', provenance: { artifactRef: 'public:visual-01', versionRef: 'v1' } }
  ]
};

const realTextVisualPressure = evaluateInternalMutation({
  specimens: [theme, text],
  proposal: {
    candidateId: 'phenotype-coupled-01',
    traits: [
      {
        dimension: 'reading-rhythm',
        value: 'layout-ruptures-follow-fragment-cadence',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'typography',
        value: 'compressed-sans-with-rupture',
        operation: 'distort',
        derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'typography' }]
      }
    ]
  }
});
assert.equal(realTextVisualPressure.status, 'SANDBOX_CANDIDATE');
assert.equal(realTextVisualPressure.crossModal, true);
assert.equal(realTextVisualPressure.crossModalPressureDemonstrated, true);
assert.equal(realTextVisualPressure.phenotypeCoupling, true);
assert.equal(realTextVisualPressure.phenotypePressureDemonstrated, true);
assert.equal(realTextVisualPressure.transformationHistory[0].phenotypePressure, true);

const linguisticOnlyPressure = evaluateInternalMutation({
  specimens: [text, dialogue],
  proposal: {
    candidateId: 'linguistic-only-01',
    traits: [
      {
        dimension: 'narrative-pressure',
        value: 'fragment-cadence-interrupted-by-turn-taking',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'text-01', sourceDimension: 'cadence' },
          { specimenId: 'dialogue-01', sourceDimension: 'turn-taking' }
        ]
      },
      {
        dimension: 'voice',
        value: 'first-person-under-address-pressure',
        operation: 'synthesize',
        derivedFrom: [
          { specimenId: 'text-01', sourceDimension: 'voice' },
          { specimenId: 'dialogue-01', sourceDimension: 'address' }
        ]
      }
    ]
  }
});
assert.equal(linguisticOnlyPressure.status, 'SANDBOX_CANDIDATE');
assert.equal(linguisticOnlyPressure.crossModal, true);
assert.equal(linguisticOnlyPressure.crossModalPressureDemonstrated, true);
assert.equal(linguisticOnlyPressure.phenotypeCoupling, false);
assert.equal(linguisticOnlyPressure.phenotypePressureDemonstrated, false);

const visualOnlyPressure = evaluateInternalMutation({
  specimens: [theme, visual],
  proposal: {
    candidateId: 'visual-only-01',
    traits: [
      {
        dimension: 'composition',
        value: 'grid-broken-by-cropped-edge',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'visual-01', sourceDimension: 'framing' }
        ]
      },
      {
        dimension: 'surface',
        value: 'low-key-compressed-type-field',
        operation: 'synthesize',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'typography' },
          { specimenId: 'visual-01', sourceDimension: 'contrast' }
        ]
      }
    ]
  }
});
assert.equal(visualOnlyPressure.status, 'SANDBOX_CANDIDATE');
assert.equal(visualOnlyPressure.crossModal, true);
assert.equal(visualOnlyPressure.crossModalPressureDemonstrated, true);
assert.equal(visualOnlyPressure.phenotypeCoupling, false);
assert.equal(visualOnlyPressure.phenotypePressureDemonstrated, false);

console.log(JSON.stringify({
  schema: 'zenomorph-muther-phenotype-pressure-test/v0.1',
  status: 'PASS',
  capability: 'TEXT_VISUAL_CROSS_PRESSURE_IS_DISTINGUISHED_FROM_GENERIC_MULTI_KIND_RECOMBINATION',
  boundary: 'PASS proves only that the sandbox can distinguish linguistic↔visual phenotype pressure from text↔dialogue or theme↔visual recombination. It does not prove aesthetic quality, autonomous judgment, assimilation, or body mutation.'
}, null, 2));
