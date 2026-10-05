(function(){
  'use strict';
  const text=value=>String(value??'');
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const bytes=value=>new Blob([JSON.stringify(value??null)]).size;
  const LEGACY_PAYLOAD_VERSION=1;
  const ONE_LINE_PROVENANCE_PAYLOAD_ID='import-provenance:one_line_a_day:v1';

  function compactProvenance(provenance){
    if(!provenance||typeof provenance!=='object')return provenance;
    const {attributedContentRTFBase64,originalTags,...index}=provenance;
    return index;
  }

  function payloadFor(record){
    const provenance=record?.provenance&&typeof record.provenance==='object'?record.provenance:{};
    return {
      id:text(record?.id),
      version:LEGACY_PAYLOAD_VERSION,
      provenance:{
        attributedContentRTFBase64:text(provenance.attributedContentRTFBase64),
        originalTags:Array.isArray(provenance.originalTags)?clone(provenance.originalTags):[]
      },
      legacyAttachmentMetadata:Array.isArray(record?.legacyAttachmentMetadata)?clone(record.legacyAttachmentMetadata):[],
      duplicateQuestion:record?.question===record?.title?text(record.question):'',
      duplicateAnswer:record?.answer===record?.content?text(record.answer):''
    };
  }

  function needsPayload(record){
    const provenance=record?.provenance||{};
    return !!text(provenance.attributedContentRTFBase64)||Array.isArray(record?.legacyAttachmentMetadata)||record?.question===record?.title||record?.answer===record?.content;
  }

  function compactRecord(record){
    if(!record||typeof record!=='object'||record.payloadRef)return clone(record);
    if(!needsPayload(record))return clone(record);
    const next=clone(record);
    next.provenance=compactProvenance(next.provenance);
    delete next.legacyAttachmentMetadata;
    if(next.question===next.title)delete next.question;
    if(next.answer===next.content)delete next.answer;
    next.payloadRef=text(record.id);
    next.payloadVersion=LEGACY_PAYLOAD_VERSION;
    return next;
  }

  function restoreRecord(index,payload){
    const next=clone(index);
    if(!payload||typeof payload!=='object')return next;
    if(payload.provenance&&typeof payload.provenance==='object')next.provenance={...(next.provenance||{}),...clone(payload.provenance)};
    if(Array.isArray(payload.legacyAttachmentMetadata))next.legacyAttachmentMetadata=clone(payload.legacyAttachmentMetadata);
    if(payload.duplicateQuestion)next.question=payload.duplicateQuestion;
    if(payload.duplicateAnswer)next.answer=payload.duplicateAnswer;
    return next;
  }

  function aggregateFields(records){
    const rows=new Map();
    const add=(path,value)=>{const size=bytes(value),row=rows.get(path)||{path,bytes:0,count:0,maxBytes:0};row.bytes+=size;row.count++;row.maxBytes=Math.max(row.maxBytes,size);rows.set(path,row);};
    (records||[]).forEach(record=>{
      if(!record||typeof record!=='object')return;
      Object.entries(record).forEach(([key,value])=>{
        add(`legacyJournalRecords[].${key}`,value);
        if(key==='provenance'&&value&&typeof value==='object')Object.entries(value).forEach(([child,childValue])=>add(`legacyJournalRecords[].provenance.${child}`,childValue));
      });
    });
    return [...rows.values()].map(row=>({...row,averageBytes:row.count?Math.round(row.bytes/row.count):0})).sort((a,b)=>b.bytes-a.bytes);
  }

  function analyzeImportProvenance(value){
    const rows=[];
    const walk=(node,path)=>{
      if(node===undefined)return;
      const size=bytes(node);
      rows.push({path,bytes:size});
      if(!node||typeof node!=='object')return;
      if(Array.isArray(node))node.forEach((item,index)=>walk(item,`${path}[]`));
      else Object.entries(node).forEach(([key,item])=>walk(item,`${path}.${key}`));
    };
    walk(value||{},'importProvenance');
    const grouped=new Map();
    rows.forEach(row=>{const key=row.path.replace(/\[\d+\]/g,'[]');const prior=grouped.get(key)||{path:key,bytes:0,count:0,maxBytes:0};prior.bytes+=row.bytes;prior.count++;prior.maxBytes=Math.max(prior.maxBytes,row.bytes);grouped.set(key,prior);});
    return [...grouped.values()].map(row=>({...row,averageBytes:row.count?Math.round(row.bytes/row.count):0})).sort((a,b)=>b.bytes-a.bytes);
  }

  function analyzeLegacyJournalFootprint(state){
    const records=Array.isArray(state?.legacyJournalRecords)?state.legacyJournalRecords:[];
    const inline=records.filter(record=>!record?.payloadRef);
    const payloadCandidates=inline.filter(needsPayload).map(payloadFor);
    const before=bytes(records),after=bytes(inline.map(compactRecord).concat(records.filter(record=>record?.payloadRef)));
    const rtf=inline.filter(record=>text(record?.provenance?.attributedContentRTFBase64));
    const normalized=inline.filter(record=>text(record?.content));
    const raw=inline.filter(record=>record?.provenance?.sourceApp||record?.provenance?.sourceEntryId);
    return {
      readOnly:true,
      recordCount:records.length,
      totalBytes:before,
      fieldBytes:aggregateFields(records),
      top20:aggregateFields(records).slice(0,20),
      recordsContaining:{provenance:records.filter(record=>record?.provenance).length,attributedContentRTFBase64:rtf.length,normalizedText:normalized.length,sourceRawData:raw.length},
      importProvenance:{totalBytes:bytes(state?.importProvenance||{}),fieldBytes:analyzeImportProvenance(state?.importProvenance||{}).slice(0,20)},
      estimated:{canonicalAfterRichPayloadMove:after,canonicalReductionBytes:Math.max(0,before-after),payloadBytes:bytes(payloadCandidates),payloadRecords:payloadCandidates.length}
    };
  }

  function isCompactOneLineProvenance(group){return !!group&&group.format===2&&group.entries&&typeof group.entries==='object';}
  function oneLineEntries(group){return isCompactOneLineProvenance(group)?group.entries:(group&&typeof group==='object'?group:{});}
  function oneLineEntry(group,key){return oneLineEntries(group)[key];}
  function setOneLineEntry(group,key,value){const entries=oneLineEntries(group);entries[key]=isCompactOneLineProvenance(group)?{fingerprint:text(value?.fingerprint),matchedExisting:value?.matchedExisting===true,replacedCurrent:value?.replacedCurrent===true}:value;return entries[key];}
  function oneLineEntryCount(group){return Object.keys(oneLineEntries(group)).length;}
  function compactOneLineProvenance(group){
    if(isCompactOneLineProvenance(group))return clone(group);
    const entries={};
    Object.entries(group||{}).forEach(([key,value])=>{if(!value||typeof value!=='object')return;entries[key]={fingerprint:text(value.fingerprint),matchedExisting:value.matchedExisting===true,replacedCurrent:value.replacedCurrent===true};});
    return {format:2,payloadRef:ONE_LINE_PROVENANCE_PAYLOAD_ID,sourceApp:'one_line_a_day_v7',sourceVersion:7,entries};
  }

  function createLegacyJournalPayloadManager(store){
    if(!store)throw new Error('Legacy journal payload store unavailable');
    async function putVerified(payload){
      if(!payload?.id)throw new Error('Legacy journal payload has no id');
      const current=await store.get(payload.id);
      if(current){
        if(JSON.stringify(current)!==JSON.stringify(payload))throw new Error(`LEGACY_PAYLOAD_COLLISION:${payload.id}`);
        return {id:payload.id,reused:true};
      }
      await store.put(payload);
      const readBack=await store.get(payload.id);
      if(JSON.stringify(readBack)!==JSON.stringify(payload))throw new Error(`LEGACY_PAYLOAD_READBACK_FAILED:${payload.id}`);
      return {id:payload.id,reused:false};
    }
    async function stageCompaction(records,{batchSize=25,onProgress}={}){
      const source=Array.isArray(records)?records:[];
      const candidates=source.filter(record=>!record?.payloadRef&&needsPayload(record));
      for(let offset=0;offset<candidates.length;offset+=batchSize){
        const batch=candidates.slice(offset,offset+batchSize);
        for(const record of batch)await putVerified(payloadFor(record));
        onProgress?.({completed:Math.min(offset+batch.length,candidates.length),total:candidates.length});
      }
      return {records:source.map(compactRecord),payloadCount:candidates.length};
    }
    async function exportForBackup(records){
      const refs=[...new Set((records||[]).map(record=>text(record?.payloadRef)).filter(Boolean))];
      const payloads=[];
      for(const id of refs){const payload=await store.get(id);if(!payload||payload.id!==id)throw new Error(`LEGACY_PAYLOAD_BACKUP_MISSING:${id}`);payloads.push(clone(payload));}
      return payloads;
    }
    async function stageOneLineProvenance(group){
      if(isCompactOneLineProvenance(group))return clone(group);
      const payload={id:ONE_LINE_PROVENANCE_PAYLOAD_ID,version:1,type:'one_line_a_day_provenance',data:clone(group||{})};
      await store.put(payload);
      const readBack=await store.get(payload.id);
      if(JSON.stringify(readBack)!==JSON.stringify(payload))throw new Error('ONE_LINE_PROVENANCE_READBACK_FAILED');
      return compactOneLineProvenance(group);
    }
    async function exportOneLineProvenanceForBackup(group){
      if(!isCompactOneLineProvenance(group)||!group.payloadRef)return [];
      const payload=await store.get(group.payloadRef);
      if(!payload||payload.id!==group.payloadRef)throw new Error(`ONE_LINE_PROVENANCE_BACKUP_MISSING:${group.payloadRef}`);
      return [clone(payload)];
    }
    async function restoreOneLineProvenanceFromBackup(payloads){for(const payload of payloads||[]){if(payload?.type!=='one_line_a_day_provenance')continue;await store.put(clone(payload));const readBack=await store.get(payload.id);if(JSON.stringify(readBack)!==JSON.stringify(payload))throw new Error('ONE_LINE_PROVENANCE_RESTORE_READBACK_FAILED');}}
    async function restoreFromBackup(payloads){
      if(!Array.isArray(payloads))return;
      for(const payload of payloads)await putVerified(payload);
    }
    async function hydrateRecord(record){
      if(!record?.payloadRef)return clone(record);
      const payload=await store.get(record.payloadRef);
      if(!payload)throw new Error(`LEGACY_PAYLOAD_MISSING:${record.payloadRef}`);
      return restoreRecord(record,payload);
    }
    return {stageCompaction,stageOneLineProvenance,exportForBackup,exportOneLineProvenanceForBackup,restoreFromBackup,restoreOneLineProvenanceFromBackup,hydrateRecord,payloadFor,compactRecord,needsPayload};
  }

  window.JournalModules=window.JournalModules||{};
  window.JournalModules.createLegacyJournalPayloadManager=createLegacyJournalPayloadManager;
  window.JournalModules.analyzeLegacyJournalFootprint=analyzeLegacyJournalFootprint;
  window.JournalModules.legacyJournalProvenance={isCompactOneLineProvenance,oneLineEntries,oneLineEntry,setOneLineEntry,oneLineEntryCount,compactOneLineProvenance};
})();
