'use strict';

/**
 * HIR-001 provider-neutral collaborator transport adapter v0.
 * Candidate/isolated only. No Stable writes. No embedded credentials.
 * Turns a DELEGATE decision into a real connector invocation only when the
 * caller supplies an explicitly permitted connector function.
 */

function fail(reason, detail = {}) {
  return { state: 'STOP', invoked: false, reason, ...detail };
}

async function invokeDelegation({ decision, connector, policy = {} }) {
  if (!decision || decision.action !== 'DELEGATE') return fail('NOT_A_DELEGATE_DECISION');
  if (!decision.handoff) return fail('MISSING_HANDOFF');
  if (!connector || typeof connector.invoke !== 'function') return fail('NO_EXECUTABLE_CONNECTOR');

  const meta = connector.meta || {};
  if (meta.enabled !== true) return fail('CONNECTOR_DISABLED');
  if (meta.cost !== 0) return fail('NONZERO_OR_UNKNOWN_COST', { cost: meta.cost ?? null });
  if (meta.privacyCompatible !== true) return fail('PRIVACY_INCOMPATIBLE');
  if (!meta.provider || !meta.connectorId) return fail('MISSING_CONNECTOR_PROVENANCE');
  if (policy.allowedProviders && !policy.allowedProviders.includes(meta.provider)) {
    return fail('PROVIDER_NOT_ALLOWED', { provider: meta.provider });
  }

  const startedAt = new Date().toISOString();
  try {
    const result = await connector.invoke(decision.handoff);
    return {
      state: 'RETURNED_UNVERIFIED',
      invoked: true,
      stableWrite: false,
      provider: meta.provider,
      connectorId: meta.connectorId,
      startedAt,
      finishedAt: new Date().toISOString(),
      receipt: {
        collaboratorIdentity: result?.identity ?? meta.provider,
        provenance: result?.provenance ?? { provider: meta.provider, connectorId: meta.connectorId },
        output: result?.output ?? null,
        completed: result?.completed === true,
        cost: 0,
        privacyCompatible: true,
        independentlyVerified: false
      }
    };
  } catch (error) {
    return fail('CONNECTOR_INVOCATION_FAILED', {
      provider: meta.provider,
      connectorId: meta.connectorId,
      error: String(error && error.message ? error.message : error)
    });
  }
}

module.exports = { invokeDelegation };
