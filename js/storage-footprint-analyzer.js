(function(){
  'use strict';
  const utf8=value=>{const text=typeof value==='string'?value:JSON.stringify(value);try{return new Blob([text||'']).size;}catch(_){return String(text||'').length*2;}};
  const utf16=value=>String(typeof value==='string'?value:JSON.stringify(value)||'').length*2;
  const type=value=>Array.isArray(value)?'array':value===null?'null':typeof value;
  const count=value=>Array.isArray(value)?value.length:value&&typeof value==='object'?Object.keys(value).length:0;
  const objectId=value=>value&&typeof value==='object'&&value.id!=null?String(value.id):'';
  const diagnosticKey=key=>/^journal-planner-(?:inventory-edit-trace|orders-save-trace|orders-persistence-trace|project30-checkbox-trace|project30-interaction-trace|dashboard-runtime-trace|today-active-challenge-trace|today-hide-when-empty-trace|snapshot-verification)-/i.test(key);
  function strings(value,path='$',out=[],depth=0){
    if(depth>10)return out;
    if(typeof value==='string'){const bytes=utf8(value);if(bytes>51200||/^data:/i.test(value)||(/^[A-Za-z0-9+/=\s]+$/.test(value)&&bytes>4096))out.push({path,bytes,category:/^data:image/i.test(value)?'data_image':/^data:/i.test(value)?'data_url':'base64_like'});return out;}
    if(!value||typeof value!=='object')return out;
    if(Array.isArray(value))value.forEach((item,index)=>strings(item,`${path}[${index}]`,out,depth+1));
    else Object.entries(value).forEach(([key,item])=>strings(item,`${path}.${key}`,out,depth+1));
    return out;
  }
  function walk(value,path='$',out=[],depth=0){
    const row={path,bytes:utf8(value),type:type(value),count:count(value),id:objectId(value)};
    out.push(row);
    if(depth>=8||!value||typeof value!=='object')return out;
    if(Array.isArray(value))value.forEach((item,index)=>walk(item,`${path}[${index}]`,out,depth+1));
    else Object.entries(value).forEach(([key,item])=>walk(item,`${path}.${key}`,out,depth+1));
    return out;
  }
  function localStorageKeys(storage){
    const rows=[];try{for(let index=0;index<storage.length;index++){const key=storage.key(index)||'',value=storage.getItem(key)||'';rows.push({key,bytes:utf8(value),utf16Bytes:utf16(value),characters:value.length,purpose:key==='journal-planner-v091'?'canonical':diagnosticKey(key)?'diagnostic':'other'});}}catch(error){return {error:{name:error?.name||'Error',message:error?.message||String(error)},rows:[],totalBytes:0};}
    rows.sort((a,b)=>b.bytes-a.bytes);return {rows,totalBytes:rows.reduce((sum,row)=>sum+row.bytes,0),diagnosticBytes:rows.filter(row=>row.purpose==='diagnostic').reduce((sum,row)=>sum+row.bytes,0)};
  }
  function moduleRows(state){return Object.entries(state||{}).map(([key,value])=>({module:key,bytes:utf8(value),utf16Bytes:utf16(value),count:count(value),type:type(value)})).sort((a,b)=>b.bytes-a.bytes);}
  function analyzeStorageFootprint(state,storage){
    const modules=moduleRows(state),nodes=walk(state,'state').filter(row=>row.path!=='state').sort((a,b)=>b.bytes-a.bytes),keyAudit=storage?localStorageKeys(storage):{rows:[],totalBytes:0,diagnosticBytes:0};
    return {readOnly:true,canonical:{characters:JSON.stringify(state||{}).length,utf8Bytes:utf8(state),utf16Bytes:utf16(state)},localStorage:keyAudit,topModules:modules,largestObjects:nodes.slice(0,20).map(row=>({path:row.path,id:row.id,objectType:row.type,approximateBytes:row.bytes,count:row.count})),largeStrings:strings(state).sort((a,b)=>b.bytes-a.bytes),duplicateStructure:{diagnosticKeyCount:keyAudit.rows.filter(row=>row.purpose==='diagnostic').length,diagnosticBytes:keyAudit.diagnosticBytes}};
  }
  if(typeof window!=='undefined')window.JournalStorageFootprint={analyzeStorageFootprint,diagnosticKey};
  if(typeof module!=='undefined'&&module.exports)module.exports={analyzeStorageFootprint,diagnosticKey};
})();
