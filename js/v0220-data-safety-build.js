(function(){
  'use strict';
  const build='v0.23.4-qa-backup-v1-v2-restore-qa2-20261006';
  window.JOURNAL_BUILD=build;
  document.documentElement.dataset.runtimeBuild=build;
  window.dispatchEvent(new CustomEvent('journalBuildReady',{detail:{build,label:'QA Backup v1/v2 Restore QA2'}}));
})();
