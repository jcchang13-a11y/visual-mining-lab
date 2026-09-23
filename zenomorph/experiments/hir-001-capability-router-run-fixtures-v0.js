#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const {route} = require('./hir-001-capability-router-v0');
const fixturePath = path.join(__dirname, 'hir-001-capability-router-fixtures-v0.json');
const doc = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
let passed = 0;
const results = doc.cases.map(c => {
  const actual = route(c);
  const mismatches = Object.entries(c.expected).filter(([k,v]) => actual[k] !== v).map(([k,v]) => ({field:k, expected:v, actual:actual[k]}));
  const ok = mismatches.length === 0;
  if (ok) passed++;
  return {id:c.id, ok, expected:c.expected, actual, mismatches};
});
const report = {
  schema:'zenomorph.hir.capability-router-fixture-result.v0',
  candidate:'HIR-001',
  stable_write:false,
  network:false,
  total:results.length,
  passed,
  failed:results.length-passed,
  results
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
process.exitCode = report.failed ? 1 : 0;
