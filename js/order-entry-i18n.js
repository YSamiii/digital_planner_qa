(function(){
  'use strict';
  const t=key=>window.OrderScreenshotI18n.t(key);
  function renderEntries(){
    const actions=document.querySelector('#orders .header-actions');
    if(actions){
      let entry=document.querySelector('#orderScreenshotEntry');
      if(!entry){entry=document.createElement('button');entry.id='orderScreenshotEntry';entry.type='button';entry.className='ghost';entry.onclick=()=>window.openOrderScreenshotImport();actions.prepend(entry);}
      entry.textContent=t('add');
    }
    const header=document.querySelector('#orderModal .modal-header');
    if(header){
      let entry=document.querySelector('#orderScreenshotNewOrderEntry');
      if(!entry){entry=document.createElement('button');entry.id='orderScreenshotNewOrderEntry';entry.type='button';entry.className='ghost';entry.onclick=()=>window.openOrderScreenshotImport();header.append(entry);}
      entry.textContent=t('recognize');
    }
  }
  window.renderOrderScreenshotEntries=renderEntries;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderEntries);else renderEntries();
})();
