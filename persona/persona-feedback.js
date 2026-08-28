(function(root){
  'use strict';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const number=value=>Number.isInteger(value)?String(value):String(Number(Number(value).toFixed(2)));
  function conditionText(condition={}){
    const value=condition.value;
    return{HAND_HAS_STRAIGHT:'打出顺子或同花顺',MIN_UNIQUE_SUITS:`选牌包含至少 ${value} 种花色`,SUBMITTED_CARD_COUNT_EXACT:`恰好打出 ${value} 张牌`,SUBMITTED_CARD_COUNT_AT_LEAST:`打出至少 ${value} 张牌`,SUBMITTED_CARD_COUNT_AT_MOST:`打出不超过 ${value} 张牌`,SCORING_CARD_COUNT_AT_LEAST:`计分牌达到 ${value} 张以上`,CURRENT_HAND_CARD_COUNT_BELOW:`当前手牌不足 ${value} 张`,HAND_PRIORITY_AT_LEAST:'使用顺子以上牌型',HAND_QUALITY_IS:condition.value==='RARE'?'使用稀有牌型':'使用普通品质牌型',HAS_MATCHED_RANK_STRUCTURE:'打出对子或更高的同点数结构',HAND_HAS_FLUSH:'打出同花或同花顺',PERSONA_RUNTIME_FLAG:condition.key==='charged'?'弃牌后等待下一次出牌':condition.key==='discardedSinceLastPlay'?'本回合未使用弃牌':`状态“${condition.key}”已生效`,SAME_HAND_TYPE_STREAK_AT_LEAST:`连续 ${value} 手使用同一种牌型`,DIFFERENT_FROM_PREVIOUS_HAND:'连续两次使用不同牌型',UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN:'打出一种本局尚未记录的新牌型',DISCARDED_CARD_COUNT_AT_LEAST:`一次弃掉至少 ${value} 张牌`}[condition.type]||'满足人格规则';
  }
  function triggerText(template,event='HAND_COMMITTED'){
    const conditions=event==='HAND_COMMITTED'?(template.conditions||[]):((template.growthRules||[]).find(rule=>rule.event===event)?.conditions||[]);
    return conditions.length?conditions.map(conditionText).join('，'):'正式打出任意牌型';
  }
  function conditionsText(conditions=[]){return conditions.length?conditions.map(conditionText).join('，'):'正式打出任意牌型'}
  function effectText(effect){
    if(effect.type==='ADD_CHIPS')return `+${number(effect.value)} 筹码`;
    if(effect.type==='ADD_MULT')return effect.valuePerStack!=null?`每层 +${number(effect.valuePerStack)} 加法倍率`:`+${number(effect.value)} 加法倍率`;
    if(effect.type==='MULTIPLY_FINAL')return `最终倍率 ×${number(effect.value)}`;
    if(effect.type==='ADD_XMULT_RATE')return `独立倍率 +${number(effect.value*100)}%`;
    if(effect.type==='ADD_COINS')return `金币 +${number(effect.value)}`;
    if(effect.type==='ADD_HAND_LIMIT')return `本场出牌次数 +${number(effect.value)}`;
    if(effect.type==='ADD_DISCARD_LIMIT')return `本场弃牌次数 +${number(effect.value)}`;
    if(effect.type==='ADD_GROWTH_STACK')return `成长 +${number(effect.value)} 层`;
    if(effect.type==='SET_RUNTIME_FLAG')return effect.key==='charged'?'完成蓄力':'建立状态';
    if(effect.type==='CLEAR_RUNTIME_FLAG')return effect.key==='charged'?'消耗蓄力':'清除状态';
    return '状态发生变化';
  }
  function totalAdditiveMultiplier(template,state={}){return(template.effects||[]).filter(effect=>effect.type==='ADD_MULT').reduce((sum,effect)=>sum+(Number(effect.value)||0)+(Number(effect.valuePerStack)||0)*(Number(state[effect.runtimeCounter])||0),0)}
  function statusLines(template,state={}){
    const lines=[];
    if(Object.prototype.hasOwnProperty.call(state,'growthStacks')){const cap=template.caps?.growthStacks??'—',stacks=state.growthStacks||0;lines.push(`成长 ${stacks} / ${cap} 层`,`当前总加成 +${number(totalAdditiveMultiplier(template,state))} 加法倍率`)}
    if(Object.prototype.hasOwnProperty.call(state,'charged'))lines.push(state.charged?'已蓄力 · 下一次正式出牌释放':'未蓄力');
    if(Object.prototype.hasOwnProperty.call(state,'discardedSinceLastPlay'))lines.push(state.discardedSinceLastPlay?'本回合已使用弃牌':'本回合未使用弃牌');
    const limit=template.activationLimit;if(limit?.scope==='BATTLE'&&Number.isFinite(limit.count))lines.push(`本场剩余 ${Math.max(0,limit.count-(state.activationCountThisBattle||0))} 次`);
    if(Object.prototype.hasOwnProperty.call(state,'firstSuccessRepeated'))lines.push(state.firstSuccessRepeated?'一次性回响已触发':'一次性回响未触发');
    return lines.length?lines:['状态正常'];
  }
  function playHint(template){
    if((template.growthRules||[]).some(rule=>(rule.conditions||[]).some(item=>item.type==='UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN')))return '尽量尝试不同牌型，它会越打越强。';
    if((template.conditions||[]).some(item=>item.type==='SAME_HAND_TYPE_STREAK_AT_LEAST'))return '连续使用同一种高价值牌型，制造最终倍率爆发。';
    if((template.conditions||[]).some(item=>item.type==='PERSONA_RUNTIME_FLAG'&&item.key==='charged'))return '先用一次大弃牌完成蓄力，再打出高价值牌型。';
    return `围绕“${triggerText(template)}”安排出牌。`;
  }
  function preciseRule(template){const lines=[`触发条件：${triggerText(template)}`];if((template.effects||[]).length)lines.push(`正式效果：${template.effects.map(effectText).join('；')}`);for(const rule of template.growthRules||[])lines.push(`${rule.event==='DISCARD_COMMITTED'?'弃牌规则':'成长规则'}：${conditionsText(rule.conditions)}，${(rule.effects||[]).map(effectText).join('；')}`);return lines.join('。')}
  function cardView(template,state={}){const identityRule=(template.growthRules||[]).find(rule=>(rule.conditions||[]).some(item=>['UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN','DISCARDED_CARD_COUNT_AT_LEAST'].includes(item.type))),trigger=template.mainEffect?.triggerText||(identityRule?conditionsText(identityRule.conditions):triggerText(template)),growthReward=identityRule?(identityRule.effects||[]).map(effectText):[],reward=template.mainEffect?.effectText||[...(template.effects||[]).map(effectText),...growthReward].join('；')||'改变人格状态';return{name:template.name,mainEntry:template.mainEntry||'主词条',trigger,reward,status:statusLines(template,state),playHint:playHint(template),preciseRule:preciseRule(template)}}
  function growthWouldTrigger(template,history,handTypeId,runtimeState={}){const cap=template.caps?.growthStacks;return(cap==null||(runtimeState.growthStacks||0)<cap)&&(template.growthRules||[]).some(rule=>rule.event==='HAND_COMMITTED'&&(rule.conditions||[]).some(condition=>condition.type==='UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN')&&handTypeId&&!((history?.usedHandTypes||[]).includes(handTypeId)))}
  function feedbackFromLogs(logs,{getTemplate,getInstance,history,handTypeId,handTypeName,kind='preview'}={}){
    return(logs||[]).filter(log=>log.triggered&&!log.disabled).map(log=>{const template=getTemplate(log.templateId),instance=getInstance?.(log.instanceId),before=log.runtimeStateBefore||instance?.runtimeState||{},after=kind==='commit'?(log.runtimeStateAfter||instance?.runtimeState||{}):before,effects=(log.effectsApplied||log.effects||[]).filter(effect=>['ADD_CHIPS','ADD_MULT','MULTIPLY_FINAL','ADD_XMULT_RATE','ADD_COINS'].includes(effect.type)).map(effectText),willGrow=growthWouldTrigger(template,history,handTypeId,before);if(willGrow)effects.push('成长 +1 层');return{instanceId:log.instanceId,templateId:log.templateId,name:template.name,reason:willGrow?`首次打出“${handTypeName||handTypeId}”`:triggerText(template),effects,status:statusLines(template,after),kind}})
  }
  function discardFeedback(logs,{getTemplate,getInstance}={}){return(logs||[]).filter(log=>log.triggered&&!log.disabled).map(log=>{const template=getTemplate(log.templateId),instance=getInstance?.(log.instanceId),after=log.runtimeStateAfter||instance?.runtimeState||{};return{instanceId:log.instanceId,templateId:log.templateId,name:template.name,reason:triggerText(template,'DISCARD_COMMITTED'),effects:(log.effectsApplied||[]).map(effectText),status:statusLines(template,after),kind:'commit'}})}
  function buildScoreBreakdown({baseLayers,personaLogs=[],otherEvents=[],finalLayers,finalScore}){const personas=personaLogs.filter(log=>log.triggered&&!log.disabled).map(log=>({name:log.name||log.templateId,chipsDelta:log.chipsDelta||0,multDelta:log.multDelta||0,finalMultiplier:1+(log.finalMultiplierDelta||0)})),other={chipsDelta:0,multDelta:0,finalMultiplier:1};for(const event of otherEvents){other.chipsDelta+=event.chipsDelta||0;other.multDelta+=event.multDelta||0;other.finalMultiplier*=event.xmultFactor||1}return{base:clone(baseLayers),personas,other,final:clone(finalLayers),finalScore}}
  root.PersonaFeedback={conditionText,triggerText,conditionsText,effectText,statusLines,playHint,preciseRule,cardView,feedbackFromLogs,discardFeedback,buildScoreBreakdown,totalAdditiveMultiplier};
})(globalThis);
