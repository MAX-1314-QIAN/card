(function(root){
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  function create(config,{random=Math.random}={}){
    if(!config?.rules?.length)throw new Error('关卡限制配置缺失');
    const byId=new Map(config.rules.map(rule=>[rule.id,rule]));
    const profileFor=battleNumber=>config.profiles.find(profile=>profile.battleNumbers.includes(battleNumber));
    function weightedPick(entries,weightOf){const total=entries.reduce((sum,item)=>sum+weightOf(item),0);if(!total)return null;let point=random()*total;for(const item of entries){point-=weightOf(item);if(point<0)return item}return entries.at(-1)}
    function draw({battleNumber,recentRuleIds=[]}={}){
      if(battleNumber<config.firstRestrictedBattleNumber)return null;
      const profile=profileFor(battleNumber);if(!profile)return null;
      const blocked=new Set(recentRuleIds.slice(-config.recentRuleCooldown));
      let candidates=(profile.ruleIds||config.rules.map(rule=>rule.id)).map(id=>byId.get(id)).filter(Boolean).filter(rule=>!blocked.has(rule.id));
      if(!candidates.length)candidates=(profile.ruleIds||config.rules.map(rule=>rule.id)).map(id=>byId.get(id)).filter(Boolean);
      let rule;
      if(profile.categoryWeights){const categories=[...new Set(candidates.map(item=>item.category))],category=weightedPick(categories,item=>profile.categoryWeights[item]||0);rule=weightedPick(candidates.filter(item=>item.category===category),()=>1)}else rule=weightedPick(candidates,()=>1);
      if(!rule)return null;
      const instance={version:config.version,ruleId:rule.id,state:{}};
      if(rule.effect.type==='HAND_BASE_CHIP_DELTA_ON_RANDOM_HAND_TYPE'){const option=rule.effect.options[Math.floor(random()*rule.effect.options.length)];instance.targetHandTypeId=option.id;instance.targetHandTypeName=option.name}
      return instance;
    }
    function isCurrent(instance){return !!instance&&instance.version===config.version&&byId.has(instance.ruleId)}
    function describe(instance){if(!isCurrent(instance))return null;const rule=byId.get(instance.ruleId),description=rule.effect.type==='HAND_BASE_CHIP_DELTA_ON_RANDOM_HAND_TYPE'?`${instance.targetHandTypeName||'指定牌型'}的基础筹码 ${rule.effect.delta}。`:rule.description;return{...clone(rule),description}}
    function adjustTarget(instance,value){const effect=describe(instance)?.effect;if(effect?.type!=='TARGET_SCORE_DELTA')return value;return Math.max(0,value+effect.delta)}
    function adjustEntry(instance,{hands,discards,handSize}){const effect=describe(instance)?.effect,result={hands,discards,handSize};if(effect?.type==='STARTING_HAND_DELTA')result.hands=Math.max(effect.floor,hands+effect.delta);else if(effect?.type==='STARTING_DISCARD_DELTA')result.discards=Math.max(effect.floor,discards+effect.delta);else if(effect?.type==='STARTING_HAND_SIZE_DELTA')result.handSize=Math.max(effect.floor,handSize+effect.delta);return result}
    function adjustFaceChips(instance,card,value){const effect=describe(instance)?.effect,matchesRank=effect?.type==='FACE_CHIP_DELTA_FOR_RANKS'&&effect.ranks.includes(String(card.r)),matchesSuit=effect?.type==='FACE_CHIP_DELTA_FOR_SUITS'&&effect.suits.includes(String(card.s));if(!matchesRank&&!matchesSuit)return value;return Math.max(effect.floor,value+effect.delta)}
    function adjustScore(instance,context){
      const rule=describe(instance),effect=rule?.effect,result={chips:context.chips,mult:context.mult,xmult:context.cardXmult*context.personaXmult,applied:false};if(!effect)return result;
      const applyBaseChipDelta=()=>{const before=context.baseHandChips,after=Math.max(effect.floor,before+effect.delta);result.chips+=after-before;result.applied=after!==before};
      if(effect.type==='HAND_BASE_CHIP_DELTA_ON_QUALITY'&&context.handQualityId===effect.qualityId)applyBaseChipDelta();
      else if(effect.type==='HAND_BASE_CHIP_DELTA_ON_REPEATED_HAND_TYPE'&&context.previousHandTypeId===context.handTypeId)applyBaseChipDelta();
      else if(effect.type==='HAND_BASE_CHIP_DELTA_ON_RANDOM_HAND_TYPE'&&instance.targetHandTypeId===context.handTypeId)applyBaseChipDelta();
      else if(effect.type==='HAND_BASE_MULT_DELTA'){const before=context.baseHandMult,after=Math.max(effect.floor,before+effect.delta);result.mult+=after-before;result.applied=after!==before}
      else if(effect.type==='PERSONA_BONUS_FACTOR'){const before={chips:result.chips,mult:result.mult,xmult:result.xmult};result.chips-=context.personaChips*(1-effect.factor);result.mult-=context.personaMult*(1-effect.factor);result.xmult=context.cardXmult*(1+(context.personaXmult-1)*effect.factor);result.applied=result.chips!==before.chips||result.mult!==before.mult||result.xmult!==before.xmult}
      return result;
    }
    function adjustVictoryCoins(instance,value){const effect=describe(instance)?.effect;if(effect?.type!=='VICTORY_COIN_DELTA')return value;return Math.max(effect.floor,value+effect.delta)}
    function afterDiscard(instance){return instance?clone(instance):instance}
    function afterPlay(instance){return instance?clone(instance):instance}
    return{version:config.version,isCurrent,draw,describe,adjustTarget,adjustEntry,adjustFaceChips,adjustScore,adjustVictoryCoins,afterDiscard,afterPlay,getRule:id=>clone(byId.get(id)||null)};
  }
  root.StageLimitRuntime={create};
  if(typeof module!=='undefined'&&module.exports)module.exports={create};
})(globalThis);
