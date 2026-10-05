(function(){
  'use strict';
  function parse(value){return value?new Date(value+'T12:00:00'):new Date();}
  function iso(date){return date.toISOString().slice(0,10);}
  function addMonthsSafe(date,months){const day=date.getDate();date.setDate(1);date.setMonth(date.getMonth()+months);date.setDate(Math.min(day,new Date(date.getFullYear(),date.getMonth()+1,0).getDate()));return date;}
  function nextDate(anchor,every,unit){let date=parse(anchor),n=Math.max(1,Number(every)||1);if(unit==='days')date.setDate(date.getDate()+n);else if(unit==='weeks')date.setDate(date.getDate()+7*n);else if(unit==='months')date=addMonthsSafe(date,n);else date=addMonthsSafe(date,12*n);return iso(date);}
  window.JournalModules=window.JournalModules||{};
  window.JournalModules.createRecurrenceHelper=()=>({nextDate,addMonthsSafe});
})();
