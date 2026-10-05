(function(){'use strict';
const endpoint='https://handbook-orders-ai-staging.samanthayaosy.workers.dev/orders/recognize';
const state={origin:window.location.origin||'N/A',endpoint,stage:'not_started',httpStatus:'N/A',errorCode:''};
const labels={origin:'Origin',endpoint:'Endpoint',stage:'Fetch stage',httpStatus:'HTTP status',errorCode:'Error code'};
function render(){const root=document.querySelector('#orderScreenshotNetworkDiagnostic');if(!root)return;for(const [key,label] of Object.entries(labels)){const field=root.querySelector(`[data-network-diagnostic="${key}"]`);if(field)field.textContent=`${label}: ${state[key]}`;}}
function reset(update={}){Object.assign(state,{origin:window.location.origin||'N/A',endpoint,stage:'not_started',httpStatus:'N/A',errorCode:''},update);render();}
function record(update={}){Object.assign(state,update);render();}
function beginRecognition(){reset({endpoint,stage:'before_fetch'});}
window.OrderScreenshotNetworkDiagnostic={reset,record,beginRecognition};
reset();
})();
