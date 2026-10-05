(function(){
  'use strict';
  const USER_VERIFIED_COMPLETIONS={
    '10-15':'有没有在养宠物?或者有没有养宠物的打算?给我带来了什么?',
    '12-06':'用自己的标准评选出一位今年对我来说的风云人物/重要人物。'
  };
  const normalize=text=>String(text||'').trim().replace(/[？?]\s*$/,'？');
  async function load(){
    const response=await fetch('./data/daily-question-calendar.json?v=0220nospendreadonlydiagnosticqa');
    if(!response.ok)throw new Error('Daily Question source data unavailable');
    const payload=await response.json();
    const seen=new Set();
    const questions=(Array.isArray(payload.questions)?payload.questions:[]).map((entry,index)=>{
      const mmdd=String(entry?.mmdd||'');
      const sourceText=entry?.sourceText||USER_VERIFIED_COMPLETIONS[mmdd]||'';
      if(!/^\d{2}-\d{2}$/.test(mmdd)||!sourceText||seen.has(mmdd))throw new Error('Invalid Daily Question source entry '+(mmdd||index));
      seen.add(mmdd);
      return {id:'daily-question-'+mmdd,mmdd,text:sourceText,normalizedText:normalize(sourceText),sourceText,sourceType:payload.sourceType||'legacy_daily_question_settings_screen_recording',provenance:entry?.sourceText?'screen_recording':'user_confirmed_source_completion'};
    });
    if(questions.length!==366||seen.size!==366||!seen.has('02-29'))throw new Error('Daily Question source coverage is incomplete');
    window.DailyQuestionCalendarSource={source:payload.source,questions,byMMDD:Object.fromEntries(questions.map(question=>[question.mmdd,question])),userVerifiedCompletions:USER_VERIFIED_COMPLETIONS};
    window.dispatchEvent(new Event('dailyQuestionSourceReady'));
  }
  load().catch(error=>{window.DailyQuestionCalendarSourceError=String(error?.message||error);console.error(error);});
})();
