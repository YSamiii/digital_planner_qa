(function(){
  'use strict';
  const SOURCE_APP='One Line a Day';
  const PROVENANCE_KEY='one_line_a_day';
  function isDateKey(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T12:00:00');
    return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function sourceKey(date,id){return `${date}::${String(id)}`;}
  function validate(payload){
    const errors=[];
    if(!payload||typeof payload!=='object')errors.push('文件不是有效 JSON 对象。');
    if(payload?.app!==SOURCE_APP)errors.push('此文件不是 One Line a Day 备份。');
    if(payload?.version!==18)errors.push('无法识别 One Line a Day v18 备份版本。');
    if(!payload?.entries||typeof payload.entries!=='object'||Array.isArray(payload.entries))errors.push('entries 对象缺失。');
    if(errors.length)return {ok:false,errors};
    const normalized=[],invalidDateExamples=[],entrySchemaExamples=[],blockExamples=[];
    Object.keys(payload.entries).sort().forEach(date=>{
      const entry=payload.entries[date];
      if(!isDateKey(date)){invalidDateExamples.push(date);return;}
      if(!entry||typeof entry!=='object'||Array.isArray(entry)||!Array.isArray(entry.blocks)){entrySchemaExamples.push(date);return;}
      const blocks=entry.blocks;
      blocks.forEach((block,index)=>{
        if(!block||typeof block!=='object'||block.id===undefined||block.id===null||String(block.id)==='')blockExamples.push(`${date} #${index+1} 缺少 id`);
        else if(typeof block.title!=='string'||!block.title.trim())blockExamples.push(`${date} #${index+1} 缺少 title`);
        else if(typeof block.text!=='string')blockExamples.push(`${date} #${index+1} text 不是文字`);
        else normalized.push({date,id:String(block.id),title:block.title.trim(),text:block.text,aiText:typeof block.aiText==='string'?block.aiText:undefined});
      });
    });
    if(invalidDateExamples.length)errors.push(`entries 包含无效日期（示例：${invalidDateExamples.slice(0,5).join('、')}）`);
    if(entrySchemaExamples.length)errors.push(`无法识别 One Line a Day v18 entries.blocks 结构（示例：${entrySchemaExamples.slice(0,5).join('、')}）`);
    if(blockExamples.length)errors.push(`block 字段无效（示例：${blockExamples.slice(0,5).join('；')}）`);
    if(errors.length)return {ok:false,errors};
    const dates=[...new Set(normalized.map(x=>x.date))];
    const titleCounts={};normalized.forEach(x=>titleCounts[x.title]=(titleCounts[x.title]||0)+1);
    return {ok:true,entries:normalized,preview:{dateStart:dates[0]||'',dateEnd:dates[dates.length-1]||'',days:dates.length,blocks:normalized.length,titleCounts}};
  }
  function importedTitle(target,title){
    const base=`${title}（导入）`;
    if(!(base in target))return base;
    let number=2;while(`${base} ${number}` in target)number+=1;
    return `${base} ${number}`;
  }
  function provenanceApi(){const api=window.JournalModules?.legacyJournalProvenance;return api||{oneLineEntry:(group,key)=>(group?.format===2&&group.entries?group.entries:group||{})[key],setOneLineEntry:(group,key,value)=>{const entries=group?.format===2&&group.entries?group.entries:group;entries[key]=value;return value;}};}
  function stage(state,validated,policy='fill_empty'){
    if(!validated?.ok)throw new Error('Cannot stage an invalid One Line a Day backup.');
    if(!['fill_empty','skip_named','append'].includes(policy))throw new Error('Unknown import conflict policy.');
    const next={dailyBlocks:clone(state.dailyBlocks||{}),customBlocks:clone(state.customBlocks||[]),importProvenance:clone(state.importProvenance||{})};
    next.importProvenance[PROVENANCE_KEY]=next.importProvenance[PROVENANCE_KEY]||{};
    const provenance=next.importProvenance[PROVENANCE_KEY],api=provenanceApi(),result={importedDays:0,importedBlocks:0,skippedDuplicates:0,conflicts:0,errors:0};const changedDays=new Set();
    validated.entries.forEach(source=>{
      const key=sourceKey(source.date,source.id);
      if(api.oneLineEntry(provenance,key)){result.skippedDuplicates+=1;return;}
      const day=next.dailyBlocks[source.date]=next.dailyBlocks[source.date]||{};
      const hasTitle=Object.prototype.hasOwnProperty.call(day,source.title);
      const existing=hasTitle?String(day[source.title]??''):'';
      let targetTitle=source.title;
      if(!hasTitle||!existing.trim()){
        day[targetTitle]=source.text;
      }else if(existing===source.text){
        api.setOneLineEntry(provenance,key,{sourceApp:PROVENANCE_KEY,sourceDate:source.date,sourceBlockId:source.id,targetTitle,matchedExisting:true});result.skippedDuplicates+=1;return;
      }else if(policy==='append'){
        targetTitle=importedTitle(day,source.title);day[targetTitle]=source.text;
      }else if(policy==='skip_named'){
        result.skippedDuplicates+=1;return;
      }else{result.conflicts+=1;return;}
      api.setOneLineEntry(provenance,key,{sourceApp:PROVENANCE_KEY,sourceDate:source.date,sourceBlockId:source.id,targetTitle});
      if(targetTitle!=='我的一天'&&!next.customBlocks.includes(targetTitle))next.customBlocks.push(targetTitle);
      result.importedBlocks+=1;changedDays.add(source.date);
    });
    result.importedDays=changedDays.size;
    return {next,result};
  }
  function createOneLineImport(){return {validate,stage,sourceKey};}
  window.JournalModules=window.JournalModules||{};
  window.JournalModules.createOneLineImport=createOneLineImport;
})();
