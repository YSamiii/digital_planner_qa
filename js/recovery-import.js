/* One-pack recovery importer.  It is deliberately data-only: no media store,
   no IndexedDB, no snapshot creation, and no mutation until the host confirms
   a fully staged candidate. */
(function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const stable=value=>{
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  };
  const text=value=>typeof value==='string'?value.trim():'';
  const logicalDailyCount=blocks=>Object.values(blocks||{}).reduce((total,day)=>total+Object.values(day||{}).filter(value=>text(value)).length,0);
  const uniqueIds=(rows,label)=>{
    const seen=new Set();
    for(const row of rows||[]){
      const id=String(row?.id??'');
      if(!id)throw new Error(`${label} contains a record without a stable id.`);
      if(seen.has(id))throw new Error(`${label} contains duplicate id ${id}.`);
      seen.add(id);
    }
  };
  function normalizeAttachment(item,index){
    const copy=clone(item||{});
    delete copy.mediaId; delete copy.companionMediaId;
    if(copy.sourceProvenance&&typeof copy.sourceProvenance==='object'){delete copy.sourceProvenance.mediaId;delete copy.sourceProvenance.companionMediaId;}
    copy.id=String(copy.id||'');copy.fileName=String(copy.fileName||'');copy.type=String(copy.type||'image');copy.sortOrder=Number.isFinite(Number(copy.sortOrder))?Number(copy.sortOrder):index;copy.status='missing_media';
    return copy;
  }
  function sanitizeLegacy(record){
    const next=clone(record);
    next.attachments=Array.isArray(next.attachments)?next.attachments.map(normalizeAttachment):[];
    next.legacyAttachmentMetadata=Array.isArray(next.legacyAttachmentMetadata)?next.legacyAttachmentMetadata.map(normalizeAttachment):next.attachments.map(clone);
    return next;
  }
  function validatePackage(pkg){
    const errors=[];
    if(!pkg||typeof pkg!=='object'||Array.isArray(pkg))errors.push('恢复包不是 JSON 对象。');
    if(pkg?.packageFormat!=='personal-life-hub-recovery-all-data')errors.push('不是受支持的单包恢复格式。');
    if(Number(pkg?.schemaVersion)!==12)errors.push('恢复包 schemaVersion 必须为 12。');
    const modules=pkg?.modules;
    for(const name of ['daily','legacyJournal','ordersBatches','inventory','subscriptions','noSpend','challenges'])if(!modules||!modules[name])errors.push(`恢复包缺少 ${name} 模块。`);
    if(pkg?.packageSha256&&typeof pkg.packageSha256!=='string')errors.push('恢复包 hash 无效。');
    try{
      if(modules){
        uniqueIds(modules.legacyJournal?.records||[],'Legacy Journal');
        uniqueIds(modules.ordersBatches?.orders?.items||[],'Orders');
        uniqueIds(modules.ordersBatches?.orders?.forwardingBatches||[],'Forwarding Batches');
        uniqueIds(modules.inventory?.inventory?.items||[],'Inventory');
        uniqueIds(modules.subscriptions?.records||[],'Subscriptions');
        uniqueIds(modules.noSpend?.records||[],'No Spend');
        uniqueIds(modules.challenges?.records||[],'Challenges');
      }
    }catch(error){errors.push(error.message);}
    return {ok:errors.length===0,errors};
  }
  function emptySummary(){return {inserted:0,preserved:0,skipped:0,replaced:0,byModule:{},notes:[]};}
  function bucket(summary,name){return summary.byModule[name]||(summary.byModule[name]={inserted:0,preserved:0,skipped:0,replaced:0});}
  function count(summary,name,kind,n=1){summary[kind]+=n;bucket(summary,name)[kind]+=n;}
  function mergeArray(currentRows,sourceRows,moduleName,summary){
    const current=Array.isArray(currentRows)?currentRows:[];
    const source=Array.isArray(sourceRows)?sourceRows:[];
    uniqueIds(current,moduleName);uniqueIds(source,moduleName);
    const byId=new Map(current.map(row=>[String(row.id),row]));
    const next=current.map(clone);
    for(const record of source){
      const id=String(record.id),existing=byId.get(id);
      if(!existing){next.push(clone(record));byId.set(id,record);count(summary,moduleName,'inserted');}
      else if(stable(existing)===stable(record))count(summary,moduleName,'skipped');
      else count(summary,moduleName,'preserved');
    }
    return next;
  }
  function isTestReplacement(date,title,current,source){
    if(date!=='2026-08-29')return false;
    if(title==='我的一天')return text(current)==='Test'&&text(source)!=='';
    if(title==='熹熹的一天')return text(current)==='Test'&&text(source)!=='';
    return false;
  }
  function mergeDaily(current,payload,summary){
    const nextBlocks=clone(current.dailyBlocks||{}),nextMeta=clone(current.dailyBlockMeta||{});
    const sourceBlocks=payload.dailyBlocks||{},sourceMeta=payload.dailyBlockMeta||{};
    for(const [date,sourceDay] of Object.entries(sourceBlocks)){
      const destination=nextBlocks[date]||(nextBlocks[date]={});
      const destinationMeta=nextMeta[date]||(nextMeta[date]={});
      for(const [title,sourceValue] of Object.entries(sourceDay||{})){
        const exists=own(destination,title),currentValue=destination[title];
        if(!exists){destination[title]=clone(sourceValue);if(own(sourceMeta[date]||{},title))destinationMeta[title]=clone(sourceMeta[date][title]);count(summary,'Daily','inserted');continue;}
        if(stable(currentValue)===stable(sourceValue))count(summary,'Daily','skipped');
        else if(isTestReplacement(date,title,currentValue,sourceValue)){destination[title]=clone(sourceValue);count(summary,'Daily','replaced');}
        else count(summary,'Daily','preserved');
        const incomingMeta=sourceMeta[date]?.[title],existingMeta=destinationMeta[title];
        if(!existingMeta&&incomingMeta)destinationMeta[title]=clone(incomingMeta);
        else if(date==='2026-08-29'&&title==='熹熹的一天'&&text(existingMeta?.growthDetail)==='Test test'&&incomingMeta?.growthDetail){destinationMeta[title]={...existingMeta,growthDetail:incomingMeta.growthDetail};}
      }
    }
    for(const [date,sourceDay] of Object.entries(sourceMeta)){
      nextMeta[date]=nextMeta[date]||{};
      for(const [title,incoming] of Object.entries(sourceDay||{}))if(!nextMeta[date][title])nextMeta[date][title]=clone(incoming);
    }
    const sourceCustom=Array.isArray(payload.customBlocks)?payload.customBlocks:[];
    const custom=[...(current.customBlocks||[])];sourceCustom.forEach(title=>{if(!custom.includes(title))custom.push(title);});
    const provenance={...(clone(current.importProvenance||{}))};for(const [key,value] of Object.entries(payload.importProvenance||{}))if(!own(provenance,key))provenance[key]=clone(value);
    return {dailyBlocks:nextBlocks,dailyBlockMeta:nextMeta,customBlocks:custom,importProvenance:provenance};
  }
  function brokenBatchRefs(state){
    const batches=new Set((state.orders?.forwardingBatches||[]).map(row=>String(row.id)));
    return (state.orders?.items||[]).filter(row=>row?.forwarding?.batchId&&!batches.has(String(row.forwarding.batchId))).map(row=>String(row.id));
  }
  function danglingMediaRefs(state){
    const output=[];
    for(const record of state.legacyJournalRecords||[])for(const attachment of [...(record.attachments||[]),...(record.legacyAttachmentMetadata||[])])if(attachment?.mediaId||attachment?.companionMediaId)output.push({recordId:record.id,attachmentId:attachment.id});
    return output;
  }
  function stage(current,pkg){
    const validation=validatePackage(pkg);if(!validation.ok)throw new Error(validation.errors.join(' '));
    const next=clone(current),summary=emptySummary(),modules=pkg.modules;
    Object.assign(next,mergeDaily(next,modules.daily,summary));
    next.legacyJournalRecords=mergeArray(next.legacyJournalRecords,(modules.legacyJournal.records||[]).map(sanitizeLegacy),'Legacy Journal',summary);
    const sourceOrders=modules.ordersBatches.orders||{};next.orders=next.orders&&typeof next.orders==='object'?next.orders:{};
    const orderCollections={items:'Orders',sellers:'Sellers',pickupLocations:'Pickup Locations',recurring:'Recurring definitions',forwardingBatches:'Forwarding Batches'};
    for(const [key,previewLabel] of Object.entries(orderCollections))next.orders[key]=mergeArray(next.orders[key],sourceOrders[key],previewLabel,summary);
    // Show every Orders sub-collection explicitly, including an empty pickup list.
    Object.values(orderCollections).forEach(previewLabel=>bucket(summary,previewLabel));
    const sourceInventory=modules.inventory.inventory||{};next.inventory=next.inventory&&typeof next.inventory==='object'?next.inventory:{};
    for(const key of ['items','categories','locations'])next.inventory[key]=mergeArray(next.inventory[key],sourceInventory[key],key==='items'?'Inventory':'Inventory',summary);
    next.subscriptions=mergeArray(next.subscriptions,modules.subscriptions.records,'Subscriptions',summary);
    next.noSpendChallenges=mergeArray(next.noSpendChallenges,modules.noSpend.records,'No Spend',summary);
    next.challenges=mergeArray(next.challenges,modules.challenges.records,'Challenges',summary);
    next.schemaVersion=12;
    const finalCounts={legacyJournal:(next.legacyJournalRecords||[]).length,dailyLogicalTextBlocks:logicalDailyCount(next.dailyBlocks),orders:(next.orders?.items||[]).length,batches:(next.orders?.forwardingBatches||[]).length,inventory:(next.inventory?.items||[]).length,subscriptions:(next.subscriptions||[]).length,noSpend:(next.noSpendChallenges||[]).length,challenges:(next.challenges||[]).length};
    const integrity={ordersBatchBrokenRefs:brokenBatchRefs(next),danglingMediaRefs:danglingMediaRefs(next),schemaVersion:next.schemaVersion};
    return {next,summary,finalCounts,integrity};
  }
  root.JournalModules=root.JournalModules||{};
  root.JournalModules.createRecoveryImport=()=>({stable,validatePackage,stage,logicalDailyCount,brokenBatchRefs,danglingMediaRefs});
  if(typeof module!=='undefined')module.exports={stable,validatePackage,stage,logicalDailyCount,brokenBatchRefs,danglingMediaRefs};
})(typeof window!=='undefined'?window:globalThis);
