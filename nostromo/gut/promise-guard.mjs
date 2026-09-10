// NOSTROMO GUT candidate thickening: opaque Promise guard.
// This module is deliberately isolated from the formal gut-engine until CI evidence passes.

export function inspectPromiseMaterial(value, path = 'root', provenance = {}) {
  if (!(value instanceof Promise)) return null;

  return {
    path,
    value: 'Promise opaque async material',
    scalarKind: 'opaque-async',
    asyncType: 'Promise',
    status: 'QUARANTINE',
    route: 'HOLD',
    priority: 5,
    reason: 'promise-not-awaited-or-inspected',
    provenance: { ...provenance }
  };
}

export function isOpaqueAsyncAtom(atom) {
  return !!atom &&
    atom.scalarKind === 'opaque-async' &&
    atom.asyncType === 'Promise' &&
    atom.status === 'QUARANTINE' &&
    atom.route === 'HOLD';
}
