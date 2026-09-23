#!/usr/bin/env node
'use strict';

/* HIR-001 isolated candidate. Verify collaborator returns before integration.
   No network, no secrets, no Stable writes. */
function verifyReceipt(receipt) {
  const fail = reason => ({accepted:false, action:'REJECT', reason, stable_write:false});
  if (!receipt || typeof receipt !== 'object') return fail('invalid_receipt');
  if (receipt.cost == null || Number(receipt.cost) > 0) return fail('nonzero_or_unknown_cost');
  if (receipt.privacy_compatible !== true) return fail('privacy_not_verified');
  if (!receipt.collaborator_id || !receipt.task_id) return fail('missing_identity');
  if (!receipt.provenance || !receipt.provenance.source || !receipt.provenance.received_at) return fail('missing_provenance');
  if (!receipt.output || typeof receipt.output !== 'object') return fail('missing_output');
  if (receipt.claimed_complete !== true) return fail('collaborator_did_not_claim_complete');
  if (!receipt.verification || receipt.verification.independent_check !== true) return fail('independent_verification_missing');
  if (receipt.verification.contradiction_found === true) return fail('verification_contradiction');
  return {accepted:true, action:'INTEGRATE_CANDIDATE', reason:'verified_zero_cost_privacy_compatible_receipt', stable_write:false};
}

if (require.main === module) {
  let raw='';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => raw += d);
  process.stdin.on('end', () => {
    try { process.stdout.write(JSON.stringify(verifyReceipt(JSON.parse(raw)), null, 2)+'\n'); }
    catch (_) { process.stdout.write(JSON.stringify({accepted:false,action:'REJECT',reason:'invalid_json',stable_write:false},null,2)+'\n'); process.exitCode=2; }
  });
}
module.exports={verifyReceipt};
