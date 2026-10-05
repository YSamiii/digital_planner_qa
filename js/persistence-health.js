/* P0 snapshot health gate. Pure state inspection; it never writes canonical state. */
(function(){
  'use strict';
  const count=value=>Array.isArray(value)?value.length:0;
  const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
  const bytes=value=>new Blob([JSON.stringify(value)]).size;
  const hash=value=>{const text=JSON.stringify(value);let valueHash=2166136261;for(let i=0;i<text.length;i++){valueHash^=text.charCodeAt(i);valueHash=Math.imul(valueHash,16777619);}return (`00000000${(valueHash>>>0).toString(16)}`).slice(-8);};
  const dailyBlockCount=value=>object(value)?Object.values(value).reduce((sum,blocks)=>sum+(Array.isArray(blocks)?blocks.length:0),0):0;
  function growthCount(state){return (state?.legacyJournalRecords||[]).filter(record=>/growth|milestone|成长/.test(String(record?.recordType||record?.type||record?.title||''))).length;}
  function fingerprint(state){
    const noSpend=Array.isArray(state?.noSpendChallenges)?state.noSpendChallenges:[];
    const orders=object(state?.orders)?state.orders:{};
    const inventory=object(state?.inventory)?state.inventory:{};
    const counts={
      entries:count(state?.entries),dailyDates:object(state?.dailyBlocks)?Object.keys(state.dailyBlocks).length:0,dailyBlocks:dailyBlockCount(state?.dailyBlocks),
      legacyJournalRecords:count(state?.legacyJournalRecords),growthRecords:growthCount(state),orders:count(orders.items),batches:count(orders.forwardingBatches),inventoryItems:count(inventory.items),
      noSpendChallenges:noSpend.length,noSpendLogs:noSpend.reduce((sum,item)=>sum+count(item?.logs),0),challenges:count(state?.challenges),subscriptions:count(state?.subscriptions),wishlists:count(state?.wishlists),fiveYearQuestions:count(state?.fiveYearQuestions)
    };
    return {schemaVersion:Number(state?.schemaVersion)||0,serializedBytes:bytes(state||{}),payloadHash:hash(state||{}),counts};
  }
  const coreRules=[
    {key:'orders',minimum:5},{key:'dailyBlocks',minimum:7},{key:'legacyJournalRecords',minimum:7},{key:'growthRecords',minimum:7},{key:'noSpendLogs',minimum:5},{key:'challenges',minimum:2},{key:'subscriptions',minimum:3},{key:'wishlists',minimum:3}
  ];
  function collapse(previous,current,rule){const before=Number(previous?.[rule.key]||0),after=Number(current?.[rule.key]||0);return before>=rule.minimum&&(after===0||after/before<=0.1);}
  function resolveLastKnownHealthy(snapshots=[]){
    return [...snapshots].filter(snapshot=>snapshot?.healthStatus==='healthy'&&snapshot.healthFingerprint&&object(snapshot.healthFingerprint.counts)).sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0))[0]||null;
  }
  function assess(currentFingerprint,baseline){
    if(!baseline?.healthFingerprint)return {status:'no_healthy_baseline',allowed:true,markHealthy:false,baseline:null,signals:[],reason:'没有可信的历史健康基线；允许保护，但不会把当前状态提升为 Last Known Healthy。'};
    const previous=baseline.healthFingerprint,signals=coreRules.filter(rule=>collapse(previous.counts,currentFingerprint.counts,rule)).map(rule=>({key:rule.key,before:previous.counts[rule.key],after:currentFingerprint.counts[rule.key]}));
    const multiCollapse=signals.length>=2;
    const sizeShrink=previous.serializedBytes>=20*1024&&currentFingerprint.serializedBytes<=previous.serializedBytes*0.15;
    const catastrophic=signals.length>0&&(multiCollapse||sizeShrink||signals.some(signal=>['orders','dailyBlocks','legacyJournalRecords','growthRecords','noSpendLogs'].includes(signal.key)));
    return {status:catastrophic?'suspicious':'healthy',allowed:!catastrophic,markHealthy:!catastrophic,baseline:{snapshotId:baseline.snapshotId,createdAt:baseline.createdAt,healthFingerprint:previous},signals,multiCollapse,sizeShrink,reason:catastrophic?'检测到相对于 Last Known Healthy 的异常数据骤降。':'相对于 Last Known Healthy 未检测到灾难性骤降。'};
  }
  function snapshotHealth(state,snapshots){const current=fingerprint(state);return {...assess(current,resolveLastKnownHealthy(snapshots)),current};}
  function validateRestorePayload(payload){
    if(!object(payload))return {ok:false,reason:'快照 payload 不是对象。'};
    if(!Number.isFinite(Number(payload.schemaVersion)))return {ok:false,reason:'快照缺少有效 schemaVersion。'};
    return {ok:true,fingerprint:fingerprint(payload)};
  }
  function retention(snapshots,{recentDaily=7,weekly=4,monthly=3,limit=30}={}){
    const ordered=[...snapshots].sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));
    const keep=new Map(),add=snapshot=>{if(snapshot?.snapshotId)keep.set(snapshot.snapshotId,snapshot);};
    ordered.filter(snapshot=>snapshot?.reason==='pre_restore_snapshot'||!snapshot?.healthFingerprint).forEach(add);
    const healthy=ordered.filter(snapshot=>snapshot?.healthStatus==='healthy');
    healthy.filter(snapshot=>snapshot.reason==='daily_protection').slice(0,recentDaily).forEach(add);
    const weeklyKeys=new Set(),monthlyKeys=new Set();
    for(const snapshot of healthy){const created=new Date(snapshot.createdAt||0);if(Number.isNaN(created.getTime()))continue;const week=`${created.getUTCFullYear()}-W${Math.ceil((((created-new Date(Date.UTC(created.getUTCFullYear(),0,1)))/86400000)+new Date(Date.UTC(created.getUTCFullYear(),0,1)).getUTCDay()+1)/7)}`;const month=`${created.getUTCFullYear()}-${String(created.getUTCMonth()+1).padStart(2,'0')}`;if(weeklyKeys.size<weekly&&!weeklyKeys.has(week)){weeklyKeys.add(week);add(snapshot);}if(monthlyKeys.size<monthly&&!monthlyKeys.has(month)){monthlyKeys.add(month);add(snapshot);}}
    for(const snapshot of ordered){if(keep.size>=limit)break;add(snapshot);}
    const kept=[...keep.values()].sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));
    return {kept,expired:ordered.filter(snapshot=>!keep.has(snapshot.snapshotId)),generations:{recentDaily,weekly,monthly}};
  }
  window.PersistenceHealth={fingerprint,assess,snapshotHealth,resolveLastKnownHealthy,validateRestorePayload,retention};
})();
