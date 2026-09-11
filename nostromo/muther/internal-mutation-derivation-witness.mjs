// MUTHER derivation witness gate v0.2
// Bounded proof that a mutated output was reconstructed from cited source material.
// This does not claim semantic causality, aesthetic quality, assimilation, or body incorporation.

const MUTATING = new Set(['hybridize', 'synthesize', 'invert', 'distort', 'cross-pressure', 'transpose']);

const text = v => typeof v === 'string' ? v : '';
const canonical = v => text(v).normalize('NFKC');

function specimenIndex(specimens) {
  const byId = new Map();
  for (const specimen of Array.isArray(specimens) ? specimens : []) {
    const id = canonical(specimen?.id).trim();
    if (!id || byId.has(id)) throw new Error('MUTHER_DERIVATION_INVALID_SPECIMEN_ID');
    const traits = new Map();
    for (const trait of Array.isArray(specimen?.traits) ? specimen.traits : []) {
      const dimension = canonical(trait?.dimension).trim();
      if (!dimension || traits.has(dimension)) throw new Error('MUTHER_DERIVATION_INVALID_TRAIT_DIMENSION');
      traits.set(dimension, text(trait?.value));
    }
    byId.set(id, traits);
  }
  return byId;
}

function candidateTraitIndex(candidate) {
  const byDimension = new Map();
  for (const trait of Array.isArray(candidate?.candidateTraits) ? candidate.candidateTraits : []) {
    const dimension = canonical(trait?.dimension).trim();
    if (!dimension || byDimension.has(dimension)) throw new Error('MUTHER_DERIVATION_INVALID_CANDIDATE_TRAIT');
    byDimension.set(dimension, trait);
  }
  return byDimension;
}

function sliceSource(part, byId) {
  const specimenId = canonical(part?.specimenId).trim();
  const sourceDimension = canonical(part?.sourceDimension).trim();
  const traits = byId.get(specimenId);
  if (!traits || !traits.has(sourceDimension)) return { error: 'MUTHER_DERIVATION_SOURCE_NOT_FOUND' };
  const value = traits.get(sourceDimension);
  const start = Number.isInteger(part?.start) ? part.start : 0;
  const end = Number.isInteger(part?.end) ? part.end : value.length;
  if (start < 0 || end < start || end > value.length || end === start) return { error: 'MUTHER_DERIVATION_INVALID_SOURCE_SLICE' };
  return { value: value.slice(start, end), specimenId, sourceDimension };
}

function buildOutput(recipe, byId) {
  if (!recipe || recipe.type !== 'join' || !Array.isArray(recipe.parts) || recipe.parts.length < 2) {
    return { error: 'MUTHER_DERIVATION_RECIPE_INVALID' };
  }
  let output = '';
  const sources = [];
  let sourceParts = 0;
  for (const part of recipe.parts) {
    if (part && Object.prototype.hasOwnProperty.call(part, 'literal')) {
      const literal = text(part.literal);
      if (literal.length > 3 || /[\p{L}\p{N}]/u.test(literal)) return { error: 'MUTHER_DERIVATION_LITERAL_TOO_EXPRESSIVE' };
      output += literal;
      continue;
    }
    const sliced = sliceSource(part, byId);
    if (sliced.error) return sliced;
    output += sliced.value;
    sources.push({ specimenId: sliced.specimenId, sourceDimension: sliced.sourceDimension });
    sourceParts += 1;
  }
  if (sourceParts < 2) return { error: 'MUTHER_DERIVATION_REQUIRES_MULTIPLE_SOURCE_PARTS' };
  return { output, sources };
}

function sourceKey(source) {
  return `${canonical(source?.specimenId).trim()}::${canonical(source?.sourceDimension).trim()}`;
}

function sameSourceSet(declared, used) {
  if (declared.size !== used.size) return false;
  for (const key of declared) if (!used.has(key)) return false;
  return true;
}

export function verifyMutationDerivation({ specimens, candidate, witnesses } = {}) {
  if (candidate?.status !== 'SANDBOX_CANDIDATE') return hold('MUTHER_DERIVATION_REQUIRES_SANDBOX_CANDIDATE');
  let byId;
  let traits;
  try {
    byId = specimenIndex(specimens);
    traits = candidateTraitIndex(candidate);
  } catch (error) {
    return hold(error.message || 'MUTHER_DERIVATION_INDEX_FAILED');
  }

  const witnessList = Array.isArray(witnesses) ? witnesses : [];
  const witnessByDimension = new Map();
  for (const witness of witnessList) {
    const dimension = canonical(witness?.outputDimension).trim();
    if (!dimension || witnessByDimension.has(dimension)) return hold('MUTHER_DERIVATION_DUPLICATE_OR_INVALID_WITNESS');
    witnessByDimension.set(dimension, witness);
  }

  const verified = [];
  for (const [dimension, trait] of traits.entries()) {
    if (!MUTATING.has(trait.operation)) continue;
    const witness = witnessByDimension.get(dimension);
    if (!witness) return hold('MUTHER_DERIVATION_WITNESS_MISSING');
    const built = buildOutput(witness.recipe, byId);
    if (built.error) return hold(built.error);
    if (canonical(built.output) !== canonical(trait.value)) return hold('MUTHER_DERIVATION_OUTPUT_MISMATCH');

    const declaredList = Array.isArray(trait.derivedFrom) ? trait.derivedFrom : [];
    const declared = new Set(declaredList.map(sourceKey));
    const used = new Set(built.sources.map(sourceKey));
    if (declared.size !== declaredList.length) return hold('MUTHER_DERIVATION_DUPLICATE_DECLARED_SOURCE');
    if (!sameSourceSet(declared, used)) return hold('MUTHER_DERIVATION_SOURCE_LABEL_MISMATCH');

    if (trait.operation === 'cross-pressure' && used.size < 2) return hold('MUTHER_DERIVATION_CROSS_PRESSURE_NOT_MATERIAL');

    verified.push({
      outputDimension: dimension,
      operation: trait.operation,
      reconstructedOutput: built.output,
      sourceParts: built.sources
    });
  }

  if (!verified.length) return hold('MUTHER_DERIVATION_NO_MUTATING_TRAITS');
  return {
    schema: 'zenomorph-muther-derivation-witness/v0.2',
    status: 'DERIVATION_WITNESS_VERIFIED',
    candidateId: candidate.candidateId,
    verifiedTraits: verified,
    provenancePreserved: true,
    semanticCausalityClaimed: false,
    aestheticJudgmentClaimed: false,
    incorporationAuthorized: false,
    bodyMutationApplied: false,
    nextRequiredGate: 'GUT_VAJRA_REVIEW_OF_DERIVATION_AND_CROSS_ORGAN_REGRESSION',
    boundary: 'This gate proves only bounded reconstructability: the declared output can be exactly reconstructed from cited source slices plus punctuation-only separators, and every declared source must materially appear in the reconstruction. It rejects arbitrary-output laundering, source-label swapping, unused provenance inflation, and duplicate declared-source padding, but it does not prove semantic causality, creativity, aesthetic value, assimilation, organ growth, or permission to modify the persistent body.'
  };
}

function hold(reason) {
  return {
    schema: 'zenomorph-muther-derivation-witness/v0.2',
    status: 'HOLD',
    reason,
    provenancePreserved: true,
    semanticCausalityClaimed: false,
    incorporationAuthorized: false,
    bodyMutationApplied: false
  };
}
