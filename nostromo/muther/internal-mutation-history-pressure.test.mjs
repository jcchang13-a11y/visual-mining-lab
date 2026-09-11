import assert from 'node:assert/strict';
import { evaluateHistoricalOrePressure } from './internal-mutation-history-pressure.mjs';

const failure = {
  id: 'failure-01',
  kind: 'failure',
  traits: [
    { dimension: 'cliche', value: 'symmetrical-tech-dashboard', provenance: { artifactRef: 'public:failure-01', versionRef: 'v1' } },
    { dimension: 'failure-mode', value: 'decorative-without-reading-effect', provenance: { artifactRef: 'public:failure-01', versionRef: 'v1' } }
  ]
};
const priorVersion = {
  id: 'version-01',
  kind: 'version',
  traits: [
    { dimension: 'voice', value: 'stable-explainer', provenance: { artifactRef: 'public:version-01', versionRef: 'v7' } },
    { dimension: 'structure', value: 'linear-closure', provenance: { artifactRef: 'public:version-01', versionRef: 'v7' } }
  ]
};
const theme = {
  id: 'theme-01',
  kind: 'theme',
  traits: [
    { dimension: 'layout', value: 'balanced-grid', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } },
    { dimension: 'rhythm', value: 'regular-spacing', provenance: { artifactRef: 'public:theme-01', versionRef: 'v1' } }
  ]
};
const text = {
  id: 'text-01',
  kind: 'text',
  traits: [
    { dimension: 'voice', value: 'unstable-first-person', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } },
    { dimension: 'cadence', value: 'interrupted-long-paragraph', provenance: { artifactRef: 'public:text-01', versionRef: 'v3' } }
  ]
};

const failurePressure = evaluateHistoricalOrePressure({
  specimens: [failure, theme],
  proposal: {
    candidateId: 'anti-dashboard-01',
    traits: [
      {
        dimension: 'layout',
        value: 'asymmetrical-reading-field-that-refuses-dashboard-symmetry',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'failure-01', sourceDimension: 'cliche' },
          { specimenId: 'theme-01', sourceDimension: 'layout' }
        ]
      },
      {
        dimension: 'rhythm',
        value: 'irregular-spacing-with-deliberate-stalls',
        operation: 'distort',
        derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'rhythm' }]
      }
    ]
  }
});
assert.equal(failurePressure.status, 'SANDBOX_CANDIDATE');
assert.equal(failurePressure.historicalPressureDemonstrated, true);
assert.deepEqual(failurePressure.historicalKindsUsed, ['failure']);
assert.equal(failurePressure.historicalPressureSteps.length, 1);

const versionPressure = evaluateHistoricalOrePressure({
  specimens: [priorVersion, text],
  proposal: {
    candidateId: 'anti-closure-01',
    traits: [
      {
        dimension: 'voice',
        value: 'first-person-that-breaks-its-own-explainer-position',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'version-01', sourceDimension: 'voice' },
          { specimenId: 'text-01', sourceDimension: 'voice' }
        ]
      },
      {
        dimension: 'structure',
        value: 'closure-reopened-by-interrupted-cadence',
        operation: 'synthesize',
        derivedFrom: [
          { specimenId: 'version-01', sourceDimension: 'structure' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      }
    ]
  }
});
assert.equal(versionPressure.status, 'SANDBOX_CANDIDATE');
assert.equal(versionPressure.historicalPressureDemonstrated, true);
assert.deepEqual(versionPressure.historicalKindsUsed, ['version']);

const passiveHistory = evaluateHistoricalOrePressure({
  specimens: [failure, theme],
  proposal: {
    candidateId: 'passive-history-01',
    traits: [
      {
        dimension: 'layout',
        value: 'broken-grid',
        operation: 'distort',
        derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'layout' }]
      },
      {
        dimension: 'warning',
        value: 'remember-dashboard-failure',
        operation: 'invert',
        derivedFrom: [{ specimenId: 'failure-01', sourceDimension: 'failure-mode' }]
      }
    ]
  }
});
assert.equal(passiveHistory.status, 'HOLD');
assert.equal(passiveHistory.reason, 'MUTHER_HISTORICAL_ORE_PRESENT_WITHOUT_DIRECT_PRESSURE');

const noHistory = evaluateHistoricalOrePressure({
  specimens: [theme, text],
  proposal: {
    candidateId: 'no-history-01',
    traits: [
      {
        dimension: 'layout',
        value: 'layout-follows-interrupted-cadence',
        operation: 'cross-pressure',
        derivedFrom: [
          { specimenId: 'theme-01', sourceDimension: 'layout' },
          { specimenId: 'text-01', sourceDimension: 'cadence' }
        ]
      },
      {
        dimension: 'rhythm',
        value: 'irregular-spacing',
        operation: 'distort',
        derivedFrom: [{ specimenId: 'theme-01', sourceDimension: 'rhythm' }]
      }
    ]
  }
});
assert.equal(noHistory.status, 'HOLD');
assert.equal(noHistory.reason, 'MUTHER_HISTORICAL_ORE_NOT_USED');

console.log(JSON.stringify({
  schema: 'zenomorph-muther-history-pressure-test/v0.1',
  status: 'PASS',
  capability: 'FAILURES_AND_PRIOR_VERSIONS_CAN_EXERT_TRACEABLE_MUTATION_PRESSURE',
  boundary: 'PASS proves only that historical ore can be distinguished from passive archival inclusion. It does not prove aesthetic quality, autonomous approval, assimilation, or body mutation.'
}, null, 2));
