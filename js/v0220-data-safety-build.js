(function(){
  'use strict';
  const build='v0.23.2-canonical-slimming-iphone-qa1-20261005';
  window.JOURNAL_BUILD=build;
  document.documentElement.dataset.runtimeBuild=build;
  window.dispatchEvent(new CustomEvent('journalBuildReady',{detail:{build,label:'Canonical Slimming iPhone QA1'}}));
})();
