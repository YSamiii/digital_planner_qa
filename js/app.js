window.JOURNAL_BUILD='v0.23.2-canonical-slimming-iphone-qa1-20261005';
document.documentElement.dataset.runtimeBuild='v0.23.2-canonical-slimming-iphone-qa1-20261005';
const {createProductivityModule, createNoSpendModule, createCollectionsModule, createSubscriptionModule, createMediaStore, createSnapshotStore, createLegacyJournalPayloadStore, createInventoryModule, createRecurrenceHelper, createSellersModule, createOrdersModule, createTodayDashboard, createOneLineImport, createTimelineFilter, createFiveYearJournal, createHistoricalDualImporter, createLegacyJournalPayloadManager, analyzeLegacyJournalFootprint} = window.JournalModules || {};
const KEY='journal-planner-v091';
const APP_VERSION='0.23.2';
const BUILD_LABEL='Canonical Slimming iPhone QA1';
window.APP_VERSION=APP_VERSION;
const LEGACY_KEYS=['journal-planner-v090','journal-planner-v081','journal-planner-v052','journal-planner-v070','journal-planner-v051','journal-planner-v03','journal-planner-v031','journal-planner-v04','journal-planner-v05'];
const INVENTORY_SORT_MODES=['added','updated','created','az','za','quantityAsc','quantityDesc','expiry'];
function defaultState(){return {schemaVersion:12,entries:[],months:{},weeks:{},long:{},projects:{},customBlocks:[],dailyBlocks:{},dailyBlockMeta:{},legacyJournalRecords:[],legacyImportTombstones:{},fiveYearQuestions:[],favorites:[],customTemplates:[],challenges:[],noSpendChallenges:[],twelveWeekYears:[],subscriptions:[],wishlists:[],inventory:{items:[],categories:[],locations:[]},orders:{items:[],sellers:[],pickupLocations:[],recurring:[],forwardingBatches:[]},settings:{theme:'sage',inventorySortMode:'added',todayDashboard:{cards:Array.from({length:8},(_,id)=>({id,visible:true,order:id,hideWhenEmpty:false}))}}}}
const TODAY_DASHBOARD_DEFAULTS=Array.from({length:8},(_,id)=>({id,visible:true,order:id,hideWhenEmpty:false}));
function normalizeTodayDashboardPreferences(dashboard,additionalCards=[]){
  const input=Array.isArray(dashboard?.cards)?dashboard.cards:[];
  const byId=new Map();
  input.forEach((card,index)=>{
    if(!card||typeof card!=='object')return;
    const id=card.id??index;
    // The last persisted entry is the active legacy value.  This also collapses
    // duplicate string/number ids created by older dashboard implementations.
    byId.set(String(id),{...card,id});
  });
  const defaultById=new Map();
  [...TODAY_DASHBOARD_DEFAULTS,...additionalCards].forEach((card,index)=>{
    const normalized={id:card.id,visible:card.visible!==false,order:Number.isFinite(Number(card.order))?Number(card.order):index,hideWhenEmpty:card.hideWhenEmpty===true};
    // Dynamic specifications may repeat a static id. Keep one canonical default
    // while allowing the active specification to supply its current default.
    defaultById.set(String(normalized.id),normalized);
  });
  const defaults=[...defaultById.values()];
  const known=new Set(defaults.map(card=>String(card.id)));
  const normalized=defaults.map((fallback,index)=>{
    const saved=byId.get(String(fallback.id));
    const has=key=>!!saved&&Object.prototype.hasOwnProperty.call(saved,key);
    return {
      ...fallback,
      ...(saved||{}),
      id:fallback.id,
      visible:has('visible')?saved.visible!==false:fallback.visible,
      order:has('order')&&Number.isFinite(Number(saved.order))?Number(saved.order):fallback.order,
      // An explicit false is a first-class persisted preference, never a default fallback.
      hideWhenEmpty:has('hideWhenEmpty')?saved.hideWhenEmpty===true:fallback.hideWhenEmpty===true
    };
  });
  byId.forEach((saved,key)=>{
    if(known.has(key))return;
    const has=property=>Object.prototype.hasOwnProperty.call(saved,property);
    normalized.push({...saved,id:saved.id,visible:has('visible')?saved.visible!==false:true,order:has('order')&&Number.isFinite(Number(saved.order))?Number(saved.order):normalized.length,hideWhenEmpty:has('hideWhenEmpty')?saved.hideWhenEmpty===true:false});
  });
  normalized.sort((a,b)=>a.order-b.order);
  return {...(dashboard&&typeof dashboard==='object'?dashboard:{}),cards:normalized};
}
window.normalizeTodayDashboardPreferences=normalizeTodayDashboardPreferences;
function hydrateAppState(state){
if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('State hydration requires an object root');
state.entries=Array.isArray(state.entries)?state.entries:[];
state.months=state.months&&typeof state.months==='object'?state.months:{};
state.weeks=state.weeks&&typeof state.weeks==='object'?state.weeks:{};
state.long=state.long&&typeof state.long==='object'?state.long:{};
state.projects=state.projects&&typeof state.projects==='object'?state.projects:{};
state.customBlocks=Array.isArray(state.customBlocks)?state.customBlocks:[];
state.dailyBlocks=state.dailyBlocks&&typeof state.dailyBlocks==='object'?state.dailyBlocks:{};
state.dailyBlockMeta=state.dailyBlockMeta&&typeof state.dailyBlockMeta==='object'?state.dailyBlockMeta:{};
state.legacyJournalRecords=Array.isArray(state.legacyJournalRecords)?state.legacyJournalRecords:[];
state.legacyImportTombstones=state.legacyImportTombstones&&typeof state.legacyImportTombstones==='object'?state.legacyImportTombstones:{};
state.fiveYearQuestions=Array.isArray(state.fiveYearQuestions)?state.fiveYearQuestions:[];
state.importProvenance=state.importProvenance&&typeof state.importProvenance==='object'?state.importProvenance:{};
state.favorites=Array.isArray(state.favorites)?state.favorites:[];
state.customTemplates=Array.isArray(state.customTemplates)?state.customTemplates:[];
state.challenges=Array.isArray(state.challenges)?state.challenges:[];
state.twelveWeekYears=Array.isArray(state.twelveWeekYears)?state.twelveWeekYears:[];
state.subscriptions=Array.isArray(state.subscriptions)?state.subscriptions:[];
state.noSpendChallenges=Array.isArray(state.noSpendChallenges)?state.noSpendChallenges:[];
/* Temporary P0 diagnostic: deliberately read-only. It never normalizes, saves,
   or returns any state outside the No Spend slice requested for device audit. */
function buildNoSpendReadonlyAudit(){
  const before=JSON.stringify(state.noSpendChallenges);
  const challenges=state.noSpendChallenges.map(challenge=>({
    challengeId:challenge?.id??null,name:challenge?.title??'',startDate:challenge?.startDate??'',duration:challenge?.days??null,
    logCount:Array.isArray(challenge?.logs)?challenge.logs.length:0,
    logs:(Array.isArray(challenge?.logs)?challenge.logs:[]).map((log,index)=>({
      index,date:log?.date??null,spent:log?.spent??null,amount:log?.amount??null,necessary:log?.necessary??null,reason:log?.reason??'',
      entriesCount:Array.isArray(log?.entries)?log.entries.length:0,
      entries:(Array.isArray(log?.entries)?log.entries:[]).map(entry=>({id:entry?.id??null,amount:entry?.amount??null,necessity:entry?.necessity??null,category:entry?.category??'',merchant:entry?.merchant??'',note:entry?.note??'',createdAt:entry?.createdAt??null,updatedAt:entry?.updatedAt??null})),
      updatedAt:log?.updatedAt??null
    }))
  }));
  const after=JSON.stringify(state.noSpendChallenges);
  return {payload:{appVersion:APP_VERSION,build:document.documentElement.dataset.runtimeBuild||window.JOURNAL_BUILD||'',schemaVersion:state.schemaVersion,exportedAt:new Date().toISOString(),canonicalStorageKey:KEY,noSpendChallenges:challenges},before,after,equal:before===after};
}
window.buildNoSpendReadonlyAudit=buildNoSpendReadonlyAudit;
state.wishlists=Array.isArray(state.wishlists)?state.wishlists:[];
state.inventory=state.inventory&&typeof state.inventory==='object'?state.inventory:{items:[],categories:[],locations:[]};
state.inventory.items=Array.isArray(state.inventory.items)?state.inventory.items:[];
state.inventory.categories=Array.isArray(state.inventory.categories)?state.inventory.categories:[];
state.inventory.locations=Array.isArray(state.inventory.locations)?state.inventory.locations:[];
state.orders=state.orders&&typeof state.orders==='object'?state.orders:{items:[],sellers:[],pickupLocations:[],recurring:[],forwardingBatches:[]};
['items','sellers','pickupLocations','recurring','forwardingBatches'].forEach(k=>state.orders[k]=Array.isArray(state.orders[k])?state.orders[k]:[]);
state.schemaVersion=12;
state.settings=state.settings&&typeof state.settings==='object'?state.settings:{theme:'sage'};
state.settings.inventorySortMode=INVENTORY_SORT_MODES.includes(state.settings.inventorySortMode)?state.settings.inventorySortMode:'added';
state.settings.todayDashboard=normalizeTodayDashboardPreferences(state.settings.todayDashboard);
return state;
}
const loadResult=window.PersistenceFoundation?.loadCanonicalState({storage:localStorage,key:KEY,legacyKeys:LEGACY_KEYS,defaultState,hydrateState:hydrateAppState})||{state:defaultState(),status:'load_failure',source:'foundation_unavailable',error:{name:'PersistenceFoundationError',message:'Persistence foundation did not load.'},canonicalRawPresent:null,canonicalRawLength:null};
let persistenceSafeMode=loadResult.status==='load_failure';
let state=loadResult.state;
let lastVerifiedCanonicalRaw='';
try{lastVerifiedCanonicalRaw=loadResult.status==='loaded'?(localStorage.getItem(KEY)||''):JSON.stringify(state);}catch(_){lastVerifiedCanonicalRaw=JSON.stringify(state);}
function restoreLastVerifiedCanonicalAfterFailedSave(){
  let actual='';try{actual=localStorage.getItem(KEY)||'';}catch(_){}
  if(actual!==lastVerifiedCanonicalRaw){
    persistenceSafeMode=true;renderPersistenceSafeModeWarning();
    return {restored:false,reason:'persisted canonical changed or cannot be read after failed commit'};
  }
  try{state=hydrateAppState(JSON.parse(lastVerifiedCanonicalRaw));return {restored:true};}
  catch(_){persistenceSafeMode=true;renderPersistenceSafeModeWarning();return {restored:false,reason:'last verified canonical could not be rehydrated'};}
}
window.getLastVerifiedCanonicalRaw=()=>lastVerifiedCanonicalRaw;
window.__canonicalSaveFailurePending=null;
window.persistenceLoadStatus=()=>({...loadResult,status:persistenceSafeMode?'load_failure':loadResult.status,state:undefined});
window.isPersistenceSafeMode=()=>persistenceSafeMode;
window.canWriteCanonicalState=()=>!persistenceSafeMode;
let view=new Date(),longKey='';
const qs=q=>document.querySelector(q),qsa=q=>document.querySelectorAll(q),pad=n=>String(n).padStart(2,'0');
const themes={
  sage:{name:'奶油鼠尾草',desc:'自然治愈，适合长期记录与规划',meta:'#F7F5EF',colors:['#8FA082','#B7C3AE','#E7DBCA','#F7F5EF']},
  sakura:{name:'樱花马卡龙',desc:'温柔轻甜，适合日常手帐与回忆',meta:'#FFF8F8',colors:['#F7C7D3','#FFD6E2','#FFE5D6','#FFF8F8']},
  blue:{name:'雾蓝纸感',desc:'清爽安静，适合专注整理与计划',meta:'#F7F8FA',colors:['#6E8196','#C7D6E3','#D8CDBF','#F7F8FA']},
  morandi:{name:'莫兰迪',desc:'低饱和安静质感，适合沉淀与复盘',meta:'#F6F1EF',colors:['#B69390','#D8C3BE','#C9B8A9','#F6F1EF']},
  beige:{name:'奶油 Beige',desc:'温暖柔和，像奶油纸页一样耐看',meta:'#FAF5EE',colors:['#C9AE8A','#E5D4BF','#EEDCC4','#FAF5EE']}
};


const multiInstanceTemplates = {
  travel:{label:'Travel Planner',newLabel:'新建旅程',titleField:'destination',dateFields:['dates']},
  fitness:{label:'Fitness Goals',newLabel:'新建计划',titleField:'projectTitle',dateFields:['startDate','endDate']},
  wellness:{label:'Self Care Plan',newLabel:'新建方案',titleField:'projectTitle',dateFields:['startDate','endDate']},
  books:{label:'Book Review',newLabel:'新建书籍记录',titleField:'title',dateFields:['start','finish']},
  finance:{label:'Financial Goals',newLabel:'新建财务计划',titleField:'projectTitle',dateFields:['startDate','endDate']},
  smartGoal:{label:'SMART Goal',newLabel:'新建目标',titleField:'goalTitle',dateFields:['startDate','targetDate']},
  longTermGoal:{label:'Long Term Goal',newLabel:'新建长期目标',titleField:'goalTitle',dateFields:['startDate','targetDate']},
  pomodoro:{label:'Pomodoro Sprint',newLabel:'新建 Sprint',titleField:'projectTitle',dateFields:['date']},
  partyPlanner:{label:'Party Planner',newLabel:'新建活动',titleField:'event',dateFields:['date']}
};
let currentProjectType='', currentProjectId='';

function isMultiInstanceTemplate(k){return !!multiInstanceTemplates[k]}
function ensureProjectBucket(type){
  state.projects[type]=Array.isArray(state.projects[type])?state.projects[type]:[];
  return state.projects[type];
}
function migrateLegacyProject(type){
  const bucket=ensureProjectBucket(type);
  if(bucket.length) return;
  const legacy=state.long[type];
  if(!legacy) return;
  const hasData = typeof legacy==='string' ? legacy.trim() : Object.values(legacy||{}).some(v=>String(v||'').trim());
  if(!hasData) return;
  bucket.push({
    id:'legacy-'+Date.now(),
    title:(legacy && typeof legacy==='object' && (legacy.title||legacy.destination||legacy.projectTitle)) || multiInstanceTemplates[type].label+' · 历史记录',
    status:'archived',
    createdAt:Date.now(),
    updatedAt:Date.now(),
    formData: typeof legacy==='string' ? {notes:legacy} : legacy
  });
  delete state.long[type];
  save();
}
function projectDisplayTitle(type,p){
  const meta=multiInstanceTemplates[type];
  const fd=p.formData||{};
  return p.title || fd[meta.titleField] || meta.label;
}
function projectDateSummary(type,p){
  const fd=p.formData||{}, fields=multiInstanceTemplates[type].dateFields||[];
  return fields.map(k=>fd[k]).filter(Boolean).join(' — ');
}
function openProjectList(type){
  currentProjectType=type;
  migrateLegacyProject(type);
  const meta=multiInstanceTemplates[type];
  qs('#projectListTitle').textContent=meta.label;
  qs('#newProjectBtn').textContent='＋ '+meta.newLabel;
  qs('#newProjectBtn').onclick=()=>createProject(type);
  renderProjectList(type);
  modalController.open('projectListModal');
}
function closeProjectList(){modalController.close('projectListModal')}
function renderProjectList(type){
  const bucket=ensureProjectBucket(type).slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  qs('#projectList').innerHTML=bucket.length ? bucket.map(p=>`
    <div class="project-card">
      <div class="project-card-top">
        <div>
          <h3>${esc(projectDisplayTitle(type,p))}</h3>
          <div class="meta">${projectDateSummary(type,p)?esc(projectDateSummary(type,p))+' · ':''}更新 ${new Date(p.updatedAt||p.createdAt||Date.now()).toLocaleDateString('zh-CN')}</div>
        </div>
        <span class="status-pill">${p.status==='archived'?'已归档':'进行中'}</span>
      </div>
      <div class="project-actions">
        <button onclick="editProject('${type}','${p.id}')">编辑</button>
        <button onclick="duplicateProject('${type}','${p.id}')">复制</button>
        <button onclick="toggleArchiveProject('${type}','${p.id}')">${p.status==='archived'?'取消归档':'归档'}</button>
        <button class="danger" onclick="deleteProject('${type}','${p.id}')">删除</button>
      </div>
    </div>`).join('') : '<div class="entry"><span class="small">还没有项目。点上方“新建”开始。</span></div>';
}
function createProject(type){
  const bucket=ensureProjectBucket(type);
  const id=(crypto.randomUUID?crypto.randomUUID():'p-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  bucket.push({id,title:'',status:'active',createdAt:Date.now(),updatedAt:Date.now(),formData:{}});
  save();
  editProject(type,id,true);
}
function findProject(type,id){return ensureProjectBucket(type).find(p=>p.id===id)}
function editProject(type,id,isNew=false){
  currentProjectType=type;currentProjectId=id;
  const p=findProject(type,id); if(!p)return;
  const schema=templateSchemas[type];
  qs('#longTitle').textContent=schema.title;
  let data=p.formData||{};
  qs('#structuredForm').innerHTML=`
    <div class="form-section">
      <h3>项目信息</h3>
      <div class="project-title-row">
        <input id="projectCustomTitle" placeholder="项目标题（可选）" value="${esc(p.title||'')}">
        <select id="projectStatus">
          <option value="active" ${p.status!=='archived'?'selected':''}>进行中</option>
          <option value="archived" ${p.status==='archived'?'selected':''}>已归档</option>
        </select>
      </div>
    </div>` + schema.sections.map(sec=>sectionHTML(sec,data)).join('');
  if(modalController.isOpen('projectListModal')) modalController.push('projectListModal','longModal',{flow:'project-list-editor',projectType:type,projectId:id});
  else modalController.open('longModal');
}
function saveProject(){
  const p=findProject(currentProjectType,currentProjectId); if(!p)return;
  const obj={};
  qsa('#structuredForm [data-sk]').forEach(el=>obj[el.dataset.sk]=el.value);
  const titleField=multiInstanceTemplates[currentProjectType]?.titleField;
  const customTitle=(qs('#projectCustomTitle')?.value||'').trim();
  const schemaTitle=(titleField&&obj[titleField]||'').trim();
  const resolvedTitle=customTitle||schemaTitle;
  if(titleField&&resolvedTitle)obj[titleField]=resolvedTitle;
  p.formData=obj;
  p.title=resolvedTitle;
  p.status=qs('#projectStatus')?.value||'active';
  p.updatedAt=Date.now();
  save();
  closeLong();
}
function duplicateProject(type,id){
  const src=findProject(type,id); if(!src)return;
  const copy=JSON.parse(JSON.stringify(src));
  copy.id=(crypto.randomUUID?crypto.randomUUID():'p-'+Date.now());
  copy.title=(projectDisplayTitle(type,src)||multiInstanceTemplates[type].label)+' · 副本';
  copy.status='active';copy.createdAt=Date.now();copy.updatedAt=Date.now();
  ensureProjectBucket(type).push(copy);save();renderProjectList(type);
}
function toggleArchiveProject(type,id){
  const p=findProject(type,id);if(!p)return;
  p.status=p.status==='archived'?'active':'archived';p.updatedAt=Date.now();save();renderProjectList(type);
}
function deleteProject(type,id){
  const p=findProject(type,id);if(!p)return;
  if(!confirm('确定删除“'+projectDisplayTitle(type,p)+'”吗？删除后无法恢复。'))return;
  state.projects[type]=ensureProjectBucket(type).filter(x=>x.id!==id);save();renderProjectList(type);
}

let recordFilter='all',recordBlockFilter='all';
function todayKey(){return iso(new Date())}
function renderTodayBlocks(){const key=todayKey();state.dailyBlocks[key]=state.dailyBlocks[key]||{};state.dailyBlockMeta[key]=state.dailyBlockMeta[key]||{};const names=['我的一天',...state.customBlocks];qs('#todayBlocks').innerHTML=names.map(name=>{const meta=state.dailyBlockMeta[key][name]||{};const growth=name==='熹熹的一天'?`<div class="block-actions growth-block-actions"><label><input type="checkbox" ${meta.isMilestone?'checked':''} onchange="toggleGrowthMilestone('${encodeURIComponent(key)}','${encodeURIComponent(name)}',this.checked)"> 成长瞬间</label>${meta.isMilestone?`<button onclick="openGrowthMilestone('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">详情</button>`:''}</div>`:'';return `<div class="daily-block"><div class="daily-block-head"><h3>${esc(name)}</h3><div class="block-actions"><button onclick="openDailyBlockEditor('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">编辑</button>${name==='我的一天'?'':`<button onclick="removeTodayBlock('${encodeURIComponent(name)}')">移除</button>`}</div></div><button class="daily-block-content" type="button" onclick="openDailyBlockEditor('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">${esc(state.dailyBlocks[key][name]||'写一点今天的内容…')}</button>${growth}</div>`}).join('')}function addTodayBlock(){const n=prompt('区块名称（例如：熹熹的一天、工作、感恩、灵感）');if(!n||!n.trim())return;if(!state.customBlocks.includes(n.trim()))state.customBlocks.push(n.trim());save();renderTodayBlocks();renderCustomBlockSettings()}
function removeTodayBlock(enc){const n=decodeURIComponent(enc);state.customBlocks=state.customBlocks.filter(x=>x!==n);save();renderTodayBlocks();renderCustomBlockSettings()}
function renderCustomBlockSettings(){const el=qs('#customBlockSettings');if(!el)return;el.innerHTML=state.customBlocks.length?state.customBlocks.map(n=>`<div class="setting-row"><div><b>${esc(n)}</b></div><button class="ghost" onclick="deleteCustomBlockSetting('${encodeURIComponent(n)}')">删除</button></div>`).join(''):'<span class="small">尚未设置额外区块。默认保留“我的一天”。</span>'}
function addCustomBlockSetting(){const n=prompt('新增常用区块名称');if(!n||!n.trim())return;if(!state.customBlocks.includes(n.trim()))state.customBlocks.push(n.trim());save();renderCustomBlockSettings();renderTodayBlocks()}
function deleteCustomBlockSetting(enc){removeTodayBlock(enc)}
function initMonthJump(){const y=qs('#jumpYear'),m=qs('#jumpMonth');if(!y||!m)return;const cy=new Date().getFullYear();y.innerHTML=Array.from({length:11},(_,i)=>cy-5+i).map(v=>`<option value="${v}" ${v===view.getFullYear()?'selected':''}>${v}年</option>`).join('');m.innerHTML=Array.from({length:12},(_,i)=>`<option value="${i}" ${i===view.getMonth()?'selected':''}>${i+1}月</option>`).join('')}
function jumpToMonth(){view=new Date(+qs('#jumpYear').value,+qs('#jumpMonth').value,1);renderMonth()}
function setRecordFilter(f,btn){recordFilter=f;qsa('#recordFilters button').forEach(x=>x.classList.remove('on'));btn.classList.add('on');renderEntries()}
function setRecordBlockFilter(value){recordBlockFilter=value||'all';renderEntries()}
const templateLabels={brain:'Brain Dump',wish:'Wish List',books:'Book Review',travel:'Travel Planner',meal:'Weekly Meal',fitness:'Fitness Goals',wellness:'Self Care Plan',finance:'Financial Goals',yearPlan:'年度计划',important:'Important Dates',glance:'Year at a Glance',vision:'Vision Board',yearReview:'年度回顾',letter:'Letter to Myself'};
function toggleFavorite(key){const i=state.favorites.indexOf(key);if(i>=0)state.favorites.splice(i,1);else state.favorites.push(key);save();renderFavoriteTemplates()}
function renderFavoriteTemplates(){const el=qs('#favoriteTemplates');if(!el)return;el.innerHTML=state.favorites.length?state.favorites.map(k=>`<button class="favorite-chip" onclick="openFavoriteTemplate('${k}')">★ ${esc(k.startsWith('custom:')?(state.customTemplates.find(t=>t.id===k.slice(7))?.name||'自定义'):templateLabels[k]||k)}</button>`).join(''):'<span class="small">收藏常用模板后会显示在这里。</span>'}
function openFavoriteTemplate(key){if(key.startsWith('custom:'))return openCustomTemplateInstance(key.slice(7));editLong(key,templateLabels[key]||key)}
function createCustomTemplate(){qs('#ctName').value='';qs('#ctFields').value='';modalController.open('customTemplateModal')}
function closeCustomTemplateModal(){modalController.close('customTemplateModal')}
function saveCustomTemplate(){const name=qs('#ctName').value.trim(),fields=qs('#ctFields').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!name||!fields.length)return;const id=crypto.randomUUID?crypto.randomUUID():'ct-'+Date.now();state.customTemplates.push({id,name,fields});state.favorites.push('custom:'+id);save();closeCustomTemplateModal();renderFavoriteTemplates()}
function openCustomTemplateInstance(id){const t=state.customTemplates.find(x=>x.id===id);if(!t)return;longKey='custom:'+id;currentProjectType='';currentProjectId='';qs('#longTitle').textContent=t.name;const data=state.long[longKey]||{};qs('#structuredForm').innerHTML=`<div class="form-section"><h3>${esc(t.name)}</h3><div class="form-grid">${t.fields.map((f,i)=>fieldHTML({k:'f'+i,label:f,type:'textarea',full:true},data['f'+i])).join('')}</div></div>`;modalController.open('longModal')}
function printSelectedPage(){const v=qs('input[name="exportPage"]:checked')?.value||'home';qsa('.page').forEach(p=>p.classList.remove('print-target'));qs('#'+v)?.classList.add('print-target');setTimeout(()=>window.print(),50)}
window.addEventListener('afterprint',()=>qsa('.page').forEach(p=>p.classList.remove('print-target')));
function updateBackTop(){const b=qs('#backTopBtn');if(b)b.style.display=window.scrollY>500?'block':'none'}window.addEventListener('scroll',updateBackTop,{passive:true});

