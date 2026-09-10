// MUTHER internal mutation sandbox v0.2
// Internal artifacts are ore. This module does not install candidates into ZENOMORPH.
// It validates whether a proposed mutation is traceable and materially transformed rather than a renamed copy.

const NON_MUTATING = new Set(['inherit', 'copy']);
const MUTATING = new Set(['hybridize', 'synthesize', 'invert', 'distort', 'cross-pressure', 'transpose']);

function text(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function canonical(v) {
  return text(v).normalize('NFKC');
}

function specimenIndex(specimens) {
  if (!Array.isArray(specimens) || specimens.length < 1) {
    throw new Error('MUTHER_INTERNAL_MUTATION_REQUIRES_AT_LEAST_ONE_SPECIMEN');
  }
  const byId = new Map();
  for (const specimen of specimens) {
    const id = canonical(specimen?.id);
    if (!id || byId.has(id)) throw new Error('MUTHER_INVALID_OR_DUPLICATE_SPECIMEN_ID');
    if (!['text', 'visual', 'theme', 'dialogue', 'failure', 'version', 'mixed'].includes(specimen?.kind)) {
      throw new Error('MUTHER_INVALID_SPECIMEN_KIND');
    }
    const traits = Array.isArray(specimen?.traits) ? specimen.traits : [];
    if (!traits.length) throw new Error('MUTHER_SPECIMEN_HAS_NO_TRAITS');
    const traitMap = new Map();
    for (const trait of traits) {
      const dimension = canonical(trait?.dimension);
      const value = text(trait?.value);
      const artifactRef = text(trait?.provenance?.artifactRef);
      const versionRef = text(trait?.provenance?.versionRef);
      if (!dimension || !value || !artifactRef || !versionRef) {
        throw new Error('MUTHER_TRAIT_PROVENANCE_INCOMPLETE');
      }
      if (traitMap.has(dimension)) throw new Error('MUTHER_DUPLICATE_TRAIT_DIMENSION');
      traitMap.set(dimension, {
        dimension,
        value,
        provenance: { artifactRef, versionRef }
      });
    }
    byId.set(id, { id, kind: specimen.kind, traits: traitMap });
  }
  return byId;
}

function resolveContribution(contribution, byId) {
  const specimenId = canonical(contribution?.specimenId);
  const sourceDimension = canonical(contribution?.sourceDimension);
  const source = byId.get(specimenId);
  const trait = source?.traits.get(sourceDimension);
  if (!source || !trait) throw new Error('MUTHER_CONTRIBUTION_SOURCE_NOT_FOUND');
  return {
    specimenId: source.id,
    specimenKind: source.kind,
    sourceDimension: trait.dimension,
    sourceValue: trait.value,
    provenance: { ...trait.provenance }
  };
}

function specimenSignature(specimen) {
  return [...specimen.traits.values()]
    .map(t => `${t.dimension}=${canonical(t.value)}`)
    .sort()
    .join('|');
}

function candidateSignature(traits) {
  return traits
    .map(t => `${t.dimension}=${canonical(t.value)}`)
    .sort()
    .join('|');
}

export function evaluateInternalMutation({ specimens, proposal } = {}) {
  const byId = specimenIndex(specimens);
  const candidateId = text(proposal?.candidateId);
  const proposedTraits = Array.isArray(proposal?.traits) ? proposal.traits : [];
  if (!candidateId || proposedTraits.length < 2) {
    return hold('MUTHER_MUTATION_CANDIDATE_INCOMPLETE');
  }

  const dimensions = new Set();
  const sourceSpecimens = new Set();
  const sourceKinds = new Set();
  const transformationHistory = [];
  const candidateTraits = [];
  let hasMutation = false;
  let hasCrossPressure = false;

  try {
    for (let i = 0; i < proposedTraits.length; i++) {
      const item = proposedTraits[i];
      const dimension = canonical(item?.dimension);
      const value = text(item?.value);
      const operation = text(item?.operation);
      const contributions = Array.isArray(item?.derivedFrom) ? item.derivedFrom : [];
      if (!dimension || !value || !operation || dimensions.has(dimension) || !contributions.length) {
        return hold('MUTHER_MUTATION_TRAIT_INVALID');
      }
      if (!NON_MUTATING.has(operation) && !MUTATING.has(operation)) {
        return hold('MUTHER_MUTATION_OPERATION_UNKNOWN');
      }
      if (MUTATING.has(operation)) hasMutation = true;

      const resolved = contributions.map(c => resolveContribution(c, byId));
      const localKinds = new Set(resolved.map(r => r.specimenKind));
      if (operation === 'cross-pressure' && localKinds.size >= 2) hasCrossPressure = true;
      for (const r of resolved) {
        sourceSpecimens.add(r.specimenId);
        sourceKinds.add(r.specimenKind);
      }
      dimensions.add(dimension);
      candidateTraits.push({ dimension, value, operation, derivedFrom: resolved });
      transformationHistory.push({
        step: i + 1,
        operation,
        outputDimension: dimension,
        outputValue: value,
        inputs: resolved
      });
    }
  } catch (error) {
    return hold(error.message || 'MUTHER_MUTATION_SOURCE_RESOLUTION_FAILED');
  }

  if (!hasMutation) return hold('MUTHER_RECOMBINATION_WITHOUT_MUTATION');

  const signature = candidateSignature(candidateTraits);
  for (const specimen of byId.values()) {
    if (signature === specimenSignature(specimen)) {
      return hold('MUTHER_RENAMED_COPY_DETECTED');
    }
  }

  const crossModal = sourceKinds.size >= 2;
  const sourceMode = sourceSpecimens.size === 1 ? 'SINGLE_SPECIMEN_MUTATION' : 'MULTI_SPECIMEN_RECOMBINATION';
  return {
    status: 'SANDBOX_CANDIDATE',
    candidateId,
    operation: 'READ_DECOMPOSE_RECOMBINE_MUTATE',
    sourceMode,
    candidateTraits,
    sourceSpecimenIds: [...sourceSpecimens],
    sourceKinds: [...sourceKinds],
    crossModal,
    crossModalPressureDemonstrated: crossModal && hasCrossPressure,
    transformationHistory,
    provenancePreserved: true,
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    nextRequiredGate: 'GUT_VAJRA_CROSS_ORGAN_STRESS_AND_REGRESSION',
    boundary: 'A sandbox mutation candidate is evidence of traceable transformation only. A single specimen may be inverted, distorted, or otherwise betrayed without requiring artificial collage. This is not evidence of autonomous aesthetic judgment, successful assimilation, organ growth, or authorization to modify the persistent body.'
  };
}

function hold(reason) {
  return {
    status: 'HOLD',
    reason,
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    provenancePreserved: true
  };
}
