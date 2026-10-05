(function(){
  'use strict';
  const BUILD='0.22.0-historical-import-qa3-diagnostic';
  const panelId='historicalEntryDiagnosticPanel';
  const lines=[];
  function compact(value){return String(value??'').replace(/\s+/g,' ').slice(0,420);}
  function panel(){return document.getElementById(panelId);}
  function render(){const el=panel();if(!el)return;el.innerHTML=`<b>Historical Import QA3</b><span>${BUILD}</span><pre>${lines.slice(-8).join('\n')}</pre>`;}
  function record(step,detail=''){lines.push(`${new Date().toISOString().slice(11,23)} ${step}${detail?` · ${compact(detail)}`:''}`);render();}
  function ensurePanel(){if(panel())return;const el=document.createElement('aside');el.id=panelId;el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('aria-label','Historical import QA3 diagnostic');document.body.appendChild(el);record('QA3_DIAGNOSTIC_READY',`build=${BUILD}`);}
  function exception(kind,error,file,line,column){const message=error?.message||error?.reason?.message||error?.reason||error||'unknown error',stack=error?.stack||error?.reason?.stack||'';record(kind,`message=${message}; file=${file||''}; line=${line||''}; column=${column||''}; stack=${stack}`);}
  function auditModal(){const modal=document.getElementById('historicalDualImportModal');if(!modal){record('MODAL_MISSING');return;}record('MODAL_CREATED',`inDocument=${document.documentElement.contains(modal)}`);const style=getComputedStyle(modal),rect=modal.getBoundingClientRect();record('MODAL_VISIBLE',`display=${style.display}; visibility=${style.visibility}; opacity=${style.opacity}; zIndex=${style.zIndex}; pointerEvents=${style.pointerEvents}; rect=${Math.round(rect.width)}x${Math.round(rect.height)}@${Math.round(rect.left)},${Math.round(rect.top)}`);}
  function openFromDiagnostic(){const fn=window.openHistoricalDualImporter||window.openHistoricalDualImport;record('OPEN_IMPORTER_CALLED',`typeof=${typeof fn}`);if(typeof fn!=='function'){record('OPEN_IMPORTER_UNAVAILABLE');auditModal();return;}try{fn();record('OPEN_IMPORTER_RETURNED');}catch(error){exception('OPEN_IMPORTER_EXCEPTION',error);}requestAnimationFrame(()=>requestAnimationFrame(auditModal));}
  function bind(){if(document.documentElement.dataset.historicalEntryQa3Bound==='true')return;document.documentElement.dataset.historicalEntryQa3Bound='true';document.addEventListener('click',event=>{const target=event.target,tag=target?.tagName||'unknown',trigger=target?.closest?.('[data-historical-import]')||null;record('ENTRY_CLICK_RECEIVED',`targetTag=${tag}; closestMatched=${!!trigger}; outerHTML=${trigger?compact(trigger.outerHTML):''}`);if(!trigger)return;record('CONTROLLER_MATCHED',`type=${trigger.type||''}; data=${trigger.hasAttribute('data-historical-import')}`);event.preventDefault();event.stopImmediatePropagation();openFromDiagnostic();},true);}
  window.addEventListener('error',event=>exception('WINDOW_ONERROR',event.error||event.message,event.filename,event.lineno,event.colno));
  window.addEventListener('unhandledrejection',event=>exception('WINDOW_UNHANDLED_REJECTION',event));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensurePanel();bind();},{once:true});else{ensurePanel();bind();}
  window.HistoricalEntryQA3Diagnostic={BUILD,record,auditModal,lines};
})();
