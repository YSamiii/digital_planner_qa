(function(){
  'use strict';
  const SECTION_ID='noSpendReadonlyAudit';
  const BUTTON_SELECTOR='[data-nospend-readonly-export]';
  let scheduled=false;

  function statusNode(){return document.querySelector('#noSpendReadonlyAuditStatus');}
  function exportAudit(options={}){
    const result=window.buildNoSpendReadonlyAudit?.(),status=statusNode();
    if(!result){if(status)status.textContent='无法读取 No Spend 状态。';return null;}
    if(!result.equal){if(status)status.textContent='诊断安全校验失败：导出前后状态不一致，未生成文件。';return result;}
    if(!options.suppressDownload){const blob=new Blob([JSON.stringify(result.payload,null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='nospend-readonly-audit-v0220.json';link.click();URL.revokeObjectURL(link.href);}
    if(status)status.textContent=`已导出 ${result.payload.noSpendChallenges.length} 个 No Spend Challenge；只读校验通过。`;
    return result;
  }
  function adminHost(){return document.querySelector('#settings details.admin-diagnostics');}
  function install(){
    const host=adminHost();
    if(!host||document.querySelector(`#${SECTION_ID}`))return false;
    const section=document.createElement('section');
    section.id=SECTION_ID;section.className='admin-trace-section';section.dataset.diagnosticBuild='0.22.0-nospend-readonly-diagnostic-r2-qa';
    section.innerHTML='<hr><h3>No Spend 诊断</h3><p class="small">仅导出 No Spend Challenge、日志与消费明细；不保存、不迁移、不修改任何记录。</p><button type="button" class="btn primary" data-nospend-readonly-export>导出 No Spend 只读审计 JSON</button><p id="noSpendReadonlyAuditStatus" class="small" aria-live="polite">尚未导出。</p>';
    section.addEventListener('click',event=>{if(event.target.closest(BUTTON_SELECTOR))window.exportNoSpendReadonlyAudit?.();});
    host.append(section);return true;
  }
  function scheduleInstall(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;install();});}
  function isVisible(node){if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.height>0;}
  function runDomReachabilityTest(){
    install();const host=adminHost();if(host)host.open=true;
    const section=document.querySelector(`#${SECTION_ID}`),button=section?.querySelector(BUTTON_SELECTOR)||null,before=window.buildNoSpendReadonlyAudit?.().before;
    let exportCalled=false;const original=window.exportNoSpendReadonlyAudit;
    window.exportNoSpendReadonlyAudit=function(options){exportCalled=true;return original({...options,suppressDownload:true});};button?.click();window.exportNoSpendReadonlyAudit=original;
    const after=window.buildNoSpendReadonlyAudit?.().after;
    return {sectionExists:!!section,sectionVisible:isVisible(section),sectionHeight:section?.getBoundingClientRect().height||0,buttonExists:!!button,buttonVisible:isVisible(button),exactButtonLabel:button?.textContent?.trim()||'',exportCalled,canonicalStateEqual:before===after};
  }
  window.exportNoSpendReadonlyAudit=exportAudit;
  window.runNoSpendReadonlyDiagnosticDomTest=runDomReachabilityTest;
  install();document.addEventListener('DOMContentLoaded',scheduleInstall,{once:true});
  const settings=document.querySelector('#settings');if(settings)new MutationObserver(scheduleInstall).observe(settings,{childList:true,subtree:true});
})();
