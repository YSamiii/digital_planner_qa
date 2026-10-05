/* v0.21.0: user-facing Backup / Restore and Plan dashboard personalization.
   This layer uses the established canonical state + IndexedDB snapshot store. */
(function(){
  'use strict';
  const BUILD='0.21.0-stable-baseline';
  document.documentElement.dataset.runtimeBuild=BUILD;
  window.JOURNAL_BUILD=BUILD;
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>\"]/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;' })[char]);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const isoLocal=date=>{const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;};
  const dayKey=()=>isoLocal(new Date());
  const snapshotStore=window.snapshotStore;
  const health=window.PersistenceHealth;

  function ensureSafety(){
    state.settings=state.settings&&typeof state.settings==='object'?state.settings:{};
    const raw=state.settings.autoProtection;
    state.settings.autoProtection=raw&&typeof raw==='object'?raw:{};
    const safety=state.settings.autoProtection;
    safety.enabled=safety.enabled!==false;
    safety.time=/^\d{2}:\d{2}$/.test(safety.time||'')?safety.time:'03:00';
    safety.retention=Math.max(1,Math.min(90,Number(safety.retention)||30));
    safety.externalReminderDays=Number(safety.externalReminderDays)||0;
    safety.snapshots=Array.isArray(safety.snapshots)?safety.snapshots:[];
    safety.lastExternalBackupAt=safety.lastExternalBackupAt||safety.lastFullBackupAt||'';
    safety.lastAutomaticSnapshotAt=safety.lastAutomaticSnapshotAt||'';
    safety.lastKnownHealthySnapshotId=safety.lastKnownHealthySnapshotId||'';
    safety.dataProtectionWarning=safety.dataProtectionWarning&&typeof safety.dataProtectionWarning==='object'?safety.dataProtectionWarning:null;
    return safety;
  }
  const snapshotMeta=record=>({snapshotId:record.snapshotId,createdAt:record.createdAt,reason:record.reason,appVersion:record.appVersion,schemaVersion:record.schemaVersion,dataVersion:record.dataVersion||1,recordCounts:record.recordCounts||{},checksum:record.checksum||'',payloadBytes:Number(record.payloadBytes)||0,healthFingerprint:record.healthFingerprint||null,healthStatus:record.healthStatus||'unclassified'});
  function snapshotPayload(){const copied=clone(state);if(copied.settings?.autoProtection){copied.settings.autoProtection.snapshots=[];delete copied.settings.autoProtection.storageSafeMode;}return copied;}
  function currentHealthGate(){const safety=ensureSafety();return health?.snapshotHealth(state,safety.snapshots)||{status:'healthy',allowed:true,markHealthy:true,current:null,reason:'Health module unavailable'};}
  function snapshotRecord(reason,gate=currentHealthGate()){const payload=snapshotPayload(),serialized=JSON.stringify(payload);return {snapshotId:`snapshot-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,createdAt:new Date().toISOString(),reason,appVersion:window.APP_VERSION||'0.21.0',schemaVersion:state.schemaVersion,dataVersion:1,recordCounts:{entries:(state.entries||[]).length,dailyDates:Object.keys(state.dailyBlocks||{}).length,orders:(state.orders?.items||[]).length,batches:(state.orders?.forwardingBatches||[]).length},checksum:`${serialized.length}:${Object.keys(payload).length}`,payload,payloadBytes:new Blob([serialized]).size,healthFingerprint:gate.current||health?.fingerprint(payload)||null,healthStatus:gate.status==='healthy'?'healthy':gate.status==='suspicious'?'suspicious':'provisional'};}
  function dateNumber(value){const n=Date.parse(value||'');return Number.isFinite(n)?n:0;}
  function isProtectedSnapshot(meta){return meta?.reason==='pre_restore_snapshot';}
  async function commitMetadata(next){
    if(window.isPersistenceSafeMode?.())return {ok:false,stage:'persistence_safe_mode',message:'Persistence Safe Mode: snapshot metadata is paused.'};
    const safety=ensureSafety(),previous=clone(safety.snapshots),selection=health?.retention(next,{limit:safety.retention})||{kept:[...next],expired:[]},kept=selection.kept,expired=selection.expired;
    safety.snapshots=kept;
    const result=save();
    if(result?.ok===false){safety.snapshots=previous;return result;}
    for(const meta of expired){try{await snapshotStore.remove(meta.snapshotId);}catch(error){console.warn('snapshot retention delete failed',error);}}
    return {ok:true,expired:expired.map(item=>item.snapshotId),generations:selection.generations||null};
  }
  async function createSnapshot(reason,options={}){
    if(window.isPersistenceSafeMode?.())throw new Error('Persistence Safe Mode: snapshot creation is paused.');
    if(!snapshotStore)throw new Error('此设备无法使用内部快照存储。');
    const gate=options.healthGate||currentHealthGate(),record=snapshotRecord(reason,gate),stored=await snapshotStore.put(record);
    if(!snapshotStore.validate(stored,record.snapshotId))throw new Error('内部快照 read-back 验证失败。');
    const committed=await commitMetadata([snapshotMeta(stored),...ensureSafety().snapshots]);
    if(committed?.ok===false)throw new Error(committed.message||'快照 metadata 保存失败。');
    return snapshotMeta(stored);
  }
  function formatWhen(value){if(!value)return '尚未创建';const date=new Date(value);return Number.isNaN(date.getTime())?String(value):date.toLocaleString();}
  function typeLabel(reason){return ({daily_protection:'自动保护',manual_snapshot:'手动快照',pre_restore_snapshot:'恢复前保护'}[reason]||'内部快照');}
  function snapshotSummary(meta){const counts=meta.recordCounts||{};return `日记 ${counts.entries||0} · Daily ${counts.dailyDates||0} 天 · 订单 ${counts.orders||0}`;}
  function externalReminder(safety=ensureSafety()){
    const days=Number(safety.externalReminderDays)||0,last=safety.lastExternalBackupAt||'';
    if(!days)return {enabled:false,overdue:false,text:'完整备份提醒已关闭'};
    if(!last)return {enabled:true,overdue:true,text:'尚未导出完整备份'};
    const elapsed=Math.floor((Date.now()-Date.parse(last))/86400000);
    return {enabled:true,overdue:elapsed>=days,text:`距离上次完整备份已 ${Math.max(0,elapsed)} 天`,elapsed,days};
  }
  function nextAutoCopy(safety){const today=dayKey(),hasToday=safety.snapshots.some(row=>row.reason==='daily_protection'&&String(row.createdAt||'').slice(0,10)===today)||String(safety.lastAutomaticSnapshotAt||'').slice(0,10)===today;if(!safety.enabled)return '自动保护已关闭';if(hasToday)return '今天已完成自动保护检查；明天目标时间后首次打开 App 时再检查。';return `今天 ${safety.time} 后首次打开 App 时，如尚未生成快照则创建一次。`;}

  function ensureBackupModal(){
    let modal=$('#backupRestoreModal');if(modal)return modal;
    modal=document.createElement('div');modal.id='backupRestoreModal';modal.className='modal';
    modal.innerHTML='<section class="modal-sheet"><header class="modal-header"><div class="modal-heading"><div class="kicker">BACKUP & RESTORE</div><h2>备份与恢复</h2></div><button class="modal-close" type="button" onclick="closeBackupRestore()">×</button></header><div class="modal-body" id="backupRestoreBody"></div><footer class="modal-footer"><button class="btn secondary" type="button" onclick="closeBackupRestore()">关闭</button></footer></section>';
    document.body.append(modal);return modal;
  }
  function renderBackupRestore(){
    const body=$('#backupRestoreBody');if(!body)return;const safety=ensureSafety(),rows=[...safety.snapshots].sort((a,b)=>dateNumber(b.createdAt)-dateNumber(a.createdAt)),reminder=externalReminder(safety),gate=currentHealthGate(),known=health?.resolveLastKnownHealthy(rows),warning=safety.dataProtectionWarning?.active||gate.status==='suspicious',protectionCopy=warning?'检测到异常数据变化，自动保护已暂停，以避免覆盖较早的健康快照。':known?`状态正常 · 最后健康保护：${formatWhen(known.createdAt)}`:'尚未建立可信健康基线；后续自动保护会先记录健康指纹。';
    body.innerHTML=`<section class="backup-user-section"><h3>数据保护状态</h3><p class="section-note">${esc(protectionCopy)}</p><button class="btn secondary" type="button" onclick="document.querySelector('#backupRestoreBody .manage-list')?.scrollIntoView({behavior:'smooth',block:'start'})">查看快照</button></section><section class="backup-user-section"><h3>自动保护</h3><p class="small">iPhone / PWA 无法保证在 ${esc(safety.time)} 准时后台运行。当天目标时间后首次打开 App，且当天尚未生成快照时，才会自动创建一次。</p><label><input id="backupAutoEnabled" type="checkbox" ${safety.enabled?'checked':''}> 自动保护已${safety.enabled?'开启':'关闭'}</label><div class="form-grid"><div class="form-field"><label>每日目标时间</label><div class="date-field"><input id="backupAutoTime" type="time" value="${esc(safety.time)}"></div></div><div class="form-field"><label>保留快照</label><input id="backupRetention" type="number" min="1" max="90" value="${safety.retention}"></div></div><button class="btn secondary" type="button" onclick="saveBackupProtectionSettings()">保存自动保护设置</button><div class="section-note">最近自动保护：${esc(formatWhen(rows.find(row=>row.reason==='daily_protection')?.createdAt))}<br>当前保存 ${rows.length} 个快照 · 保留上限 ${safety.retention}<br>${esc(nextAutoCopy(safety))}</div></section>
      <section class="backup-user-section"><h3>手动备份</h3><button class="btn primary" type="button" onclick="createManualInternalSnapshot()">立即创建内部快照</button><p class="small">内部快照保存在此设备，用于安全恢复；创建后会进行 read-back 验证。</p><button class="btn secondary" type="button" onclick="exportFullBackupV21()">导出完整备份</button><p class="small">最近完整备份：${esc(safety.lastExternalBackupAt?formatWhen(safety.lastExternalBackupAt):'尚未导出完整备份')}</p><label>完整备份提醒<select id="backupReminderInterval"><option value="0">关闭</option><option value="7">每 7 天</option><option value="14">每 14 天</option><option value="30">每 30 天</option></select></label><button class="btn secondary" type="button" onclick="saveBackupReminderSettings()">保存提醒设置</button>${reminder.enabled?`<p class="section-note">${esc(reminder.text)}</p>`:''}</section>
      <section class="backup-user-section"><h3>恢复与历史快照</h3><p class="small">从快照恢复会替换当前 App 数据。开始前会先创建并验证一份恢复前保护快照。</p><div class="manage-list">${rows.map(row=>`<article class="manage-row"><span><b>${esc(formatWhen(row.createdAt))}</b><small>${esc(typeLabel(row.reason))} · ${Math.round((row.payloadBytes||0)/1024)} KB · v${esc(row.appVersion||'—')} · schema ${esc(row.schemaVersion??'—')}<br>${esc(snapshotSummary(row))}</small></span><span class="manage-actions"><button type="button" onclick="openSnapshotDetail('${esc(row.snapshotId)}')">详情</button><button type="button" class="danger" onclick="deleteInternalSnapshot('${esc(row.snapshotId)}')">删除</button></span></article>`).join('')||'<p class="small">还没有内部快照。</p>'}</div></section>`;
    $('#backupReminderInterval').value=String(Number(safety.externalReminderDays)||0);
  }
  window.openBackupRestore=function(){ensureBackupModal();renderBackupRestore();modalController.open('backupRestoreModal');};
  window.closeBackupRestore=function(){modalController.close('backupRestoreModal');};
  window.saveBackupProtectionSettings=async function(){const safety=ensureSafety(),previous=clone(safety);safety.enabled=$('#backupAutoEnabled').checked;safety.time=$('#backupAutoTime').value||'03:00';safety.retention=Math.max(1,Math.min(90,Number($('#backupRetention').value)||30));const result=await commitMetadata(safety.snapshots);if(result?.ok===false){Object.assign(safety,previous);alert(result.message||'自动保护设置未保存。');}renderBackupRestore();};
  window.saveBackupReminderSettings=function(){const safety=ensureSafety();safety.externalReminderDays=Number($('#backupReminderInterval').value)||0;const result=save();if(result?.ok===false)alert(result.message||'提醒设置未保存。');renderBackupRestore();};
  window.createManualInternalSnapshot=async function(){try{const gate=currentHealthGate();if(!gate.allowed&&!confirm('检测到异常数据变化。内部快照将只标记为“疑似异常”，不会覆盖 Last Known Healthy。仍要创建？'))return;const meta=await createSnapshot('manual_snapshot',{healthGate:gate});renderBackupRestore();alert(`内部快照已创建并验证：${formatWhen(meta.createdAt)}`);}catch(error){alert(`创建内部快照失败：${error.message||error}`);}};
  window.exportFullBackupV21=async function(){try{const gate=currentHealthGate();if(!gate.allowed&&!confirm('当前数据状态可能异常，此备份仅保存当前状态。仍要导出？'))return;await window.exportDataV20?.();const safety=ensureSafety();safety.lastExternalBackupAt=new Date().toISOString();const result=save();if(result?.ok===false)throw new Error(result.message||'完整备份时间未保存');renderBackupRestore();}catch(error){alert(`导出完整备份失败：${error.message||error}`);}};
  window.openSnapshotDetail=async function(id){const meta=ensureSafety().snapshots.find(row=>String(row.snapshotId)===String(id));if(!meta)return;const body=$('#backupRestoreBody');body.innerHTML=`<button class="ghost" type="button" onclick="renderBackupRestore()">‹ 返回快照历史</button><section class="backup-user-section"><h3>快照详情</h3><div class="detail-grid"><div><small>创建时间</small><b>${esc(formatWhen(meta.createdAt))}</b></div><div><small>类型</small><b>${esc(typeLabel(meta.reason))}</b></div><div><small>来源版本</small><b>v${esc(meta.appVersion||'—')}</b></div><div><small>schema</small><b>${esc(meta.schemaVersion??'—')}</b></div></div><p class="section-note">${esc(snapshotSummary(meta))} · 约 ${Math.round((meta.payloadBytes||0)/1024)} KB</p><button class="btn primary" type="button" onclick="restoreInternalSnapshot('${esc(meta.snapshotId)}')">从此快照恢复</button></section>`;};
  window.restoreInternalSnapshot=async function(id){
    const selected=ensureSafety().snapshots.find(row=>String(row.snapshotId)===String(id));if(!selected)return;
    if(!confirm('恢复会用所选快照替换当前 App 数据。恢复前会先保存一份当前状态。'))return;
    try{
      const stored=await snapshotStore.get(id);if(!snapshotStore.validate(stored,id))throw new Error('所选快照不可用或 read-back 验证失败。');
      const candidate=health?.validateRestorePayload(stored.payload)||{ok:true};if(!candidate.ok)throw new Error(`所选快照未通过恢复校验：${candidate.reason}`);
      const protection=await createSnapshot('pre_restore_snapshot',{healthGate:currentHealthGate()});
      if(!protection?.snapshotId)throw new Error('恢复前保护快照创建失败。');
      const metadata=clone(ensureSafety().snapshots);state=clone(stored.payload);state.settings=state.settings||{};state.settings.autoProtection={...(state.settings.autoProtection||{}),snapshots:metadata};
      const result=save();if(result?.ok===false)throw new Error(result.message||'恢复后的状态未保存。');
      renderAll();renderBackupRestore();alert(`已恢复到 ${formatWhen(selected.createdAt)} 的快照。`);
    }catch(error){alert(`未恢复：${error.message||error}`);}
  };
  window.deleteInternalSnapshot=async function(id){const safety=ensureSafety(),meta=safety.snapshots.find(row=>String(row.snapshotId)===String(id));if(!meta)return;const warning=meta.reason==='pre_restore_snapshot'?'这是恢复前保护快照；删除后将失去这一份恢复安全链保护。':'删除只会移除该内部快照，不会改变当前 App 数据。';if(!confirm(`${warning}\n\n确认删除？`))return;const next=safety.snapshots.filter(row=>String(row.snapshotId)!==String(id));const result=await commitMetadata(next);if(result?.ok===false){alert(result.message||'删除失败。');return;}try{await snapshotStore.remove(id);}catch(error){alert(`metadata 已更新，但快照存储删除失败：${error.message||error}`);}renderBackupRestore();};

  function planStaticCards(){
    const activeRows=type=>(state.projects?.[type]||[]).filter(item=>item.status!=='archived'&&item.status!=='completed'),active=type=>activeRows(type).length>0;
    const activeCount=type=>activeRows(type).length;
    const activeChallenges=()=>window.getActiveChallengeDashboardCards?.()||[];
    const meaningful=value=>typeof value==='string'?value.trim().length>0:Array.isArray(value)?value.some(meaningful):!!value&&typeof value==='object'&&Object.values(value).some(meaningful);
    return [
      {id:'smart',title:'SMART Goals',meta:`${activeCount('smartGoal')} 个进行中`,empty:!active('smartGoal'),go:"openProjectList('smartGoal')"},
      {id:'long',title:'Long Term Goals',meta:`${activeCount('longTermGoal')} 个进行中`,empty:!active('longTermGoal'),go:"openProjectList('longTermGoal')"},
      {id:'priority',title:'Priority Matrix',meta:'重要 × 紧急',empty:!meaningful(state.long?.priorityMatrix),go:"editLong('priorityMatrix','Priority Matrix')"},
      {id:'pomodoro',title:'Pomodoro',meta:activeCount('pomodoro')?`${activeCount('pomodoro')} 个进行中`: 'Sprint / Session',empty:!active('pomodoro'),go:"openProjectList('pomodoro')"},
      {id:'tools',title:'所有 Challenge',meta:`${activeChallenges().length} 个进行中`,empty:false,go:"go('productivity')"}
    ];
  }
  function planDynamicCards(){return (window.getActiveChallengeDashboardCards?.()||[]).map(item=>{const detail=`openChallengePlanOverview('${esc(item.challengeId)}')`;let progress=item.kind==='twelve_week'?`Week ${item.currentDay} / 12`:`Day ${item.currentDay} / ${item.duration||'—'}`;if(item.kind==='focus'&&item.mode==='score'){const log=item.record?.dailyLogs?.[new Date().toISOString().slice(0,10)]||{},rules=item.record?.scoreRules||[],required=rules.filter(rule=>rule.kind==='required'&&log[rule.id]).reduce((sum,rule)=>sum+Number(rule.score||0),0),bonus=Math.max(0,...rules.filter(rule=>rule.kind==='bonus'&&log[rule.id]).map(rule=>log[rule.id]?Number(rule.score||0):0));progress+=` · 今日 ${required+bonus}/100`;}if(item.kind==='no_spend'){const noSpend=(item.record?.logs||[]).filter(log=>!log.spent).length;progress+=` · No Spend ${noSpend} 天`;}return {id:`challenge:${item.challengeId}`,title:item.name,meta:progress,empty:false,go:detail,challengeId:item.challengeId};});}
  function planResolved(){ensureSafety();state.settings.planDashboard=state.settings.planDashboard&&typeof state.settings.planDashboard==='object'?state.settings.planDashboard:{cards:[]};state.settings.planDashboard.cards=Array.isArray(state.settings.planDashboard.cards)?state.settings.planDashboard.cards:[];const all=[...planStaticCards(),...planDynamicCards()],existing=new Map(state.settings.planDashboard.cards.map(item=>[String(item.id),item]));return all.map((card,index)=>({...card,id:String(card.id),visible:existing.get(String(card.id))?.visible!==false,hideWhenEmpty:existing.get(String(card.id))?.hideWhenEmpty===true,order:Number.isFinite(Number(existing.get(String(card.id))?.order))?Number(existing.get(String(card.id)).order):index})).sort((a,b)=>a.order-b.order);}
  function planVisible(){return planResolved().filter(card=>card.visible!==false&&!(card.hideWhenEmpty&&card.empty));}
  let planSession=null;
  function beginPlanSession(){const cards=planResolved().map(card=>({id:card.id,visible:card.visible!==false,hideWhenEmpty:card.hideWhenEmpty===true,order:card.order}));planSession={id:`plan-v021-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,cards};return planSession;}
  const activePlanSession=()=>planSession||beginPlanSession();
  function planDraftRows(){const byId=new Map(planResolved().map(card=>[card.id,card])),session=activePlanSession();return session.cards.filter(card=>byId.has(card.id)).map(card=>({...byId.get(card.id),...card})).sort((a,b)=>a.order-b.order);}
  function renderPlanSettings(preserve=true){const body=$('#planDashboardModal .modal-body'),scroll=preserve?body?.scrollTop||0:0,rows=planDraftRows(),host=$('#planDashboardOptions');if(!host)return;host.innerHTML=rows.map((card,index)=>`<div class="manage-row" data-plan-card-key="${esc(card.id)}"><div><label><input type="checkbox" data-plan-v021="visible" data-card-key="${esc(card.id)}" ${card.visible?'checked':''}> ${esc(card.title)}</label><label class="today-empty-toggle"><input type="checkbox" data-plan-v021="hideWhenEmpty" data-card-key="${esc(card.id)}" ${card.hideWhenEmpty?'checked':''}> 无内容时隐藏</label></div><span><button type="button" data-plan-v021-action="move" data-card-key="${esc(card.id)}" data-direction="-1" ${index===0?'disabled':''}>↑</button><button type="button" data-plan-v021-action="move" data-card-key="${esc(card.id)}" data-direction="1" ${index===rows.length-1?'disabled':''}>↓</button></span></div>`).join('');if(body)requestAnimationFrame(()=>body.scrollTop=scroll);}
  function ensurePlanModal(){let modal=$('#planDashboardModal');if(modal)return modal;modal=document.createElement('div');modal.id='planDashboardModal';modal.className='modal';modal.innerHTML='<section class="modal-sheet"><header class="modal-header"><div class="modal-heading"><div class="kicker">PLAN</div><h2>自定义计划首页</h2></div><button class="modal-close" type="button" onclick="modalController.close(\'planDashboardModal\')">×</button></header><div class="modal-body"><div id="planDashboardOptions" class="manage-list"></div><button class="ghost" type="button" data-plan-v021-action="reset">恢复默认</button></div><footer class="modal-footer"><button class="btn secondary" type="button" onclick="modalController.close(\'planDashboardModal\')">取消</button><button class="btn primary" type="button" data-plan-v021-action="save">保存</button></footer></section>';document.body.append(modal);return modal;}
  function bindPlanModal(){const modal=ensurePlanModal();if(modal.dataset.v021Bound)return;modal.dataset.v021Bound='true';modal.addEventListener('change',event=>{const input=event.target.closest('[data-plan-v021]');if(!input)return;const row=activePlanSession().cards.find(card=>card.id===input.dataset.cardKey);if(!row)return;row[input.dataset.planV021]=input.checked;renderPlanSettings();});modal.addEventListener('click',event=>{const button=event.target.closest('[data-plan-v021-action]');if(!button)return;event.preventDefault();const session=activePlanSession(),action=button.dataset.planV021Action;if(action==='move'){const cards=session.cards.sort((a,b)=>a.order-b.order),index=cards.findIndex(card=>card.id===button.dataset.cardKey),next=index+Number(button.dataset.direction);if(index>=0&&next>=0&&next<cards.length){[cards[index],cards[next]]=[cards[next],cards[index]];cards.forEach((card,order)=>card.order=order);renderPlanSettings();}}else if(action==='reset'){session.cards=planResolved().map((card,order)=>({id:card.id,visible:true,hideWhenEmpty:false,order}));renderPlanSettings();}else if(action==='save'){ensureSafety();const dashboard=state.settings.planDashboard,map=new Map(dashboard.cards.map(card=>[String(card.id),card]));session.cards.forEach(card=>map.set(card.id,{id:card.id,visible:card.visible!==false,hideWhenEmpty:card.hideWhenEmpty===true,order:card.order}));dashboard.cards=[...map.values()];const result=save();if(result?.ok===false){alert(result.message||'计划首页偏好未保存。');return;}planSession=null;modalController.close('planDashboardModal');window.renderPlanDashboard();}});}
  window.openPlanDashboardSettings=function(){bindPlanModal();beginPlanSession();renderPlanSettings(false);modalController.open('planDashboardModal');};
  window.renderPlanDashboard=function(){const root=$('#plan');if(!root)return;const cards=planVisible();root.innerHTML=`<button class="page-back" type="button" onclick="backPage()">返回</button><div class="top"><div><div class="kicker">PLAN</div><h1>计划</h1><div class="sub">把目标、项目、周期与专注方法放在一起。</div></div><button class="ghost" type="button" onclick="openPlanDashboardSettings()">⚙ 自定义</button></div><div class="hub-section"><div class="section-head"><h2>计划概览</h2></div><div class="hub-grid">${cards.map(card=>`<button class="hub-card plan-instance-card" data-plan-card-key="${esc(card.id)}" onclick="${card.go}"><b>${esc(card.title)}</b><span>${esc(card.meta)}</span><i>›</i></button>`).join('')||'<div class="entry"><span class="small">当前没有显示的计划卡。可通过“自定义”恢复。</span></div>'}</div></div>`;};
  ['saveChallenge','deleteChallenge','saveNoSpend','deleteNoSpend','saveTwelveWeekYear','deleteTwelveWeekYear'].forEach(name=>{const previous=window[name];if(!previous||previous.__v021PlanRefresh)return;const wrapped=function(...args){const result=previous.apply(this,args);window.renderPlanDashboard?.();return result;};wrapped.__v021PlanRefresh=true;window[name]=wrapped;});

  const previousRun=window.v0200Audit?.maybeAutomaticSnapshot;
  window.v0210BackupPlan={createSnapshot,externalReminder,planResolved,planVisible,maybeAutomaticSnapshot:previousRun,UPCOMING_RENEWAL_DAYS:30};
  function boot(){ensureSafety();window.renderPlanDashboard?.();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
