(function(){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const asArray=(value,label)=>{if(!Array.isArray(value))throw new Error(`QA_BACKUP_${label}_MISSING`);return value;};
  const uniqueIds=(rows,label)=>{
    const seen=new Set();
    for(const row of rows){const id=String(row?.id||'');if(!id)throw new Error(`QA_BACKUP_${label}_ID_MISSING`);if(seen.has(id))throw new Error(`QA_BACKUP_${label}_ID_DUPLICATE`);seen.add(id);}return seen;
  };
  const collectMediaRefs=(node,refs=new Set(),depth=0)=>{
    if(depth>32||!node||typeof node!=='object')return refs;
    if(Array.isArray(node)){node.forEach(value=>collectMediaRefs(value,refs,depth+1));return refs;}
    Object.entries(node).forEach(([key,value])=>{if((key==='imageRef'||key==='mediaId'||key==='companionMediaId')&&typeof value==='string'&&value)refs.add(value);else collectMediaRefs(value,refs,depth+1);});
    return refs;
  };
  function parse(text,{validateState}={}){
    let envelope;try{envelope=JSON.parse(String(text||''));}catch(_){throw new Error('QA_BACKUP_INVALID_JSON');}
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope))throw new Error('QA_BACKUP_INVALID_ENVELOPE');
    if(Number(envelope.backupVersion)!==2)throw new Error('QA_BACKUP_UNSUPPORTED_FORMAT');
    const state=clone(envelope.state);
    if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('QA_BACKUP_STATE_MISSING');
    if(Number(envelope.schemaVersion)!==12||Number(state.schemaVersion)!==12)throw new Error('QA_BACKUP_UNSUPPORTED_SCHEMA');
    const health=typeof validateState==='function'?validateState(state):{ok:true};
    if(!health?.ok)throw new Error('QA_BACKUP_STATE_INVALID');
    const media=asArray(envelope.media,'MEDIA'),legacyJournalPayloads=asArray(envelope.legacyJournalPayloads,'LEGACY_PAYLOADS'),importProvenancePayloads=asArray(envelope.importProvenancePayloads,'PROVENANCE_PAYLOADS');
    const mediaIds=uniqueIds(media,'MEDIA'),legacyIds=uniqueIds(legacyJournalPayloads,'LEGACY_PAYLOADS'),provenanceIds=uniqueIds(importProvenancePayloads,'PROVENANCE_PAYLOADS');
    media.forEach(row=>{if(typeof row?.data!=='string')throw new Error('QA_BACKUP_MEDIA_DATA_MISSING');try{atob(row.data);}catch(_){throw new Error('QA_BACKUP_MEDIA_DATA_INVALID');}});
    legacyJournalPayloads.forEach(row=>{if(!row||typeof row!=='object')throw new Error('QA_BACKUP_LEGACY_PAYLOAD_INVALID');});
    importProvenancePayloads.forEach(row=>{if(!row||typeof row!=='object')throw new Error('QA_BACKUP_PROVENANCE_PAYLOAD_INVALID');});
    const payloadIds=new Set([...legacyIds,...provenanceIds]);
    if(payloadIds.size!==legacyIds.size+provenanceIds.size)throw new Error('QA_BACKUP_PAYLOAD_ID_DUPLICATE');
    (state.legacyJournalRecords||[]).forEach(record=>{const ref=String(record?.payloadRef||'');if(ref&&!payloadIds.has(ref))throw new Error('QA_BACKUP_LEGACY_REF_MISSING');});
    const oneLine=state.importProvenance?.one_line_a_day;
    if(oneLine?.format===2&&oneLine?.payloadRef&&!payloadIds.has(String(oneLine.payloadRef)))throw new Error('QA_BACKUP_PROVENANCE_REF_MISSING');
    const referencedMedia=collectMediaRefs(state);
    legacyJournalPayloads.forEach(payload=>collectMediaRefs(payload,referencedMedia));
    importProvenancePayloads.forEach(payload=>collectMediaRefs(payload,referencedMedia));
    for(const ref of referencedMedia)if(!mediaIds.has(ref))throw new Error('QA_BACKUP_MEDIA_REF_MISSING');
    return {envelope:{version:envelope.version,backupVersion:envelope.backupVersion,appVersion:String(envelope.appVersion||''),schemaVersion:Number(envelope.schemaVersion),exportedAt:String(envelope.exportedAt||'')},state,media,legacyJournalPayloads,importProvenancePayloads,summary:{entries:(state.entries||[]).length,dailyDates:Object.keys(state.dailyBlocks||{}).length,orders:(state.orders?.items||[]).length,inventory:(state.inventory?.items||[]).length,legacyRecords:(state.legacyJournalRecords||[]).length,media:media.length,legacyPayloads:legacyJournalPayloads.length,provenancePayloads:importProvenancePayloads.length,snapshotPayloadsIncluded:false}};
  }
  window.QAFullBackupRestore={parse};
})();
