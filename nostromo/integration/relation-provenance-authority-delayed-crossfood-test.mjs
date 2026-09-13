import fs from 'node:fs';
import assert from 'node:assert/strict';
import { assessRelationProvenanceAuthority } from './relation-provenance-authority-gate.mjs';

const expressSpecimen=JSON.parse(fs.readFileSync(new URL('../research/level1-express-dependency-specimen-v0.1.json',import.meta.url),'utf8'));

const explicitDependencyRelations=[
  ...expressSpecimen.dependencies,
  ...expressSpecimen.devDependencies
].map(([name,version],index)=>({
  source:`${expressSpecimen.package.name}@${expressSpecimen.package.version}`,
  target:`${name}@${version}`,
  type:'declared-dependency',
  origin:'source-explicit',
  evidenceRef:index<expressSpecimen.dependencies.length
    ? `dependencies:${index}`
    : `devDependencies:${index-expressSpecimen.dependencies.length}`
}));

const explicitResult=assessRelationProvenanceAuthority(expressSpecimen,{
  relations:explicitDependencyRelations,
  minimumRelations:4
});
assert.equal(explicitResult.status,'PASS');
assert.equal(explicitResult.authoritativeRelationCount,16);

// Tempting but source-unauthorized graph: dependencies sharing words or version prefixes
// are not edges declared by package.json and must remain quarantined.
const lexicalHeuristic=[
  {
    source:'content-disposition@^2.0.1',
    target:'content-type@^2.0.0',
    type:'similar-name',
    origin:'heuristic-lexical-similarity',
    evidenceRef:'derived:shared-token-content'
  },
  {
    source:'accepts@^2.0.0',
    target:'depd@^2.0.0',
    type:'same-version-prefix',
    origin:'heuristic-version-similarity',
    evidenceRef:'derived:shared-major-range'
  }
];
const heuristicResult=assessRelationProvenanceAuthority(expressSpecimen,{
  relations:lexicalHeuristic,
  minimumRelations:2
});
assert.equal(heuristicResult.status,'HOLD');
assert.equal(heuristicResult.authoritativeRelationCount,0);

console.log(JSON.stringify({
  schema:'zenomorph-delayed-crossfood-relation-provenance-test/v0.1',
  food:'expressjs/express package.json',
  sourceBlobSha:expressSpecimen.source.sourceBlobSha,
  explicitResult,
  heuristicResult,
  conclusion:'The relation-origin candidate survives a third materially different food: source-declared software dependencies pass, lexical/version-similarity edges remain quarantined. Candidate only; no body admission.'
},null,2));
