// NOSTROMO connector evidence handoff v0.8
import fs from 'node:fs/promises';
import path from 'node:path';

const RESULT=path.join(process.cwd(),'nostromo','integration','connector-last-result.json');

export async function loadConnectorEvidence(){
  const raw=JSON.parse(await fs.readFile(RESULT,'utf8'));
  const failures=[];
  if(!['nostromo-connector-result/v0.1','nostromo-connector-result/v0.2','nostromo-connector-result/v0.3'].includes(raw.schema))failures.push('SCHEMA_MISMATCH');
  if(raw.status!=='PASS')failures.push('CONNECTOR_RESULT_NOT_PASS');
  if(raw.mutherDrive?.status!=='EXECUTED')failures.push('MUTHER_DRIVE_NOT_EXECUTED');
  if(raw.schema==='nostromo-connector-result/v0.3' && raw.mutherInternal?.status!=='EXECUTED')failures.push('MUTHER_INTERNAL_NOT_EXECUTED');
  if(raw.schema==='nostromo-connector-result/v0.3' && raw.mutherInternal?.sourceClass!=='GOOGLE_DRIVE_AUTHORIZED')failures.push('MUTHER_INTERNAL_SOURCE_UNVERIFIED');
  if(raw.dropletWeb?.status!=='EXECUTED')failures.push('DROPLET_WEB_NOT_EXECUTED');
  if(['nostromo-connector-result/v0.2','nostromo-connector-result/v0.3'].includes(raw.schema) && raw.dropletVerify?.status!=='EXECUTED')failures.push('DROPLET_VERIFY_NOT_EXECUTED');
  const completedAt=Date.parse(raw.completedAt||'');
  if(!Number.isFinite(completedAt))failures.push('COMPLETED_AT_INVALID');
  const muther={
    action:'MINE_DRIVE_QUERY',
    status:raw.mutherDrive?.status||'MISSING',
    query:raw.mutherDrive?.query||null,
    returnedCount:Number(raw.mutherDrive?.returnedCount||0),
    fingerprints:Array.isArray(raw.mutherDrive?.sampleFingerprints)?raw.mutherDrive.sampleFingerprints:[],
    boundary:raw.mutherDrive?.boundary||null
  };
  const mutherInternal=raw.mutherInternal?{
    action:'MINE_INTERNAL',
    status:raw.mutherInternal.status||'MISSING',
    sourceClass:raw.mutherInternal.sourceClass||null,
    query:raw.mutherInternal.query||null,
    returnedCount:Number(raw.mutherInternal.returnedCount||0),
    fingerprints:Array.isArray(raw.mutherInternal.sampleFingerprints)?raw.mutherInternal.sampleFingerprints:[],
    boundary:raw.mutherInternal.boundary||null
  }:null;
  const droplet={
    action:'SEARCH_EXTERNAL',
    status:raw.dropletWeb?.status||'MISSING',
    query:raw.dropletWeb?.query||null,
    evidenceCount:Number(raw.dropletWeb?.evidenceCount||0),
    publicEvidence:Array.isArray(raw.dropletWeb?.publicEvidence)?raw.dropletWeb.publicEvidence:[],
    boundary:raw.dropletWeb?.boundary||null
  };
  const dropletVerify=raw.dropletVerify?{
    action:'VERIFY',
    status:raw.dropletVerify.status||'MISSING',
    claim:raw.dropletVerify.claim||null,
    evidenceCount:Number(raw.dropletVerify.evidenceCount||0),
    evidence:Array.isArray(raw.dropletVerify.redactedEvidence)?raw.dropletVerify.redactedEvidence:[],
    boundary:raw.dropletVerify.boundary||null
  }:null;
  return {
    schema:'nostromo-connector-evidence/v0.8',
    status:failures.length?'REJECTED':'ACCEPTED',
    completedAt:raw.completedAt||null,
    actions:{muther,mutherInternal,droplet,dropletVerify},
    failures,
    boundary:'This module validates and hands off persisted evidence from an authorized external connector runtime. It does not itself call Google Drive or a search engine. MINE_INTERNAL is accepted only when the persisted evidence identifies an explicitly authorized source class; the current verified source is query-scoped Google Drive. Private raw Drive content, titles, IDs and URLs are not repository data.'
  };
}
