(function(){
  'use strict';
  function createTimelineFilter(){
    function blockTitles(rows){return [...new Set(rows.filter(row=>row.blockTitle&&String(row.content||'').trim()).map(row=>row.blockTitle))].sort((a,b)=>a.localeCompare(b,'zh-CN'));}
    function apply(rows,{type='all',block='all',search='',sort='new'}={}){
      const query=String(search||'').trim().toLowerCase();
      let result=rows.slice();
      if(type!=='all')result=result.filter(row=>row.type===type);
      if(block!=='all')result=result.filter(row=>row.blockTitle===block);
      if(query)result=result.filter(row=>`${row.title||''} ${row.content||''}`.toLowerCase().includes(query));
      result.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
      if(sort==='old')result.reverse();
      return result;
    }
    return {blockTitles,apply};
  }
  window.JournalModules=window.JournalModules||{};
  window.JournalModules.createTimelineFilter=createTimelineFilter;
})();
