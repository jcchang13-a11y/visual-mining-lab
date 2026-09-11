// MUTHER failure-ore activation gate v0.1
// Failure artifacts are mineable ore only when they materially participate in a mutating step.
// Merely citing a failure as inherited metadata is not evidence that ZENOMORPH learned from it.

import { evaluateInternalMutation } from './internal-mutation.mjs';

const MUTATING = new Set(['hybridize', 'synthesize', 'invert', 'distort', 'cross-pressure', 'transpose']);

function hold(reason, details = {}) {
  return {
    schema: 'zenomorph-muther-failure-ore/v0.1',
    status: 'HOLD',
    reason,
    ...details,
    failureOreActivated: false,
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    provenancePreserved: true
  };
}

export function evaluateFailureOreActivation({ specimens, proposal } = {}) {
  const base = evaluateInternalMutation({ specimens, proposal });
  if (base.status !== 'SANDBOX_CANDIDATE') return base;

  const failureIds = new Set(
    (Array.isArray(specimens) ? specimens : [])
      .filter(specimen => specimen?.kind === 'failure')
      .map(specimen => typeof specimen?.id === 'string' ? specimen.id.trim().normalize('NFKC') : '')
      .filter(Boolean)
  );
  if (!failureIds.size) return hold('MUTHER_FAILURE_ORE_SPECIMEN_REQUIRED');

  const activatedSteps = [];
  const decorativeSteps = [];
  const nonFailureSources = new Set();

  for (const trait of base.candidateTraits || []) {
    const failureSources = (trait.derivedFrom || []).filter(source => failureIds.has(source.specimenId));
    const otherSources = (trait.derivedFrom || []).filter(source => !failureIds.has(source.specimenId));
    for (const source of otherSources) nonFailureSources.add(source.specimenId);
    if (!failureSources.length) continue;

    const record = {
      outputDimension: trait.dimension,
      operation: trait.operation,
      failureSourceIds: [...new Set(failureSources.map(source => source.specimenId))],
      pairedSourceIds: [...new Set(otherSources.map(source => source.specimenId))],
      failureProvenance: failureSources.map(source => ({ ...source.provenance }))
    };
    if (MUTATING.has(trait.operation)) activatedSteps.push(record);
    else decorativeSteps.push(record);
  }

  if (!activatedSteps.length) {
    return hold('MUTHER_FAILURE_ORE_DECORATIVE_ONLY', {
      decorativeFailureSteps: decorativeSteps,
      boundary: 'A failure can be cited without being metabolized. At least one failure-derived contribution must participate in a mutating operation; inherit/copy alone is only archival reuse.'
    });
  }
  if (!nonFailureSources.size) {
    return hold('MUTHER_FAILURE_ORE_NO_RECOMBINATION_TARGET', {
      failurePressureSteps: activatedSteps,
      boundary: 'Mining a failure requires it to pressure something beyond itself. At least one non-failure specimen must participate in the candidate so failure history can alter another content or phenotype lineage.'
    });
  }

  return {
    ...base,
    schema: 'zenomorph-muther-failure-ore/v0.1',
    failureOreActivated: true,
    failurePressureSteps: activatedSteps,
    decorativeFailureSteps: decorativeSteps,
    failureOreRecombinationTargets: [...nonFailureSources],
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    boundary: `${base.boundary} Failure artifacts count as active ore only when provenance-bound failure traits participate in at least one mutating operation and the candidate also involves non-failure material. This proves traceable reuse of failure history, not learning quality, aesthetic merit, assimilation, or permission to modify the persistent body.`
  };
}
