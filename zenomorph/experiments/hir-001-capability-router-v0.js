#!/usr/bin/env node
'use strict';

/* HIR-001 isolated candidate. No network calls, no secrets, no Stable writes. */
const STATES = Object.freeze({
  CAN_DO: 'CAN_DO_VERIFIABLY',
  SPECIALIST: 'SPECIALIST_PREFERRED',
  BLOCKED_TOOL: 'BLOCKED_MISSING_TOOL',
  BLOCKED_PERMISSION: 'BLOCKED_PERMISSION',
  BLOCKED_DATA: 'BLOCKED_DATA',
  UNKNOWN: 'UNKNOWN'
});

function route(task) {
  if (!task || typeof task !== 'object') return {state: STATES.UNKNOWN, action: 'STOP', reason: 'invalid_task'};
  const constraints = task.constraints || {};
  const capabilities = new Set(task.available_capabilities || []);
  const required = task.required_capability;

  if (task.data_available === false) return {state: STATES.BLOCKED_DATA, action: 'STOP', reason: 'required_data_unavailable'};
  if (task.permission_available === false) return {state: STATES.BLOCKED_PERMISSION, action: 'STOP', reason: 'permission_unavailable'};
  if (required && capabilities.has(required)) return {state: STATES.CAN_DO, action: 'SELF', reason: 'required_capability_present'};

  const candidates = (task.collaborators || []).filter(c => {
    if (!c || c.available !== true || c.capability !== required) return false;
    if (constraints.cost_max === 0 && Number(c.cost || 0) > 0) return false;
    if (constraints.privacy && c.privacy_compatible !== true) return false;
    return true;
  });

  if (candidates.length) {
    const chosen = candidates.sort((a,b) => Number(b.fit || 0) - Number(a.fit || 0))[0];
    return {
      state: STATES.SPECIALIST,
      action: 'DELEGATE',
      collaborator_id: chosen.id,
      handoff: {task: task.task, required_capability: required, minimum_input: task.minimum_input || null},
      verification_required: true,
      reason: 'eligible_specialist_available'
    };
  }

  return {state: STATES.BLOCKED_TOOL, action: 'STOP', reason: 'no_eligible_capability_or_collaborator'};
}

if (require.main === module) {
  let raw='';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => raw += d);
  process.stdin.on('end', () => {
    try { process.stdout.write(JSON.stringify(route(JSON.parse(raw)), null, 2) + '\n'); }
    catch (_) { process.stdout.write(JSON.stringify({state:STATES.UNKNOWN,action:'STOP',reason:'invalid_json'}, null, 2)+'\n'); process.exitCode=2; }
  });
}
module.exports = {route, STATES};
