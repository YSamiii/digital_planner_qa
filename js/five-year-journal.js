(function(){
  'use strict';
  const SOURCE_APP='legacy-five-year-journal';
  const QUESTION_TAG='每日一问',GROWTH_TAG='熹熹成长日记',EVENT_TAG='今日大事件';
  const SYSTEM_QUESTIONS=[
    {id:'system-new-year',text:'我现在最期待的事情是什么？'},
    {id:'system-small-joy',text:'今天有什么小小的快乐？'},
    {id:'system-grateful',text:'今天我最感谢什么？'},
    {id:'system-proud',text:'今天我为自己感到骄傲的是什么？'},
    {id:'system-kindness',text:'今天我感受到的一份善意是什么？'},
    {id:'system-learned',text:'今天我学到了什么？'},
    {id:'system-surprise',text:'今天有什么让我意外的事？'},
    {id:'system-calm',text:'今天哪一刻让我觉得平静？'},
    {id:'system-energy',text:'今天什么事情给了我能量？'},
    {id:'system-rest',text:'今天我怎样照顾了自己？'},
    {id:'system-connection',text:'今天我和谁有一段温暖的连接？'},
    {id:'system-home',text:'今天家里最有趣的小事是什么？'},
    {id:'system-child',text:'今天熹熹让我记住的一句话或一个瞬间是什么？'},
    {id:'system-growth',text:'今天我发现自己有什么新的变化？'},
    {id:'system-brave',text:'今天我做了哪件需要一点勇气的事？'},
    {id:'system-slow',text:'今天我愿意慢下来做什么？'},
    {id:'system-focus',text:'今天最值得被记住的一个细节是什么？'},
    {id:'system-wish',text:'如果明天可以带走今天的一样东西，我想带走什么？'},
    {id:'system-thanks-self',text:'今天我想对自己说一句什么话？'},
    {id:'system-season',text:'今天的天气、光线或季节让我想到什么？'},
    {id:'system-try',text:'今天我尝试了什么新事物？'},
    {id:'system-help',text:'今天我帮助了谁，或谁帮助了我？'},
    {id:'system-smile',text:'今天什么让我笑了？'},
    {id:'system-simple',text:'今天一件简单却美好的事是什么？'},
    {id:'system-next',text:'明天我最想留出时间做什么？'}
  ];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const pad=value=>String(value).padStart(2,'0');
  const validDate=(year,month,day)=>{const date=new Date(Date.UTC(Number(year),Number(month)-1,Number(day)));return Number.isInteger(Number(year))&&Number.isInteger(Number(month))&&Number.isInteger(Number(day))&&date.getUTCFullYear()===Number(year)&&date.getUTCMonth()===Number(month)-1&&date.getUTCDate()===Number(day);};
  const dateOf=entry=>`${String(entry.year).padStart(4,'0')}-${pad(entry.month)}-${pad(entry.day)}`;
  const sourceKey=id=>`${SOURCE_APP}:${String(id)}`;
  const normalizeTag=tag=>String(tag||'').replace(/\u3000/g,' ').trim();
  function classify(entry){const tags=Array.isArray(entry.tags)?entry.tags.filter(x=>typeof x==='string').map(normalizeTag).filter(Boolean):[];if(tags.includes(GROWTH_TAG))return 'growth';if(tags.includes(QUESTION_TAG))return 'five_year_question';if(tags.includes(EVENT_TAG))return 'event';return 'legacy_journal';}
  function normalizeEntry(entry,exportDate){const originalTags=Array.isArray(entry.tags)?entry.tags.filter(x=>typeof x==='string'):[],tags=originalTags.map(normalizeTag).filter(Boolean),attachments=Array.isArray(entry.attachments)?entry.attachments.filter(x=>x&&typeof x==='object').map((item,index)=>({id:String(item.id||''),fileName:String(item.fileName||''),type:String(item.type||'image'),sortOrder:Number.isFinite(Number(item.sortOrder))?Number(item.sortOrder):index,status:'missing_media'})):[],type=classify({...entry,tags});return {id:`legacy-${String(entry.id)}`,recordType:type,date:dateOf(entry),timestamp:typeof entry.timestamp==='string'||typeof entry.timestamp==='number'?entry.timestamp:'',title:String(entry.title||''),content:String(entry.content||''),question:type==='five_year_question'?String(entry.title||''):'',answer:type==='five_year_question'?String(entry.content||''):'',growthTags:type==='growth'?tags.filter(tag=>tag!==GROWTH_TAG):[],weather:entry.weather??null,attachments,legacyAttachmentMetadata:attachments.map(item=>({...item})),provenance:{sourceApp:SOURCE_APP,sourceEntryId:String(entry.id),sourceExportDate:exportDate||'',originalTags,attributedContentRTFBase64:typeof entry.attributedContentRTFBase64==='string'?entry.attributedContentRTFBase64:''},createdAt:Date.now(),updatedAt:Date.now()};}
  function validateManifest(payload){const invalid=[];if(!payload||typeof payload!=='object')return {ok:false,error:'文件不是有效 JSON 对象。'};if(!Array.isArray(payload.entries))return {ok:false,error:'无法识别五年日记 manifest：entries 必须是数组。'};const normalized=[];payload.entries.forEach((entry,index)=>{if(!entry||typeof entry!=='object'||entry.id===undefined||entry.id===null||String(entry.id)===''||!validDate(entry.year,entry.month,entry.day)){invalid.push(index+1);return;}normalized.push(normalizeEntry(entry,payload.exportDate));});const counts={five_year_question:0,growth:0,event:0,legacy_journal:0,media:0};normalized.forEach(record=>{counts[record.recordType]+=1;counts.media+=(record.attachments||[]).length;});return {ok:true,records:normalized,invalid,preview:{total:normalized.length,counts,invalid:invalid.length}};}
  function stageImport(state,validated){if(!validated?.ok)throw new Error('Cannot stage an invalid manifest.');const next={legacyJournalRecords:clone(state.legacyJournalRecords||[]),legacyImportTombstones:clone(state.legacyImportTombstones||{})};const existing=new Set(next.legacyJournalRecords.map(record=>record.provenance?.sourceApp===SOURCE_APP?sourceKey(record.provenance.sourceEntryId):''));let imported=0,duplicates=0,tombstones=0,missingMedia=0;for(const record of validated.records){const key=sourceKey(record.provenance.sourceEntryId);if(next.legacyImportTombstones[key]){tombstones++;continue;}if(existing.has(key)){duplicates++;continue;}next.legacyJournalRecords.push(record);existing.add(key);imported++;missingMedia+=(record.attachments||[]).length;}return {next,result:{imported,duplicates,tombstones,invalid:validated.invalid.length,missingMedia}};}
  const mediaIdPart=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const mediaMime=fileName=>/\.jpe?g$/i.test(fileName)?'image/jpeg':/\.png$/i.test(fileName)?'image/png':/\.heic$/i.test(fileName)?'image/heic':/\.mov$/i.test(fileName)?'video/quicktime':/\.mp4$/i.test(fileName)?'video/mp4':'application/octet-stream';
  function createLegacyMediaRecoveryAdapter(){
    function buildAttachmentMapping(entry,attachment,sourceZip){const sourceEntryId=String(entry?.id||''),sourceAttachmentId=String(attachment?.id||''),fileName=String(attachment?.fileName||'');if(!sourceEntryId||!sourceAttachmentId||!fileName)throw new Error('Legacy attachment mapping requires source record ID, attachment ID, and fileName.');const attachmentType=String(attachment.type||'image'),targetRecordId=`legacy-${sourceEntryId}`,baseId=`legacy-five-year-media-${mediaIdPart(sourceAttachmentId)}`,isLivePhoto=attachmentType==='livePhoto',primaryMime=mediaMime(fileName),companionFileName=isLivePhoto?`${sourceAttachmentId}.mov`:'';const provenance={sourceApp:SOURCE_APP,sourceZipSha256:String(sourceZip?.sha256||''),sourceZipFileName:String(sourceZip?.fileName||''),sourceEntryId,sourceAttachmentId,originalFileName:fileName,attachmentType};const primary={mediaId:`${baseId}-primary`,archivePath:`attachments/${primaryMime.startsWith('video/')?'videos':'images'}/${fileName}`,fileName,mime:primaryMime,ownerType:'legacy-five-year',ownerId:targetRecordId,component:'primary',provenance};const companion=isLivePhoto?{mediaId:`${baseId}-companion`,archivePath:`attachments/videos/${companionFileName}`,fileName:companionFileName,mime:'video/quicktime',ownerType:'legacy-five-year',ownerId:targetRecordId,component:'live_photo_companion',provenance:{...provenance,originalFileName:companionFileName}}:null;const targetAttachmentReference={id:sourceAttachmentId,fileName,type:attachmentType,sortOrder:Number.isFinite(Number(attachment.sortOrder))?Number(attachment.sortOrder):0,status:'available',mediaId:primary.mediaId,companionMediaId:companion?.mediaId||'',sourceProvenance:provenance};return {targetRecordId,sourceAttachmentId,targetAttachmentReference,primary,companion};}
    async function blobHash(blob){const bytes=await blob.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');}
    async function putVerified(store,descriptor,blob){if(!(blob instanceof Blob))throw new Error('Recovery media requires a Blob.');if(!descriptor?.mediaId)throw new Error('Recovery media descriptor has no mediaId.');const sourceHash=await blobHash(blob),existing=await store.get(descriptor.mediaId);if(existing){const existingHash=await blobHash(existing.blob);if(existingHash!==sourceHash||existing.mime!==descriptor.mime||existing.ownerType!==descriptor.ownerType||existing.ownerId!==descriptor.ownerId)throw new Error(`MEDIA_ID_COLLISION:${descriptor.mediaId}`);return {status:'reused',mediaId:descriptor.mediaId,sha256:sourceHash};}await store.putBlob(blob,{id:descriptor.mediaId,mime:descriptor.mime,ownerType:descriptor.ownerType,ownerId:descriptor.ownerId});const readBack=await store.get(descriptor.mediaId);if(!readBack||readBack.mime!==descriptor.mime||readBack.ownerType!==descriptor.ownerType||readBack.ownerId!==descriptor.ownerId||await blobHash(readBack.blob)!==sourceHash)throw new Error(`MEDIA_READBACK_FAILED:${descriptor.mediaId}`);return {status:'created',mediaId:descriptor.mediaId,sha256:sourceHash};}
    async function writeAttachmentMapping(store,mapping,binaries){if(!mapping?.primary||!binaries?.primary)throw new Error('Recovery attachment mapping is incomplete.');const primary=await putVerified(store,mapping.primary,binaries.primary),companion=mapping.companion?await putVerified(store,mapping.companion,binaries.companion):null;return {primary,companion,targetAttachmentReference:mapping.targetAttachmentReference};}
    return {buildAttachmentMapping,blobHash,putVerified,writeAttachmentMapping,mediaMime};
  }
  function recordsForSlot(records,month,day){return records.filter(record=>{const [,m,d]=(record.date||'').split('-');return Number(m)===Number(month)&&Number(d)===Number(day)&&record.recordType==='five_year_question';}).sort((a,b)=>String(a.date).localeCompare(String(b.date)));}
  function createFiveYearJournal(){return {SOURCE_APP,SYSTEM_QUESTIONS,validDate,dateOf,sourceKey,validateManifest,stageImport,recordsForSlot,createLegacyMediaRecoveryAdapter};}
  window.JournalModules=window.JournalModules||{};
  window.JournalModules.createFiveYearJournal=createFiveYearJournal;
})();