const templateSchemas = {
  yearPlan: {
    title:'年度计划',
    sections:[
      {title:'年度核心',fields:[
        {k:'theme',label:'年度关键词 / Theme',type:'text'},
        {k:'mainGoal',label:'今年最重要的一个目标',type:'textarea',full:true}
      ]},
      {title:'12个月计划',kind:'months',prefix:'month'}
    ]
  },
  important: {
    title:'重要日期',
    sections:[{title:'Important Dates',kind:'months',prefix:'month',placeholder:'生日 / 节日 / 纪念日 / 预约'}]
  },
  glance: {
    title:'Year at a Glance',
    sections:[{title:'全年大事记',kind:'months',prefix:'month',placeholder:'这个月最值得记住的事'}]
  },
  vision: {
    title:'Vision Board',
    sections:[
      {title:'年度愿景',fields:[
        {k:'keywords',label:'年度关键词',type:'text'},
        {k:'life',label:'我想过怎样的生活',type:'textarea',full:true},
        {k:'family',label:'家庭',type:'textarea'},
        {k:'health',label:'健康',type:'textarea'},
        {k:'career',label:'工作 / 学习',type:'textarea'},
        {k:'finance',label:'财务',type:'textarea'}
      ]}
    ]
  },
  yearReview: {
    title:'年度回顾',
    sections:[
      {title:'这一年',fields:[
        {k:'top5',label:'Top 5 Accomplishments This Year',type:'textarea'},
        {k:'hardest',label:'The Hardest Thing About This Year Was',type:'textarea'},
        {k:'lessons',label:'Biggest Lessons',type:'textarea'},
        {k:'grateful',label:'Grateful For',type:'textarea'}
      ]},
      {title:'复盘',fields:[
        {k:'well',label:'What Did I Do Well',type:'textarea'},
        {k:'improve',label:'What I Need to Improve',type:'textarea'},
        {k:'better',label:'How to Make Next Year Better',type:'textarea',full:true}
      ]},
      {title:'Goals',fields:[
        {k:'personal',label:'Personal Goals',type:'textarea'},
        {k:'health',label:'Health Goals',type:'textarea'},
        {k:'career',label:'Career Goals',type:'textarea'},
        {k:'financial',label:'Financial Goals',type:'textarea'}
      ]}
    ]
  },
  letter: {
    title:'写给自己的信',
    sections:[{title:'Letter to Myself',fields:[
      {k:'date',label:'日期',type:'date'},
      {k:'letter',label:'想对未来的自己说',type:'textarea',full:true}
    ]}]
  },
  brain: {
    title:'Brain Dump',
    sections:[
      {title:'脑内清空',fields:[
        {k:'dump',label:'现在脑子里所有事情',type:'textarea',full:true},
        {k:'must',label:'必须处理',type:'textarea'},
        {k:'later',label:'可以以后再处理',type:'textarea'},
        {k:'drop',label:'可以放弃',type:'textarea',full:true}
      ]}
    ]
  },
  wish: {
    title:'Wish List',
    sections:[{title:'Wish List',fields:[
      {k:'for',label:'WISH-LIST FOR',type:'text',full:true},
      {k:'items',label:'ITEM / STORE-WEBSITE / PRICE',type:'textarea',full:true}
    ]}]
  },
  books: {
    title:'Book Review',
    sections:[
      {title:'Book Details',fields:[
        {k:'title',label:'Title',type:'text'},
        {k:'author',label:'Author',type:'text'},
        {k:'start',label:'Start Date',type:'date'},
        {k:'finish',label:'Finish Date',type:'date'},
        {k:'rating',label:'Rating 1–5',type:'number'}
      ]},
      {title:'Review',fields:[
        {k:'summary',label:'Summary / 这本书讲了什么',type:'textarea',full:true},
        {k:'takeaways',label:'Key Takeaways / 最大收获',type:'textarea'},
        {k:'quotes',label:'Favourite Quotes',type:'textarea'},
        {k:'thoughts',label:'My Thoughts',type:'textarea',full:true}
      ]}
    ]
  },
  travel: {
    title:'Travel Planner',
    sections:[
      {title:'Trip Details',fields:[
        {k:'destination',label:'Destination',type:'text'},
        {k:'dates',label:'Travel Dates',type:'text'},
        {k:'people',label:'Travelling With',type:'text'},
        {k:'budget',label:'Travel Budget',type:'text'}
      ]},
      {title:'Pre Travel Checklist',fields:[
        {k:'research',label:'Travel Research / 想去的地方',type:'textarea'},
        {k:'checklist',label:'Pre Travel Checklist',type:'textarea'}
      ]},
      {title:'Plan & Memories',fields:[
        {k:'plan',label:'Travel Planner / 行程',type:'textarea',full:true},
        {k:'memories',label:'Travel Memories',type:'textarea'},
        {k:'spending',label:'Actual Spending / 实际花费',type:'textarea'}
      ]}
    ]
  },
  meal: {
    title:'Weekly Meal Planner',
    sections:[
      {title:'Weekly Meal',fields:[
        {k:'mon',label:'Monday',type:'text'},{k:'tue',label:'Tuesday',type:'text'},
        {k:'wed',label:'Wednesday',type:'text'},{k:'thu',label:'Thursday',type:'text'},
        {k:'fri',label:'Friday',type:'text'},{k:'sat',label:'Saturday',type:'text'},
        {k:'sun',label:'Sunday',type:'text'}
      ]},
      {title:'Kitchen',fields:[
        {k:'grocery',label:'Grocery List',type:'textarea'},
        {k:'inventory',label:'Kitchen Inventory',type:'textarea'}
      ]}
    ]
  },
  fitness: {
    title:'Fitness Goals',
    sections:[
      {title:'Plan Period',fields:[
        {k:'projectTitle',label:'计划名称',type:'text'},
        {k:'startDate',label:'Start Date',type:'date'},
        {k:'endDate',label:'End Date',type:'date'}
      ]},
      {title:'My Fitness Goals',fields:[
        {k:'startWeight',label:'Start Weight',type:'number'},
        {k:'goalWeight',label:'Goal Weight',type:'number'},
        {k:'finalWeight',label:'Final Weight',type:'number'},
        {k:'bmi',label:'BMI',type:'number'}
      ]},
      {title:'Top Fitness Goals',fields:[
        {k:'goals',label:'Top Fitness Goals',type:'textarea',full:true},
        {k:'why',label:'Why These Goals Matter',type:'textarea',full:true}
      ]},
      {title:'Action Plan',fields:[
        {k:'actions',label:'Action Steps',type:'textarea'},
        {k:'goodHabits',label:'Good Habits to Start',type:'textarea'},
        {k:'badHabits',label:'Bad Habits to Stop',type:'textarea'}
      ]},
      {title:'Measurements',fields:[
        {k:'waist',label:'Waist',type:'text'},
        {k:'hips',label:'Hips',type:'text'},
        {k:'chest',label:'Chest',type:'text'},
        {k:'arms',label:'Arms',type:'text'}
      ]}
    ]
  },
  wellness: {
    title:'Self Care Plan',
    sections:[
      {title:'Plan Period',fields:[
        {k:'projectTitle',label:'方案名称',type:'text'},
        {k:'startDate',label:'Start Date',type:'date'},
        {k:'endDate',label:'End Date',type:'date'}
      ]},
      {title:'Self Care',fields:[
        {k:'body',label:'Body / 身体',type:'textarea'},
        {k:'mind',label:'Mind / 心理',type:'textarea'},
        {k:'social',label:'Social',type:'textarea'},
        {k:'rest',label:'Rest / 休息',type:'textarea'}
      ]},
      {title:'This Week',fields:[
        {k:'sleep',label:'Sleep Goal',type:'text'},
        {k:'mood',label:'Mood 1–10',type:'number'},
        {k:'gratitude',label:'Gratitude',type:'textarea',full:true}
      ]}
    ]
  },
  finance: {
    title:'Financial Goals',
    sections:[
      {title:'Plan Period',fields:[
        {k:'projectTitle',label:'计划名称',type:'text'},
        {k:'startDate',label:'Start Date',type:'date'},
        {k:'endDate',label:'End Date',type:'date'}
      ]},
      {title:'Financial Goals',fields:[
        {k:'income',label:'Income Goal',type:'text'},
        {k:'saving',label:'Saving Goal',type:'text'},
        {k:'debt',label:'Debt Goal',type:'text'},
        {k:'investment',label:'Investment Goal',type:'text'}
      ]},
      {title:'Plan',fields:[
        {k:'actions',label:'Action Steps',type:'textarea',full:true},
        {k:'notes',label:'Notes',type:'textarea',full:true}
      ]}
    ]
  },
  smartGoal:{title:'SMART Goal Planner',sections:[
    {title:'Goal Period',fields:[{k:'goalTitle',label:'目标名称',type:'text'},{k:'startDate',label:'Start Date',type:'date'},{k:'targetDate',label:'Target Date',type:'date'}]},
    {title:'SMART',fields:[{k:'goal',label:'Goal',type:'textarea',full:true},{k:'specific',label:'Specific',type:'textarea'},{k:'measurable',label:'Measurable',type:'textarea'},{k:'achievable',label:'Achievable',type:'textarea'},{k:'relevant',label:'Relevant',type:'textarea'},{k:'timebound',label:'Time-bound',type:'textarea'}]},
    {title:'Action',fields:[{k:'nextSteps',label:'Next Actions',type:'textarea',full:true},{k:'review',label:'Progress / Review',type:'textarea',full:true}]}
  ]},
  longTermGoal:{title:'Long Term Goal',sections:[
    {title:'Goal',fields:[{k:'goalTitle',label:'目标名称',type:'text'},{k:'startDate',label:'Start Date',type:'date'},{k:'targetDate',label:'Target Date',type:'date'},{k:'why',label:'Why It Matters',type:'textarea',full:true}]},
    {title:'Milestones',fields:[{k:'milestones',label:'Milestones',type:'textarea',full:true},{k:'actions',label:'Next Actions',type:'textarea',full:true},{k:'review',label:'Review',type:'textarea',full:true}]}
  ]},
  priorityMatrix:{title:'Priority Matrix',sections:[{title:'Important × Urgent',fields:[{k:'q1',label:'重要 + 紧急',type:'textarea'},{k:'q2',label:'重要 + 不紧急',type:'textarea'},{k:'q3',label:'不重要 + 紧急',type:'textarea'},{k:'q4',label:'不重要 + 不紧急',type:'textarea'}]}]},
  pomodoro:{title:'Pomodoro Sprint',sections:[
    {title:'Sprint',fields:[{k:'projectTitle',label:'Sprint 名称',type:'text'},{k:'date',label:'Date',type:'date'},{k:'task',label:'Main Task',type:'textarea',full:true},{k:'sessions',label:'Planned Sessions',type:'number'}]},
    {title:'Review',fields:[{k:'completed',label:'Completed Sessions',type:'number'},{k:'distractions',label:'Distractions / Parking Lot',type:'textarea'},{k:'review',label:'Review',type:'textarea',full:true}]}
  ]},
  partyPlanner:{title:'Party Planner',sections:[
    {title:'Event',fields:[{k:'event',label:'Event',type:'text'},{k:'date',label:'Date',type:'date'},{k:'budget',label:'Budget',type:'text'},{k:'guests',label:'Guest List',type:'textarea'}]},
    {title:'Plan',fields:[{k:'food',label:'Food / Drinks',type:'textarea'},{k:'todo',label:'To Do',type:'textarea'},{k:'notes',label:'Notes / Memories',type:'textarea',full:true}]}
  ]}

};

