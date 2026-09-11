// MUTHER historical-ore pressure gate v0.1
// Failures and prior versions are not passive archives: they may exert explicit mutation pressure.
// This wrapper never installs a candidate into ZENOMORPH.

import { evaluateInternalMutation } from './internal-mutation.mjs';

const HISTORICAL_KINDS = new Set(['failure', 'version']);

function historicalPressureSteps(candidateTraits = []) {
  const steps = [];
  for (let i = 0; i < candidateTraits.length; i++) {
    const trait = candidateTraits[i];
    if (trait?.operation !== 'cross-pressure') continue;
    const kinds = new Set((trait?.derivedFrom || []).map(source => source?.specimenKind).filter(Boolean));
    const historical = [...kinds].filter(kind => HISTORICAL_KINDS.has(kind));
    const present = [...kinds].filter(kind => !HISTORICAL_KINDS.has(kind));
    if (historical.length && present.length) {
      steps.push({
        step: i + 1,
        outputDimension: trait.dimension,
        historicalKinds: historical,
        presentKinds: present,
        sourceSpecimenIds: [...new Set((trait.derivedFrom || []).map(source => source.specimenId).filter(Boolean))]
      });
    }
  }
  return steps;
}

export function evaluateHistoricalOrePressure({ specimens, proposal, requireHistoricalPressure = true } = {}) {
  const base = evaluateInternalMutation({ specimens, proposal });
  if (base.status !== 'SANDBOX_CANDIDATE') return base;

  const historicalKindsUsed = [...new Set(
    (base.candidateTraits || [])
      .flatMap(trait => trait.derivedFrom || [])
      .map(source => source.specimenKind)
      .filter(kind => HISTORICAL_KINDS.has(kind))
  )];
  const pressureSteps = historicalPressureSteps(base.candidateTraits);
  const historicalPressureDemonstrated = pressureSteps.length > 0;

  if (requireHistoricalPressure && !historicalPressureDemonstrated) {
    return {
      schema: 'zenomorph-muther-history-pressure/v0.1',
      status: 'HOLD',
      reason: historicalKindsUsed.length
        ? 'MUTHER_HISTORICAL_ORE_PRESENT_WITHOUT_DIRECT_PRESSURE'
        : 'MUTHER_HISTORICAL_ORE_NOT_USED',
      historicalKindsUsed,
      historicalPressureDemonstrated: false,
      incorporationAuthorized: false,
      bodyMutationApplied: false,
      provenancePreserved: true,
      boundary: 'A failure or prior version counts as active mutation pressure only when a cross-pressure step directly combines historical ore with at least one non-historical specimen. Merely including historical material elsewhere in the candidate does not prove that history changed the phenotype.'
    };
  }

  return {
    ...base,
    schema: 'zenomorph-muther-history-pressure/v0.1',
    historicalKindsUsed,
    historicalPressureDemonstrated,
    historicalPressureSteps: pressureSteps,
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    boundary: `${base.boundary} Historical ore is active only when direct cross-pressure is traceable at the trait level. Failure/version participation is not itself evidence that the mutation is better, assimilated, or fit for incorporation.`
  };
}
