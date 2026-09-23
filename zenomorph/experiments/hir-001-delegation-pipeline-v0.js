'use strict';

/**
 * HIR-001 delegation pipeline v0.
 * Candidate/isolated only. No Stable writes. No embedded credentials.
 * Wires an already-produced DELEGATE decision through the provider-neutral
 * transport and then through an explicitly supplied receipt verifier.
 */

const { invokeDelegation } = require('./hir-001-provider-neutral-transport-adapter-v0');

function stop(reason, detail = {}) {
  return { state: 'STOP', stableWrite: false, reason, ...detail };
}

async function runDelegationPipeline({ decision, connector, transportPolicy = {}, verifyReceipt }) {
  const transported = await invokeDelegation({ decision, connector, policy: transportPolicy });
  if (!transported || transported.state !== 'RETURNED_UNVERIFIED') {
    return stop('TRANSPORT_NOT_RETURNED', { transport: transported ?? null });
  }

  if (typeof verifyReceipt !== 'function') {
    return stop('NO_RECEIPT_VERIFIER', {
      transport: { state: transported.state, provider: transported.provider, connectorId: transported.connectorId }
    });
  }

  let verified;
  try {
    verified = await verifyReceipt(transported.receipt);
  } catch (error) {
    return stop('RECEIPT_VERIFICATION_FAILED', {
      provider: transported.provider,
      connectorId: transported.connectorId,
      error: String(error && error.message ? error.message : error)
    });
  }

  if (!verified || verified.state !== 'INTEGRATE_CANDIDATE') {
    return stop('RECEIPT_REJECTED', {
      provider: transported.provider,
      connectorId: transported.connectorId,
      verification: verified ?? null
    });
  }

  return {
    state: 'INTEGRATE_CANDIDATE',
    stableWrite: false,
    provider: transported.provider,
    connectorId: transported.connectorId,
    transportState: transported.state,
    verification: verified
  };
}

module.exports = { runDelegationPipeline };
