import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { assessRelationBearingSpecimen } from './foreign-relation-specimen-gate.mjs';

const dataset = 'MaleCNS v1.0';
const neuronId = '12781';
const sourceUrl = `https://storage.googleapis.com/flyem-male-cns/v1.0/segmentation/skeletons-malecns/skeletons-swc/${neuronId}.swc`;

const response = await fetch(sourceUrl);
assert.equal(response.ok, true, `MaleCNS specimen fetch failed: ${response.status} ${response.statusText}`);
const text = await response.text();
assert.ok(text.length > 0, 'MaleCNS SWC specimen is empty');

const sha256 = crypto.createHash('sha256').update(text).digest('hex');
const rows = text.split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'))
  .map(line => line.split(/\s+/));

const nodes = rows
  .filter(cols => cols.length >= 7)
  .map(cols => ({ id: cols[0], parent: cols[6] }));
const relations = nodes
  .filter(node => node.parent !== '-1')
  .map(node => ({ source: node.parent, target: node.id }));

assert.ok(nodes.length > 2, 'Expected a real multi-node skeleton');
assert.ok(relations.length >= 2, 'Expected explicit parent-child relations in SWC');

const assessment = assessRelationBearingSpecimen({
  source: {
    identity: `sha256:${sha256}`,
    provider: 'HHMI Janelia FlyEM',
    dataset,
    neuronId,
    sourceUrl,
    license: 'CC-BY'
  },
  relations
});

assert.equal(assessment.status, 'PASS');
assert.equal(assessment.reason, 'traceable-relation-bearing-specimen');
assert.equal(assessment.behaviorChangeCandidate, 'NETWORK_LABELS_DO_NOT_COUNT_AS_NETWORK_EVIDENCE');
assert.equal(assessment.bodyAdmission, false);
assert.equal(assessment.persistentMutation, false);

const output = {
  schema: 'zenomorph-malecns-real-swc-gate/v0.1',
  organism: 'ZENOMORPH',
  habitat: 'NOSTROMO',
  dataset,
  neuronId,
  sourceUrl,
  license: 'CC-BY',
  sha256,
  byteLength: Buffer.byteLength(text),
  nodeCount: nodes.length,
  explicitParentChildRelations: relations.length,
  assessment,
  interpretationBoundary: 'This test only asks whether the candidate gate accepts a traceable specimen that actually carries relations. It does not infer that ZENOMORPH should imitate neuronal morphology or install a biological structure.',
  bodyAdmission: false,
  promotion: 'NONE'
};

console.log(JSON.stringify(output, null, 2));
