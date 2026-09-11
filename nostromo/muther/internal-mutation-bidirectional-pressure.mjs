// MUTHER bidirectional text-visual phenotype pressure gate v0.3
// A cross-modal mutation is not yet bidirectional merely because text and visual ore both participate.
// This wrapper requires traceable pressure in both directions while keeping the candidate sandboxed.
// v0.2 blocked label-only bidirectionality by requiring opposite targets to use distinct resolved source traces.
// v0.3 also collapses duplicate resolved contributions before trace comparison, so repeating the same ore relation cannot manufacture a second causal route.

import { evaluateInternalMutation } from './internal-mutation.mjs';

const TARGETS = new Set(['linguistic', 'visual']);
const LINGUISTIC_KINDS = new Set(['text', 'dialogue']);
const VISUAL_KINDS = new Set(['visual', 'theme']);

function familyOf(kind) {
  if (LINGUISTIC_KINDS.has(kind)) return 'linguistic';
  if (VISUAL_KINDS.has(kind)) return 'visual';
  return null;
}

function canonical(v) {
  return typeof v === 'string' ? v.trim().normalize('NFKC') : '';
}

function hold(reason, details = {}) {
  return {
    schema: 'zenomorph-muther-bidirectional-pressure/v0.3',
    status: 'HOLD',
    reason,
    ...details,
    bidirectionalPhenotypePressureDemonstrated: false,
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    provenancePreserved: true
  };
}

function sourceTraceSignature(trait) {
  const traces = (trait.derivedFrom || [])
    .map(source => `${canonical(source?.specimenId)}::${canonical(source?.sourceDimension)}::${canonical(source?.sourceValue)}::${canonical(source?.provenance?.artifactRef)}::${canonical(source?.provenance?.versionRef)}`);
  return JSON.stringify([...new Set(traces)].sort());
}

export function evaluateBidirectionalPhenotypePressure({ specimens, proposal } = {}) {
  const base = evaluateInternalMutation({ specimens, proposal });
  if (base.status !== 'SANDBOX_CANDIDATE') return base;

  const rawTraits = Array.isArray(proposal?.traits) ? proposal.traits : [];
  const candidateTraits = Array.isArray(base.candidateTraits) ? base.candidateTraits : [];
  if (rawTraits.length !== candidateTraits.length) {
    return hold('MUTHER_BIDIRECTIONAL_PRESSURE_TRAIT_ALIGNMENT_FAILED');
  }

  const directions = [];
  for (let i = 0; i < candidateTraits.length; i++) {
    const trait = candidateTraits[i];
    if (trait?.operation !== 'cross-pressure') continue;

    const phenotypeTarget = typeof rawTraits[i]?.phenotypeTarget === 'string'
      ? rawTraits[i].phenotypeTarget.trim().toLowerCase()
      : '';
    if (!phenotypeTarget) continue;
    if (!TARGETS.has(phenotypeTarget)) {
      return hold('MUTHER_BIDIRECTIONAL_PRESSURE_TARGET_INVALID', { step: i + 1, phenotypeTarget });
    }

    const sourceFamilies = new Set(
      (trait.derivedFrom || []).map(source => familyOf(source?.specimenKind)).filter(Boolean)
    );
    if (!(sourceFamilies.has('linguistic') && sourceFamilies.has('visual'))) {
      return hold('MUTHER_BIDIRECTIONAL_PRESSURE_TARGET_WITHOUT_CROSS_FAMILY_SOURCE', {
        step: i + 1,
        phenotypeTarget,
        sourceFamilies: [...sourceFamilies]
      });
    }

    directions.push({
      step: i + 1,
      phenotypeTarget,
      outputDimension: trait.dimension,
      outputValue: trait.value,
      sourceTraceSignature: sourceTraceSignature(trait),
      sourceSpecimenIds: [...new Set((trait.derivedFrom || []).map(source => source.specimenId).filter(Boolean))],
      sourceKinds: [...new Set((trait.derivedFrom || []).map(source => source.specimenKind).filter(Boolean))]
    });
  }

  const visualPressure = directions.filter(item => item.phenotypeTarget === 'visual');
  const linguisticPressure = directions.filter(item => item.phenotypeTarget === 'linguistic');
  if (!visualPressure.length || !linguisticPressure.length) {
    return hold('MUTHER_BIDIRECTIONAL_PRESSURE_INCOMPLETE', {
      demonstratedDirections: [...new Set(directions.map(item => item.phenotypeTarget))],
      pressureSteps: directions,
      boundary: 'Text+visual participation is not enough. A bidirectional phenotype candidate needs at least one traceable cross-pressure step targeting visual phenotype and another targeting linguistic phenotype.'
    });
  }

  const hasDistinctSourceTracePair = visualPressure.some(visual =>
    linguisticPressure.some(linguistic => visual.sourceTraceSignature !== linguistic.sourceTraceSignature)
  );
  if (!hasDistinctSourceTracePair) {
    return hold('MUTHER_BIDIRECTIONAL_PRESSURE_LABEL_ONLY_ECHO', {
      pressureSteps: directions,
      boundary: 'Changing phenotypeTarget, output dimension, output wording, or duplicate contribution count alone does not demonstrate reciprocal pressure. At least one visual-targeting step and one linguistic-targeting step must be grounded in different unique resolved source-dimension/provenance traces.'
    });
  }

  return {
    ...base,
    schema: 'zenomorph-muther-bidirectional-pressure/v0.3',
    bidirectionalPhenotypePressureDemonstrated: true,
    visualPhenotypePressureSteps: visualPressure,
    linguisticPhenotypePressureSteps: linguisticPressure,
    distinctSourceTracePairDemonstrated: true,
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    boundary: `${base.boundary} Bidirectional pressure is demonstrated only structurally: at least one text↔visual cross-pressure step explicitly targets visual phenotype and at least one separately targets linguistic phenotype, with both source families traceable in each step and at least one distinct unique resolved source trace across the two directions. Merely relabelling the same ore relation, changing output names, or repeating identical contributions is held as an echo. This does not prove aesthetic merit, semantic improvement, autonomous authorship, assimilation, or permission to modify the persistent body.`
  };
}