function fieldHTML(f,val){
  const v = val ?? '';
  const full = f.full ? ' full' : '';
  if(f.type==='textarea') return `<div class="form-field${full}"><label>${f.label}</label><textarea data-sk="${f.k}">${esc(v)}</textarea></div>`;
  if(f.type==='date') return `<div class="form-field${full}"><label>${f.label}</label><div class="date-field"><input data-sk="${f.k}" type="date" value="${esc(v)}"></div></div>`;
  return `<div class="form-field${full}"><label>${f.label}</label><input data-sk="${f.k}" type="${f.type||'text'}" value="${esc(v)}"></div>`;
}
function sectionHTML(sec,data){
  if(sec.kind==='months'){
    const names=['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `<div class="form-section"><h3>${sec.title}</h3><div class="month-list">${
      names.map((n,i)=>`<div class="month-row"><b>${n}</b><textarea data-sk="${sec.prefix+(i+1)}" placeholder="${sec.placeholder||''}">${esc(data[sec.prefix+(i+1)]||'')}</textarea></div>`).join('')
    }</div></div>`;
  }
  return `<div class="form-section"><h3>${sec.title}</h3><div class="form-grid">${sec.fields.map(f=>fieldHTML(f,data[f.k])).join('')}</div></div>`;
}

function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function save(){
  let payload='';
  const fail=(stage,error)=>{const rollback=restoreLastVerifiedCanonicalAfterFailedSave(),result={ok:false,stage,errorName:error?.name||'Error',message:error?.message||String(error||'保存失败'),persisted:false,rollback};window.lastPersistenceResult=result;window.__canonicalSaveFailurePending=result;ordersPersistenceDiagnostics?.recordFailure(stage,error);console.warn('save failed',stage,error);alert(result.errorName==='QuotaExceededError'?'保存失败，本机存储空间不足。当前修改尚未安全保存。':'保存失败，当前修改尚未安全保存。');return result;};
  if(persistenceSafeMode){const result={ok:false,stage:'persistence_safe_mode',errorName:'PersistenceSafeModeError',message:'数据暂时无法读取。为保护现有记录，App 已暂停保存。',persisted:false};window.lastPersistenceResult=result;window.__canonicalSaveFailurePending=result;renderPersistenceSafeModeWarning();return result;}
  try{payload=JSON.stringify(state);ordersPersistenceDiagnostics?.recordStringify(payload);}
  catch(error){return fail('JSON.stringify',error)}
  const commit=window.PersistenceFoundation?.commitCanonical;
  if(typeof commit!=='function')return fail('quota_safe_commit_unavailable',new Error('统一安全保存路径不可用'));
  const result=commit({storage:localStorage,key:KEY,payload,onAttempt:()=>ordersPersistenceDiagnostics?.recordSetAttempt(payload),onSuccess:()=>ordersPersistenceDiagnostics?.recordSetSuccess(payload),verifyReadBack:raw=>{const persisted=JSON.parse(raw);if(!persisted||typeof persisted!=='object'||Array.isArray(persisted))throw new Error('canonical read-back root 无效');if(Number(persisted.schemaVersion)!==12)throw new Error('canonical read-back schemaVersion 无效');return {schemaVersion:persisted.schemaVersion};}});
  if(!result.ok)return fail(result.stage,{name:result.errorName,message:result.message});
  lastVerifiedCanonicalRaw=payload;window.__canonicalSaveFailurePending=null;window.lastPersistenceResult=result;return result;
}
function commitInventoryCandidate(candidate,{itemId,expectedQuantity}={}){
  const fail=(stage,error)=>{const result={ok:false,stage,errorName:error?.name||'Error',message:error?.message||String(error||'保存失败'),persisted:false};window.lastPersistenceResult=result;return result;};
  if(persistenceSafeMode)return fail('persistence_safe_mode',new Error('数据暂时无法读取。为保护现有记录，App 已暂停保存。'));
  let payload='';try{payload=JSON.stringify(candidate);}catch(error){return fail('JSON.stringify',error);}
  const commit=window.PersistenceFoundation?.commitCanonical;
  if(typeof commit!=='function')return fail('quota_safe_commit_unavailable',new Error('统一安全保存路径不可用'));
  const result=commit({storage:localStorage,key:KEY,payload,verifyReadBack:raw=>{
    const persisted=JSON.parse(raw);
    if(!persisted||typeof persisted!=='object'||Array.isArray(persisted))throw new Error('canonical read-back root 无效');
    if(Number(persisted.schemaVersion)!==12)throw new Error('canonical read-back schemaVersion 无效');
    const item=(persisted.inventory?.items||[]).find(entry=>String(entry?.id)===String(itemId));
    if(!item)throw new Error('canonical read-back inventory item 缺失');
    if(!Number.isFinite(Number(item.quantity))||Number(item.quantity)<0)throw new Error('canonical read-back inventory quantity 无效');
    if(Number(item.quantity)!==Number(expectedQuantity))throw new Error('canonical read-back inventory quantity 不匹配');
    return {schemaVersion:persisted.schemaVersion,inventoryItemId:String(itemId),quantity:Number(item.quantity)};
  }});
  if(!result?.ok)return fail(result?.stage||'commit',{name:result?.errorName||'Error',message:result?.message||'保存失败'});
  state=hydrateAppState(candidate);lastVerifiedCanonicalRaw=payload;window.__canonicalSaveFailurePending=null;window.lastPersistenceResult=result;return result;
}
function commitOrderInventoryCandidate(candidate,{orderId,expectedInventoryIds=[],expectOrder=true}={}){
  const fail=(stage,error)=>({ok:false,stage,errorName:error?.name||'Error',message:error?.message||String(error||'保存失败'),persisted:false});
  if(persistenceSafeMode)return fail('persistence_safe_mode',new Error('数据暂时无法读取。为保护现有记录，App 已暂停保存。'));
  let payload='';try{payload=JSON.stringify(candidate);}catch(error){return fail('JSON.stringify',error);}
  const commit=window.PersistenceFoundation?.commitCanonical;if(typeof commit!=='function')return fail('quota_safe_commit_unavailable',new Error('统一安全保存路径不可用'));
  const result=commit({storage:localStorage,key:KEY,payload,verifyReadBack:raw=>{const persisted=JSON.parse(raw),hasOrder=(persisted.orders?.items||[]).some(order=>String(order.id)===String(orderId));if(Number(persisted?.schemaVersion)!==12)throw new Error('canonical read-back schemaVersion 无效');if(expectOrder&&!hasOrder)throw new Error('canonical read-back order 缺失');if(!expectOrder&&hasOrder)throw new Error('canonical read-back order 未删除');for(const id of expectedInventoryIds){if(!(persisted.inventory?.items||[]).some(item=>String(item.id)===String(id)))throw new Error('canonical read-back inventory item 缺失');}return {schemaVersion:12,orderId:String(orderId),expectOrder:!!expectOrder};}});
  if(!result?.ok)return fail(result?.stage||'commit',{name:result?.errorName||'Error',message:result?.message||'保存失败'});
  state=hydrateAppState(candidate);lastVerifiedCanonicalRaw=payload;window.lastPersistenceResult=result;return result;
}
function commitNoSpendCandidate(candidate,{challengeId,date,expectedStatus}={}){
  const fail=(stage,error)=>({ok:false,stage,errorName:error?.name||'Error',message:error?.message||String(error||'保存失败'),persisted:false});
  if(persistenceSafeMode)return fail('persistence_safe_mode',new Error('数据暂时无法读取。为保护现有记录，App 已暂停保存。'));
  let payload='';try{payload=JSON.stringify(candidate);}catch(error){return fail('JSON.stringify',error);}
  const commit=window.PersistenceFoundation?.commitCanonical;if(typeof commit!=='function')return fail('quota_safe_commit_unavailable',new Error('统一安全保存路径不可用'));
  const result=commit({storage:localStorage,key:KEY,payload,verifyReadBack:raw=>{const persisted=JSON.parse(raw),challenge=(persisted.noSpendChallenges||[]).find(item=>String(item.id)===String(challengeId)),log=(challenge?.logs||[]).find(item=>item.date===date);if(Number(persisted?.schemaVersion)!==12)throw new Error('canonical read-back schemaVersion 无效');if(!challenge)throw new Error('canonical read-back challenge 缺失');if(log?.status!==expectedStatus)throw new Error('canonical read-back No Spend status 不匹配');return {schemaVersion:12,challengeId:String(challengeId),date,status:expectedStatus};}});
  if(!result?.ok)return fail(result?.stage||'commit',{name:result?.errorName||'Error',message:result?.message||'保存失败'});
  state=hydrateAppState(candidate);lastVerifiedCanonicalRaw=payload;window.lastPersistenceResult=result;return result;
}
function commitTwelveWeekCandidate(candidate,{cycleId,weekIndex,expectedDates=[]}={}){
  const fail=(stage,error)=>{const result={ok:false,stage,errorName:error?.name||'Error',message:error?.message||String(error||'保存失败'),persisted:false};window.lastPersistenceResult=result;return result;};
  if(persistenceSafeMode)return fail('persistence_safe_mode',new Error('数据暂时无法读取。为保护现有记录，App 已暂停保存。'));
  let payload='';try{payload=JSON.stringify(candidate);}catch(error){return fail('JSON.stringify',error);}
  const commit=window.PersistenceFoundation?.commitCanonical;
  if(typeof commit!=='function')return fail('quota_safe_commit_unavailable',new Error('统一安全保存路径不可用'));
  const result=commit({storage:localStorage,key:KEY,payload,verifyReadBack:raw=>{
    const persisted=JSON.parse(raw);
    if(!persisted||typeof persisted!=='object'||Array.isArray(persisted))throw new Error('canonical read-back root 无效');
    if(Number(persisted.schemaVersion)!==12)throw new Error('canonical read-back schemaVersion 无效');
    const cycle=(persisted.twelveWeekYears||[]).find(entry=>String(entry?.id)===String(cycleId));
    if(!cycle)throw new Error('canonical read-back 12 Week Year 周期缺失');
    if(weekIndex!==undefined){
      const week=cycle.weeks?.[Number(weekIndex)];
      if(!week||typeof week!=='object')throw new Error('canonical read-back 12 Week Year 周记录缺失');
      if(week.structuredActions!==undefined){
        if(!Array.isArray(week.structuredActions))throw new Error('canonical read-back structured actions 无效');
        const allowed=new Set((expectedDates||[]).map(String));
        week.structuredActions.forEach(action=>{
          if(!action||typeof action!=='object'||!String(action.id||''))throw new Error('canonical read-back action id 无效');
          if(!Number.isInteger(Number(action.weeklyTarget))||Number(action.weeklyTarget)<1||Number(action.weeklyTarget)>7)throw new Error('canonical read-back action target 无效');
          if(action.checkins!==undefined){
            if(!action.checkins||typeof action.checkins!=='object'||Array.isArray(action.checkins))throw new Error('canonical read-back action checkins 无效');
            Object.entries(action.checkins).forEach(([date,done])=>{if(!allowed.has(String(date))||done!==true)throw new Error('canonical read-back action checkin 无效');});
          }
        });
      }
    }
    return {schemaVersion:persisted.schemaVersion,twelveWeekYearId:String(cycleId),weekIndex:weekIndex===undefined?null:Number(weekIndex)};
  }});
  if(!result?.ok)return fail(result?.stage||'commit',{name:result?.errorName||'Error',message:result?.message||'保存失败'});
  state=hydrateAppState(candidate);lastVerifiedCanonicalRaw=payload;window.__canonicalSaveFailurePending=null;window.lastPersistenceResult=result;return result;
}
function renderAppVersion(){for(const el of document.querySelectorAll('[data-app-version]'))el.textContent=`v${APP_VERSION}`;for(const el of document.querySelectorAll('[data-build-label]'))el.textContent=BUILD_LABEL;}
const inventoryEditDiagnostics=(()=>{
  const TRACE_KEY='journal-planner-inventory-edit-trace-v0163';
  let trace=[];try{const raw=localStorage.getItem(TRACE_KEY);trace=raw?JSON.parse(raw):[];if(!Array.isArray(trace))trace=[];}catch(_){trace=[];}
  const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  function itemSnapshot(item){if(!item)return null;return {id:item.id,name:item.name,quantity:item.quantity,location:item.location,notes:item.notes,category:item.category,unit:item.unit,minQuantity:item.minQuantity,expiryDate:item.expiryDate,sourceOrders:copy(item.sourceOrders||[]),history:copy(item.history||[])};}
  function renderCount(){const el=qs('#inventoryEditTraceCount');if(el)el.textContent=`Inventory Edit trace: ${trace.length} events`;}
  function record(step,payload={}){trace.push({timestamp:new Date().toISOString(),step,...copy(payload)});if(trace.length>80)trace.splice(0,trace.length-80);renderCount();}
  function readPersistedItem(itemId){record('persisted record read-back start',{itemId,persistenceKey:KEY});let persistedItem=null,error='';try{const persisted=JSON.parse(localStorage.getItem(KEY)||'{}');persistedItem=(persisted.inventory?.items||[]).find(item=>String(item.id)===String(itemId))||null;}catch(err){error=String(err?.message||err)}record('persisted record read-back end',{itemId,result:persistedItem?'found':'missing',error,persistedRecord:itemSnapshot(persistedItem)});return persistedItem;}
  function exportTrace(){renderCount();const payload={exportedAt:new Date().toISOString(),appVersion:APP_VERSION,build:document.documentElement.dataset.runtimeBuild,persistenceKey:KEY,traceStorageKey:TRACE_KEY,canonicalSource:'state.inventory.items -> localStorage',trace:copy(trace),renderSourceSnapshot:copy(state.inventory?.items||[]).map(itemSnapshot)};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='inventory-edit-diagnostic-v0162.json';a.click();URL.revokeObjectURL(a.href);}
  return {record,readPersistedItem,exportTrace,itemSnapshot,renderCount,trace};
})();
/* P0 diagnostic only: records an Order save without changing Order state or view behavior. */
const ordersSaveDiagnostics=(()=>{
  const TRACE_KEY='journal-planner-orders-save-trace-v0200';let sessions=[];try{const raw=localStorage.getItem(TRACE_KEY);sessions=raw?JSON.parse(raw):[];if(!Array.isArray(sessions))sessions=[];}catch(_){sessions=[];}let active=null;
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const ids=()=>Array.isArray(state.orders?.items)?state.orders.items.map(order=>String(order?.id||'')).filter(Boolean):[];
  const activeIds=()=>Array.isArray(state.orders?.items)?state.orders.items.filter(order=>!order?.archived&&!order?.archivedAt&&!order?.deleted&&!order?.deletedAt&&!order?.tombstoned).map(order=>String(order.id)):[];
  const filterState=()=>({chipFilter:window.getOrdersFilterState?.()?.chipFilter||'',statusFilter:qs('#orderStatusFilter')?.value||'',search:qs('#orderSearch')?.value||'',sort:qs('#orderSort')?.value||''});
  // Diagnostics stay in this runtime session. Persisting full order drafts and
  // snapshots competes with canonical data for the same quota.
  function persist(){}
  function renderCount(){const el=qs('#ordersSaveTraceCount');if(el)el.textContent=`Orders Save trace: ${sessions.reduce((total,session)=>total+(session.events||[]).length,0)} events`}
  function record(step,payload={}){if(!active)return;active.events.push({timestamp:new Date().toISOString(),step,...copy(payload)});persist();renderCount();}
  function begin(payload={}){active={traceId:`orders-save-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,startedAt:new Date().toISOString(),appVersion:APP_VERSION,build:document.documentElement.dataset.runtimeBuild,beforeSaveCanonicalCount:ids().length,beforeSaveCanonicalIDs:ids(),beforeSaveActiveIDs:activeIds(),beforeSaveDraft:copy(payload),events:[]};sessions.push(active);if(sessions.length>30)sessions.splice(0,sessions.length-30);record('save_handler_received',{beforeSaveCanonicalCount:active.beforeSaveCanonicalCount,beforeSaveCanonicalIDs:active.beforeSaveCanonicalIDs,draft:active.beforeSaveDraft,filterState:filterState()});return active.traceId;}
  function recordCanonical(savedOrder){record('canonical_order_object_built',{savedOrderId:savedOrder?.id||'',savedOrderSnapshot:copy(savedOrder),stateOrdersItemsCount:ids().length,flags:{archived:savedOrder?.archived??null,archivedAt:savedOrder?.archivedAt??null,deleted:savedOrder?.deleted??null,deletedAt:savedOrder?.deletedAt??null,tombstoned:savedOrder?.tombstoned??null},fulfillmentType:savedOrder?.fulfillmentType??null,status:savedOrder?.status??null});}
  function recordPersist(savedOrder,persistSuccess){let persisted=null,error='';try{persisted=(JSON.parse(localStorage.getItem(KEY)||'{}').orders?.items||[]).find(order=>String(order?.id)===String(savedOrder?.id))||null;}catch(err){error=String(err?.message||err);}record('persist_write_result',{persistSuccess:!!persistSuccess,savedOrderId:savedOrder?.id||'',afterSaveCanonicalCount:ids().length,persistedReadBackFound:!!persisted,persistedRecord:copy(persisted),error});}
  function recordRender(pipeline,domIds){record('orders_production_render',{selectorInputCount:pipeline?.canonicalCount??null,afterActiveCount:pipeline?.afterActiveFilter??null,afterChipCount:pipeline?.afterChipFilter??null,afterStatusCount:pipeline?.afterStatusFilter??null,afterSearchCount:pipeline?.afterSearch??null,renderCandidateCount:pipeline?.renderCandidateCount??null,renderCandidateIds:copy(pipeline?.renderCandidateIds||[]),domCount:domIds.length,domOrderIds:copy(domIds),afterSaveFilterState:filterState()});}
  function finish(){if(!active)return null;const afterIds=ids(),before=new Set(active.beforeSaveCanonicalIDs),savedOrderId=afterIds.find(id=>!before.has(id))||'';const latest=[...(active.events||[])].reverse().find(event=>event.step==='orders_production_render')||{};const visibleIds=latest.renderCandidateIds||[],domIds=latest.domOrderIds||[];const lost=active.beforeSaveCanonicalIDs.filter(id=>!afterIds.includes(id));const allFilters=latest.afterSaveFilterState?.chipFilter==='all'&&!latest.afterSaveFilterState?.statusFilter&&!latest.afterSaveFilterState?.search;active.completedAt=new Date().toISOString();Object.assign(active,{afterSaveCanonicalCount:afterIds.length,afterSaveCanonicalIDs:afterIds,savedOrderId:savedOrderId||active.events.find(event=>event.savedOrderId)?.savedOrderId||'',savedOrderSnapshot:copy((state.orders?.items||[]).find(order=>String(order?.id)===String(savedOrderId))||null),persistSuccess:active.events.some(event=>event.step==='persist_write_result'&&event.persistSuccess),afterSaveFilterState:latest.afterSaveFilterState||filterState(),afterActiveCount:latest.afterActiveCount??null,afterChipCount:latest.afterChipCount??null,afterStatusCount:latest.afterStatusCount??null,afterSearchCount:latest.afterSearchCount??null,renderCandidateCount:latest.renderCandidateCount??null,domCount:latest.domCount??null,savedOrderInCanonical:!!savedOrderId&&afterIds.includes(savedOrderId),savedOrderInVisible:!!savedOrderId&&visibleIds.includes(savedOrderId),savedOrderInDom:!!savedOrderId&&domIds.includes(savedOrderId),invariants:{existingOrderIdsPreserved:lost.length===0,lostCanonicalOrderIds:lost,allFilterActiveVisibleRendered:!allFilters||JSON.stringify(activeIds().slice().sort())===JSON.stringify(domIds.slice().sort()),allFilterActiveIds:allFilters?activeIds():[],allFilterRenderedIds:allFilters?domIds:[]}});record('save_trace_completed',{savedOrderId:active.savedOrderId,invariants:active.invariants});persist();renderCount();const result=active;active=null;return result;}
  function clear(){sessions=[];active=null;try{localStorage.removeItem(TRACE_KEY);}catch(_){}renderCount();}
  function payload(){return {exportedAt:new Date().toISOString(),appVersion:APP_VERSION,build:document.documentElement.dataset.runtimeBuild,persistenceKey:KEY,traceStorageKey:TRACE_KEY,canonicalSource:'state.orders.items -> localStorage',sessions:copy(sessions)};}
  function exportTrace(){const blob=new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='orders-save-trace-v0200.json';link.click();URL.revokeObjectURL(link.href);}
  async function copyTrace(){const text=JSON.stringify(payload(),null,2);try{await navigator.clipboard.writeText(text);alert('Orders Save trace 已复制。');}catch(_){const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();document.execCommand('copy');area.remove();alert('Orders Save trace 已复制。');}}
  return {begin,record,recordCanonical,recordPersist,recordRender,finish,clear,exportTrace,copyTrace,renderCount};
})();
/* P0 persistence diagnostic. It is deliberately independent of canonical state and never writes the app payload. */
const ordersPersistenceDiagnostics=(()=>{
  const TRACE_KEY='journal-planner-orders-persistence-trace-v0200';let sessions=[];try{const raw=localStorage.getItem(TRACE_KEY);sessions=raw?JSON.parse(raw):[];if(!Array.isArray(sessions))sessions=[];}catch(_){sessions=[];}let active=null,readbacksScheduled=false;
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const byteLength=value=>{try{return new Blob([String(value||'')]).size}catch(_){return String(value||'').length}};
  const canonicalIds=()=>Array.isArray(state.orders?.items)?state.orders.items.map(order=>String(order?.id||'')).filter(Boolean):[];
  function approximateStorage(){let bytes=0,keys=[];try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||'',value=localStorage.getItem(key)||'';const size=byteLength(key)+byteLength(value);bytes+=size;keys.push({key,bytes:size});}}catch(error){return {error:serializeError(error),bytes:null,keys:[]}}return {bytes,keys:keys.sort((a,b)=>b.bytes-a.bytes).slice(0,20)};}
  function serializeError(error){return {name:error?.name||'',message:error?.message||String(error||''),stack:error?.stack||''};}
  // This trace is exportable on demand, but must not consume persistent quota
  // during ordinary saves.
  function persist(){}
  function renderCount(){const el=qs('#ordersPersistenceTraceCount');if(el)el.textContent=`Orders Persistence trace: ${sessions.reduce((total,session)=>total+(session.events||[]).length,0)} events`;}
  function record(step,payload={}){if(!active)return;active.events.push({timestamp:new Date().toISOString(),step,...copy(payload)});if(active.events.length>80)active.events.splice(0,active.events.length-80);persist();renderCount();}
  function readback(label){let raw=null,parsed=null,error=null;try{raw=localStorage.getItem(KEY);if(raw!==null)parsed=JSON.parse(raw);}catch(exception){error=serializeError(exception);}const rows=Array.isArray(parsed?.orders?.items)?parsed.orders.items:[];record(`readback_${label}`,{checkpoint:label,payloadExists:raw!==null,payloadBytes:raw===null?0:byteLength(raw),parseSuccess:raw===null?false:!error,error,ordersCount:rows.length,savedOrderId:active?.savedOrderId||'',savedOrderFound:!!active?.savedOrderId&&rows.some(order=>String(order?.id)===String(active.savedOrderId))});}
  function scheduleReadbacks(){if(readbacksScheduled||!active)return;readbacksScheduled=true;[0,50,250,1000].forEach(delay=>setTimeout(()=>readback(`${delay}ms`),delay));setTimeout(()=>{if(active)record('writer_window_closed',{durationMs:2000});},2000);}
  function begin(draft={}){readbacksScheduled=false;const stored=localStorage.getItem(KEY),beforeIds=canonicalIds();active={traceId:`orders-persist-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,startedAt:new Date().toISOString(),appVersion:APP_VERSION,build:document.documentElement.dataset.runtimeBuild,persistFunction:'save',storageBackend:'localStorage',persistenceKey:KEY,beforeCanonicalCount:beforeIds.length,beforeCanonicalIDs:beforeIds,existingStoredPayloadBytes:stored===null?0:byteLength(stored),localStorageApproximateTotal:approximateStorage(),draft:copy(draft),events:[]};sessions.push(active);if(sessions.length>20)sessions.splice(0,sessions.length-20);record('persistence_trace_started',{beforeCanonicalCount:active.beforeCanonicalCount,existingStoredPayloadBytes:active.existingStoredPayloadBytes,persistenceKey:KEY});return active.traceId;}
  function recordCanonical(savedOrder){if(!active)return;active.savedOrderId=String(savedOrder?.id||'');active.savedOrderSnapshot=copy(savedOrder);record('canonical_order_ready_for_persist',{savedOrderId:active.savedOrderId,afterInMemoryCanonicalCount:canonicalIds().length,flags:{archived:savedOrder?.archived??null,deleted:savedOrder?.deleted??null,tombstoned:savedOrder?.tombstoned??null},fulfillmentType:savedOrder?.fulfillmentType??null,status:savedOrder?.status??null});}
  function writerMeta(payload){const rows=state.orders?.items||[];return {writer:'save()',sourceStack:(new Error().stack||'').split('\n').slice(1,5),payloadBytes:byteLength(payload),ordersCount:rows.length,containsSavedOrderId:!!active?.savedOrderId&&rows.some(order=>String(order?.id)===String(active.savedOrderId))};}
  function recordStringify(payload){record('json_stringify_success',writerMeta(payload));}
  function recordSetAttempt(payload){record('localStorage_setItem_attempt',{key:KEY,...writerMeta(payload)});}
  function recordSetSuccess(payload){record('localStorage_setItem_success',{key:KEY,...writerMeta(payload)});scheduleReadbacks();}
  function recordFailure(stage,error){record('persistence_failure',{stage,error:serializeError(error),persistenceKey:KEY});}
  function clear(){sessions=[];active=null;readbacksScheduled=false;try{localStorage.removeItem(TRACE_KEY);}catch(_){}renderCount();}
  function payload(){return {exportedAt:new Date().toISOString(),appVersion:APP_VERSION,build:document.documentElement.dataset.runtimeBuild,persistFunction:'save',storageBackend:'localStorage',persistenceKey:KEY,traceStorageKey:TRACE_KEY,traceStorageIsIndependent:true,canonicalSource:'state.orders.items -> journal-planner-v091',sessions:copy(sessions)};}
  function exportTrace(){const blob=new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='orders-persistence-trace-v0200.json';link.click();URL.revokeObjectURL(link.href);}
  async function copyTrace(){const text=JSON.stringify(payload(),null,2);try{await navigator.clipboard.writeText(text);alert('Orders Persistence trace 已复制。');}catch(_){const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();document.execCommand('copy');area.remove();alert('Orders Persistence trace 已复制。');}}
  return {begin,recordCanonical,recordStringify,recordSetAttempt,recordSetSuccess,recordFailure,clear,exportTrace,copyTrace,renderCount};
})();
/* Read-only storage audit. It exports measurements only and never writes or trims canonical state. */
const stateSizeAudit=(()=>{
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const bytes=value=>{try{const text=JSON.stringify(value);return new Blob([text===undefined?'':text]).size}catch(error){return null}};
  const count=value=>Array.isArray(value)?value.length:value&&typeof value==='object'?Object.keys(value).length:value==null?0:1;
  const type=value=>Array.isArray(value)?'array':value===null?'null':typeof value;
  function walk(value,path,rows=[],depth=0){const size=bytes(value);rows.push({path,bytes:size,type:type(value),recordCount:count(value)});if(depth>=7||!value||typeof value!=='object')return rows;if(Array.isArray(value)){value.forEach((item,index)=>walk(item,`${path}[${index}]`,rows,depth+1));}else Object.entries(value).forEach(([key,item])=>walk(item,`${path}.${key}`,rows,depth+1));return rows;}
  function contamination(value,path='$',out={dataUrls:[],base64Like:[],diagnosticKeys:[]},depth=0){if(depth>8)return out;if(typeof value==='string'){const row={path,bytes:new Blob([value]).size};if(/^data:[^,]+,/i.test(value))out.dataUrls.push(row);else if(value.length>4096&&/^[A-Za-z0-9+/=\s]+$/.test(value))out.base64Like.push(row);return out;}if(!value||typeof value!=='object')return out;if(Array.isArray(value))value.forEach((item,index)=>contamination(item,`${path}[${index}]`,out,depth+1));else Object.entries(value).forEach(([key,item])=>{if(/diagnostic|trace/i.test(key))out.diagnosticKeys.push(`${path}.${key}`);contamination(item,`${path}.${key}`,out,depth+1);});return out;}
  function analyze(label,root){const top=Object.entries(root||{}).map(([key,value])=>({key,bytes:bytes(value),recordCount:count(value),type:type(value)})).sort((a,b)=>(b.bytes||0)-(a.bytes||0));const paths=walk(root,'state').filter(row=>row.path!=='state').sort((a,b)=>(b.bytes||0)-(a.bytes||0)).slice(0,20);const snapshots=Array.isArray(root?.settings?.autoProtection?.snapshots)?root.settings.autoProtection.snapshots:[];const embedded=snapshots.filter(snapshot=>snapshot?.state&&typeof snapshot.state==='object');const nested=embedded.filter(snapshot=>Array.isArray(snapshot.state?.settings?.autoProtection?.snapshots)&&snapshot.state.settings.autoProtection.snapshots.length>0);return {label,totalBytes:bytes(root),topLevel:top,largestPaths:paths,snapshotAudit:{snapshotCount:snapshots.length,embeddedFullStateSnapshotCount:embedded.length,embeddedSnapshotsBytes:bytes(snapshots),nestedSnapshotPayloadCount:nested.length,canonicalContainsFullStateSnapshots:embedded.length>0,recursiveSelfEmbeddingDetected:nested.length>0},contamination:contamination(root),orders:{count:Array.isArray(root?.orders?.items)?root.orders.items.length:0,ids:Array.isArray(root?.orders?.items)?root.orders.items.map(order=>String(order?.id||'')).filter(Boolean):[]}};}
   function run(){let persisted=null,persistError=null,raw=null;try{raw=localStorage.getItem(KEY);persisted=raw?JSON.parse(raw):null;}catch(error){persistError={name:error?.name||'',message:error?.message||String(error),stack:error?.stack||''};}const runtime=analyze('runtime',state),stored=analyze('persisted',persisted||{}),storedIds=new Set(stored.orders.ids),runtimeOnly=runtime.orders.ids.filter(id=>!storedIds.has(id));const result={generatedAt:new Date().toISOString(),readOnly:true,appVersion:APP_VERSION,schemaVersion:state.schemaVersion,persistenceKey:KEY,runtimeTotalBytes:runtime.totalBytes,persistedTotalBytes:raw===null?0:new Blob([raw]).size,deltaBytes:(runtime.totalBytes||0)-(raw===null?0:new Blob([raw]).size),persistedParseError:persistError,runtime,persisted:stored,runtimeOnlyOrderIds:runtimeOnly,diagnosticStorageSeparation:{ordersSaveTraceKey:'journal-planner-orders-save-trace-v0200',ordersPersistenceTraceKey:'journal-planner-orders-persistence-trace-v0200',canonicalStateContainsDiagnosticFields:runtime.contamination.diagnosticKeys.length>0},sourceArchitectureFinding:{automaticSnapshotsStoredInsideCanonicalSettings:false,snapshotPayloadExcludesNestedSnapshotsByImplementation:true,fullStateDuplicateRisk:false,snapshotPayloadStore:'IndexedDB personal-life-hub/snapshots'}};const el=qs('#stateSizeAuditSummary');if(el)el.textContent=`State size: runtime ${Math.round((result.runtimeTotalBytes||0)/1024)} KB · persisted ${Math.round((result.persistedTotalBytes||0)/1024)} KB · Δ ${Math.round((result.deltaBytes||0)/1024)} KB · snapshots ${runtime.snapshotAudit.snapshotCount}`;return result;}
  function exportAudit(){const report=run(),blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='state-size-audit-v0200.json';link.click();URL.revokeObjectURL(link.href);return report;}
  return {run,exportAudit};
})();
/* QA-only and read-only: exports storage measurements without user values. */
const storageFootprintAudit=(()=>{
  const safeError=error=>({name:error?.name||'Error',message:error?.message||String(error||'')});
  async function run(){
    const analyzer=window.JournalStorageFootprint?.analyzeStorageFootprint;
    if(typeof analyzer!=='function')throw new Error('Storage footprint analyzer unavailable');
    const report=analyzer(state,localStorage);
    let snapshots={count:null,payloadBytes:null,error:null},media={count:null,bytes:null,error:null},legacyPayloads={count:null,bytes:null,error:null},estimate={usage:null,quota:null,persisted:null,error:null};
    try{const rows=await window.snapshotStore?.list?.()||[];snapshots={count:rows.length,payloadBytes:rows.reduce((sum,row)=>sum+Math.max(0,Number(row?.payloadBytes)||0),0),error:null};}catch(error){snapshots.error=safeError(error);}
    try{const rows=await mediaStore?.list?.()||[];media={count:rows.length,bytes:rows.reduce((sum,row)=>sum+Math.max(0,Number(row?.blob?.size)||0),0),error:null};}catch(error){media.error=safeError(error);}
    try{const rows=await legacyJournalPayloadStore?.list?.()||[];legacyPayloads={count:rows.length,bytes:rows.reduce((sum,row)=>sum+new Blob([JSON.stringify(row)]).size,0),error:null};}catch(error){legacyPayloads.error=safeError(error);}
    try{const value=await navigator.storage?.estimate?.()||{},persisted=typeof navigator.storage?.persisted==='function'?await navigator.storage.persisted().catch(()=>null):null;estimate={usage:Number.isFinite(value.usage)?value.usage:null,quota:Number.isFinite(value.quota)?value.quota:null,persisted,error:null};}catch(error){estimate.error=safeError(error);}
    const legacyJournal=typeof analyzeLegacyJournalFootprint==='function'?analyzeLegacyJournalFootprint(state):null;
    const result={readOnly:true,generatedAt:new Date().toISOString(),schemaVersion:state.schemaVersion,canonical:report.canonical,localStorage:{totalBytes:report.localStorage.totalBytes,diagnosticBytes:report.localStorage.diagnosticBytes,keys:report.localStorage.rows.map(row=>({key:row.key,purpose:row.purpose,bytes:row.bytes,utf16Bytes:row.utf16Bytes}))},topModules:report.topModules.map(row=>({module:row.module,bytes:row.bytes,count:row.count,type:row.type})),largestObjects:report.largestObjects,largeStrings:report.largeStrings,duplicateStructure:report.duplicateStructure,legacyJournal,indexedDb:{database:'personal-life-hub',snapshots,media,legacyJournalPayloads},browserStorageEstimate:estimate};
    const out=qs('#storageFootprintAuditSummary');if(out)out.textContent=`Canonical ${Math.round(result.canonical.utf8Bytes/1024)} KB · legacy index ${Math.round((legacyJournal?.totalBytes||0)/1024)} KB · legacy payload ${Math.round((legacyPayloads.bytes||0)/1024)} KB · localStorage ${Math.round(result.localStorage.totalBytes/1024)} KB · diagnostics ${Math.round(result.localStorage.diagnosticBytes/1024)} KB · snapshots ${snapshots.count??'N/A'}`;
    return result;
  }
  async function exportAudit(){const report=await run(),blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='storage-footprint-audit-v0231.json';link.click();URL.revokeObjectURL(link.href);return report;}
  return {run,exportAudit};
})();
function applyTheme(key){
  if(!themes[key])key='sage';
  document.body.dataset.theme=key;
  state.settings.theme=key;
  document.getElementById('themeColorMeta').setAttribute('content',themes[key].meta);
  qs('#homeThemeName').textContent=themes[key].name;
  qs('#settingThemeName').textContent=themes[key].name;
  renderThemeList();
}
function setTheme(key){applyTheme(key);return save();}
function renderThemeList(){
  let cur=state.settings.theme;
  qs('#themeList').innerHTML=Object.entries(themes).map(([key,t])=>`
    <div class="theme-card ${key===cur?'selected':''}" onclick="setTheme('${key}')">
      <div class="theme-preview">${t.colors.map((c,i)=>`<span class="sw" style="height:${18+i*8}px;background:${c}"></span>`).join('')}</div>
      <div><h3>${t.name}</h3><p>${t.desc}</p></div>
      <div class="check">${key===cur?'✓':''}</div>
    </div>`).join('');
}
let currentPage='home',pageStack=[];
const rootPages=new Set(['home','journal','plan','life','more']);
function ensurePageBackButtons(){
  qsa('.page').forEach(page=>{
    if(page.id==='home'||page.querySelector('.page-back'))return;
    const btn=document.createElement('button');
    btn.className='page-back';btn.type='button';btn.textContent='返回';btn.onclick=()=>backPage();
    page.insertBefore(btn,page.firstChild);
  });
}
function updatePageBack(){qsa('.page-back').forEach(btn=>btn.hidden=currentPage==='home')}
function renderPage(id){
  qsa('.page').forEach(x=>x.classList.remove('active'));const target=qs('#'+id);if(!target)return;target.classList.add('active');
  if(id==='home')window.renderTodayHub?.();if(id==='plan')window.renderPlanDashboard?.();if(id==='fiveYear')renderFiveYearJournal();if(id==='growthJournal')renderGrowthJournal();if(id==='month')renderMonth();if(id==='week')renderWeek();if(id==='records')renderEntries();if(id==='settings'){renderThemeList();renderCustomBlockSettings()}
  if(id==='templates')renderFavoriteTemplates();if(id==='productivity'){productivityModule.render();noSpendModule.render()}if(id==='subscriptions')subscriptionModule.render();if(id==='wishlists')collectionsModule.renderWishlists();if(id==='inventory')inventoryModule.render();if(id==='orders')ordersModule.render();
  const fab=qs('#primaryFab');if(fab)fab.hidden=!['home','journal'].includes(id);
}
function go(id,b){
  if(!qs('#'+id))return;
  if(id!==currentPage){pageStack.push({id:currentPage,scrollY:window.scrollY});currentPage=id}
  renderPage(id);
  if(b){qsa('nav button').forEach(x=>x.classList.remove('on'));b.classList.add('on')}
  updatePageBack();window.scrollTo(0,0);
}
function backPage(){
  const previous=pageStack.pop()||{id:'home',scrollY:0};currentPage=typeof previous==='string'?previous:previous.id;renderPage(currentPage);updatePageBack();window.scrollTo(0,typeof previous==='string'?0:previous.scrollY||0);
}
function openChallengePlanOverview(challengeId){
  const id=String(challengeId||'');
  const exists=(state.challenges||[]).some(item=>String(item.id)===id)||(state.noSpendChallenges||[]).some(item=>String(item.id)===id)||(state.twelveWeekYears||[]).some(item=>String(item.id)===id);
  if(!exists)return;
  go('productivity');
  requestAnimationFrame(()=>{
    const target=[...document.querySelectorAll('[data-challenge-id]')].find(node=>String(node.dataset.challengeId)===id);
    target?.scrollIntoView({behavior:'auto',block:'center'});
  });
}
window.openChallengePlanOverview=openChallengePlanOverview;
function openEntry(){
  qs('#entryModal').dataset.editId='';modalController.open('entryModal');
  qs('#edate').value=iso(new Date());
  qs('#etype').value='daily';
  qs('#etitle').value='';
  qs('#econtent').value='';
}
function closeEntry(){modalController.close('entryModal')}
function saveEntry(){
  const title=qs('#etitle').value.trim(), content=qs('#econtent').value.trim();
  if(!title&&!content)return;
  const editId=qs('#entryModal').dataset.editId;
  if(editId){
    const e=state.entries.find(x=>String(x.id)===String(editId));
    if(e){e.type=qs('#etype').value;e.date=qs('#edate').value;e.title=title;e.content=content;e.updatedAt=Date.now();}
  }else{
    state.entries.unshift({id:Date.now(),type:qs('#etype').value,date:qs('#edate').value,title,content,createdAt:Date.now()});
  }
  save();closeEntry();renderEntries();renderRecent();renderMonth()
}

function editEntryById(id){
  const e=state.entries.find(x=>String(x.id)===String(id));if(!e)return;
  modalController.open('entryModal');
  qs('#edate').value=e.date;qs('#etype').value=e.type;qs('#etitle').value=e.title||'';qs('#econtent').value=e.content||'';
  qs('#entryModal').dataset.editId=String(e.id);
}
function deleteEntryById(id){
  const e=state.entries.find(x=>String(x.id)===String(id));if(!e)return;
  if(!confirm('确定删除这条记录吗？删除后无法恢复。'))return;
  state.entries=state.entries.filter(x=>String(x.id)!==String(id));save();renderEntries();renderRecent();renderMonth();
}

function esc(x){return (x||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function label(t){return {daily:'日记',memory:'重要瞬间',idea:'灵感',done:'Done List',five_year_question:'每日一问',growth:'成长记录',event:'大事件'}[t]||t}
function dailyBlockEntries(){return Object.entries(state.dailyBlocks||{}).flatMap(([date,blocks])=>Object.entries(blocks||{}).filter(([,content])=>String(content||'').trim()).map(([title,content])=>{const meta=state.dailyBlockMeta?.[date]?.[title]||{};return {id:`daily-block:${date}:${title}`,date,type:meta.isMilestone?'growth':'daily',title:meta.growthTitle||title,blockTitle:title,content:meta.growthDetails||String(content),growthTags:meta.growthTags||[],readOnly:true};}))}
function legacyTimelineEntries(){return (state.legacyJournalRecords||[]).map(record=>({...record,type:record.recordType==='legacy_journal'?'daily':record.recordType,readOnly:false,legacy:true}));}
function deleteLegacyRecord(id){const record=state.legacyJournalRecords.find(item=>item.id===id);if(!record||!confirm('确定删除这条记录吗？删除后不会因重复导入而自动恢复。'))return;const provenance=record.provenance;if(provenance?.sourceApp===fiveYearJournal.SOURCE_APP)state.legacyImportTombstones[fiveYearJournal.sourceKey(provenance.sourceEntryId)]={sourceApp:provenance.sourceApp,sourceEntryId:provenance.sourceEntryId,userDeleted:true,deletedAt:Date.now()};state.legacyJournalRecords=state.legacyJournalRecords.filter(item=>item.id!==id);save();renderEntries();renderGrowthJournal();renderFiveYearJournal();}function eh(e){const actions=e.readOnly?'<div class="small">每日区块</div>':e.legacy?'<div class="entry-menu"><button onclick="openLegacyJournalEditor(\''+e.id+'\')">编辑</button><button class="danger" onclick="deleteLegacyRecord(\''+e.id+'\')">删除</button></div>':'<div class="entry-menu"><button onclick="editEntryById(\''+e.id+'\')">编辑</button><button class="danger" onclick="deleteEntryById(\''+e.id+'\')">删除</button></div>';return '<div class="entry"><div class="meta">'+esc(e.date)+' · '+label(e.type)+'</div><b>'+esc(e.title||label(e.type))+'</b><p>'+esc(e.content)+'</p>'+actions+'</div>'}function renderRecordBlockFilter(rows){const select=qs('#recordBlockFilter');if(!select)return;const titles=timelineFilter.blockTitles(rows);if(recordBlockFilter!=='all'&&!titles.includes(recordBlockFilter))recordBlockFilter='all';select.innerHTML=`<option value="all">全部 Block</option>${titles.map(title=>`<option value="${esc(title)}" ${title===recordBlockFilter?'selected':''}>${esc(title)}</option>`).join('')}`}
function renderEntries(){const rows=[...state.entries,...legacyTimelineEntries(),...dailyBlockEntries()];renderRecordBlockFilter(rows);const arr=timelineFilter.apply(rows,{type:recordFilter,block:recordBlockFilter,search:qs('#recordSearch')?.value||'',sort:qs('#recordSort')?.value||'new'});qs('#recordsList').innerHTML=arr.length?arr.map(eh).join(''):'<div class="entry"><span class="small">没有符合条件的记录</span></div>'}
function renderRecent(){const recent=[...state.entries,...legacyTimelineEntries()].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));qs('#recent').innerHTML=recent.length?recent.slice(0,4).map(eh).join(''):'<div class="entry"><span class="small">还没有记录。点击右下角 ＋ 开始。</span></div>'}
function renderTodayHub(){
  const el=qs('#todayHubSummary');if(!el)return;
  const today=iso(new Date()),orders=state.orders?.items||[],inventory=state.inventory?.items||[];
  const delivered=new Set(['delivered','picked_up','cancelled','returned']);
  const pendingOrders=orders.filter(x=>!x.archived&&!delivered.has(x.status)).length;
  const lowStock=inventory.filter(x=>x.lowStockEnabled!==false&&Number(x.quantity||0)<=Number(x.minQuantity||0)).length;
  const currentChallenge=[...(state.challenges||[]),...(state.noSpendChallenges||[])].filter(x=>x.status!=='archived'&&(!x.endDate||x.endDate>=today)).length;
  const currentCycle=(state.twelveWeekYears||[]).filter(x=>x.status!=='archived'&&(!x.endDate||x.endDate>=today)).length;
  const soon=new Date();soon.setDate(soon.getDate()+30);const renewals=(state.subscriptions||[]).filter(x=>x.status==='active'&&x.nextRenewal&&x.nextRenewal>=today&&x.nextRenewal<=iso(soon)).length;
  const hasEntry=(state.entries||[]).some(x=>x.date===today)||Object.values(state.dailyBlocks?.[today]||{}).some(v=>String(v||'').trim());
  const summary=todayDashboard.build(state,today),cards=[
    {title:'今日记录',...summary.journal,go:"openTodayDaily()"},{title:'本周计划',...summary.weekly,go:"go('week')"},{title:'当前 Challenge',...summary.challenge,go:"go('productivity')"},{title:'12 Week Year',...summary.twelve,go:"go('productivity')"},{title:'待处理订单',...summary.orders,go:"go('orders')"},{title:'低库存',...summary.inventory,go:"go('inventory')"},{title:'即将续费',...summary.subscription,go:"go('subscriptions')"},{title:'今日一问',empty:false,meta:(state.legacyJournalRecords||[]).some(record=>record.recordType==='five_year_question'&&record.date===today&&String(record.answer||record.content||'').trim())?'已回答':'去回答今日问题',go:"openDailyQuestion()"}
  ];
  const pref=state.settings.todayDashboard=state.settings.todayDashboard||{cards:cards.map((_,i)=>({id:i,visible:true,order:i,hideWhenEmpty:false}))};pref.cards.forEach(x=>{if(x.hideWhenEmpty===undefined)x.hideWhenEmpty=false});const saved=new Map(pref.cards.map(x=>[x.id,x]));const visible=cards.map((card,i)=>({...card,id:i,...saved.get(i)})).filter(x=>x.visible!==false&&!(x.hideWhenEmpty&&x.empty)).sort((a,b)=>(a.order??a.id)-(b.order??b.id));
  el.innerHTML=`<div class="section-head"><h2>今天概览</h2><button class="ghost" onclick="openTodayDashboardSettings()">⚙ 自定义</button></div><div class="today-hub-grid">${visible.map(card=>`<button class="today-hub-card ${card.attention?'attention':''}" onclick="${card.go}"><b>${esc(card.title)}</b><span>${esc(card.meta)}</span><i>›</i></button>`).join('')||'<div class="entry"><span class="small">当前没有显示的概览卡。可通过“自定义”恢复。</span></div>'}</div>`;
}
const todayCardLabels=['今日记录','本周计划','当前 Challenge','12 Week Year','待处理订单','低库存','即将续费','今日一问'];
function todayPreferenceRows(){return (state.settings.todayDashboard?.cards||[]).slice().sort((a,b)=>(a.order??a.id)-(b.order??b.id));}
function renderTodayDashboardSettings(preserveScroll=true){const body=qs('#todayDashboardModal .modal-body'),scrollTop=preserveScroll?body?.scrollTop||0:0,rows=todayPreferenceRows();qs('#todayDashboardOptions').innerHTML=rows.map((x,index)=>`<div class="manage-row today-setting-row"><div><label><input type="checkbox" data-today-card="${x.id}" ${x.visible!==false?'checked':''} onchange="setTodayCardVisibility(${x.id},this.checked)"> ${todayCardLabels[x.id]}</label><label class="today-empty-toggle"><input type="checkbox" ${x.hideWhenEmpty?'checked':''} onchange="setTodayCardEmptyPolicy(${x.id},this.checked)"> 无内容时隐藏</label></div><span><button onclick="moveTodayCard(${x.id},-1)" ${index===0?'disabled':''}>↑</button><button onclick="moveTodayCard(${x.id},1)" ${index===rows.length-1?'disabled':''}>↓</button></span></div>`).join('');if(body)requestAnimationFrame(()=>body.scrollTop=scrollTop);}
function openTodayDashboardSettings(){renderTodayDashboardSettings(false);modalController.open('todayDashboardModal')}
function moveTodayCard(id,delta){const rows=state.settings.todayDashboard.cards,item=rows.find(x=>x.id===id),other=rows.find(x=>x.order===item.order+delta);if(!item||!other)return;[item.order,other.order]=[other.order,item.order];save();renderTodayDashboardSettings();renderTodayHub()}
function setTodayCardVisibility(id,visible){const item=state.settings.todayDashboard.cards.find(x=>x.id===id);if(!item)return;item.visible=visible;save();renderTodayDashboardSettings();renderTodayHub();}
function setTodayCardEmptyPolicy(id,hideWhenEmpty){const item=state.settings.todayDashboard.cards.find(x=>x.id===id);if(!item)return;item.hideWhenEmpty=hideWhenEmpty;save();renderTodayDashboardSettings();renderTodayHub();}
function saveTodayDashboardSettings(){save();modalController.close('todayDashboardModal');renderTodayHub()}
function resetTodayDashboard(){state.settings.todayDashboard={cards:Array.from({length:8},(_,id)=>({id,visible:true,order:id,hideWhenEmpty:false}))};save();renderTodayDashboardSettings();renderTodayHub()}
function mk(){return view.getFullYear()+'-'+pad(view.getMonth()+1)}
function mo(){state.months[mk()]=state.months[mk()]||{};return state.months[mk()]}
function renderMonth(){initMonthJump();
  qs('#monthTitle').textContent=view.getFullYear()+' 年 '+(view.getMonth()+1)+' 月';
  let y=view.getFullYear(),m=view.getMonth(),start=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();
  let h=['一','二','三','四','五','六','日'].map(x=>'<div class="calh">'+x+'</div>').join('');
  for(let i=0;i<start;i++)h+='<div class="day"></div>';
  for(let d=1;d<=days;d++){
    let ds=y+'-'+pad(m+1)+'-'+pad(d),has=state.entries.some(e=>e.date===ds)||Object.values(state.dailyBlocks?.[ds]||{}).some(value=>String(value||'').trim());
    h+='<div class="day '+(ds===iso(new Date())?'today ':'')+(has?'has':'')+'" data-date="'+ds+'">'+d+'</div>'
  }
  qs('#calendar').innerHTML=h;
  qsa('#calendar [data-date]').forEach(el=>el.addEventListener('click',()=>openDate(el.dataset.date)));
  let o=mo();qsa('[data-mf]').forEach(el=>{let f=el.dataset.mf;el.value=o[f]||'';el.oninput=()=>{mo()[f]=el.value;save()}});
  let a=[...state.entries,...dailyBlockEntries()].filter(e=>e.date.startsWith(mk())).sort((a,b)=>a.date.localeCompare(b.date));
  qs('#monthEntries').innerHTML=a.length?a.map(eh).join(''):'<span class="small">本月暂无记录</span>'
}
function openDate(ds){openEntry();qs('#edate').value=ds}
function shift(n){view=new Date(view.getFullYear(),view.getMonth()+n,1);renderMonth()}
function mtab(id,b){qsa('.mt').forEach(x=>x.style.display='none');qs('#'+id).style.display='block';qsa('#month .tab').forEach(x=>x.classList.remove('on'));b.classList.add('on')}
function wk(){let d=new Date(),x=(d.getDay()+6)%7;d.setDate(d.getDate()-x);return iso(d)}
function renderWeek(){
  let k=wk();state.weeks[k]=state.weeks[k]||{};let w=state.weeks[k];
  qsa('[data-wf]').forEach(el=>{let f=el.dataset.wf;el.value=w[f]||'';el.oninput=()=>{w[f]=el.value;save()}});
  let d=new Date(k+'T00:00:00'),h='';
  ['周一','周二','周三','周四','周五','周六','周日'].forEach((n,i)=>{
    let x=new Date(d);x.setDate(d.getDate()+i);let key='d'+i;
    h+='<div class="box weekday"><strong>'+n+' · '+(x.getMonth()+1)+'/'+x.getDate()+'</strong><textarea data-day="'+key+'" placeholder="安排 / Done / 备注">'+esc(w[key]||'')+'</textarea></div>'
  });
  qs('#weekDays').innerHTML=h;qsa('[data-day]').forEach(el=>el.oninput=()=>{w[el.dataset.day]=el.value;save()})
}
function editLong(k,t){
  if(isMultiInstanceTemplate(k)){openProjectList(k);return;}
  longKey=k;currentProjectType='';currentProjectId='';
  const schema=templateSchemas[k]||{title:t,sections:[{title:t,fields:[{k:'notes',label:'内容',type:'textarea',full:true}]}]};
  qs('#longTitle').textContent=schema.title||t;
  let data=state.long[k];
  if(typeof data==='string') data={notes:data};
  data=data||{};
  qs('#structuredForm').innerHTML=schema.sections.map(sec=>sectionHTML(sec,data)).join('');
  modalController.open('longModal');
}
function closeLong(){
  const projectType=currentProjectType;
  modalController.pop('longModal');
  if(projectType&&modalController.isOpen('projectListModal'))renderProjectList(projectType);
}
function saveLong(){
  if(currentProjectType&&currentProjectId){saveProject();return;}
  const obj={};
  qsa('#structuredForm [data-sk]').forEach(el=>obj[el.dataset.sk]=el.value);
  state.long[longKey]=obj;
  save();
  closeLong();
}
function renderPhotos(){qs('#photoGrid').innerHTML=Array.from({length:28},(_,i)=>`<div class="photo-ph">${i%6===0?'✦':''}</div>`).join('')}
async function exportData(){
  try{const media=await mediaStore.exportForBackup(),legacyJournalPayloadsForBackup=await legacyJournalPayloads.exportForBackup(state.legacyJournalRecords||[]),importProvenancePayloads=await legacyJournalPayloads.exportOneLineProvenanceForBackup(state.importProvenance?.one_line_a_day);const blob=new Blob([JSON.stringify({version:12,schemaVersion:state.schemaVersion,appVersion:APP_VERSION,backupVersion:2,exportedAt:new Date().toISOString(),state,media,legacyJournalPayloads:legacyJournalPayloadsForBackup,importProvenancePayloads},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='journal-planner-backup-v0232.json';a.click();URL.revokeObjectURL(a.href)}catch(e){alert('备份失败：'+(e.message||'历史日记 payload、导入来源或媒体无法导出'))}
}
function importData(ev){
  const f=ev.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=async()=>{try{const d=JSON.parse(r.result),candidate=d.state||d;if(!candidate||typeof candidate!=='object')throw new Error('invalid state');candidate.settings=candidate.settings||{theme:'sage'};candidate.inventory=candidate.inventory&&typeof candidate.inventory==='object'?candidate.inventory:{items:[],categories:[],locations:[]};candidate.inventory.items=Array.isArray(candidate.inventory.items)?candidate.inventory.items:[];candidate.inventory.categories=Array.isArray(candidate.inventory.categories)?candidate.inventory.categories:[];candidate.orders=candidate.orders&&typeof candidate.orders==='object'?candidate.orders:{items:[],sellers:[],pickupLocations:[],recurring:[],forwardingBatches:[]};['items','sellers','pickupLocations','recurring','forwardingBatches'].forEach(k=>candidate.orders[k]=Array.isArray(candidate.orders[k])?candidate.orders[k]:[]);const refs=new Set((candidate.legacyJournalRecords||[]).map(record=>String(record?.payloadRef||'')).filter(Boolean)),payloads=Array.isArray(d.legacyJournalPayloads)?d.legacyJournalPayloads:[],payloadIds=new Set(payloads.map(payload=>String(payload?.id||'')));for(const id of refs)if(!payloadIds.has(id))throw new Error(`legacy journal payload missing: ${id}`);const oneLine=candidate.importProvenance?.one_line_a_day,needsProvenancePayload=oneLine?.format===2&&oneLine?.payloadRef,provenancePayloads=Array.isArray(d.importProvenancePayloads)?d.importProvenancePayloads:[];if(needsProvenancePayload&&!provenancePayloads.some(payload=>payload?.id===oneLine.payloadRef))throw new Error('one line provenance payload missing');await mediaStore.restoreFromBackup(d.media||[]);await legacyJournalPayloads.restoreFromBackup(payloads);await legacyJournalPayloads.restoreOneLineProvenanceFromBackup(provenancePayloads);state=candidate;state.schemaVersion=12;const result=save();if(!result?.ok)return result;applyTheme(state.settings.theme);renderAll();alert('导入完成');return result}catch(e){alert('备份文件无效、历史日记 payload / 导入来源缺失或媒体恢复失败')}};
  r.readAsText(f)
}
let oneLineImportDraft=null;
function selectOneLineImport(){const input=qs('#oneLineImportFile');input.value='';input.click()}
function importPreviewHtml(preview){const types=Object.entries(preview.titleCounts).map(([title,count])=>`<li>${esc(title)} <b>${count}</b></li>`).join('');return `<div class="import-preview-card"><b>导入预览</b><p>${esc(preview.dateStart)} → ${esc(preview.dateEnd)}</p><p>${preview.days} days · ${preview.blocks} blocks</p><ul>${types}</ul></div>`}
function prepareOneLineImport(ev){
  const file=ev.target.files?.[0];if(!file)return;
  const reader=new FileReader();reader.onload=()=>{
    let parsed;try{parsed=JSON.parse(reader.result)}catch(_){alert('文件不是有效 JSON，未导入任何数据。');return}
    const validated=oneLineImport.validate(parsed);if(!validated.ok){alert(`无法导入：\n${validated.errors.slice(0,5).join('\n')}`);return}
    oneLineImportDraft={validated,fileName:file.name};
    qs('#oneLineImportPreview').innerHTML=importPreviewHtml(validated.preview);
    qs('#oneLineImportConfirm').disabled=false;
    qs('#oneLineConflictPolicy').value='fill_empty';
    modalController.open('oneLineImportModal');
  };reader.onerror=()=>alert('无法读取文件，未导入任何数据。');reader.readAsText(file);
}
function closeOneLineImport(){oneLineImportDraft=null;modalController.close('oneLineImportModal')}
function commitOneLineImport(){
  if(!oneLineImportDraft)return;
  try{
    const policy=qs('#oneLineConflictPolicy').value;
    const staged=oneLineImport.stage(state,oneLineImportDraft.validated,policy);
    state.dailyBlocks=staged.next.dailyBlocks;state.customBlocks=staged.next.customBlocks;state.importProvenance=staged.next.importProvenance;
    const result=save();if(!result?.ok)return result;
    renderAll();modalController.close('oneLineImportModal');oneLineImportDraft=null;
    alert(`导入完成：\n${staged.result.importedDays} days\n${staged.result.importedBlocks} blocks\n跳过重复：${staged.result.skippedDuplicates}\n冲突：${staged.result.conflicts}\n错误：${staged.result.errors}`);
  }catch(error){alert(`导入失败，未修改当前数据：${error.message||error}`)}
}
if(!createProductivityModule||!createNoSpendModule||!createCollectionsModule||!createSubscriptionModule||!createMediaStore||!createLegacyJournalPayloadStore||!createLegacyJournalPayloadManager||!createInventoryModule||!createRecurrenceHelper||!createSellersModule||!createOrdersModule||!createTodayDashboard||!createOneLineImport||!createTimelineFilter||!createFiveYearJournal||!createHistoricalDualImporter){
  throw new Error('Required feature module failed to load. Please run refresh-clean-baseline.html.');
}
const modalController=(()=>{
  let lockedScrollY=0;
  const suspended=new Map();
  const stack=[];
  function syncLock(){const any=qsa('.modal.open,.modal.suspended').length>0;if(any&&!document.body.classList.contains('modal-open')){lockedScrollY=window.scrollY;document.body.classList.add('modal-open');document.body.style.top=`-${lockedScrollY}px`;}if(!any&&document.body.classList.contains('modal-open')){document.body.classList.remove('modal-open');document.body.style.top='';window.scrollTo(0,lockedScrollY);}}
  function setActive(el,active){if(!el)return;el.setAttribute('aria-hidden',active?'false':'true');if('inert' in el)el.inert=!active;}
  function focusModal(el){requestAnimationFrame(()=>{const target=el?.querySelector('[autofocus], .modal-close, input, select, textarea, button');target?.focus?.({preventScroll:true});});}
  function open(id){const el=qs('#'+id);if(!el)return;el.classList.remove('suspended');el.classList.add('open');const body=el.querySelector('.modal-body');if(body)body.scrollTop=0;setActive(el,true);syncLock();focusModal(el)}
  function blockFailedSaveClose(id){const failure=window.__canonicalSaveFailurePending;if(!failure)return false;window.__canonicalSaveFailurePending=null;const body=qs('#'+id)?.querySelector('.modal-body');if(body)body.insertAdjacentHTML('afterbegin',`<p class="notice error"><b>保存失败，输入仍保留在此编辑窗口。</b><br>${esc(failure.message||'请在空间恢复后再次保存。')}</p>`);return true;}
  function close(id){if(blockFailedSaveClose(id))return null;const el=qs('#'+id);if(!el)return;el.classList.remove('open','suspended');setActive(el,false);suspended.delete(id);for(let i=stack.length-1;i>=0;i--)if(stack[i].parentId===id||stack[i].childId===id)stack.splice(i,1);syncLock()}
  function suspend(id,context={}){const el=qs('#'+id);if(!el||!el.classList.contains('open'))return null;const body=el.querySelector('.modal-body');const snapshot={modalId:id,scrollTop:body?.scrollTop||0,context};suspended.set(id,snapshot);el.classList.remove('open');el.classList.add('suspended');setActive(el,false);syncLock();return snapshot;}
  function resume(id){const el=qs('#'+id),snapshot=suspended.get(id);if(!el)return null;el.classList.remove('suspended');el.classList.add('open');setActive(el,true);const body=el.querySelector('.modal-body');if(body&&snapshot)body.scrollTop=snapshot.scrollTop||0;suspended.delete(id);syncLock();focusModal(el);return snapshot?.context||null;}
  function push(parentId,childId,context={}){if(!isOpen(parentId)){open(childId);return null;}const parent=suspend(parentId,context);const entry={parentId,childId,context,returnFocus:document.activeElement instanceof HTMLElement?document.activeElement:null};stack.push(entry);open(childId);return entry;}
  function pop(childId){if(blockFailedSaveClose(childId))return null;const at=stack.map(x=>x.childId).lastIndexOf(childId);if(at<0){close(childId);return null;}const entry=stack.splice(at,1)[0];const child=qs('#'+childId);if(child){child.classList.remove('open','suspended');setActive(child,false);suspended.delete(childId);}const context=resume(entry.parentId);if(entry.returnFocus?.isConnected)requestAnimationFrame(()=>entry.returnFocus.focus({preventScroll:true}));return context||entry.context;}
  function isOpen(id){return !!qs('#'+id)?.classList.contains('open')}
  function activeCount(){return qsa('.modal.open').length}
  return{open,close,suspend,resume,push,pop,isOpen,activeCount};
})();
const mediaStore=createMediaStore();
window.snapshotStore=createSnapshotStore?.();
const legacyJournalPayloadStore=createLegacyJournalPayloadStore();
const legacyJournalPayloads=createLegacyJournalPayloadManager(legacyJournalPayloadStore);
let legacyJournalMigrationRunning=false;
async function migrateLegacyJournalPayloads(){
  if(legacyJournalMigrationRunning||persistenceSafeMode)return {ok:false,reason:'busy_or_safe_mode'};
  const records=Array.isArray(state.legacyJournalRecords)?state.legacyJournalRecords:[];
  const oneLineGroup=state.importProvenance?.one_line_a_day;
  const needsRecords=records.some(record=>!record?.payloadRef&&legacyJournalPayloads.needsPayload(record));
  const needsOneLine=!!oneLineGroup&&oneLineGroup.format!==2;
  if(!needsRecords&&!needsOneLine)return {ok:true,skipped:true};
  legacyJournalMigrationRunning=true;
  const beforeRecords=JSON.stringify(records),beforeProvenance=JSON.stringify(state.importProvenance||{});
  try{
    const staged=await legacyJournalPayloads.stageCompaction(records,{batchSize:25}),compactOneLine=needsOneLine?await legacyJournalPayloads.stageOneLineProvenance(oneLineGroup):null;
    if(JSON.stringify(state.legacyJournalRecords)!==beforeRecords||JSON.stringify(state.importProvenance||{})!==beforeProvenance)return {ok:false,reason:'state_changed_during_migration'};
    const candidate=JSON.parse(JSON.stringify(state));
    candidate.legacyJournalRecords=staged.records;
    if(needsOneLine){candidate.importProvenance=candidate.importProvenance||{};candidate.importProvenance.one_line_a_day=compactOneLine;}
    state=candidate;
    const result=save();
    if(!result?.ok)return {ok:false,reason:'canonical_commit_failed',result};
    renderAll();
    return {ok:true,payloadCount:staged.payloadCount};
  }catch(error){
    console.warn('legacy journal payload migration deferred',error);
    return {ok:false,reason:'payload_write_or_verify_failed',errorName:error?.name||'Error'};
  }finally{legacyJournalMigrationRunning=false;}
}
function scheduleLegacyJournalPayloadMigration(){setTimeout(()=>{migrateLegacyJournalPayloads();},0);}
const recurrence=createRecurrenceHelper();
const inventoryI18n={
  locale:()=>String(document.documentElement.lang||'zh-CN').toLowerCase().startsWith('en')?'en':'zh',
  t(key){const messages={useOne:{zh:'减少一个',en:'Use One'},useOneAria:{zh:'减少一个',en:'Use One'},undo:{zh:'撤销',en:'Undo'},reduced:{zh:'库存已减少 1',en:'Inventory reduced by 1'},cannotUse:{zh:'库存已为 0，无法继续减少。',en:'Inventory is already 0.'},saveFailed:{zh:'保存失败，库存数量未变。请重试。',en:'Save failed. Inventory quantity did not change. Please try again.'},undoFailed:{zh:'撤销保存失败，库存保持减少后的数量。请重试。',en:'Undo could not be saved. Inventory remains reduced. Please try again.'},undoUnavailable:{zh:'这次操作已无法撤销。',en:'This action can no longer be undone.'},addedOrder:{zh:'添加顺序',en:'Added Order'},recentlyUpdated:{zh:'最近更新',en:'Recently Updated'},recentlyAdded:{zh:'最近加入',en:'Recently Added'},nameAZ:{zh:'名称 A–Z',en:'Name'},nameZA:{zh:'名称 Z–A',en:'Name Z–A'},quantityAsc:{zh:'数量少到多',en:'Quantity: Low to High'},quantityDesc:{zh:'数量多到少',en:'Quantity: High to Low'},expiry:{zh:'到期日期',en:'Expiry Date'}};return messages[key]?.[this.locale()]||messages[key]?.zh||key;}
};
/* Old troubleshooting traces are non-user, non-canonical data. They must never
   block a normal save. They remain available in memory for the current session,
   while quota recovery may remove only this explicit legacy-key allowlist. */
const diagnosticStorageKeys=new Set([
  'journal-planner-inventory-edit-trace-v0163',
  'journal-planner-orders-save-trace-v0200',
  'journal-planner-orders-persistence-trace-v0200',
  'journal-planner-project30-checkbox-trace-v0220',
  'journal-planner-project30-interaction-trace-v0220r4',
  'journal-planner-dashboard-runtime-trace-v0200',
  'journal-planner-today-active-challenge-trace-v0200',
  'journal-planner-today-hide-when-empty-trace-v0200',
  'journal-planner-snapshot-verification-v0200'
]);
window.PersistenceFoundation?.registerQuotaSafeCleanup?.(()=>{
  return {safe:true,removeKeys:[...diagnosticStorageKeys]};
},{safeKey:key=>diagnosticStorageKeys.has(String(key))});
const moduleCtx={qs,qsa,esc,iso,getState:()=>state,save,commitInventoryCandidate,commitTwelveWeekCandidate,commitOrderInventoryCandidate,modal:modalController,media:mediaStore,recurrence,inventoryI18n,inventoryDiagnostics:inventoryEditDiagnostics,ordersSaveDiagnostics,ordersPersistenceDiagnostics};
const productivityModule=createProductivityModule(moduleCtx);
const noSpendModule=createNoSpendModule({...moduleCtx,commitNoSpendCandidate});
const collectionsModule=createCollectionsModule(moduleCtx);
const subscriptionModule=createSubscriptionModule(moduleCtx);
const inventoryModule=createInventoryModule(moduleCtx);
const sellersModule=createSellersModule({...moduleCtx,inventory:inventoryModule});
const ordersModule=createOrdersModule({...moduleCtx,inventory:inventoryModule,sellers:sellersModule});
const todayDashboard=createTodayDashboard();
window.getCurrentWeekPlanSummary=(currentState,date)=>todayDashboard.getCurrentWeekPlanSummary(currentState,date);
window.isWeekPlanEmpty=summary=>todayDashboard.isWeekPlanEmpty(summary);
window.getTodayJournalSummary=(currentState,date)=>todayDashboard.getTodayJournalSummary(currentState,date);
window.hasMeaningfulDailyContent=(currentState,date)=>todayDashboard.hasMeaningfulDailyContent(currentState,date);
const oneLineImport=createOneLineImport();
const fiveYearJournal=createFiveYearJournal();
const historicalDualImporter=createHistoricalDualImporter();
const timelineFilter=createTimelineFilter();
let historicalDualDraft=null;
const historicalEsc=value=>String(value??'').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
function historicalFailure(message){const el=qs('#historicalDualImportError');if(el){el.hidden=false;el.textContent=message;}return null;}
function historicalApprovals(){return [...qsa('#historicalDualImportPreview input[data-historical-conflict]:checked')].map(input=>input.dataset.historicalConflict);}
function selectHistoricalDualImport(){const input=qs('#historicalDualImportFiles');input.value='';input.click();}
function openHistoricalDualImport(){
  const error=qs('#historicalDualImportError'),preview=qs('#historicalDualImportPreview'),confirm=qs('#historicalDualImportConfirm');
  if(error){error.hidden=true;error.textContent='';}if(!historicalDualDraft&&preview)preview.innerHTML='<div class="import-preview-card"><b>选择历史文件</b><p class="small">可一次选择 manifest.json 与 One Line v7 merged backup；也可只选择其中一个文件。</p><button class="btn primary" type="button" onclick="selectHistoricalDualImport()">选择历史文件</button></div>';
  if(confirm)confirm.disabled=!historicalDualDraft;
  modalController.open('historicalDualImportModal');
}
function bindHistoricalDualImportEntry(){
  const root=document;
  if(root.documentElement.dataset.historicalImportClickController==='bound')return;
  root.documentElement.dataset.historicalImportClickController='bound';
  root.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-historical-import]');
    if(!trigger)return;
    event.preventDefault();
    openHistoricalDualImport();
  });
}
function readHistoricalFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({file,payload:JSON.parse(reader.result)});reader.onerror=()=>reject(new Error(`无法读取 ${file.name}`));reader.readAsText(file);});}
async function prepareHistoricalDualImport(event){
  const files=[...(event.target.files||[])];if(!files.length)return;
  try{
    const parsed=await Promise.all(files.map(readHistoricalFile));let manifest=null,oneLine=null;
    for(const item of parsed){if(Array.isArray(item.payload?.entries)){if(manifest)throw new Error('一次只能选择一份 manifest.json。');manifest=historicalDualImporter.parseManifest(item.payload);}
      else if(item.payload?.app==='One Line a Day'){if(oneLine)throw new Error('一次只能选择一份 One Line v7 merged backup。');oneLine=historicalDualImporter.parseOneLineV7(item.payload,item.file.name);}
      else throw new Error(`无法识别文件：${item.file.name}`);}
    if(manifest&&!manifest.ok)throw new Error(manifest.errors.join('\n'));if(oneLine&&!oneLine.ok)throw new Error(oneLine.errors.join('\n'));if(!manifest&&!oneLine)throw new Error('请选择 manifest.json 或 One Line v7 merged backup。');
    historicalDualDraft={manifest,oneLine};qs('#historicalDualImportError').hidden=true;renderHistoricalDualPreview();modalController.open('historicalDualImportModal');
  }catch(error){historicalFailure(`未导入任何数据：${error.message||error}`);modalController.open('historicalDualImportModal');}
}
function historicalPreviewRows(items,kind){return items.map(item=>{const status={insert:'新增',duplicate:'同源重复跳过',tombstone:'已删除记录跳过',exact_duplicate:'完全重复跳过',provenance_duplicate:'已导入跳过',empty_source:'历史为空跳过',conflict:'冲突：默认保留当前',approved_replace:'已明确批准替换'}[item.status]||item.status;const conflict=item.status==='conflict'?`<label class="small"><input type="checkbox" data-historical-conflict="${historicalEsc(item.date+'::'+item.id)}" onchange="renderHistoricalDualPreview()"> 明确使用历史文本替换当前内容</label><p class="small"><b>当前：</b>${historicalEsc(item.currentText)}</p><p class="small"><b>历史：</b>${historicalEsc(item.importedText)}</p>`:'';return `<article class="import-preview-card"><b>${historicalEsc(item.date||'')} · ${historicalEsc(item.title||item.id||'')}</b><p class="small">${status}</p>${conflict}</article>`;}).join('');}
function renderHistoricalDualPreview(){
  const host=qs('#historicalDualImportPreview');if(!historicalDualDraft||!host)return;const staged=historicalDualImporter.buildCandidate(state,historicalDualDraft,historicalApprovals());historicalDualDraft.lastStaged=staged;const m=staged.preview.manifest,o=staged.preview.oneLine;
  host.innerHTML=`<div class="import-preview-card"><b>Manifest</b><p>新增 ${m.insert} · 同源重复 ${m.duplicate} · tombstone ${m.tombstone} · 无效 ${m.invalid} · missing media metadata ${m.missingMedia}</p></div>${historicalPreviewRows(m.items,'manifest')}<div class="import-preview-card"><b>One Line v7</b><p>新增 ${o.insert} · 完全重复 ${o.exactDuplicate} · 当前保留 ${o.keepCurrent} · 冲突 ${o.conflict} · 历史为空 ${o.emptySource} · 已批准替换 ${o.approvedReplace} · 已导入 ${o.provenanceDuplicate}</p></div>${historicalPreviewRows(o.items,'oneLine')}`;
  qs('#historicalDualImportConfirm').disabled=false;
}
function closeHistoricalDualImport(){historicalDualDraft=null;modalController.close('historicalDualImportModal');}
function commitHistoricalDualImport(){
  if(!historicalDualDraft)return;const before=state,staged=historicalDualImporter.buildCandidate(before,historicalDualDraft,historicalApprovals()),candidate=staged.candidate,integrity=historicalDualImporter.validateCandidate(candidate);
  if(!integrity.ok){historicalFailure(`候选数据未通过完整性检查：${integrity.errors.join('；')}`);return;}
  const health=window.PersistenceHealth;if(!health){historicalFailure('Snapshot Health Gate 不可用；没有写入任何数据。');return;}
  const snapshots=before.settings?.autoProtection?.snapshots||[],gate=health.snapshotHealth(candidate,snapshots);if(!gate.allowed){historicalFailure(`Snapshot Health Gate 拒绝导入：${gate.reason}`);return;}
  let payload;try{payload=JSON.stringify(candidate);}catch(error){historicalFailure(`无法生成候选保存内容：${error.message||error}`);return;}
  const commit=window.PersistenceFoundation?.commitCanonical;if(typeof commit!=='function'){historicalFailure('统一安全保存路径不可用；没有写入任何数据。');return;}
  const expected={legacyCount:(before.legacyJournalRecords||[]).length+staged.preview.manifest.insert,provenanceCount:(window.JournalModules?.legacyJournalProvenance?.oneLineEntryCount?.(before.importProvenance?.one_line_a_day||{})||Object.keys(before.importProvenance?.one_line_a_day||{}).length)+staged.preview.oneLine.insert+staged.preview.oneLine.exactDuplicate+staged.preview.oneLine.approvedReplace};
  const result=commit({storage:localStorage,key:KEY,payload,verifyReadBack:raw=>{const persisted=JSON.parse(raw),verified=historicalDualImporter.validateCandidate(persisted,expected);if(!verified.ok)throw new Error(verified.errors.join('；'));return {schemaVersion:persisted.schemaVersion,integrity:'pass'};}});
  if(!result?.ok){historicalFailure(`保存失败；当前数据与预览仍保留：${result?.message||'未知错误'}`);return;}
  state=candidate;lastVerifiedCanonicalRaw=payload;window.__canonicalSaveFailurePending=null;window.lastPersistenceResult=result;renderAll();scheduleLegacyJournalPayloadMigration();historicalDualDraft=null;modalController.close('historicalDualImportModal');alert(`历史日记导入完成：manifest 新增 ${staged.preview.manifest.insert}；One Line 新增 ${staged.preview.oneLine.insert}；明确替换 ${staged.preview.oneLine.approvedReplace}。`);
}
Object.assign(window,productivityModule,noSpendModule,collectionsModule,subscriptionModule,inventoryModule,sellersModule,ordersModule);
bindHistoricalDualImportEntry();
Object.assign(window,{openHistoricalDualImport,openHistoricalDualImporter:openHistoricalDualImport,selectHistoricalDualImport,prepareHistoricalDualImport,closeHistoricalDualImport,commitHistoricalDualImport,renderHistoricalDualPreview});
window.openInventorySourceOrder=inventoryModule.openSourceOrder;
window.inventoryTraceOpenDetail=(itemId,event)=>{inventoryEditDiagnostics.record('inventory_detail_open_requested',{itemId,source:'inventory list action',eventType:event?.type||'inline'});return inventoryModule.openInventoryItem(itemId);};
window.inventoryEditTraceClick=(event)=>{inventoryEditDiagnostics.record('inventory_edit_button_clicked',{itemId:document.querySelector('#inventoryDetailModal')?.dataset.itemId||'',source:'inventory detail footer',eventType:event?.type||'inline'});return inventoryModule.editInventoryFromDetail();};
window.inventoryEditTraceSave=(event)=>{inventoryEditDiagnostics.record('inventory_edit_save_clicked',{itemId:document.querySelector('#inventoryModal')?.dataset.itemId||'',source:'inventory editor footer',eventType:event?.type||'inline'});return inventoryModule.saveItem();};
window.inventoryUseOne=(itemId,event)=>inventoryModule.useOne(itemId,event);
window.undoInventoryUseOne=event=>inventoryModule.undoUseOne(event);
window.setInventorySort=mode=>inventoryModule.setSort(mode);
window.toggleOrderFulfillment=ordersModule.toggleFulfillment;
window.toggleOrderManualTotal=ordersModule.toggleManualTotal;
window.orderBatchChanged=ordersModule.batchChanged;
window.renderOrders=ordersModule.render;
window.setOrderFilter=ordersModule.setFilter;
window.clearOrderFilters=ordersModule.clearFilters;
function renderAll(){window.renderTodayHub?.();renderRecent();renderEntries();renderMonth();renderWeek();renderPhotos();renderThemeList();renderTodayBlocks();renderCustomBlockSettings();renderFavoriteTemplates();productivityModule.render();noSpendModule.render();collectionsModule.renderWishlists();subscriptionModule.render();inventoryModule.render();sellersModule.render();ordersModule.render();inventoryEditDiagnostics.renderCount();ordersSaveDiagnostics.renderCount();ordersPersistenceDiagnostics.renderCount();renderAppVersion()}
function renderPersistenceSafeModeWarning(){const banner=qs('#persistenceSafeModeBanner');if(banner)banner.hidden=!persistenceSafeMode;}
function exportPersistenceFailureMetadata(){const payload={appVersion:APP_VERSION,build:document.documentElement.dataset.runtimeBuild||window.JOURNAL_BUILD||'',schemaVersion:state.schemaVersion,exportedAt:new Date().toISOString(),persistence:{key:KEY,status:loadResult.status,source:loadResult.source,canonicalRawPresent:loadResult.canonicalRawPresent,canonicalRawLength:loadResult.canonicalRawLength,error:loadResult.error||null,safeMode:persistenceSafeMode}};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='persistence-load-failure-metadata.json';link.click();URL.revokeObjectURL(link.href);return payload;}
function showBootError(err){
  console.error(err);
  const box=qs('#bootError'), text=qs('#bootErrorText');
  if(box&&text){text.textContent=(err&&err.message)||String(err);box.style.display='block'}
}
function boot(){
  try{
    const localPanel=qs('[data-fulfillment="local"]');
    if(localPanel){
      const rename={orderDeliveredDate:'orderLocalDeliveryDate',orderCustomAddress:'orderLocalDeliveryAddress',orderPickupNotes:'orderLocalDeliveryNotes'};
      Object.entries(rename).forEach(([oldId,newId])=>{const field=localPanel.querySelector('#'+oldId);if(field)field.id=newId;});
    }
    ensurePageBackButtons();
    qs('#todayText').textContent=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
    applyTheme(state.settings.theme||'sage');
    if(!persistenceSafeMode&&(loadResult.status==='new'||String(loadResult.source||'').startsWith('legacy:')))save();
    renderPersistenceSafeModeWarning();
    renderAll();
    scheduleLegacyJournalPayloadMigration();
  }catch(err){showBootError(err)}
}
Object.assign(window,{openTodayDashboardSettings,moveTodayCard,setTodayCardVisibility,setTodayCardEmptyPolicy,saveTodayDashboardSettings,resetTodayDashboard,selectOneLineImport,prepareOneLineImport,closeOneLineImport,commitOneLineImport,exportInventoryEditDiagnostics:inventoryEditDiagnostics.exportTrace,clearOrdersSaveTrace:ordersSaveDiagnostics.clear,copyOrdersSaveTrace:ordersSaveDiagnostics.copyTrace,exportOrdersSaveTrace:ordersSaveDiagnostics.exportTrace,clearOrdersPersistenceTrace:ordersPersistenceDiagnostics.clear,copyOrdersPersistenceTrace:ordersPersistenceDiagnostics.copyTrace,exportOrdersPersistenceTrace:ordersPersistenceDiagnostics.exportTrace,runStateSizeAudit:stateSizeAudit.run,exportStateSizeAudit:stateSizeAudit.exportAudit,runStorageFootprintAudit:storageFootprintAudit.run,exportStorageFootprintAudit:storageFootprintAudit.exportAudit,openQuestionLibrary,closeQuestionLibrary,renderQuestionLibrary,addFiveYearQuestion,editFiveYearQuestion,renderFiveYearJournal,setFiveYearDate,shiftFiveYearDay,openDailyQuestion,syncDailyQuestionText,closeDailyQuestion,saveDailyQuestion,toggleGrowthMilestone,openGrowthMilestone,closeGrowthMilestone,saveGrowthMilestone,renderGrowthJournal,selectLegacyFiveYearImport,prepareLegacyFiveYearImport,closeLegacyFiveYearImport,commitLegacyFiveYearImport,openDailyBlockEditor,closeDailyBlockEditor,saveDailyBlockEditor,openLegacyJournalEditor,closeLegacyJournalEditor,saveLegacyJournalEditor,openFiveYearRecordEditor,setGrowthDateFilter});
[
 'go','backPage','openEntry','closeEntry','saveEntry','openDate','shift','mtab',
 'editLong','closeLong','saveLong','applyTheme','exportData','importData','addTodayBlock','removeTodayBlock','addCustomBlockSetting','deleteCustomBlockSetting','jumpToMonth','setRecordFilter','setRecordBlockFilter','toggleFavorite','openFavoriteTemplate','createCustomTemplate','closeCustomTemplateModal','saveCustomTemplate','openCustomTemplateInstance','printSelectedPage',
 'openProjectList','closeProjectList','createProject','editProject','duplicateProject',
 'toggleArchiveProject','deleteProject','editEntryById','deleteEntryById','deleteLegacyRecord',
 'renderInventory','openInventoryItemEditor','closeInventoryItemEditor','saveInventoryItem','deleteInventoryItem','archiveInventoryItem','restoreInventoryItem','openInventoryItem','closeInventoryDetail','editInventoryFromDetail','openInventorySourceOrder','inventoryImageChanged','updateInventorySimilar','toggleInventoryCustom','openInventorySettings','closeInventorySettings','addInventoryManaged','renameInventoryCategory','renameInventoryLocation','deleteInventoryCategory','deleteInventoryLocation','setInventoryFilter'
].forEach(name=>{window[name]=({go,backPage,openEntry,closeEntry,saveEntry,openDate,shift,mtab,editLong,closeLong,saveLong,applyTheme,exportData,importData,addTodayBlock,removeTodayBlock,addCustomBlockSetting,deleteCustomBlockSetting,jumpToMonth,setRecordFilter,setRecordBlockFilter,toggleFavorite,openFavoriteTemplate,createCustomTemplate,closeCustomTemplateModal,saveCustomTemplate,openCustomTemplateInstance,printSelectedPage,openProjectList,closeProjectList,createProject,editProject,duplicateProject,toggleArchiveProject,deleteProject,editEntryById,deleteEntryById,deleteLegacyRecord,renderInventory:inventoryModule.render,openInventoryItemEditor:inventoryModule.openItemEditor,closeInventoryItemEditor:inventoryModule.closeItemEditor,saveInventoryItem:inventoryModule.saveItem,deleteInventoryItem:inventoryModule.deleteItem,archiveInventoryItem:inventoryModule.archiveItem,restoreInventoryItem:inventoryModule.restoreItem,openInventoryItem:inventoryModule.openItem,closeInventoryDetail:inventoryModule.closeInventoryDetail,editInventoryFromDetail:inventoryModule.editInventoryFromDetail,openInventorySourceOrder:inventoryModule.openSourceOrder,inventoryImageChanged:inventoryModule.imageChanged,updateInventorySimilar:inventoryModule.updateSimilar,toggleInventoryCustom:inventoryModule.toggleCustom,openInventorySettings:inventoryModule.openSettings,closeInventorySettings:inventoryModule.closeSettings,addInventoryManaged:inventoryModule.addManaged,renameInventoryCategory:i=>inventoryModule.renameManaged('category',i),renameInventoryLocation:i=>inventoryModule.renameManaged('location',i),deleteInventoryCategory:i=>inventoryModule.deleteManaged('category',i),deleteInventoryLocation:i=>inventoryModule.deleteManaged('location',i),setInventoryFilter:inventoryModule.setFilter})[name]});

let fiveYearViewDate=iso(new Date()),legacyFiveYearDraft=null,growthMilestoneContext=null;
const growthTagChoices=['语言','大运动','精细动作','认知','社交','情绪','自理','游戏','睡眠','饮食','其他'];
function fiveYearRecords(){return state.legacyJournalRecords.filter(record=>record.recordType==='five_year_question');}
function allGrowthRecords(){const legacy=state.legacyJournalRecords.filter(record=>record.recordType==='growth').map(record=>({...record,source:'legacy'}));const current=Object.entries(state.dailyBlockMeta||{}).flatMap(([date,blocks])=>Object.entries(blocks||{}).filter(([,meta])=>meta?.isMilestone).map(([blockTitle,meta])=>({id:`daily-growth:${date}:${blockTitle}`,date,recordType:'growth',title:meta.growthTitle||blockTitle,content:meta.growthDetails||state.dailyBlocks?.[date]?.[blockTitle]||'',growthTags:Array.isArray(meta.growthTags)?meta.growthTags:[],attachments:meta.attachments||[],source:'daily',blockTitle})));return [...legacy,...current];}
function setFiveYearDate(value){if(/^\d{4}-\d{2}-\d{2}$/.test(value))fiveYearViewDate=value;renderFiveYearJournal();}
function shiftFiveYearDay(delta){const d=new Date(fiveYearViewDate+'T12:00:00');d.setDate(d.getDate()+delta);fiveYearViewDate=iso(d);renderFiveYearJournal();}
function renderFiveYearJournal(){const date=qs('#fiveYearDate');if(!date)return;date.value=fiveYearViewDate;const [,month,day]=fiveYearViewDate.split('-').map(Number),query=(qs('#fiveYearSearch')?.value||'').trim().toLowerCase();let rows=fiveYearJournal.recordsForSlot(fiveYearRecords(),month,day);if(query)rows=rows.filter(record=>`${record.question||record.title||''} ${record.answer||record.content||''}`.toLowerCase().includes(query));const years=[...new Set(state.legacyJournalRecords.filter(record=>record.recordType==='five_year_question').map(record=>Number((record.date||'').slice(0,4))))].sort((a,b)=>a-b);const leap=month===2&&day===29?years.filter(year=>!fiveYearJournal.validDate(year,month,day)):[];qs('#fiveYearList').innerHTML=(leap.length?`<div class="entry"><span class="small">${leap.map(year=>`${year} 年无 2月29日`).join(' · ')}</span></div>`:'')+(rows.length?rows.map(record=>`<article class="entry five-year-record"><div class="meta">${esc(record.date)}</div><b>问题：${esc(record.question||record.title)}</b><p>回答：${esc(record.answer||record.content)}</p></article>`).join(''):'<div class="entry"><span class="small">这一天还没有每日一问记录。</span></div>');}
function questionLibrary(){const custom=state.fiveYearQuestions||[];const seen=new Set();return [...fiveYearJournal.SYSTEM_QUESTIONS,...custom].filter(question=>question?.id&&question?.text&&!seen.has(question.id)&&(seen.add(question.id)||true));}
function renderQuestionLibrary(){const el=qs('#questionLibraryList');if(!el)return;const custom=new Set((state.fiveYearQuestions||[]).map(question=>question.id));el.innerHTML=questionLibrary().map(question=>`<div class="manage-row"><span><b>${esc(question.text)}</b><small>${custom.has(question.id)?'自定义问题':'系统问题'}</small></span>${custom.has(question.id)?`<button onclick="editFiveYearQuestion('${question.id}')">编辑</button>`:''}</div>`).join('');}
function openQuestionLibrary(){renderQuestionLibrary();modalController.open('questionLibraryModal');}
function closeQuestionLibrary(){modalController.close('questionLibraryModal');}
function addFiveYearQuestion(){const text=prompt('新增每日一问');if(!text||!text.trim())return;state.fiveYearQuestions.push({id:`question-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,text:text.trim(),createdAt:Date.now()});save();renderQuestionLibrary();}
function editFiveYearQuestion(id){const question=(state.fiveYearQuestions||[]).find(item=>item.id===id);if(!question)return;const text=prompt('编辑每日一问',question.text);if(text===null)return;if(!text.trim()){if(confirm('删除这条自定义问题？'))state.fiveYearQuestions=state.fiveYearQuestions.filter(item=>item.id!==id);}else question.text=text.trim();save();renderQuestionLibrary();}
function openDailyQuestion(date=iso(new Date())){qs('#dailyQuestionDate').value=date;const questions=questionLibrary();qs('#dailyQuestionSelect').innerHTML=questions.map(question=>`<option value="${esc(question.id)}">${esc(question.text)}</option>`).join('')+'<option value="__custom__">自定义问题…</option>';const existing=state.legacyJournalRecords.find(record=>record.recordType==='five_year_question'&&record.date===date);if(existing){qs('#dailyQuestionText').value=existing.question||existing.title||'';qs('#dailyQuestionAnswer').value=existing.answer||existing.content||'';qs('#dailyQuestionSelect').value=questions.some(question=>question.text===qs('#dailyQuestionText').value)?questions.find(question=>question.text===qs('#dailyQuestionText').value).id:'__custom__';}else{syncDailyQuestionText();qs('#dailyQuestionAnswer').value='';}modalController.open('dailyQuestionModal');}
function syncDailyQuestionText(){const selected=qs('#dailyQuestionSelect').value,question=questionLibrary().find(item=>item.id===selected);qs('#dailyQuestionText').value=question?.text||'';qs('#dailyQuestionText').readOnly=selected!=='__custom__';}
function closeDailyQuestion(){modalController.close('dailyQuestionModal');}
function saveDailyQuestion(){const date=qs('#dailyQuestionDate').value||iso(new Date()),question=qs('#dailyQuestionText').value.trim(),answer=qs('#dailyQuestionAnswer').value.trim();if(!question&&!answer)return;let record=state.legacyJournalRecords.find(item=>item.recordType==='five_year_question'&&item.date===date);if(!record){record={id:`five-question-${Date.now()}`,recordType:'five_year_question',date,provenance:{sourceApp:'personal-life-hub',sourceEntryId:`daily-question:${date}`},createdAt:Date.now()};state.legacyJournalRecords.push(record);}Object.assign(record,{title:question,content:answer,question,answer,updatedAt:Date.now()});save();closeDailyQuestion();renderFiveYearJournal();renderEntries();renderTodayHub();}
function toggleGrowthMilestone(encodedDate,encodedBlock,enabled){const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock);state.dailyBlockMeta[date]=state.dailyBlockMeta[date]||{};const meta=state.dailyBlockMeta[date][block]=state.dailyBlockMeta[date][block]||{};meta.isMilestone=!!enabled;if(!enabled){save();renderTodayBlocks();renderGrowthJournal();return;}meta.growthTitle=meta.growthTitle||block;meta.growthDetails=meta.growthDetails||state.dailyBlocks?.[date]?.[block]||'';meta.growthTags=Array.isArray(meta.growthTags)?meta.growthTags:[];save();renderTodayBlocks();openGrowthMilestone(encodedDate,encodedBlock);}
function openGrowthMilestone(encodedDate,encodedBlock){const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=state.dailyBlockMeta?.[date]?.[block]||{};growthMilestoneContext={date,block};qs('#growthMilestoneSource').textContent=`${date} · ${block}`;qs('#growthMilestoneTitle').value=meta.growthTitle||block;qs('#growthMilestoneDetails').value=meta.growthDetails||state.dailyBlocks?.[date]?.[block]||'';qs('#growthMilestoneTags').value=(meta.growthTags||[]).join(', ');modalController.open('growthMilestoneModal');}
function closeGrowthMilestone(){growthMilestoneContext=null;modalController.close('growthMilestoneModal');}
function saveGrowthMilestone(){if(!growthMilestoneContext)return;const {date,block}=growthMilestoneContext,meta=state.dailyBlockMeta[date][block];meta.isMilestone=true;meta.growthTitle=qs('#growthMilestoneTitle').value.trim()||block;meta.growthDetails=qs('#growthMilestoneDetails').value.trim();meta.growthTags=[...new Set(qs('#growthMilestoneTags').value.split(',').map(tag=>tag.trim()).filter(Boolean))];save();closeGrowthMilestone();renderTodayBlocks();renderGrowthJournal();renderEntries();}
function renderGrowthJournal(){const list=qs('#growthList');if(!list)return;const search=(qs('#growthSearch')?.value||'').trim().toLowerCase(),tag=qs('#growthTagFilter')?.value||'all',sort=qs('#growthSort')?.value||'new';let rows=allGrowthRecords();const tags=[...new Set(rows.flatMap(row=>row.growthTags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN'));const select=qs('#growthTagFilter');if(select){if(tag!=='all'&&!tags.includes(tag))select.value='all';select.innerHTML=`<option value="all">全部成长标签</option>${tags.map(value=>`<option value="${esc(value)}" ${value===tag?'selected':''}>${esc(value)}</option>`).join('')}`;}if(tag!=='all')rows=rows.filter(row=>(row.growthTags||[]).includes(tag));if(search)rows=rows.filter(row=>`${row.title||''} ${row.content||''}`.toLowerCase().includes(search));rows.sort((a,b)=>sort==='old'?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)));list.innerHTML=rows.length?rows.map(row=>`<article class="entry"><div class="meta">${esc(row.date)}${row.growthTags?.length?` · ${esc(row.growthTags.join('、'))}`:''}</div><b>${esc(row.title||'成长瞬间')}</b><p>${esc(row.content||'')}</p>${row.attachments?.length?'<div class="small">媒体尚未导入</div>':''}</article>`).join(''):'<div class="entry"><span class="small">还没有成长记录。</span></div>';}
function selectLegacyFiveYearImport(){const input=qs('#legacyFiveYearFile');input.value='';input.click();}
function prepareLegacyFiveYearImport(event){const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{let parsed;try{parsed=JSON.parse(reader.result);}catch(_){alert('文件不是有效 JSON，未导入任何数据。');return;}const validated=fiveYearJournal.validateManifest(parsed);if(!validated.ok){alert(validated.error);return;}legacyFiveYearDraft={validated};const counts=validated.preview.counts;qs('#legacyFiveYearImportPreview').innerHTML=`<div class="import-preview-card"><b>导入预览</b><p>检测到 ${validated.preview.total} 条记录</p><ul><li>每日一问 <b>${counts.five_year_question}</b></li><li>成长日记 <b>${counts.growth}</b></li><li>今日大事件 <b>${counts.event}</b></li><li>其他 <b>${counts.legacy_journal}</b></li><li>媒体引用 <b>${counts.media}</b></li></ul>${validated.preview.invalid?`<p class="small">无效记录：${validated.preview.invalid}（会跳过）</p>`:''}</div>`;modalController.open('legacyFiveYearImportModal');};reader.onerror=()=>alert('无法读取文件，未导入任何数据。');reader.readAsText(file);}
function closeLegacyFiveYearImport(){legacyFiveYearDraft=null;modalController.close('legacyFiveYearImportModal');}
function linkHighConfidenceGrowthRecords(){for(const record of state.legacyJournalRecords.filter(item=>item.recordType==='growth')){const daily=String(state.dailyBlocks?.[record.date]?.['熹熹的一天']||'').trim(),title=String(record.title||'').trim();if(!daily||!title)continue;const exact=daily===String(record.content||'').trim(),titleMatch=title.length>=6&&daily.includes(title);if(!exact&&!titleMatch)continue;record.relatedDailyBlockId=`daily-block:${record.date}:熹熹的一天`;state.dailyBlockMeta[record.date]=state.dailyBlockMeta[record.date]||{};const meta=state.dailyBlockMeta[record.date]['熹熹的一天']=state.dailyBlockMeta[record.date]['熹熹的一天']||{};meta.relatedLegacyRecordIds=[...new Set([...(meta.relatedLegacyRecordIds||[]),record.id])];}}
function commitLegacyFiveYearImport(){if(!legacyFiveYearDraft)return;try{const staged=fiveYearJournal.stageImport(state,legacyFiveYearDraft.validated);state.legacyJournalRecords=staged.next.legacyJournalRecords;state.legacyImportTombstones=staged.next.legacyImportTombstones;linkHighConfidenceGrowthRecords();save();renderAll();closeLegacyFiveYearImport();alert(`导入完成：\n成功导入：${staged.result.imported}\n已存在跳过：${staged.result.duplicates}\n用户删除跳过：${staged.result.tombstones}\n无效记录：${staged.result.invalid}\n待补媒体：${staged.result.missingMedia}`);}catch(error){alert(`导入失败，未修改当前数据：${error.message||error}`);}}
let dailyBlockEditContext=null,legacyJournalEditId='',dailyQuestionEditId='',growthDateFilter='';
function openDailyBlockEditor(encodedDate,encodedName){const date=decodeURIComponent(encodedDate),name=decodeURIComponent(encodedName);dailyBlockEditContext={date,name};qs('#dailyBlockEditorTitle').textContent=`编辑：${name}`;qs('#dailyBlockEditorDate').textContent=date;qs('#dailyBlockEditorName').value=name;qs('#dailyBlockEditorName').readOnly=name==='我的一天';qs('#dailyBlockEditorContent').value=state.dailyBlocks?.[date]?.[name]||'';modalController.open('dailyBlockEditorModal');}
function closeDailyBlockEditor(){dailyBlockEditContext=null;modalController.close('dailyBlockEditorModal');}
function saveDailyBlockEditor(){if(!dailyBlockEditContext)return;const {date,name}=dailyBlockEditContext,newName=qs('#dailyBlockEditorName').value.trim()||name,content=qs('#dailyBlockEditorContent').value;state.dailyBlocks[date]=state.dailyBlocks[date]||{};state.dailyBlockMeta[date]=state.dailyBlockMeta[date]||{};if(newName!==name){state.dailyBlocks[date][newName]=content;delete state.dailyBlocks[date][name];if(state.dailyBlockMeta[date][name]){state.dailyBlockMeta[date][newName]=state.dailyBlockMeta[date][name];delete state.dailyBlockMeta[date][name];}state.customBlocks=state.customBlocks.map(block=>block===name?newName:block);Object.values(state.importProvenance||{}).forEach(group=>Object.values(group||{}).forEach(item=>{if(item?.sourceDate===date&&item?.targetTitle===name)item.targetTitle=newName;}));}else state.dailyBlocks[date][name]=content;save();closeDailyBlockEditor();renderTodayBlocks();renderEntries();renderGrowthJournal();renderMonth();}
function growthTagOptions(selected=[] ,targetId){const active=new Set(selected||[]);return growthTagChoices.map(tag=>`<label class="growth-tag-option"><input type="checkbox" value="${esc(tag)}" ${active.has(tag)?'checked':''}>${esc(tag)}</label>`).join('');}
function openLegacyJournalEditor(id){const record=state.legacyJournalRecords.find(item=>item.id===id);if(!record)return;legacyJournalEditId=id;qs('#legacyJournalEditorTitle').textContent=record.recordType==='growth'?'编辑成长记录':record.recordType==='event'?'编辑大事件':'编辑记录';qs('#legacyJournalDate').value=record.date||iso(new Date());qs('#legacyJournalTitle').value=record.title||'';qs('#legacyJournalContent').value=record.content||'';const growth=record.recordType==='growth';qs('#legacyGrowthTagsSection').hidden=!growth;if(growth)qs('#legacyGrowthTags').innerHTML=growthTagOptions(record.growthTags||[],'legacyGrowthTags');modalController.open('legacyJournalEditorModal');}
function closeLegacyJournalEditor(){legacyJournalEditId='';modalController.close('legacyJournalEditorModal');}
function saveLegacyJournalEditor(){const record=state.legacyJournalRecords.find(item=>item.id===legacyJournalEditId);if(!record)return;record.date=qs('#legacyJournalDate').value||record.date;record.title=qs('#legacyJournalTitle').value.trim();record.content=qs('#legacyJournalContent').value.trim();if(record.recordType==='growth')record.growthTags=[...document.querySelectorAll('#legacyGrowthTags input:checked')].map(input=>input.value);if(record.recordType==='five_year_question'){record.question=record.title;record.answer=record.content;}record.updatedAt=Date.now();save();closeLegacyJournalEditor();renderEntries();renderGrowthJournal();renderFiveYearJournal();renderMonth();}
function openFiveYearRecordEditor(id){const record=state.legacyJournalRecords.find(item=>item.id===id&&item.recordType==='five_year_question');if(!record)return;dailyQuestionEditId=id;qs('#dailyQuestionDate').value=record.date;qs('#dailyQuestionSelect').innerHTML='<option value="__custom__">编辑本日问题</option>';qs('#dailyQuestionSelect').value='__custom__';qs('#dailyQuestionText').readOnly=false;qs('#dailyQuestionText').value=record.question||record.title||'';qs('#dailyQuestionAnswer').value=record.answer||record.content||'';modalController.open('dailyQuestionModal');}
function openDailyQuestion(date=iso(new Date())){dailyQuestionEditId='';qs('#dailyQuestionDate').value=date;const questions=questionLibrary();qs('#dailyQuestionSelect').innerHTML=questions.map(question=>`<option value="${esc(question.id)}">${esc(question.text)}</option>`).join('')+'<option value="__custom__">自定义问题…</option>';const existing=state.legacyJournalRecords.find(record=>record.recordType==='five_year_question'&&record.date===date);if(existing){dailyQuestionEditId=existing.id;qs('#dailyQuestionText').value=existing.question||existing.title||'';qs('#dailyQuestionAnswer').value=existing.answer||existing.content||'';qs('#dailyQuestionSelect').value='__custom__';qs('#dailyQuestionText').readOnly=false;}else{syncDailyQuestionText();qs('#dailyQuestionAnswer').value='';}modalController.open('dailyQuestionModal');}
function saveDailyQuestion(){const date=qs('#dailyQuestionDate').value||iso(new Date()),question=qs('#dailyQuestionText').value.trim(),answer=qs('#dailyQuestionAnswer').value.trim();if(!question&&!answer)return;let record=dailyQuestionEditId?state.legacyJournalRecords.find(item=>item.id===dailyQuestionEditId):state.legacyJournalRecords.find(item=>item.recordType==='five_year_question'&&item.date===date);if(!record){record={id:`five-question-${Date.now()}`,recordType:'five_year_question',provenance:{sourceApp:'personal-life-hub',sourceEntryId:`daily-question:${date}`},createdAt:Date.now()};state.legacyJournalRecords.push(record);}Object.assign(record,{date,title:question,content:answer,question,answer,updatedAt:Date.now()});save();closeDailyQuestion();renderFiveYearJournal();renderEntries();renderTodayHub();renderMonth();}
function openGrowthMilestone(encodedDate,encodedBlock){const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=state.dailyBlockMeta?.[date]?.[block]||{};growthMilestoneContext={date,block};qs('#growthMilestoneSource').textContent=`${date} · ${block}（日期跟随原始 Daily）`;qs('#growthMilestoneTitle').value=meta.growthTitle||block;qs('#growthMilestoneDetails').value=meta.growthDetails||state.dailyBlocks?.[date]?.[block]||'';qs('#growthMilestoneTags').outerHTML=`<div id="growthMilestoneTags" class="growth-tag-options">${growthTagOptions(meta.growthTags||[])}</div>`;modalController.open('growthMilestoneModal');}
function saveGrowthMilestone(){if(!growthMilestoneContext)return;const {date,block}=growthMilestoneContext,meta=state.dailyBlockMeta[date][block];meta.isMilestone=true;meta.growthTitle=qs('#growthMilestoneTitle').value.trim()||block;meta.growthDetails=qs('#growthMilestoneDetails').value.trim();meta.growthTags=[...document.querySelectorAll('#growthMilestoneTags input:checked')].map(input=>input.value);save();closeGrowthMilestone();renderTodayBlocks();renderGrowthJournal();renderEntries();renderMonth();}
function setGrowthDateFilter(date){growthDateFilter=date||'';const input=qs('#growthDateFilter');if(input)input.value=growthDateFilter;renderGrowthJournal();}
function renderFiveYearJournal(){const date=qs('#fiveYearDate');if(!date)return;date.value=fiveYearViewDate;const [,month,day]=fiveYearViewDate.split('-').map(Number),query=(qs('#fiveYearSearch')?.value||'').trim().toLowerCase();let rows=fiveYearJournal.recordsForSlot(fiveYearRecords(),month,day);if(query)rows=rows.filter(record=>`${record.question||record.title||''} ${record.answer||record.content||''}`.toLowerCase().includes(query));const years=[...new Set(state.legacyJournalRecords.filter(record=>record.recordType==='five_year_question').map(record=>Number((record.date||'').slice(0,4))))].sort((a,b)=>a-b);const leap=month===2&&day===29?years.filter(year=>!fiveYearJournal.validDate(year,month,day)):[];qs('#fiveYearList').innerHTML=(leap.length?`<div class="entry"><span class="small">${leap.map(year=>`${year} 年无 2月29日`).join(' · ')}</span></div>`:'')+(rows.length?rows.map(record=>`<article class="entry five-year-record" onclick="openFiveYearRecordEditor('${record.id}')"><div class="meta">${esc(record.date)}</div><b>问题：${esc(record.question||record.title)}</b><p>回答：${esc(record.answer||record.content)}</p><div class="small">点击编辑</div></article>`).join(''):'<div class="entry"><span class="small">这一天还没有每日一问记录。</span></div>');}
function journalRefresh(){renderTodayBlocks();renderTodayHub();renderEntries();renderGrowthJournal();renderFiveYearJournal();renderMonth();renderRecent();}
function ensureDailyBlockMeta(date,name){state.dailyBlockMeta[date]=state.dailyBlockMeta[date]||{};const meta=state.dailyBlockMeta[date][name]=state.dailyBlockMeta[date][name]||{};if(!meta.blockId)meta.blockId=`daily-block-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return meta;}
function findDailyBlockById(date,blockId){const blocks=state.dailyBlocks?.[date]||{},meta=state.dailyBlockMeta?.[date]||{};return Object.keys(blocks).map(name=>({name,meta:meta[name]||{}})).find(item=>item.meta.blockId===blockId)||null;}
function dailyBlockEntries(){return Object.entries(state.dailyBlocks||{}).flatMap(([date,blocks])=>Object.entries(blocks||{}).filter(([,content])=>String(content||'').trim()).map(([title,content])=>{const meta=ensureDailyBlockMeta(date,title);return {id:meta.blockId,date,type:meta.isMilestone?'growth':'daily',title:meta.growthTitle||title,blockTitle:title,content:meta.growthDetails||String(content),growthTags:meta.growthTags||[],readOnly:true,dailyBlock:true};}));}
function renderTodayBlocks(){const key=todayKey();state.dailyBlocks[key]=state.dailyBlocks[key]||{};state.dailyBlockMeta[key]=state.dailyBlockMeta[key]||{};const names=[...new Set(['我的一天',...state.customBlocks,...Object.keys(state.dailyBlocks[key])])];qs('#todayBlocks').innerHTML=names.map(name=>{const meta=ensureDailyBlockMeta(key,name),growth=name==='熹熹的一天'?`<div class="block-actions growth-block-actions"><label><input type="checkbox" ${meta.isMilestone?'checked':''} onchange="toggleGrowthMilestone('${encodeURIComponent(key)}','${encodeURIComponent(name)}',this.checked)"> 成长瞬间</label>${meta.isMilestone?`<button onclick="openGrowthMilestone('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">成长详情</button>`:''}</div>`:'';return `<article class="daily-block"><div class="daily-block-head"><h3>${esc(name)}</h3><div class="block-actions"><button onclick="openDailyBlockEditor('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">编辑</button><button class="danger" onclick="confirmDeleteDailyBlock('${encodeURIComponent(key)}','${meta.blockId}')">删除</button></div></div><button class="daily-block-content" type="button" onclick="openDailyBlockEditor('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">${esc(state.dailyBlocks[key][name]||'写一点今天的内容…')}</button>${growth}</article>`}).join('');}
function openTodayDaily(){const today=todayKey();go('home');requestAnimationFrame(()=>qs('#todayBlocks')?.scrollIntoView({behavior:'smooth',block:'start'}));}
function openDailyBlockEditor(encodedDate,encodedName){const date=decodeURIComponent(encodedDate),name=decodeURIComponent(encodedName),meta=ensureDailyBlockMeta(date,name);dailyBlockEditContext={date,name,blockId:meta.blockId};qs('#dailyBlockEditorTitle').textContent=`编辑：${name}`;qs('#dailyBlockEditorDate').textContent=date;qs('#dailyBlockEditorName').value=name;qs('#dailyBlockEditorName').readOnly=false;qs('#dailyBlockEditorContent').value=state.dailyBlocks?.[date]?.[name]||'';qs('#dailyBlockDeleteButton').textContent='删除区块';modalController.open('dailyBlockEditorModal');}
function saveDailyBlockEditor(){if(!dailyBlockEditContext)return;const {date,name,blockId}=dailyBlockEditContext,found=findDailyBlockById(date,blockId),oldName=found?.name||name,newName=qs('#dailyBlockEditorName').value.trim()||oldName,content=qs('#dailyBlockEditorContent').value;state.dailyBlocks[date]=state.dailyBlocks[date]||{};const meta=ensureDailyBlockMeta(date,oldName);if(newName!==oldName){if(state.dailyBlocks[date][newName]!==undefined&&newName!==oldName){alert('同一天已有同名区块，请换一个名称。');return;}state.dailyBlocks[date][newName]=content;delete state.dailyBlocks[date][oldName];state.dailyBlockMeta[date][newName]=meta;delete state.dailyBlockMeta[date][oldName];state.customBlocks=state.customBlocks.map(item=>item===oldName?newName:item);Object.values(state.importProvenance||{}).forEach(group=>Object.values(group||{}).forEach(item=>{if(item?.sourceDate===date&&item?.targetTitle===oldName)item.targetTitle=newName;}));}else state.dailyBlocks[date][oldName]=content;save();closeDailyBlockEditor();journalRefresh();}
function confirmDeleteDailyBlock(encodedDate,blockId){const date=decodeURIComponent(encodedDate),found=findDailyBlockById(date,blockId);if(!found)return;const warning=found.meta.isMilestone?'该区块包含成长记录。删除后会同时清理关联的成长记录。':'这只会删除此 Daily 区块，不会删除当天其他区块。';if(!confirm(`删除“${found.name}”？\n${warning}`)||!confirm('请再次确认：此操作会删除这个 Daily 区块。'))return;delete state.dailyBlocks[date][found.name];delete state.dailyBlockMeta[date][found.name];state.customBlocks=state.customBlocks.filter(item=>item!==found.name);save();closeDailyBlockEditor();journalRefresh();}
function deleteDailyBlock(){if(!dailyBlockEditContext)return;confirmDeleteDailyBlock(encodeURIComponent(dailyBlockEditContext.date),dailyBlockEditContext.blockId);}
function cancelGrowthMilestone(){if(!growthMilestoneContext)return;const {date,block}=growthMilestoneContext,meta=state.dailyBlockMeta?.[date]?.[block];if(!meta)return;if(!confirm('取消成长记录？原来的 Daily 区块内容会保留。')||!confirm('请再次确认：只从成长日记移除该记录。'))return;delete meta.isMilestone;delete meta.growthTitle;delete meta.growthDetails;delete meta.growthTags;delete meta.attachments;save();closeGrowthMilestone();journalRefresh();}
function openLegacyJournalEditor(id){const record=state.legacyJournalRecords.find(item=>item.id===id);if(!record)return;if(record.recordType==='five_year_question'){openFiveYearRecordEditor(id);return;}legacyJournalEditId=id;qs('#legacyJournalEditorTitle').textContent=record.recordType==='growth'?'编辑成长记录':record.recordType==='event'?'编辑大事件':'编辑记录';qs('#legacyJournalDate').value=record.date||iso(new Date());qs('#legacyJournalTitle').value=record.title||'';qs('#legacyJournalContent').value=record.content||'';const growth=record.recordType==='growth';qs('#legacyGrowthTagsSection').hidden=!growth;if(growth)qs('#legacyGrowthTags').innerHTML=growthTagOptions(record.growthTags||[]);qs('#legacyJournalDeleteButton').textContent=growth?'删除成长记录':'删除记录';modalController.open('legacyJournalEditorModal');}
function deleteLegacyJournalFromEditor(){const record=state.legacyJournalRecords.find(item=>item.id===legacyJournalEditId);if(!record)return;const description=record.recordType==='growth'?'删除这条独立成长记录？':'删除这条历史记录？';if(!confirm(description)||!confirm('请再次确认：删除后重新导入同一来源也不会恢复。'))return;deleteLegacyRecord(record.id);closeLegacyJournalEditor();journalRefresh();}
function deleteLegacyRecord(id){const record=state.legacyJournalRecords.find(item=>item.id===id);if(!record)return;const provenance=record.provenance;if(provenance?.sourceApp===fiveYearJournal.SOURCE_APP)state.legacyImportTombstones[fiveYearJournal.sourceKey(provenance.sourceEntryId)]={sourceApp:provenance.sourceApp,sourceEntryId:provenance.sourceEntryId,userDeleted:true,deletedAt:Date.now()};state.legacyJournalRecords=state.legacyJournalRecords.filter(item=>item.id!==id);save();journalRefresh();}
function syncDailyQuestionText(){const selected=qs('#dailyQuestionSelect').value,question=questionLibrary().find(item=>item.id===selected),custom=selected==='__custom__';qs('#dailyQuestionCustomWrap').hidden=!custom;qs('#dailyQuestionPrompt').hidden=custom;qs('#dailyQuestionPrompt').textContent=custom?'':(question?.text||'');if(custom&&!qs('#dailyQuestionText').value)qs('#dailyQuestionText').value='';}
function openFiveYearRecordEditor(id){const record=state.legacyJournalRecords.find(item=>item.id===id&&item.recordType==='five_year_question');if(!record)return;dailyQuestionEditId=id;qs('#dailyQuestionDate').value=record.date;qs('#dailyQuestionSelect').innerHTML='<option value="__custom__">编辑本日问题</option>';qs('#dailyQuestionSelect').value='__custom__';qs('#dailyQuestionText').value=record.question||record.title||'';qs('#dailyQuestionAnswer').value=record.answer||record.content||'';syncDailyQuestionText();qs('#dailyQuestionDeleteButton').hidden=false;modalController.open('dailyQuestionModal');}
function openDailyQuestion(date=iso(new Date())){dailyQuestionEditId='';qs('#dailyQuestionDate').value=date;const questions=questionLibrary();qs('#dailyQuestionSelect').innerHTML=questions.map(question=>`<option value="${esc(question.id)}">${esc(question.text)}</option>`).join('')+'<option value="__custom__">自定义问题…</option>';const existing=state.legacyJournalRecords.find(record=>record.recordType==='five_year_question'&&record.date===date);if(existing){dailyQuestionEditId=existing.id;qs('#dailyQuestionAnswer').value=existing.answer||existing.content||'';const matched=questions.find(question=>question.text===(existing.question||existing.title||''));qs('#dailyQuestionSelect').value=matched?matched.id:'__custom__';qs('#dailyQuestionText').value=matched?'':(existing.question||existing.title||'');}else{qs('#dailyQuestionSelect').selectedIndex=0;qs('#dailyQuestionText').value='';qs('#dailyQuestionAnswer').value='';}syncDailyQuestionText();qs('#dailyQuestionDeleteButton').hidden=!dailyQuestionEditId;modalController.open('dailyQuestionModal');}
function saveDailyQuestion(){const date=qs('#dailyQuestionDate').value||iso(new Date()),selected=qs('#dailyQuestionSelect').value,question=selected==='__custom__'?qs('#dailyQuestionText').value.trim():(questionLibrary().find(item=>item.id===selected)?.text||''),answer=qs('#dailyQuestionAnswer').value.trim();if(!question&&!answer)return;let record=dailyQuestionEditId?state.legacyJournalRecords.find(item=>item.id===dailyQuestionEditId):state.legacyJournalRecords.find(item=>item.recordType==='five_year_question'&&item.date===date);if(!record){record={id:`five-question-${Date.now()}`,recordType:'five_year_question',provenance:{sourceApp:'personal-life-hub',sourceEntryId:`daily-question:${date}`},createdAt:Date.now()};state.legacyJournalRecords.push(record);}Object.assign(record,{date,title:question,content:answer,question,answer,questionId:selected==='__custom__'?null:selected,updatedAt:Date.now()});save();closeDailyQuestion();journalRefresh();}
function deleteDailyQuestionRecord(){const record=state.legacyJournalRecords.find(item=>item.id===dailyQuestionEditId);if(!record)return;if(!confirm('删除这一天的每日一问回答？题库中的问题不会删除。')||!confirm('请再次确认：只删除这一天的回答记录。'))return;deleteLegacyRecord(record.id);closeDailyQuestion();journalRefresh();}
function setFiveYearToday(){fiveYearViewDate=iso(new Date());renderFiveYearJournal();}
function renderFiveYearJournal(){const date=qs('#fiveYearDate');if(!date)return;date.value=fiveYearViewDate;const [,month,day]=fiveYearViewDate.split('-').map(Number),query=(qs('#fiveYearSearch')?.value||'').trim().toLowerCase();let rows=fiveYearJournal.recordsForSlot(fiveYearRecords(),month,day);if(query)rows=rows.filter(record=>`${record.question||record.title||''} ${record.answer||record.content||''}`.toLowerCase().includes(query));const todayRecord=state.legacyJournalRecords.find(record=>record.recordType==='five_year_question'&&record.date===fiveYearViewDate),prompt=qs('#fiveYearPrompt');if(prompt)prompt.innerHTML=todayRecord?`<button class="full-btn" onclick="openFiveYearRecordEditor('${todayRecord.id}')"><b>今日一问已回答</b><span>${esc(todayRecord.question||todayRecord.title)}</span></button>`:`<div><b>今日一问</b><p>${esc(questionLibrary()[0]?.text||'写下今天的回答')}</p><button class="btn primary" onclick="openDailyQuestion('${fiveYearViewDate}')">回答</button></div>`;qs('#fiveYearList').innerHTML=rows.length?rows.map(record=>`<article class="entry five-year-record" onclick="openFiveYearRecordEditor('${record.id}')"><div class="meta">${esc(record.date)}</div><b>问题</b><p>${esc(record.question||record.title)}</p><b>回答</b><p>${esc(record.answer||record.content)}</p><div class="small">轻触查看、编辑或删除</div></article>`).join(''):'<div class="entry"><span class="small">这一天还没有其他年份的记录。</span></div>'}
function canonicalDailyProjection(){return Object.entries(state.dailyBlocks||{}).flatMap(([date,blocks])=>Object.entries(blocks||{}).filter(([,text])=>String(text||'').trim()).map(([title,text])=>{const meta=ensureDailyBlockMeta(date,title);return {id:meta.blockId,sourceType:'daily_block',sourceDate:date,sourceBlockId:meta.blockId,date,blockTitle:title,title:meta.growthTitle||title,content:meta.growthDetails||String(text),type:meta.isMilestone?'growth':'daily',growthTags:meta.growthTags||[],dailyBlock:true,readOnly:true};}));}
function dailyBlockEntries(){return canonicalDailyProjection();}
function timelineDailyDiagnostic(date){const canonical=canonicalDailyProjection().filter(row=>row.date===date).map(row=>({blockId:row.sourceBlockId,title:row.blockTitle,text:row.content}));const projections=dailyBlockEntries().filter(row=>row.sourceDate===date).map(row=>({sourceDate:row.sourceDate,sourceBlockId:row.sourceBlockId,renderedTitle:row.blockTitle,renderedText:row.content}));return {canonicalDailyBlocks:canonical,timelineDailyProjections:projections};}
function renderEntries(){const rows=[...state.entries,...legacyTimelineEntries(),...canonicalDailyProjection()];renderRecordBlockFilter(rows);const arr=timelineFilter.apply(rows,{type:recordFilter,block:recordBlockFilter,search:qs('#recordSearch')?.value||'',sort:qs('#recordSort')?.value||'new'});qs('#recordsList').innerHTML=arr.length?arr.map(eh).join(''):'<div class="entry"><span class="small">没有符合条件的记录</span></div>'}
function shiftGrowthDate(delta){const current=growthDateFilter||iso(new Date()),date=new Date(`${current}T12:00:00`);date.setDate(date.getDate()+Number(delta||0));setGrowthDateFilter(iso(date));}
function setGrowthDateFilter(date){growthDateFilter=date||'';const input=qs('#growthDateFilter');if(input)input.value=growthDateFilter;const all=qs('#growthAllButton');if(all)all.classList.toggle('on',!growthDateFilter);renderGrowthJournal();}
function renderGrowthJournal(){const list=qs('#growthList');if(!list)return;const search=(qs('#growthSearch')?.value||'').trim().toLowerCase(),tag=qs('#growthTagFilter')?.value||'all',sort=qs('#growthSort')?.value||'new';let rows=allGrowthRecords();const tags=[...new Set(rows.flatMap(row=>row.growthTags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN')),select=qs('#growthTagFilter');if(select){select.innerHTML=`<option value="all">全部标签</option>${tags.map(value=>`<option value="${esc(value)}" ${value===tag?'selected':''}>${esc(value)}</option>`).join('')}`;}if(growthDateFilter)rows=rows.filter(row=>row.date===growthDateFilter);if(tag!=='all')rows=rows.filter(row=>(row.growthTags||[]).includes(tag));if(search)rows=rows.filter(row=>`${row.title||''} ${row.content||''}`.toLowerCase().includes(search));rows.sort((a,b)=>sort==='old'?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)));list.innerHTML=rows.length?rows.map(row=>`<article class="entry growth-edit-card" onclick="${row.source==='daily'?`openGrowthMilestone('${encodeURIComponent(row.date)}','${encodeURIComponent(row.blockTitle)}')`:`openLegacyJournalEditor('${row.id}')`}"><div class="meta">${esc(row.date)}</div><b>${esc(row.title||'成长瞬间')}</b><p class="growth-preview">${esc(row.content||'')}</p><div class="growth-pills">${(row.growthTags||[]).map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>${row.attachments?.length?'<div class="media-status">📎 媒体待导入</div>':''}</article>`).join(''):`<div class="entry"><span class="small">${growthDateFilter?'当天没有成长记录':'还没有成长记录。'}</span></div>`;}
Object.assign(window,{shiftGrowthDate,timelineDailyDiagnostic});
function eh(e){const action=e.dailyBlock?`<div class="entry-menu"><button onclick="openDailyBlockEditor('${encodeURIComponent(e.date)}','${encodeURIComponent(e.blockTitle)}')">编辑</button><button class="danger" onclick="confirmDeleteDailyBlock('${encodeURIComponent(e.date)}','${e.id}')">删除</button></div>`:e.legacy?`<div class="entry-menu"><button onclick="${e.recordType==='five_year_question'?`openFiveYearRecordEditor('${e.id}')`:`openLegacyJournalEditor('${e.id}')`}">编辑</button><button class="danger" onclick="deleteLegacyJournalFromTimeline('${e.id}')">删除</button></div>`:`<div class="entry-menu"><button onclick="editEntryById('${e.id}')">编辑</button><button class="danger" onclick="deleteEntryById('${e.id}')">删除</button></div>`;return `<article class="entry journal-timeline-card" onclick="if(event.target.closest('button'))return;${e.dailyBlock?`openDailyBlockEditor('${encodeURIComponent(e.date)}','${encodeURIComponent(e.blockTitle)}')`:e.legacy?(e.recordType==='five_year_question'?`openFiveYearRecordEditor('${e.id}')`:`openLegacyJournalEditor('${e.id}')`):`editEntryById('${e.id}')`}"><div class="meta">${esc(e.date)} · ${label(e.type)}</div><b>${esc(e.title||label(e.type))}</b><p>${esc(e.content)}</p>${action}</article>`}
function deleteLegacyJournalFromTimeline(id){const record=state.legacyJournalRecords.find(item=>item.id===id);if(!record)return;const labelText=record.recordType==='five_year_question'?'删除这一天的每日一问回答？题库不会删除。':record.recordType==='growth'?'删除这条独立成长记录？':'删除这条历史记录？';if(!confirm(labelText)||!confirm('请再次确认。'))return;deleteLegacyRecord(id);}
Object.assign(window,{openTodayDaily,confirmDeleteDailyBlock,deleteDailyBlock,cancelGrowthMilestone,deleteLegacyJournalFromEditor,deleteDailyQuestionRecord,setFiveYearToday,deleteLegacyJournalFromTimeline});

/* v0.18.1 final iPhone QA: Daily blocks are the only body source for linked Growth. */
let historicalBackfillType='daily',standaloneGrowthDraftDate='';
function canonicalDailyBlock(date,blockId,blockTitle){const blocks=state.dailyBlocks?.[date]||{},meta=state.dailyBlockMeta?.[date]||{};const title=blockId?Object.keys(blocks).find(name=>meta[name]?.blockId===blockId):blockTitle;return title===undefined?null:{date,title,text:String(blocks[title]||''),meta:meta[title]||{}};}
function linkedGrowthProjection(){return Object.entries(state.dailyBlockMeta||{}).flatMap(([date,blocks])=>Object.entries(blocks||{}).filter(([,meta])=>meta?.isMilestone).map(([blockTitle,meta])=>{const source=canonicalDailyBlock(date,meta.blockId,blockTitle);if(!source)return null;return {id:`daily-growth:${source.meta.blockId}`,sourceType:'daily_block',sourceDate:date,sourceBlockId:source.meta.blockId,date,recordType:'growth',title:source.title,blockTitle:source.title,content:source.text,growthTags:Array.isArray(source.meta.growthTags)?source.meta.growthTags:[],attachments:source.meta.attachments||[],updatedAt:source.meta.updatedAt||null,source:'daily'};}).filter(Boolean));}
function allGrowthRecords(){const legacy=state.legacyJournalRecords.filter(record=>record.recordType==='growth').map(record=>({...record,source:'legacy',sourceType:'legacy_growth'}));return [...legacy,...linkedGrowthProjection()];}
function canonicalDailyProjection(){return Object.entries(state.dailyBlocks||{}).flatMap(([date,blocks])=>Object.entries(blocks||{}).filter(([,text])=>String(text||'').trim()).map(([title,text])=>{const meta=ensureDailyBlockMeta(date,title);return {id:meta.blockId,sourceType:'daily_block',sourceDate:date,sourceBlockId:meta.blockId,date,blockTitle:title,title,content:String(text),type:meta.isMilestone?'growth':'daily',growthTags:meta.growthTags||[],dailyBlock:true,readOnly:true};}));}
function dailyBlockEntries(){return canonicalDailyProjection();}
function openGrowthMilestone(encodedDate,encodedBlock){const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=ensureDailyBlockMeta(date,block);growthMilestoneContext={date,block};qs('#growthMilestoneSource').textContent=`${date} · ${block}（正文始终来自 Daily 区块）`;qs('#growthMilestoneTitle').value=block;qs('#growthMilestoneTitle').readOnly=true;qs('#growthMilestoneDetails').value=meta.growthNote||'';qs('#growthMilestoneDetails').previousElementSibling.textContent='成长备注（可选）';qs('#growthMilestoneTags').outerHTML=`<div id="growthMilestoneTags" class="growth-tag-options">${growthTagOptions(meta.growthTags||[])}</div>`;modalController.open('growthMilestoneModal');}
function saveGrowthMilestone(){if(!growthMilestoneContext)return;const {date,block}=growthMilestoneContext,meta=ensureDailyBlockMeta(date,block);meta.isMilestone=true;meta.growthNote=qs('#growthMilestoneDetails').value.trim();meta.growthTags=[...document.querySelectorAll('#growthMilestoneTags input:checked')].map(input=>input.value);meta.updatedAt=Date.now();save();closeGrowthMilestone();journalRefresh();}
function toggleGrowthMilestone(encodedDate,encodedBlock,enabled){const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=ensureDailyBlockMeta(date,block);meta.isMilestone=!!enabled;if(!enabled){delete meta.growthNote;delete meta.growthTags;delete meta.attachments;save();journalRefresh();return;}meta.growthTags=Array.isArray(meta.growthTags)?meta.growthTags:[];meta.updatedAt=Date.now();save();renderTodayBlocks();openGrowthMilestone(encodedDate,encodedBlock);}
function growthToday(){return iso(new Date());}
if(!growthDateFilter)growthDateFilter=growthToday();
function setGrowthDateFilter(date){growthDateFilter=date||'';const input=qs('#growthDateFilter'),all=qs('#growthAllButton');if(input)input.value=growthDateFilter||growthToday();if(all)all.classList.toggle('on',!growthDateFilter);renderGrowthJournal();}
function setGrowthToday(){setGrowthDateFilter(growthToday());}
function shiftGrowthDate(delta){const current=growthDateFilter||growthToday(),date=new Date(`${current}T12:00:00`);date.setDate(date.getDate()+Number(delta||0));setGrowthDateFilter(iso(date));}
function renderGrowthJournal(){const list=qs('#growthList');if(!list)return;const search=(qs('#growthSearch')?.value||'').trim().toLowerCase(),tag=qs('#growthTagFilter')?.value||'all',sort=qs('#growthSort')?.value||'new';const input=qs('#growthDateFilter');if(input)input.value=growthDateFilter||growthToday();let rows=allGrowthRecords();const tags=[...new Set(rows.flatMap(row=>row.growthTags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN')),select=qs('#growthTagFilter');if(select)select.innerHTML=`<option value="all">全部标签</option>${tags.map(value=>`<option value="${esc(value)}" ${value===tag?'selected':''}>${esc(value)}</option>`).join('')}`;if(growthDateFilter)rows=rows.filter(row=>row.date===growthDateFilter);if(tag!=='all')rows=rows.filter(row=>(row.growthTags||[]).includes(tag));if(search)rows=rows.filter(row=>`${row.title||''} ${row.content||''}`.toLowerCase().includes(search));rows.sort((a,b)=>sort==='old'?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)));list.innerHTML=rows.length?rows.map(row=>`<article class="entry growth-edit-card" onclick="${row.sourceType==='daily_block'?`openDailyBlockEditor('${encodeURIComponent(row.sourceDate)}','${encodeURIComponent(row.blockTitle)}')`:`openLegacyJournalEditor('${row.id}')`}"><div class="meta">${esc(row.date)}</div><b>${esc(row.title||'成长瞬间')}</b><p class="growth-preview">${esc(row.content||'')}</p><div class="growth-pills">${(row.growthTags||[]).map(item=>`<span>${esc(item)}</span>`).join('')}</div>${row.attachments?.length?'<div class="media-status">📎 媒体待导入</div>':''}</article>`).join(''):`<div class="entry"><span class="small">${growthDateFilter?'当天没有成长记录':'还没有成长记录。'}</span></div>`;}
function growthCanonicalTrace(date,blockId){const source=canonicalDailyBlock(date,blockId);const projection=linkedGrowthProjection().find(row=>row.sourceDate===date&&row.sourceBlockId===blockId);return {canonicalDailyText:source?.text||null,storedGrowthSnapshotText:source?.meta?.growthDetails||null,renderedGrowthText:projection?.content||null};}
function closeDailyBlockEditor(){dailyBlockEditContext=null;modalController.pop('dailyBlockEditorModal');}
function closeDailyQuestion(){dailyQuestionEditId='';modalController.pop('dailyQuestionModal');}
function closeLegacyJournalEditor(){legacyJournalEditId='';standaloneGrowthDraftDate='';modalController.pop('legacyJournalEditorModal');}
function openStandaloneGrowthEditor(date){standaloneGrowthDraftDate=date;legacyJournalEditId='';qs('#legacyJournalEditorTitle').textContent='添加成长记录';qs('#legacyJournalDate').value=date;qs('#legacyJournalTitle').value='';qs('#legacyJournalContent').value='';qs('#legacyGrowthTagsSection').hidden=false;qs('#legacyGrowthTags').innerHTML=growthTagOptions([]);qs('#legacyJournalDeleteButton').hidden=true;modalController.open('legacyJournalEditorModal');}
function openStandaloneGrowthEditorForSelectedDate(){openStandaloneGrowthEditor(growthDateFilter||growthToday());}
function saveLegacyJournalEditor(){let record=state.legacyJournalRecords.find(item=>item.id===legacyJournalEditId);if(!record&&standaloneGrowthDraftDate){record={id:`growth-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,recordType:'growth',provenance:{sourceApp:'personal-life-hub',sourceEntryId:`standalone-growth:${Date.now()}`},createdAt:Date.now()};state.legacyJournalRecords.push(record);}if(!record)return;record.date=qs('#legacyJournalDate').value||record.date;record.title=qs('#legacyJournalTitle').value.trim();record.content=qs('#legacyJournalContent').value.trim();if(record.recordType==='growth')record.growthTags=[...document.querySelectorAll('#legacyGrowthTags input:checked')].map(input=>input.value);if(record.recordType==='five_year_question'){record.question=record.title;record.answer=record.content;}record.updatedAt=Date.now();save();closeLegacyJournalEditor();journalRefresh();}
function openHistoricalBackfill(){historicalBackfillType='daily';qs('#historicalBackfillDate').value=growthToday();renderHistoricalBackfill();modalController.open('historicalBackfillModal');}
function closeHistoricalBackfill(){modalController.pop('historicalBackfillModal');}
function setHistoricalBackfillType(type){historicalBackfillType=type;renderHistoricalBackfill();}
function renderHistoricalBackfill(){const wrap=qs('#historicalBackfillBlockWrap'),select=qs('#historicalBackfillBlock');if(wrap)wrap.hidden=historicalBackfillType!=='daily';if(select){const date=qs('#historicalBackfillDate')?.value||growthToday(),names=[...new Set(['我的一天','熹熹的一天',...state.customBlocks,...Object.keys(state.dailyBlocks?.[date]||{})])];select.innerHTML=names.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');}qsa('[data-backfill-type]').forEach(button=>button.classList.toggle('on',button.dataset.backfillType===historicalBackfillType));}
function continueHistoricalBackfill(){const date=qs('#historicalBackfillDate').value||growthToday();if(historicalBackfillType==='daily'){const name=qs('#historicalBackfillBlock').value||'我的一天';state.dailyBlocks[date]=state.dailyBlocks[date]||{};if(state.dailyBlocks[date][name]===undefined)state.dailyBlocks[date][name]='';const meta=ensureDailyBlockMeta(date,name);dailyBlockEditContext={date,name,blockId:meta.blockId};qs('#dailyBlockEditorTitle').textContent=`编辑：${name}`;qs('#dailyBlockEditorDate').textContent=date;qs('#dailyBlockEditorName').value=name;qs('#dailyBlockEditorContent').value=state.dailyBlocks[date][name];modalController.push('historicalBackfillModal','dailyBlockEditorModal',{date,type:'daily'});return;}if(historicalBackfillType==='question'){dailyQuestionEditId='';const questions=questionLibrary(),existing=state.legacyJournalRecords.find(record=>record.recordType==='five_year_question'&&record.date===date);qs('#dailyQuestionDate').value=date;qs('#dailyQuestionSelect').innerHTML=questions.map(question=>`<option value="${esc(question.id)}">${esc(question.text)}</option>`).join('')+'<option value="__custom__">自定义问题…</option>';if(existing){dailyQuestionEditId=existing.id;qs('#dailyQuestionAnswer').value=existing.answer||existing.content||'';const matched=questions.find(question=>question.text===(existing.question||existing.title||''));qs('#dailyQuestionSelect').value=matched?matched.id:'__custom__';qs('#dailyQuestionText').value=matched?'':(existing.question||existing.title||'');}else{qs('#dailyQuestionSelect').selectedIndex=0;qs('#dailyQuestionText').value='';qs('#dailyQuestionAnswer').value='';}syncDailyQuestionText();qs('#dailyQuestionDeleteButton').hidden=!dailyQuestionEditId;modalController.push('historicalBackfillModal','dailyQuestionModal',{date,type:'question'});return;}if(historicalBackfillType==='growth'){standaloneGrowthDraftDate=date;legacyJournalEditId='';qs('#legacyJournalEditorTitle').textContent='添加成长记录';qs('#legacyJournalDate').value=date;qs('#legacyJournalTitle').value='';qs('#legacyJournalContent').value='';qs('#legacyGrowthTagsSection').hidden=false;qs('#legacyGrowthTags').innerHTML=growthTagOptions([]);qs('#legacyJournalDeleteButton').hidden=true;modalController.push('historicalBackfillModal','legacyJournalEditorModal',{date,type:'growth'});return;}qs('#entryModal').dataset.editId='';qs('#edate').value=date;qs('#etype').value='event';qs('#etitle').value='';qs('#econtent').value='';modalController.push('historicalBackfillModal','entryModal',{date,type:'event'});}
function closeEntry(){modalController.pop('entryModal');}
Object.assign(window,{openHistoricalBackfill,closeHistoricalBackfill,setHistoricalBackfillType,continueHistoricalBackfill,setGrowthToday,openStandaloneGrowthEditorForSelectedDate,growthCanonicalTrace,shiftGrowthDate,setGrowthDateFilter,renderGrowthJournal,allGrowthRecords,openGrowthMilestone,saveGrowthMilestone,toggleGrowthMilestone,openDailyBlockEditor,closeDailyBlockEditor,closeDailyQuestion,closeLegacyJournalEditor,saveLegacyJournalEditor});
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js?v=0232canonicalslimmingqa1-20261005').catch(err=>console.warn('SW registration failed',err));
  });
}

/* v0.20.0: Daily-linked Growth has a live Daily summary and an independent extension detail. */
function linkedGrowthProjection(){return Object.entries(state.dailyBlockMeta||{}).flatMap(([date,blocks])=>Object.entries(blocks||{}).filter(([,meta])=>meta?.isMilestone).map(([blockTitle,meta])=>{const source=canonicalDailyBlock(date,meta.blockId,blockTitle);if(!source)return null;const legacyDetail=String(meta.growthDetails||'').trim();const summary=source.text;const growthDetail=String(meta.growthDetail||meta.growthNote||'').trim()||(legacyDetail&&legacyDetail!==summary?legacyDetail:'');return {id:`daily-growth:${source.meta.blockId}`,sourceType:'daily_block',sourceDate:date,sourceBlockId:source.meta.blockId,date,recordType:'growth',summary,detail:growthDetail,title:summary||source.title,content:summary,growthTags:Array.isArray(source.meta.growthTags)?source.meta.growthTags:[],attachments:source.meta.attachments||[],source:'daily'};}).filter(Boolean));}
function allGrowthRecords(){const standalone=state.legacyJournalRecords.filter(record=>record.recordType==='growth').map(record=>({...record,summary:record.title||record.content||'',detail:record.detail||record.content||'',source:'legacy',sourceType:'standalone_growth'}));return [...standalone,...linkedGrowthProjection()];}
function openGrowthMilestone(encodedDate,encodedBlock){const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=ensureDailyBlockMeta(date,block);growthMilestoneContext={date,block};qs('#growthMilestoneSource').textContent=`${date} · ${block}`;qs('#growthMilestoneTitle').value=state.dailyBlocks?.[date]?.[block]||'';qs('#growthMilestoneTitle').readOnly=true;qs('#growthMilestoneTitle').previousElementSibling.textContent='今日成长（来自熹熹的一天）';qs('#growthMilestoneDetails').value=meta.growthDetail||meta.growthNote||'';qs('#growthMilestoneDetails').previousElementSibling.textContent='详细记录（可选）';qs('#growthMilestoneTags').outerHTML=`<div id="growthMilestoneTags" class="growth-tag-options">${growthTagOptions(meta.growthTags||[])}</div>`;modalController.open('growthMilestoneModal');}
function saveGrowthMilestone(){if(!growthMilestoneContext)return;const {date,block}=growthMilestoneContext,meta=ensureDailyBlockMeta(date,block);meta.isMilestone=true;meta.growthDetail=qs('#growthMilestoneDetails').value.trim();delete meta.growthNote;meta.growthTags=[...document.querySelectorAll('#growthMilestoneTags input:checked')].map(input=>input.value);meta.updatedAt=Date.now();save();closeGrowthMilestone();journalRefresh();}
function toggleGrowthMilestone(encodedDate,encodedBlock,enabled){const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=ensureDailyBlockMeta(date,block);meta.isMilestone=!!enabled;if(!enabled){if(!confirm('将从成长日记中移除这条记录及其成长详情，熹熹的一天原始记录会保留。'))return;delete meta.growthDetail;delete meta.growthNote;delete meta.growthTags;delete meta.attachments;save();journalRefresh();return;}meta.growthTags=Array.isArray(meta.growthTags)?meta.growthTags:[];meta.updatedAt=Date.now();save();renderTodayBlocks();openGrowthMilestone(encodedDate,encodedBlock);}
function renderGrowthJournal(){const list=qs('#growthList');if(!list)return;const search=(qs('#growthSearch')?.value||'').trim().toLowerCase(),tag=qs('#growthTagFilter')?.value||'all',sort=qs('#growthSort')?.value||'new';const input=qs('#growthDateFilter');if(input)input.value=growthDateFilter||growthToday();let rows=allGrowthRecords();const tags=[...new Set(rows.flatMap(row=>row.growthTags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN')),select=qs('#growthTagFilter');if(select)select.innerHTML=`<option value="all">全部标签</option>${tags.map(value=>`<option value="${esc(value)}" ${value===tag?'selected':''}>${esc(value)}</option>`).join('')}`;if(growthDateFilter)rows=rows.filter(row=>row.date===growthDateFilter);if(tag!=='all')rows=rows.filter(row=>(row.growthTags||[]).includes(tag));if(search)rows=rows.filter(row=>`${row.summary||''} ${row.detail||''}`.toLowerCase().includes(search));rows.sort((a,b)=>sort==='old'?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)));list.innerHTML=rows.length?rows.map(row=>{const open=row.sourceType==='daily_block'?`openGrowthMilestone('${encodeURIComponent(row.sourceDate)}','${encodeURIComponent(row.blockTitle)}')`:`openLegacyJournalEditor('${row.id}')`;return `<article class="entry growth-edit-card" onclick="${open}"><div class="meta">${esc(row.date)}</div><b>${esc(row.summary||'成长瞬间')}</b>${row.detail?`<p class="growth-preview">${esc(row.detail)}</p>`:''}<div class="growth-pills">${(row.growthTags||[]).map(item=>`<span>${esc(item)}</span>`).join('')}</div>${row.attachments?.length?'<div class="media-status">📎 附件已关联</div>':''}</article>`;}).join(''):`<div class="entry"><span class="small">${growthDateFilter?'当天没有成长记录':'还没有成长记录。'}</span></div>`;}
function growthRange(range){const today=growthToday(),d=new Date(`${today}T12:00:00`),day=d.getDay()||7,start=iso(new Date(d.getFullYear(),d.getMonth(),d.getDate()-day+1)),end=iso(new Date(d.getFullYear(),d.getMonth(),d.getDate()+7-day));if(range==='lastWeek'){const s=new Date(`${start}T12:00:00`);s.setDate(s.getDate()-7);const e=new Date(`${end}T12:00:00`);e.setDate(e.getDate()-7);return {start:iso(s),end:iso(e)};}if(range==='thisMonth')return {start:`${today.slice(0,7)}-01`,end:iso(new Date(d.getFullYear(),d.getMonth()+1,0))};if(range==='lastMonth'){const x=new Date(d.getFullYear(),d.getMonth()-1,1);return {start:iso(x),end:iso(new Date(d.getFullYear(),d.getMonth(),0))};}return {start,end};}
function exportGrowthRows(start,end){return allGrowthRecords().filter(row=>row.date>=start&&row.date<=end).sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(row=>({date:row.date,sourceType:row.sourceType==='daily_block'?'daily-linked-growth':'standalone-growth',summary:row.summary||'',detail:row.detail||'',tags:row.growthTags||[],attachmentCount:(row.attachments||[]).length}));}
function growthMarkdown(rows,start,end){return `# 熹熹成长日记\n\n时间范围：${start} ～ ${end}\n\n`+rows.map(row=>`## ${row.date}\n\n### 今日成长\n${row.summary}\n${row.detail?`\n### 详细记录\n${row.detail}\n`:''}${row.tags.length?`\n标签：${row.tags.join('、')}\n`:''}${row.attachmentCount?`\n附件：${row.attachmentCount} 项\n`:''}\n---\n`).join('');}
function openGrowthExport(){const range=growthRange('thisWeek');qs('#growthExportRange').value='thisWeek';qs('#growthExportStart').value=range.start;qs('#growthExportEnd').value=range.end;previewGrowthExport();modalController.open('growthExportModal');}
function updateGrowthExportRange(){const range=qs('#growthExportRange').value;if(range!=='custom'){const dates=growthRange(range);qs('#growthExportStart').value=dates.start;qs('#growthExportEnd').value=dates.end;}qs('#growthExportCustom').hidden=qs('#growthExportRange').value!=='custom';previewGrowthExport();}
function previewGrowthExport(){const start=qs('#growthExportStart').value,end=qs('#growthExportEnd').value,rows=start&&end?exportGrowthRows(start,end):[];qs('#growthExportPreview').textContent=rows.length?`${start} ～ ${end} · ${new Set(rows.map(row=>row.date)).size} 天 · ${rows.length} 条成长记录`:'所选时间范围内没有成长记录。';return {start,end,rows};}
function downloadGrowthExport(kind){const {start,end,rows}=previewGrowthExport();if(!rows.length){alert('所选时间范围内没有成长记录。');return;}const value=kind==='json'?JSON.stringify({exportType:'growth-journal',exportVersion:1,startDate:start,endDate:end,exportedAt:new Date().toISOString(),records:rows},null,2):growthMarkdown(rows,start,end);const blob=new Blob([value],{type:kind==='json'?'application/json':'text/markdown;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`growth-journal-${start}-${end}.${kind==='json'?'json':'md'}`;a.click();URL.revokeObjectURL(a.href);}
async function copyGrowthExport(){const {start,end,rows}=previewGrowthExport();if(!rows.length){alert('所选时间范围内没有成长记录。');return;}try{await navigator.clipboard.writeText(growthMarkdown(rows,start,end));alert('已复制成长记录文本。');}catch(_){alert('复制失败，请使用导出 Markdown。');}}
function closeGrowthExport(){modalController.pop('growthExportModal');}
Object.assign(window,{renderGrowthJournal,allGrowthRecords,openGrowthMilestone,saveGrowthMilestone,toggleGrowthMilestone,openGrowthExport,updateGrowthExportRange,previewGrowthExport,downloadGrowthExport,copyGrowthExport,closeGrowthExport,exportGrowthRows});
setTimeout(()=>{const page=qs('#growthJournal'),top=page?.querySelector('.top');if(top&&!top.querySelector('[data-growth-export]')){const button=document.createElement('button');button.type='button';button.className='ghost';button.dataset.growthExport='true';button.textContent='导出';button.onclick=openGrowthExport;top.append(button);}},0);
function ensureForwardingPreShipmentUI(value='not_received_warehouse'){const inherited=qs('#orderForwardInherited');if(!inherited||qs('#orderPreShipmentStage'))return;const field=document.createElement('div');field.className='form-field';field.id='orderPreShipmentField';field.innerHTML='<label>仓库处理状态</label><select id="orderPreShipmentStage"><option value="not_received_warehouse">未入库</option><option value="received_warehouse">已入库</option><option value="waiting_pack">待打包</option><option value="waiting_payment">待支付</option><option value="waiting_dispatch">待发货</option></select><p class="small">订单在批次接管运输前，保留各自的仓库处理状态。</p>';inherited.after(field);qs('#orderPreShipmentStage').value=value;qs('#orderPreShipmentStage').onchange=()=>{const stage=qs('#orderPreShipmentStage').value,transport=qs('#orderForwardStage'),labels={not_received_warehouse:'未入库',received_warehouse:'已入库',waiting_pack:'待打包',waiting_payment:'待支付',waiting_dispatch:'待发货'};if(transport&&!transport.querySelector(`option[value="${stage}"]`))transport.insertAdjacentHTML('afterbegin',`<option value="${stage}">${labels[stage]}</option>`);if(transport)transport.value=stage;};}
const v0190OpenOrderEditor=window.openOrderEditor;window.openOrderEditor=function(id=''){v0190OpenOrderEditor(id);const order=state.orders?.items?.find(item=>item.id===id),stage=order?.forwarding?.preForwardingStage||order?.forwarding?.currentStage||'not_received_warehouse';qs('#orderModal').dataset.v0190OrderId=id||'';ensureForwardingPreShipmentUI(stage);qs('#orderPreShipmentStage').value=['not_received_warehouse','received_warehouse','waiting_pack','waiting_payment','waiting_dispatch'].includes(stage)?stage:'not_received_warehouse';};
const v0190SaveOrder=window.saveOrder;window.saveOrder=async function(){const pre=qs('#orderPreShipmentStage')?.value||'',id=qs('#orderModal').dataset.v0190OrderId||'',before=new Set((state.orders?.items||[]).map(item=>item.id));await v0190SaveOrder();if(!pre)return;const order=id?(state.orders?.items||[]).find(item=>item.id===id):(state.orders?.items||[]).find(item=>!before.has(item.id));if(order?.fulfillmentType==='forwarding'){order.forwarding=order.forwarding||{};order.forwarding.preForwardingStage=pre;save();window.renderOrders?.();}};
function ensureBatchHandoffUI(value=true){const stage=qs('#batchStage');if(!stage||qs('#batchHandoffActive'))return;const field=document.createElement('label');field.id='batchHandoffField';field.innerHTML='<input id="batchHandoffActive" type="checkbox" style="width:auto"> 此批次已接管运输状态';stage.closest('.modal-body').insertBefore(field,stage.closest('label'));qs('#batchHandoffActive').checked=value!==false;}
const v0190OpenBatchEditor=window.openBatchEditor;window.openBatchEditor=function(id=''){v0190OpenBatchEditor(id);const batch=state.orders?.forwardingBatches?.find(item=>item.id===id);qs('#batchModal').dataset.v0190BatchId=id||'';ensureBatchHandoffUI(batch?.handoffActive!==false);qs('#batchHandoffActive').checked=batch?.handoffActive!==false;};
const v0190SaveBatch=window.saveBatch;window.saveBatch=function(){const handoff=!!qs('#batchHandoffActive')?.checked,id=qs('#batchModal').dataset.v0190BatchId||'',before=new Set((state.orders?.forwardingBatches||[]).map(item=>item.id));v0190SaveBatch();const batch=id?(state.orders?.forwardingBatches||[]).find(item=>item.id===id):(state.orders?.forwardingBatches||[]).find(item=>!before.has(item.id));if(batch){batch.handoffActive=handoff;save();window.renderOrders?.();}};
Object.assign(window,{openOrderEditor:window.openOrderEditor,saveOrder:window.saveOrder,openBatchEditor:window.openBatchEditor,saveBatch:window.saveBatch});
setTimeout(()=>{const filter=qs('#orderStatusFilter'),stages=[['not_received_warehouse','未入库'],['received_warehouse','已入库'],['waiting_pack','待打包'],['waiting_payment','待支付'],['waiting_dispatch','待发货'],['arrived_destination_hub','到达总仓'],['destination_hub_processing','总仓处理中']];if(filter)stages.forEach(([value,text])=>{if(!filter.querySelector(`option[value="${value}"]`)){const option=document.createElement('option');option.value=value;option.textContent=text;filter.append(option);}});},0);

/* v0.20.0 Final iPhone QA: one resolver and one relationship lifecycle for Growth. */
function resolveGrowthRecord(identity){
  const value=typeof identity==='string'?{id:identity}:identity||{};
  const id=value.id||'';
  const blockId=value.sourceBlockId||(id.startsWith('daily-growth:')?id.slice('daily-growth:'.length):'');
  if(value.kind==='daily-linked'||value.sourceType==='daily_block'||blockId){
    let date=value.sourceDate||value.date||'',title=value.blockTitle||'';
    // List-card identity intentionally contains the durable block id. On a later
    // tap, recover its date/title from canonical Daily metadata instead of
    // assuming a display-date attribute was carried by the card.
    if(blockId&&!date){for(const [candidateDate,blocks] of Object.entries(state.dailyBlockMeta||{})){const candidateTitle=Object.keys(blocks||{}).find(name=>blocks[name]?.blockId===blockId);if(candidateTitle!==undefined){date=candidateDate;title=title||candidateTitle;break;}}}
    const source=canonicalDailyBlock(date,blockId,title);
    if(!source||!source.meta?.isMilestone)return null;
    return {kind:'daily-linked',id:`daily-growth:${source.meta.blockId}`,recordId:'',relationshipId:source.meta.blockId,date:source.date,summary:source.text,detail:String(source.meta.growthDetail||'').trim(),tags:Array.isArray(source.meta.growthTags)?source.meta.growthTags:[],attachments:source.meta.attachments||[],sourceType:'daily_block',sourceDate:source.date,sourceBlockId:source.meta.blockId,blockTitle:source.title};
  }
  const record=state.legacyJournalRecords?.find(item=>item.id===id||item.id===value.recordId);
  if(!record||record.recordType!=='growth')return null;
  const standalone=record.provenance?.sourceApp==='personal-life-hub';
  return {kind:standalone?'standalone':'legacy',id:record.id,recordId:record.id,relationshipId:'',date:record.date||'',summary:record.title||record.content||'',detail:record.detail||record.content||'',tags:Array.isArray(record.growthTags)?record.growthTags:[],attachments:record.attachments||[],sourceType:standalone?'standalone_growth':'legacy_growth',sourceDate:'',sourceBlockId:'',blockTitle:''};
}
function linkedGrowthProjection(){return Object.entries(state.dailyBlockMeta||{}).flatMap(([date,blocks])=>Object.entries(blocks||{}).map(([blockTitle,meta])=>resolveGrowthRecord({kind:'daily-linked',sourceDate:date,sourceBlockId:meta?.blockId,blockTitle})).filter(Boolean));}
function allGrowthRecords(){return [...(state.legacyJournalRecords||[]).filter(record=>record.recordType==='growth').map(record=>resolveGrowthRecord({id:record.id})).filter(Boolean),...linkedGrowthProjection()];}
function growthCardOpen(id){const row=resolveGrowthRecord(id);if(!row)return;if(row.kind==='daily-linked')openGrowthMilestone(encodeURIComponent(row.sourceDate),encodeURIComponent(row.blockTitle));else openLegacyJournalEditor(row.recordId);}
function openGrowthMilestone(encodedDate,encodedBlock){
  const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=ensureDailyBlockMeta(date,block);
  growthMilestoneContext={date,block,blockId:meta.blockId};
  const row=resolveGrowthRecord({kind:'daily-linked',sourceDate:date,sourceBlockId:meta.blockId,blockTitle:block});
  qs('#growthMilestoneSource').textContent=`${date} · ${block}`;
  const title=qs('#growthMilestoneTitle'),details=qs('#growthMilestoneDetails');
  title.previousElementSibling.textContent='今日成长（同步到 Daily 区块）';title.readOnly=false;title.value=row?.summary||state.dailyBlocks?.[date]?.[block]||'';
  details.previousElementSibling.textContent='详细记录（可选）';details.placeholder='';details.value=row?.detail||'';
  qs('#growthMilestoneTags').outerHTML=`<div id="growthMilestoneTags" class="growth-tag-options">${growthTagOptions(row?.tags||[])}</div>`;
  const remove=qs('#growthMilestoneModal .btn.danger');if(remove)remove.textContent='从成长日记移除';
  modalController.open('growthMilestoneModal');
}
function saveGrowthMilestone(){
  if(!growthMilestoneContext)return;
  const {date,block}=growthMilestoneContext,meta=ensureDailyBlockMeta(date,block);
  state.dailyBlocks[date]=state.dailyBlocks[date]||{};
  state.dailyBlocks[date][block]=qs('#growthMilestoneTitle').value;
  meta.isMilestone=true;meta.growthDetail=qs('#growthMilestoneDetails').value.trim();delete meta.growthNote;delete meta.growthDetails;
  meta.growthTags=[...document.querySelectorAll('#growthMilestoneTags input:checked')].map(input=>input.value);meta.updatedAt=Date.now();
  save();closeGrowthMilestone();journalRefresh();
}
function toggleGrowthMilestone(encodedDate,encodedBlock,enabled){
  const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=ensureDailyBlockMeta(date,block);
  if(!enabled){
    if(!confirm('将从成长日记中移除这条记录及其成长详情和成长标签，但不会删除原始 Daily 区块。'))return;
    delete meta.isMilestone;delete meta.growthDetail;delete meta.growthNote;delete meta.growthDetails;delete meta.growthTags;delete meta.attachments;delete meta.growthTitle;meta.updatedAt=Date.now();
    save();if(modalController.isOpen('growthMilestoneModal'))closeGrowthMilestone();journalRefresh();return;
  }
  meta.isMilestone=true;meta.growthTags=Array.isArray(meta.growthTags)?meta.growthTags:[];meta.updatedAt=Date.now();save();renderTodayBlocks();openGrowthMilestone(encodedDate,encodedBlock);
}
function cancelGrowthMilestone(){if(!growthMilestoneContext)return;const {date,block}=growthMilestoneContext;toggleGrowthMilestone(encodeURIComponent(date),encodeURIComponent(block),false);}
function renderTodayBlocks(){const key=todayKey();state.dailyBlocks[key]=state.dailyBlocks[key]||{};state.dailyBlockMeta[key]=state.dailyBlockMeta[key]||{};const names=[...new Set(['我的一天',...state.customBlocks,...Object.keys(state.dailyBlocks[key])])];qs('#todayBlocks').innerHTML=names.map(name=>{const meta=ensureDailyBlockMeta(key,name);const growth=name==='熹熹的一天'?`<div class="block-actions growth-block-actions">${meta.isMilestone?`<button type="button" onclick="openGrowthMilestone('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">查看成长详情</button><button type="button" class="ghost" onclick="toggleGrowthMilestone('${encodeURIComponent(key)}','${encodeURIComponent(name)}',false)">从成长日记移除</button>`:`<button type="button" onclick="toggleGrowthMilestone('${encodeURIComponent(key)}','${encodeURIComponent(name)}',true)">添加到成长日记</button>`}</div>`:'';return `<article class="daily-block"><div class="daily-block-head"><h3>${esc(name)}</h3><div class="block-actions"><button onclick="openDailyBlockEditor('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">编辑</button><button class="danger" onclick="confirmDeleteDailyBlock('${encodeURIComponent(key)}','${meta.blockId}')">删除</button></div></div><button class="daily-block-content" type="button" onclick="openDailyBlockEditor('${encodeURIComponent(key)}','${encodeURIComponent(name)}')">${esc(state.dailyBlocks[key][name]||'写一点今天的内容…')}</button>${growth}</article>`;}).join('');}
function renderGrowthJournal(){const list=qs('#growthList');if(!list)return;const search=(qs('#growthSearch')?.value||'').trim().toLowerCase(),tag=qs('#growthTagFilter')?.value||'all',sort=qs('#growthSort')?.value||'new';const input=qs('#growthDateFilter');if(input)input.value=growthDateFilter||growthToday();let rows=allGrowthRecords();const tags=[...new Set(rows.flatMap(row=>row.tags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN')),select=qs('#growthTagFilter');if(select)select.innerHTML=`<option value="all">全部标签</option>${tags.map(value=>`<option value="${esc(value)}" ${value===tag?'selected':''}>${esc(value)}</option>`).join('')}`;if(growthDateFilter)rows=rows.filter(row=>row.date===growthDateFilter);if(tag!=='all')rows=rows.filter(row=>row.tags.includes(tag));if(search)rows=rows.filter(row=>`${row.summary} ${row.detail}`.toLowerCase().includes(search));rows.sort((a,b)=>sort==='old'?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)));list.innerHTML=rows.length?rows.map(row=>`<article class="entry growth-edit-card" onclick="growthCardOpen('${esc(row.id)}')"><div class="meta">${esc(row.date)}</div><b>${esc(row.summary||'成长瞬间')}</b>${row.detail?`<p class="growth-preview">${esc(row.detail)}</p>`:''}<div class="growth-pills">${row.tags.map(item=>`<span>${esc(item)}</span>`).join('')}</div>${row.attachments.length?'<div class="media-status">📎 附件已关联</div>':''}</article>`).join(''):`<div class="entry"><span class="small">${growthDateFilter?'当天没有成长记录':'还没有成长记录。'}</span></div>`;}
function growthCanonicalTrace(date,blockId){const row=resolveGrowthRecord({kind:'daily-linked',sourceDate:date,sourceBlockId:blockId});return {canonicalDailyText:row?.summary||null,storedGrowthDetail:row?.detail||null,renderedGrowthText:row?.summary||null,identity:row?.id||null};}
Object.assign(window,{resolveGrowthRecord,linkedGrowthProjection,allGrowthRecords,growthCardOpen,openGrowthMilestone,saveGrowthMilestone,toggleGrowthMilestone,cancelGrowthMilestone,renderTodayBlocks,renderGrowthJournal,growthCanonicalTrace});

/* v0.20.0 Final iPhone QA: simple forwarding ownership boundary. */
function v0190FinalForwardingUI(){
  const type=qs('#orderFulfillment')?.value;if(type!=='forwarding')return;
  const batch=qs('#orderBatch')?.value||'';const oldOverride=qs('#orderForwardOverride');if(oldOverride)oldOverride.closest('label').hidden=true;
  const oldFields=qs('#orderForwardOverrideFields');if(oldFields)oldFields.hidden=true;
  let pre=qs('#orderPreShipmentField'),independent=qs('#orderIndependentStatusField');
  if(!pre){pre=document.createElement('div');pre.className='form-field';pre.id='orderPreShipmentField';pre.innerHTML='<label>仓库状态</label><select id="orderPreShipmentStage"><option value="ordered">已下单</option><option value="not_received_warehouse">未入库</option><option value="received_warehouse">已入库</option></select>';qs('#orderForwardInherited')?.after(pre);}
  if(!independent){independent=document.createElement('div');independent.className='form-field';independent.id='orderIndependentStatusField';independent.innerHTML='<label>订单独立状态</label><select id="orderIndependentStatus"></select><p class="small">仅在此订单实际进度与批次不一致时使用。</p>';qs('#orderForwardInherited')?.after(independent);}
  const orderId=qs('#orderModal')?.dataset.v0190FinalOrderId||'',order=state.orders?.items?.find(item=>item.id===orderId),f=order?.forwarding||{};
  qs('#orderPreShipmentStage').value=['ordered','not_received_warehouse','received_warehouse'].includes(f.preForwardingStage)?f.preForwardingStage:'ordered';
  const batchModel=state.orders?.forwardingBatches?.find(item=>item.id===batch),stages=batchModel?.routeStages||[...qs('#orderForwardStage')?.options||[]].map(option=>option.value),primary=batchModel?.serviceType||'sea';
  qs('#orderIndependentStatus').innerHTML='<option value="">无</option>'+stages.map(stage=>`<option value="${esc(stage)}">${esc(window.JournalModules?stage:(stage))}</option>`).join('');
  [...qs('#orderIndependentStatus').options].forEach(option=>{const names={received_warehouse:'已入库',waiting_pack:'待打包',waiting_payment:'待支付',waiting_dispatch:'待发货',waiting_departure:primary==='air'?'待起飞':'待开船',departed:primary==='air'?'已起飞':'已开船',arrived_airport:'已到机场',arrived_port:'已到港',rail_transit:'铁路运输中',truck_transit:'卡车运输中',local_transit:'本地运输中',arrived_destination_hub:'到达总仓',destination_hub_processing:'总仓处理中',waiting_pickup_point:'等待送往取货点',at_pickup_point:'已到取货点',picked_up:'已取'};if(option.value)option.textContent=names[option.value]||option.value;});
  qs('#orderIndependentStatus').value=f.independentStatus||'';pre.hidden=!!batch;independent.hidden=!batch;
  const inherited=qs('#orderForwardInherited');if(inherited)inherited.textContent=batch?(batchModel?`${batchModel.name} · 当前批次状态：${qs('#orderIndependentStatus option:checked')?.textContent==='无'?(batchModel.currentStage||'已入库'):'已使用订单独立状态'}`:'已关联批次'):'未关联批次：请选择订单当前仓库状态。';
}
const v0190FinalOpenOrder=window.openOrderEditor;window.openOrderEditor=function(id=''){v0190FinalOpenOrder(id);qs('#orderModal').dataset.v0190FinalOrderId=id||'';v0190FinalForwardingUI();};
const v0190FinalBatchChanged=window.orderBatchChanged;window.orderBatchChanged=function(){v0190FinalBatchChanged();setTimeout(v0190FinalForwardingUI,0);};
const v0190FinalToggleFulfillment=window.toggleOrderFulfillment;window.toggleOrderFulfillment=function(){v0190FinalToggleFulfillment();setTimeout(v0190FinalForwardingUI,0);};
const v0190FinalSaveOrder=window.saveOrder;window.saveOrder=async function(){const id=qs('#orderModal')?.dataset.v0190FinalOrderId||'',previous=state.orders?.items?.find(item=>item.id===id),previousForward=JSON.parse(JSON.stringify(previous?.forwarding||{})),pre=qs('#orderPreShipmentStage')?.value||previousForward.preForwardingStage||'ordered',independent=qs('#orderIndependentStatus')?.value||'',batchId=qs('#orderBatch')?.value||'',before=new Set((state.orders?.items||[]).map(item=>item.id));const initialResult=await v0190FinalSaveOrder();if(initialResult?.ok===false)return initialResult;const order=id?(state.orders?.items||[]).find(item=>item.id===id):(state.orders?.items||[]).find(item=>!before.has(item.id));if(!order?.forwarding)return initialResult;const f=order.forwarding;f.overrideEnabled=false;f.independentStatus=batchId?independent:'';if(batchId){const entering=!previousForward.batchId||previousForward.batchId!==batchId;const previousStage=previousForward.preForwardingStage||pre;if(entering&&['','ordered','not_received_warehouse'].includes(previousStage))f.preForwardingStage='received_warehouse';else f.preForwardingStage=previousStage||'received_warehouse';}else{f.preForwardingStage=previousForward.preForwardingStage||pre||'ordered';}const finalResult=save();if(finalResult.ok)window.renderOrders?.();return finalResult;};
const v0200OrdersTraceSaveOrder=window.saveOrder;window.saveOrder=async function(...args){const draft={source:'global saveOrder',editorOrderId:qs('#orderModal')?.dataset.v0190FinalOrderId||'',seller:qs('#orderSeller')?.value||'',fulfillmentType:qs('#orderFulfillment')?.value||'',status:qs('#orderStatus')?.value||'',items:[...document.querySelectorAll('#orderItems [data-order-item]')].map(row=>({id:row.dataset.itemId||'',name:row.querySelector('.oi-name')?.value||'',quantity:row.querySelector('.oi-qty')?.value||''})),notes:qs('#orderNotes')?.value||''};ordersSaveDiagnostics.begin(draft);ordersPersistenceDiagnostics.begin(draft);try{const result=await v0200OrdersTraceSaveOrder(...args);ordersSaveDiagnostics.finish();return result;}catch(error){ordersSaveDiagnostics.record('save_handler_error',{error:String(error?.message||error)});ordersPersistenceDiagnostics.recordFailure('saveOrder wrapper',error);ordersSaveDiagnostics.finish();throw error;}};
const v0190FinalOpenBatch=window.openBatchEditor;window.openBatchEditor=function(id=''){v0190FinalOpenBatch(id);const handoff=qs('#batchHandoffField');if(handoff)handoff.hidden=true;};
Object.assign(window,{openOrderEditor:window.openOrderEditor,orderBatchChanged:window.orderBatchChanged,toggleOrderFulfillment:window.toggleOrderFulfillment,saveOrder:window.saveOrder,openBatchEditor:window.openBatchEditor});

/* v0.20.0 Growth CRUD parity: one Detail shell for every Growth kind. */
function openGrowthDetail(identity){
  const row=resolveGrowthRecord(identity);if(!row)return;
  growthMilestoneContext={kind:row.kind,recordId:row.recordId,date:row.sourceDate||row.date,block:row.blockTitle,blockId:row.sourceBlockId,identity:row.id};
  qs('#growthMilestoneSource').textContent=row.kind==='daily-linked'?`${row.date} · ${row.blockTitle||'Daily 区块'}`:`${row.date}${row.kind==='legacy'?' · 历史成长记录':' · 独立成长记录'}`;
  const title=qs('#growthMilestoneTitle'),details=qs('#growthMilestoneDetails');
  title.previousElementSibling.textContent=row.kind==='daily-linked'?'今日成长（同步到 Daily 区块）':'今日成长';title.readOnly=false;title.value=row.summary||'';
  details.previousElementSibling.textContent='详细记录（可选）';details.placeholder='';details.value=row.detail||'';
  qs('#growthMilestoneTags').outerHTML=`<div id="growthMilestoneTags" class="growth-tag-options">${growthTagOptions(row.tags||[])}</div>`;
  const remove=qs('#growthMilestoneModal .btn.danger');if(remove)remove.textContent=row.kind==='daily-linked'?'从成长日记移除':'删除成长记录';
  modalController.open('growthMilestoneModal');
}
function openGrowthMilestone(encodedDate,encodedBlock){
  const date=decodeURIComponent(encodedDate),block=decodeURIComponent(encodedBlock),meta=ensureDailyBlockMeta(date,block);
  openGrowthDetail({kind:'daily-linked',sourceDate:date,sourceBlockId:meta.blockId,blockTitle:block});
}
function growthCardOpen(identity){openGrowthDetail(identity);}
function saveGrowthMilestone(){
  if(!growthMilestoneContext)return;const context=growthMilestoneContext,summary=qs('#growthMilestoneTitle').value,detail=qs('#growthMilestoneDetails').value.trim(),tags=[...document.querySelectorAll('#growthMilestoneTags input:checked')].map(input=>input.value);
  if(context.kind==='daily-linked'){
    const meta=ensureDailyBlockMeta(context.date,context.block);state.dailyBlocks[context.date]=state.dailyBlocks[context.date]||{};state.dailyBlocks[context.date][context.block]=summary;meta.isMilestone=true;meta.growthDetail=detail;delete meta.growthNote;delete meta.growthDetails;meta.growthTags=tags;meta.updatedAt=Date.now();
  }else{
    const record=state.legacyJournalRecords?.find(item=>item.id===context.recordId);if(!record)return;record.title=summary;record.content=detail;record.detail=detail;record.growthTags=tags;record.updatedAt=Date.now();
  }
  save();closeGrowthMilestone();journalRefresh();
}
function cancelGrowthMilestone(){
  if(!growthMilestoneContext)return;const context=growthMilestoneContext;
  if(context.kind==='daily-linked'){
    if(!confirm('将从成长日记移除这条记录及其成长详情和成长标签，但不会删除“熹熹的一天”原始记录。'))return;
    const meta=ensureDailyBlockMeta(context.date,context.block);delete meta.isMilestone;delete meta.growthDetail;delete meta.growthNote;delete meta.growthDetails;delete meta.growthTags;delete meta.attachments;delete meta.growthTitle;meta.updatedAt=Date.now();save();closeGrowthMilestone();journalRefresh();return;
  }
  const record=state.legacyJournalRecords?.find(item=>item.id===context.recordId);if(!record||!confirm('删除这条独立成长记录？此操作不会影响任何 Daily 区块。'))return;
  const provenance=record.provenance;if(provenance?.sourceApp===fiveYearJournal.SOURCE_APP)state.legacyImportTombstones[fiveYearJournal.sourceKey(provenance.sourceEntryId)]={sourceApp:provenance.sourceApp,sourceEntryId:provenance.sourceEntryId,userDeleted:true,deletedAt:Date.now()};
  state.legacyJournalRecords=state.legacyJournalRecords.filter(item=>item.id!==record.id);save();closeGrowthMilestone();journalRefresh();
}
function renderGrowthJournal(){
  const list=qs('#growthList');if(!list)return;const priorScroll=list.scrollTop,search=(qs('#growthSearch')?.value||'').trim().toLowerCase(),tag=qs('#growthTagFilter')?.value||'all',sort=qs('#growthSort')?.value||'new';const input=qs('#growthDateFilter');if(input)input.value=growthDateFilter||growthToday();let rows=allGrowthRecords();const tags=[...new Set(rows.flatMap(row=>row.tags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN')),select=qs('#growthTagFilter');if(select)select.innerHTML=`<option value="all">全部标签</option>${tags.map(value=>`<option value="${esc(value)}" ${value===tag?'selected':''}>${esc(value)}</option>`).join('')}`;if(growthDateFilter)rows=rows.filter(row=>row.date===growthDateFilter);if(tag!=='all')rows=rows.filter(row=>row.tags.includes(tag));if(search)rows=rows.filter(row=>`${row.summary} ${row.detail}`.toLowerCase().includes(search));rows.sort((a,b)=>sort==='old'?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)));
  list.innerHTML=rows.length?rows.map(row=>`<article class="entry growth-edit-card" data-growth-id="${esc(row.id)}" role="button" tabindex="0" aria-label="编辑 ${esc(row.summary||'成长记录')}"><div class="meta">${esc(row.date)}</div><b>${esc(row.summary||'成长瞬间')}</b>${row.detail?`<p class="growth-preview">${esc(row.detail)}</p>`:''}<div class="growth-pills">${row.tags.map(item=>`<span>${esc(item)}</span>`).join('')}</div>${row.attachments.length?'<div class="media-status">📎 附件已关联</div>':''}<span class="growth-card-chevron" aria-hidden="true">›</span></article>`).join(''):`<div class="entry"><span class="small">${growthDateFilter?'当天没有成长记录':'还没有成长记录。'}</span></div>`;
  list.querySelectorAll('[data-growth-id]').forEach(card=>{const open=()=>openGrowthDetail(card.dataset.growthId);card.addEventListener('click',open);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});});list.scrollTop=priorScroll;
}
Object.assign(window,{openGrowthDetail,openGrowthMilestone,growthCardOpen,saveGrowthMilestone,cancelGrowthMilestone,renderGrowthJournal});

/* v0.20.0 Growth Card Final: one persistent delegated tap path for every card. */
const growthCardNavigationTrace=window.__growthCardNavigationTrace||[];
function traceGrowthCardNavigation(step,detail={}){growthCardNavigationTrace.push({at:new Date().toISOString(),step,...detail});if(growthCardNavigationTrace.length>80)growthCardNavigationTrace.splice(0,growthCardNavigationTrace.length-80);window.__growthCardNavigationTrace=growthCardNavigationTrace;}
function bindGrowthCardNavigation(){
  const list=qs('#growthList');if(!list||list.dataset.growthCardDelegation==='bound')return;
  list.dataset.growthCardDelegation='bound';
  list.addEventListener('click',event=>{
    const target=event.target?.nodeType===1?event.target:event.target?.parentElement;
    const card=target?.closest?.('[data-growth-card]');
    if(!card||!list.contains(card)){traceGrowthCardNavigation('tap_ignored',{target:target?.tagName||'unknown'});return;}
    const identity=card.dataset.growthId||'';traceGrowthCardNavigation('card_tapped',{identity,kind:card.dataset.growthKind||'',target:target?.tagName||'unknown'});
    if(!identity){traceGrowthCardNavigation('identity_missing',{kind:card.dataset.growthKind||''});return;}
    const record=resolveGrowthRecord(identity);if(!record){traceGrowthCardNavigation('resolver_missing',{identity});return;}
    traceGrowthCardNavigation('resolver_ok',{identity,kind:record.kind});openGrowthDetail(identity);traceGrowthCardNavigation('detail_open_requested',{identity,modalOpen:modalController.isOpen('growthMilestoneModal')});
  },true);
  traceGrowthCardNavigation('delegation_bound');
}
function openGrowthDetail(identity){
  const row=resolveGrowthRecord(identity);if(!row){traceGrowthCardNavigation('detail_open_failed',{identity:String(identity||'')});return;}
  traceGrowthCardNavigation('detail_opened',{identity:row.id,kind:row.kind});
  growthMilestoneContext={kind:row.kind,recordId:row.recordId,date:row.sourceDate||row.date,block:row.blockTitle,blockId:row.sourceBlockId,identity:row.id};
  qs('#growthMilestoneSource').textContent=row.kind==='daily-linked'?`${row.date} · ${row.blockTitle||'Daily 区块'}`:`${row.date}${row.kind==='legacy'?' · 历史成长记录':' · 独立成长记录'}`;
  const title=qs('#growthMilestoneTitle'),details=qs('#growthMilestoneDetails');
  title.previousElementSibling.textContent=row.kind==='daily-linked'?'今日成长（同步到 Daily 区块）':'今日成长';title.readOnly=false;title.value=row.summary||'';
  details.previousElementSibling.textContent='详细记录（可选）';details.placeholder='';details.value=row.detail||'';
  qs('#growthMilestoneTags').outerHTML=`<div id="growthMilestoneTags" class="growth-tag-options">${growthTagOptions(row.tags||[])}</div>`;
  const remove=qs('#growthMilestoneModal .btn.danger');if(remove)remove.textContent=row.kind==='daily-linked'?'从成长日记移除':'删除成长记录';
  modalController.open('growthMilestoneModal');
}
function renderGrowthJournal(){
  const list=qs('#growthList');if(!list)return;bindGrowthCardNavigation();const priorScroll=list.scrollTop,search=(qs('#growthSearch')?.value||'').trim().toLowerCase(),tag=qs('#growthTagFilter')?.value||'all',sort=qs('#growthSort')?.value||'new';const input=qs('#growthDateFilter');if(input)input.value=growthDateFilter||growthToday();let rows=allGrowthRecords();const tags=[...new Set(rows.flatMap(row=>row.tags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN')),select=qs('#growthTagFilter');if(select)select.innerHTML=`<option value="all">全部标签</option>${tags.map(value=>`<option value="${esc(value)}" ${value===tag?'selected':''}>${esc(value)}</option>`).join('')}`;if(growthDateFilter)rows=rows.filter(row=>row.date===growthDateFilter);if(tag!=='all')rows=rows.filter(row=>row.tags.includes(tag));if(search)rows=rows.filter(row=>`${row.summary} ${row.detail}`.toLowerCase().includes(search));rows.sort((a,b)=>sort==='old'?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)));
  list.innerHTML=rows.length?rows.map(row=>`<article class="entry growth-edit-card" data-growth-card data-growth-kind="${esc(row.kind)}" data-growth-id="${esc(row.id)}" role="button" tabindex="0" aria-label="编辑 ${esc(row.summary||'成长记录')}"><div class="meta">${esc(row.date)}</div><b>${esc(row.summary||'成长瞬间')}</b>${row.detail?`<p class="growth-preview">${esc(row.detail)}</p>`:''}<div class="growth-pills">${row.tags.map(item=>`<span>${esc(item)}</span>`).join('')}</div>${row.attachments.length?'<div class="media-status">📎 附件已关联</div>':''}<span class="growth-card-chevron" aria-hidden="true">›</span></article>`).join(''):`<div class="entry"><span class="small">${growthDateFilter?'当天没有成长记录':'还没有成长记录。'}</span></div>`;
  list.querySelectorAll('[data-growth-card]').forEach(card=>card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click();}}));list.scrollTop=priorScroll;traceGrowthCardNavigation('list_rendered',{count:rows.length,filter:{date:growthDateFilter||'',tag,sort,search}});
}
Object.assign(window,{bindGrowthCardNavigation,openGrowthDetail,renderGrowthJournal,growthCardOpen:openGrowthDetail,getGrowthCardNavigationTrace:()=>[...growthCardNavigationTrace]});

/* Diagnostic build only: records the real iPhone event path without changing Growth navigation. */
const growthCardInteractionDiagnostic=window.__growthCardInteractionDiagnostic||[];
function growthInteractionStyle(element){if(!element)return null;const style=getComputedStyle(element);return {tag:element.tagName||'',id:element.id||'',className:String(element.className||''),pointerEvents:style.pointerEvents,zIndex:style.zIndex,position:style.position,overflow:style.overflow,touchAction:style.touchAction,userSelect:style.userSelect,opacity:style.opacity,visibility:style.visibility};}
function growthInteractionRecord(step,detail={}){growthCardInteractionDiagnostic.push({timestamp:new Date().toISOString(),step,...detail});if(growthCardInteractionDiagnostic.length>160)growthCardInteractionDiagnostic.splice(0,growthCardInteractionDiagnostic.length-160);window.__growthCardInteractionDiagnostic=growthCardInteractionDiagnostic;renderGrowthCardInteractionDiagnostic();}
function growthInteractionElementFromEvent(event){const target=event.target?.nodeType===1?event.target:event.target?.parentElement;const point=Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)?{x:event.clientX,y:event.clientY}:null;const stack=point&&document.elementsFromPoint?document.elementsFromPoint(point.x,point.y).slice(0,5).map(growthInteractionStyle):[];const hit=point&&document.elementFromPoint?growthInteractionStyle(document.elementFromPoint(point.x,point.y)):null;const card=target?.closest?.('[data-growth-card]')||null,record=card?.dataset?.growthId?resolveGrowthRecord(card.dataset.growthId):null;return {eventType:event.type,targetTag:target?.tagName||'',targetClass:String(target?.className||''),targetId:target?.id||'',clientX:point?.x??null,clientY:point?.y??null,cardFound:!!card,cardConnected:!!card?.isConnected,growthKind:card?.dataset?.growthKind||record?.kind||'',growthId:card?.dataset?.growthId||'',sourceDate:record?.sourceDate||'',sourceBlockId:record?.sourceBlockId||'',relationshipId:record?.relationshipId||'',routeAction:card?'delegated growth detail open':'',resolverResult:record?{kind:record.kind,id:record.id,summary:record.summary}:null,modalState:{growthDetailOpen:modalController.isOpen('growthMilestoneModal')},hitTest:hit,hitStack:stack,cardStyle:growthInteractionStyle(card)};}
function bindGrowthCardInteractionDiagnostic(){
  if(document.documentElement.dataset.growthCardDiagnosticBound==='true')return;document.documentElement.dataset.growthCardDiagnosticBound='true';
  ['pointerdown','pointerup','touchstart','touchend','click'].forEach(eventType=>document.addEventListener(eventType,event=>{const data=growthInteractionElementFromEvent(event);const list=qs('#growthList');if(data.cardFound||list?.contains(event.target))growthInteractionRecord(`${eventType}_received`,data);},true));
  growthInteractionRecord('diagnostic_bound',{actualRenderer:'renderGrowthJournal in js/app.js',containerSelector:'#growthList',containerCount:document.querySelectorAll('#growthList').length});
}
function growthCardInteractionSnapshot(){const list=qs('#growthList'),ids=[...document.querySelectorAll('[id]')].map(el=>el.id),duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];return {appVersion:APP_VERSION,build:document.documentElement.dataset.runtimeBuild,actualRenderer:'renderGrowthJournal in js/app.js',actualListContainer:'#growthList',containerCount:document.querySelectorAll('#growthList').length,cardCount:list?.querySelectorAll('[data-growth-card]').length||0,listenerAttached:list?.dataset?.growthCardDelegation||'not-recorded',listenerAttachCount:list?.dataset?.growthCardDelegation==='bound'?1:0,duplicateIds:duplicates,cardMarkup:[...list?.querySelectorAll('[data-growth-card]')||[]].slice(0,3).map(card=>card.outerHTML),trace:[...growthCardInteractionDiagnostic]};}
function renderGrowthCardInteractionDiagnostic(){const count=qs('#growthCardInteractionCount');if(count)count.textContent=`Growth Card trace: ${growthCardInteractionDiagnostic.length} events`;}
function clearGrowthCardInteractionTrace(){growthCardInteractionDiagnostic.splice(0);growthInteractionRecord('trace_cleared');}
function exportGrowthCardInteractionTrace(){const payload=growthCardInteractionSnapshot(),blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download='growth-card-interaction-trace-v0190.json';anchor.click();URL.revokeObjectURL(anchor.href);}
async function copyGrowthCardInteractionTrace(){const text=JSON.stringify(growthCardInteractionSnapshot(),null,2);try{await navigator.clipboard.writeText(text);alert('Growth Card Interaction Trace 已复制。');}catch(_){alert('复制失败，请使用导出 JSON。');}}
bindGrowthCardInteractionDiagnostic();renderGrowthCardInteractionDiagnostic();
Object.assign(window,{clearGrowthCardInteractionTrace,exportGrowthCardInteractionTrace,copyGrowthCardInteractionTrace,getGrowthCardInteractionSnapshot:growthCardInteractionSnapshot});

// v0.22 Daily Question calendar: source-backed, leap-safe and deliberately
// independent from the legacy 25-question library.
function dailyQuestionForDate(date){return window.DailyQuestionCalendarSource?.byMMDD?.[String(date||'').slice(5)]||null;}
function questionLibrary(){const source=window.DailyQuestionCalendarSource?.questions||[],custom=state.fiveYearQuestions||[],seen=new Set();return [...source,...custom].filter(question=>question?.id&&question?.text&&!seen.has(question.id)&&(seen.add(question.id)||true));}
function applyDailyQuestionCalendarMigration(){
  const source=window.DailyQuestionCalendarSource;if(!source?.byMMDD)return false;
  state.settings=state.settings||{};const expected=Object.fromEntries(source.questions.map(question=>[question.mmdd,question.id]));const calendarChanged=JSON.stringify(state.settings.dailyQuestionCalendar||{})!==JSON.stringify(expected);state.settings.dailyQuestionCalendar=expected;
  const target=state.legacyJournalRecords.find(record=>record?.recordType==='five_year_question'&&record.date==='2026-08-28'&&record.questionId==='system-new-year'&&(record.question||record.title)==='我现在最期待的事情是什么？');
  const correct=source.byMMDD['08-28'];
  if(target&&correct){Object.assign(target,{questionId:correct.id,question:correct.text,title:correct.text,updatedAt:Date.now(),calendarCorrection:'v0220-2026-08-28-source-bound'});}
  return calendarChanged||Boolean(target);
}
function dailyQuestionPromptForDate(date){const existing=state.legacyJournalRecords.find(record=>record.recordType==='five_year_question'&&record.date===date);return existing?{id:existing.questionId||null,text:existing.question||existing.title||'',historical:true}:dailyQuestionForDate(date);}
function syncDailyQuestionText(){const selected=qs('#dailyQuestionSelect').value,question=questionLibrary().find(item=>item.id===selected),custom=selected==='__custom__';qs('#dailyQuestionCustomWrap').hidden=!custom;qs('#dailyQuestionPrompt').hidden=custom;qs('#dailyQuestionPrompt').textContent=custom?'':(question?.text||'今天没有预设问题');}
function openDailyQuestion(date=iso(new Date())){dailyQuestionEditId='';qs('#dailyQuestionDate').value=date;const questions=questionLibrary(),existing=state.legacyJournalRecords.find(record=>record.recordType==='five_year_question'&&record.date===date),mapped=dailyQuestionForDate(date);qs('#dailyQuestionSelect').innerHTML=questions.map(question=>`<option value="${esc(question.id)}">${esc(question.text)}</option>`).join('')+'<option value="__custom__">自定义问题…</option>';if(existing){dailyQuestionEditId=existing.id;qs('#dailyQuestionAnswer').value=existing.answer||existing.content||'';qs('#dailyQuestionSelect').value=existing.questionId&&questions.some(question=>question.id===existing.questionId)?existing.questionId:'__custom__';qs('#dailyQuestionText').value=qs('#dailyQuestionSelect').value==='__custom__'?(existing.question||existing.title||''):'';}else{qs('#dailyQuestionSelect').value=mapped?.id||'__custom__';qs('#dailyQuestionText').value='';qs('#dailyQuestionAnswer').value='';}syncDailyQuestionText();qs('#dailyQuestionDeleteButton').hidden=!dailyQuestionEditId;modalController.open('dailyQuestionModal');}
function renderFiveYearJournal(){const date=qs('#fiveYearDate');if(!date)return;date.value=fiveYearViewDate;const [,month,day]=fiveYearViewDate.split('-').map(Number),rows=fiveYearJournal.recordsForSlot(fiveYearRecords(),month,day),todayRecord=state.legacyJournalRecords.find(record=>record.recordType==='five_year_question'&&record.date===fiveYearViewDate),prompt=qs('#fiveYearPrompt'),mapped=dailyQuestionForDate(fiveYearViewDate);if(prompt)prompt.innerHTML=todayRecord?`<button class="full-btn" onclick="openFiveYearRecordEditor('${todayRecord.id}')"><b>今日一问已回答</b><span>${esc(todayRecord.question||todayRecord.title)}</span></button>`:`<div><b>今日一问</b><p>${esc(mapped?.text||'今天没有预设问题')}</p><button class="btn primary" onclick="openDailyQuestion('${fiveYearViewDate}')">${mapped?'回答':'自定义一个问题'}</button></div>`;qs('#fiveYearList').innerHTML=rows.length?rows.map(record=>`<article class="entry five-year-record" onclick="openFiveYearRecordEditor('${record.id}')"><div class="meta">${esc(record.date)}</div><b>问题</b><p>${esc(record.question||record.title)}</p><b>回答</b><p>${esc(record.answer||record.content)}</p></article>`).join(''):'<div class="entry"><span class="small">这一天还没有其他年份的记录。</span></div>';}
window.addEventListener('dailyQuestionSourceReady',()=>{const changed=applyDailyQuestionCalendarMigration();if(changed){const result=save();if(!result?.ok)return result;}renderFiveYearJournal();renderTodayHub();if(changed)journalRefresh();});

/* v0.22 one-pack recovery import.  The package is staged entirely in memory.
   No media store, snapshot, migration, or canonical write is touched before
   the user confirms the one displayed summary. */
const recoveryImportEngine=window.JournalModules?.createRecoveryImport?.();
let recoveryAllDataDraft=null;
const recoveryEsc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function recoveryDownloadCurrentBackup(){
  const raw=JSON.stringify(state),blob=new Blob([raw],{type:'application/json'}),link=document.createElement('a');
  link.href=URL.createObjectURL(blob);link.download=`journal-planner-v091-before-recovery-import-${iso(new Date())}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),0);
  return {bytes:new Blob([raw]).size};
}
async function recoverySha256(pkg){
  const copy=JSON.parse(JSON.stringify(pkg));delete copy.packageSha256;
  const bytes=new TextEncoder().encode(recoveryImportEngine.stable(copy));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
function recoveryPreviewHtml(staged){
  const labels=[['Daily','Daily'],['Legacy Journal','Legacy Journal / Five Years'],['Orders','Orders'],['Sellers','Sellers'],['Pickup Locations','Pickup Locations'],['Recurring definitions','Recurring definitions'],['Forwarding Batches','Forwarding Batches'],['Inventory','Inventory'],['Subscriptions','Subscriptions'],['No Spend','No Spend'],['Challenges','Challenges']];
  const row=([key,label])=>{const value=staged.summary.byModule[key]||{inserted:0,preserved:0,skipped:0,replaced:0};return `<li><b>${recoveryEsc(label)}</b>：新增 ${value.inserted} / 保留 ${value.preserved} / 跳过 ${value.skipped}${value.replaced?` / 批准替换 ${value.replaced}`:''}</li>`;};
  return `<section class="import-preview-card"><b>准备恢复</b><ul>${labels.map(row).join('')}</ul><p class="section-note">总计：新增 ${staged.summary.inserted} · 保留 ${staged.summary.preserved} · 重复跳过 ${staged.summary.skipped} · 批准替换 ${staged.summary.replaced}</p><p class="small">将只写入文字与结构化数据；不会访问或写入图片、视频、Live Photo 或媒体库。</p></section>`;
}
function openRecoveryAllDataImport(){const input=qs('#recoveryAllDataFile');if(!input)return;input.value='';input.click();}
async function prepareRecoveryAllDataImport(event){
  const file=event.target.files?.[0];if(!file||!recoveryImportEngine)return;
  let pkg;try{pkg=JSON.parse(await file.text());}catch(_){alert('恢复包不是有效 JSON，未导入任何数据。');return;}
  const validated=recoveryImportEngine.validatePackage(pkg);if(!validated.ok){alert(`恢复包无法使用：\n${validated.errors.join('\n')}`);return;}
  try{
    const actual=await recoverySha256(pkg);
    if(actual!==String(pkg.packageSha256||'').toLowerCase())throw new Error('恢复包 hash 校验失败。');
    const staged=recoveryImportEngine.stage(state,pkg);
    const expected=pkg.expectedFinalCounts||{};
    for(const [key,value] of Object.entries(expected))if(Number(staged.finalCounts[key])!==Number(value))throw new Error(`恢复投影 ${key}=${staged.finalCounts[key]}，不等于预期 ${value}。`);
    if(staged.integrity.ordersBatchBrokenRefs.length||staged.integrity.danglingMediaRefs.length||staged.integrity.schemaVersion!==12)throw new Error('恢复投影未通过关联完整性校验。');
    const protection=recoveryDownloadCurrentBackup();
    recoveryAllDataDraft={pkg,staged,fileName:file.name,packageHash:actual,protection};
    qs('#recoveryAllDataPreview').innerHTML=recoveryPreviewHtml(staged);qs('#recoveryAllDataConfirm').disabled=false;
    modalController.open('recoveryAllDataModal');
  }catch(error){recoveryAllDataDraft=null;alert(`未导入：${error.message||error}`);}
}
function closeRecoveryAllDataImport(){recoveryAllDataDraft=null;modalController.close('recoveryAllDataModal');}
function recoverySaveFailure(result){
  const preview=qs('#recoveryAllDataPreview');
  if(preview)preview.insertAdjacentHTML('beforeend',`<p class="notice error"><b>RECOVERY SAVE FAILED — NO VERIFIED COMMIT</b><br>${recoveryEsc(result?.message||'保存失败，恢复候选仍保留在当前窗口。')}</p>`);
}
function commitRecoveryAllDataImport(){
  const draft=recoveryAllDataDraft;if(!draft)return;
  const original=state;
  try{
    const payload=JSON.stringify(draft.staged.next);
    const commit=window.PersistenceFoundation?.commitCanonical;
    if(typeof commit!=='function')throw new Error('统一 quota-safe canonical commit 不可用。');
    const result=commit({storage:localStorage,key:KEY,payload});
    if(result?.ok===false){draft.lastCommitFailure=result;recoverySaveFailure(result);return;}
    const raw=localStorage.getItem(KEY);if(!raw)throw new Error('canonical read-back 不存在。');
    const persisted=JSON.parse(raw);
    if(recoveryImportEngine.stable(persisted)!==recoveryImportEngine.stable(draft.staged.next))throw new Error('canonical read-back 与已验证恢复候选不一致。');
    const verification=recoveryImportEngine.stage(original,draft.pkg);
    if(recoveryImportEngine.stable(verification.next)!==recoveryImportEngine.stable(persisted))throw new Error('恢复后验证不一致。');
    const health=window.PersistenceHealth?.fingerprint?.(persisted);
    if(!health||health.schemaVersion!==12||health.counts.orders!==draft.staged.finalCounts.orders||health.counts.batches!==draft.staged.finalCounts.batches)throw new Error('恢复后健康校验不一致。');
    state=persisted;
    renderAll();closeRecoveryAllDataImport();
    alert(`恢复完成\n新增 ${draft.staged.summary.inserted} · 保留 ${draft.staged.summary.preserved} · 跳过 ${draft.staged.summary.skipped} · 批准替换 ${draft.staged.summary.replaced}`);
  }catch(error){state=original;recoverySaveFailure({message:error?.message||error});}
}
Object.assign(window,{openRecoveryAllDataImport,prepareRecoveryAllDataImport,closeRecoveryAllDataImport,commitRecoveryAllDataImport,recoveryAllDataImportTestHook:()=>({draft:recoveryAllDataDraft,engine:recoveryImportEngine})});
