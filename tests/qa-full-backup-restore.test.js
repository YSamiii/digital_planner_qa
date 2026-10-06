const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function context(){const window={JournalModules:{}};const sandbox={window,Blob,atob,btoa,JSON,Set,Map,Object,Array,String,Number,Boolean,console};vm.createContext(sandbox);return sandbox;}
function load(sandbox,file){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});}
function expectCode(fn,code){assert.throws(fn,error=>String(error?.message)===code);}
const fixture=fs.readFileSync(path.join(__dirname,'fixtures','qa-full-backup-v1-synthetic.json'),'utf8');
const sandbox=context();load(sandbox,'js/legacy-journal-payload-store.js');load(sandbox,'js/qa-full-backup-restore.js');
const restore=sandbox.window.QAFullBackupRestore;
const v1=restore.parse(fixture,{validateState:()=>({ok:true})});
assert.equal(v1.envelope.backupVersion,1);assert.equal(v1.requiresSlimmingMigration,true);assert.equal(v1.summary.orders,1);assert.equal(v1.summary.media,1);
const rows=new Map();const store={put:async row=>rows.set(row.id,JSON.parse(JSON.stringify(row))),get:async id=>rows.get(id),remove:async id=>rows.delete(id),list:async()=>[...rows.values()]};
const manager=sandbox.window.JournalModules.createLegacyJournalPayloadManager(store);
(async()=>{
  const compacted=await manager.stageCompaction(v1.state.legacyJournalRecords);
  const oneLinePayload=manager.oneLineProvenancePayloadFor(v1.state.importProvenance.one_line_a_day);
  const compactOneLine=await manager.stageOneLineProvenance(v1.state.importProvenance.one_line_a_day);
  const migrated=JSON.parse(JSON.stringify(v1.state));migrated.legacyJournalRecords=compacted.records;migrated.importProvenance.one_line_a_day=compactOneLine;
  assert.equal(compacted.records[0].payloadRef,'legacy-v1');assert.equal(rows.get('legacy-v1').provenance.attributedContentRTFBase64,'c3ludGhldGlj');assert.equal(compactOneLine.format,2);
  restore.validateComponents({state:migrated,media:v1.media,legacyJournalPayloads:compacted.payloads,importProvenancePayloads:[oneLinePayload]});
  const v2={version:12,schemaVersion:12,appVersion:'0.23.4',backupVersion:2,exportedAt:'2026-10-06T12:00:00.000Z',state:migrated,media:v1.media,legacyJournalPayloads:compacted.payloads,importProvenancePayloads:[oneLinePayload]};
  const parsedV2=restore.parse(JSON.stringify(v2),{validateState:()=>({ok:true})});assert.equal(parsedV2.requiresSlimmingMigration,false);assert.equal(parsedV2.legacyJournalPayloads.length,1);
  expectCode(()=>restore.parse('{',{validateState:()=>({ok:true})}),'QA_BACKUP_INVALID_JSON');
  expectCode(()=>restore.parse(JSON.stringify({...v2,backupVersion:3}),{validateState:()=>({ok:true})}),'QA_BACKUP_UNSUPPORTED_FORMAT');
  expectCode(()=>restore.parse(JSON.stringify({...v2,schemaVersion:13,state:{...v2.state,schemaVersion:13}}),{validateState:()=>({ok:true})}),'QA_BACKUP_SCHEMA_TOO_NEW');
  expectCode(()=>restore.parse(JSON.stringify({...v2,legacyJournalPayloads:[]}),{validateState:()=>({ok:true})}),'QA_BACKUP_LEGACY_REF_MISSING');
  const backupPlan=fs.readFileSync(path.join(root,'js','v0210-backup-plan.js'),'utf8');
  assert.match(backupPlan,/idbMutationAttempted=true;\s*await qaFullBackupStore\.replaceFromBackup/);assert.match(backupPlan,/idbMutationAttempted&&!canonicalCommitted&&previousIdb/);assert.match(backupPlan,/commitQaRestoreCandidate\(candidate\)/);
  console.log('PASS qa full backup v1/v2 parser, slimming migration, reference validation, and rollback guards');
})().catch(error=>{console.error(error);process.exitCode=1;});
