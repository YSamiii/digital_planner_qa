(function(){
  'use strict';
  const build='0.22.0-daily-question-device-mapping-diagnostic-r2-final-qa';
  window.JOURNAL_BUILD=build;
  document.documentElement.dataset.runtimeBuild=build;
  const key='journal-planner-project30-checkbox-trace-v0220';
  function count(){try{return (JSON.parse(localStorage.getItem(key)||'{"events":[]}').events||[]).length;}catch(_){return 0;}}
  function render(){const node=document.querySelector('#project30CheckboxTraceCount');if(node)node.textContent=`Project 30 checkbox trace: ${count()} events`;}
  function install(){
    const host=document.querySelector('#settings .section.box');
    if(!host||document.querySelector('#project30CheckboxTraceAdmin'))return;
    const details=document.createElement('details');
    details.id='project30CheckboxTraceAdmin';details.className='admin-diagnostics';
    details.innerHTML='<summary>Admin / Diagnostic Mode — Project 30 Checkbox Save Trace</summary><p id="project30CheckboxTraceCount" class="small" aria-live="polite">Project 30 checkbox trace: 0 events</p><div class="backup-actions"><button class="btn secondary" type="button" data-project30-trace="clear">清空 trace</button><button class="btn primary" type="button" data-project30-trace="export">导出 JSON</button></div><p class="small">清空后打开 Project 30 的今日记录，取消或勾选一项并保存，再导出。本诊断只记录 Challenge 日记录保存链路。</p>';
    details.addEventListener('click',event=>{const action=event.target.closest('[data-project30-trace]')?.dataset.project30Trace;if(action==='clear'){window.clearProject30CheckboxTrace?.();render();}if(action==='export')window.exportProject30CheckboxTrace?.();});
    host.append(details);render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.addEventListener('focus',render);
})();
