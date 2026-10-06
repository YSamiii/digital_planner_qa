(function(){
  'use strict';
  const build='v0.23.3-qa-full-backup-restore-qa1-20261006';
  window.JOURNAL_BUILD=build;
  document.documentElement.dataset.runtimeBuild=build;
  window.dispatchEvent(new CustomEvent('journalBuildReady',{detail:{build,label:'QA Full Backup Restore QA1'}}));
})();
