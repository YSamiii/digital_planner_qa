(function(){
  'use strict';
  const build='v0.23.3-forwarding-warehouse-state-fix-iphone-qa1-20261006';
  window.JOURNAL_BUILD=build;
  document.documentElement.dataset.runtimeBuild=build;
  window.dispatchEvent(new CustomEvent('journalBuildReady',{detail:{build,label:'Forwarding Warehouse State Fix iPhone QA1'}}));
})();
