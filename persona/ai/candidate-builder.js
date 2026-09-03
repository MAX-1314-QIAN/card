(function(root){
  'use strict';
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const round=(value,digits=6)=>Number(Number(value).toFixed(digits));
  const clamp=value=>Math.max(0,Math.min(1,Number(value)));
  const format=value=>Number.isInteger(Number(value))?String(Number(value)):String(round(value,2));
  const hash=value=>[...String(value)].reduce((sum,char)=>((sum^char.charCodeAt(0))*16777619)>>>0,2166136261).toString(36).toUpperCase();
  const shareWhere=(rows,predicate,denominator=null)=>{const selected=(rows||[]).filter(row=>predicate(Number(row.value)));if(Number.isFinite(denominator))return denominator>0?selected.reduce((sum,row)=>sum+Number(row.count||0),0)/denominator:0;return selected.reduce((sum,row)=>sum+Number(row.share||0),0)};
  const handShare=(window,ids)=>{const wanted=new Set(ids||[]);return(window?.handTypes||[]).filter(item=>wanted.has(item.id)).reduce((sum,item)=>sum+Number(item.playShare||0),0)};

  function resolveConditions(conditions,profile){
    const resolved=[];
    for(const original of conditions||[]){
      const condition=clone(original);
      if(condition.valueSource==='BEHAVIOR_DOMINANT_HAND_TYPE'){if(!profile.dominantHandTypeId)return null;condition.value=profile.dominantHandTypeId;delete condition.valueSource}
      if(condition.valueSource==='BEHAVIOR_SECONDARY_HAND_TYPE'){if(!profile.secondaryHandTypeId)return null;condition.value=profile.secondaryHandTypeId;delete condition.valueSource}
      if(condition.valuesSource==='BEHAVIOR_TOP_TWO_HAND_TYPES'){if(profile.topTwoHandTypeIds.length<2)return null;condition.values=[...profile.topTwoHandTypeIds];delete condition.valuesSource}
      resolved.push(condition);
    }
    return resolved;
  }

  function conditionRate(condition,window){
    const signals=window?.conditionSignals||{},plays=Number(window?.playCount||0);
    if(!plays&&condition.type!=='DISCARDED_CARD_COUNT_AT_LEAST')return null;
    switch(condition.type){
      case'SUBMITTED_CARD_COUNT_AT_LEAST':return shareWhere(signals.submittedCounts,value=>value>=condition.value);
      case'SUBMITTED_CARD_COUNT_AT_MOST':return shareWhere(signals.submittedCounts,value=>value<=condition.value);
      case'SUBMITTED_CARD_COUNT_EXACT':return shareWhere(signals.submittedCounts,value=>value===condition.value);
      case'SCORING_CARD_COUNT_AT_LEAST':return shareWhere(signals.scoringCounts,value=>value>=condition.value);
      case'CURRENT_HAND_CARD_COUNT_BELOW':return shareWhere(signals.currentHandCounts,value=>value<condition.value);
      case'HAND_PRIORITY_AT_LEAST':return signals[`priorityAtLeast${condition.value}Rate`]??null;
      case'HAND_QUALITY_IS':return condition.value==='RARE'?signals.rareQualityRate:signals.normalQualityRate;
      case'HAND_TYPE_IS':return handShare(window,[condition.value]);
      case'HAND_TYPE_IN':return handShare(window,condition.values);
      case'SAME_HAND_TYPE_STREAK_AT_LEAST':return condition.value===2?signals.sameHandTypeStreakAtLeast2Rate:null;
      case'DIFFERENT_FROM_PREVIOUS_HAND':return signals.differentFromPreviousHandRate??null;
      case'UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN':return signals.firstUniqueHandTypeRate??null;
      case'HAND_HAS_STRAIGHT':return signals.straightRate??null;
      case'MIN_UNIQUE_SUITS':return signals[`uniqueSuitAtLeast${condition.value}Rate`]??null;
      case'HAS_MATCHED_RANK_STRUCTURE':return signals.matchedRankStructureRate??null;
      case'HAND_HAS_FLUSH':return signals.flushRate??null;
      case'DISCARDED_CARD_COUNT_AT_LEAST':return shareWhere(signals.discardedCounts,value=>value>=condition.value,plays);
      default:return null;
    }
  }

  function combinedRate(conditions,snapshot){
    const rateFor=window=>{const rates=(conditions||[]).map(condition=>conditionRate(condition,window)).filter(Number.isFinite);return rates.length?Math.min(...rates):null},cumulative=rateFor(snapshot?.windows?.cumulative),recent=rateFor(snapshot?.windows?.recent),recentPlays=Number(snapshot?.windows?.recent?.playCount||0);
    if(Number.isFinite(recent)&&Number.isFinite(cumulative)&&recentPlays>=3)return round(recent*.6+cumulative*.4);
    return Number.isFinite(cumulative)?round(cumulative):Number.isFinite(recent)?round(recent):null;
  }

  function variantRate(part,variant,resolvedConditions,snapshot){
    if(part.id==='AI_TRIGGER_NEXT_PLAY_AFTER_DISCARD'){
      const threshold=variant.support?.rules?.[0]?.conditions?.[0]?.value,condition={type:'DISCARDED_CARD_COUNT_AT_LEAST',value:threshold};
      return combinedRate([condition],snapshot);
    }
    if(part.id==='AI_TRIGGER_NO_DISCARD_SINCE_PLAY'){
      const cumulative=1-Number(snapshot?.windows?.cumulative?.conditionSignals?.discardFollowUpRate||0),recent=1-Number(snapshot?.windows?.recent?.conditionSignals?.discardFollowUpRate||0);
      return round(Number(snapshot?.windows?.recent?.playCount||0)>=3?recent*.6+cumulative*.4:cumulative);
    }
    return combinedRate(resolvedConditions,snapshot);
  }

  function growthRate(growth,resolvedConditions,triggerRate,snapshot){return growth.conditionSource==='CORE_TRIGGER'?triggerRate:combinedRate(resolvedConditions,snapshot)}
  function interpolate(template,replacements){return String(template||'').replace(/\{(\w+)\}/g,(match,key)=>Object.prototype.hasOwnProperty.call(replacements,key)?replacements[key]:match)}
  function effectCopy(type,value){if(type==='ADD_CHIPS')return`+${format(value)} 筹码`;if(type==='ADD_MULT')return`+${format(value)} 倍率`;if(type==='ADD_XMULT_RATE')return`+${format(Number(value)*100)}% 独立倍率`;return`最终倍率 ×${format(value)}`}

  function triggerCopy(part,variant,conditions,handTypeById){
    const firstNumeric=[...conditions,...(variant.support?.rules||[]).flatMap(rule=>rule.conditions||[])].find(condition=>Number.isFinite(condition.value)),priority=conditions.find(condition=>condition.type==='HAND_PRIORITY_AT_LEAST')?.value,priorityHand=[...handTypeById.values()].filter(item=>item.priority>=priority).sort((a,b)=>a.priority-b.priority)[0],typeIds=conditions.flatMap(condition=>condition.type==='HAND_TYPE_IN'?condition.values||[]:condition.type==='HAND_TYPE_IS'?[condition.value]:[]),replacements={value:firstNumeric?.value,resolvedHandTypeName:priorityHand?.name||handTypeById.get(typeIds[0])?.name,resolvedHandTypeNames:typeIds.map(id=>handTypeById.get(id)?.name||id).join('或')};
    return interpolate(part.copyTemplate,replacements);
  }

  function directionFit(directionId,part,growth,profile){
    const tags=new Set(part.behaviorTags||[]),growthId=growth.id;
    let score=0;
    if(directionId==='AI_DIRECTION_FOLLOW'){if(tags.has('DOMINANT_STYLE'))score+=34;if(tags.has('STYLE_SET'))score+=24;if(tags.has('REPEAT'))score+=20;if(tags.has('MATCHED_RANKS')||tags.has('STRAIGHT')||tags.has('FLUSH'))score+=8;if(growthId==='AI_GROWTH_CORE_TRIGGER'||growthId==='AI_GROWTH_MATCHED_RANKS')score+=10}
    if(directionId==='AI_DIRECTION_BRIDGE'){if(tags.has('SECONDARY_STYLE'))score+=32;if(tags.has('STYLE_SET'))score+=22;if(tags.has('VARIETY')||tags.has('DIVERSITY')||tags.has('DISCOVERY'))score+=18;if(growthId==='AI_GROWTH_DIFFERENT_HAND'||growthId==='AI_GROWTH_FIRST_UNIQUE_HAND'||growthId==='AI_GROWTH_SUIT_DIVERSITY')score+=10}
    if(directionId==='AI_DIRECTION_BREAK'){if(tags.has('LEAN_PLAY')||tags.has('RISK')||tags.has('NORMAL'))score+=20;if(tags.has('VARIETY')||tags.has('DIVERSITY')||tags.has('DISCOVERY'))score+=16;if(growthId==='AI_GROWTH_DIFFERENT_HAND'||growthId==='AI_GROWTH_FIRST_UNIQUE_HAND'||growthId==='AI_GROWTH_DISCARD_TWO')score+=10}
    if(profile.upgradedHandTypeIds.some(id=>part.id.includes('HAND_TYPE')&&profile.topTwoHandTypeIds.includes(id)))score+=4;
    return score;
  }

  function createProfile(snapshot){
    const cumulative=snapshot?.windows?.cumulative||{};
    return{dominantHandTypeId:cumulative.dominantHandTypeId||null,secondaryHandTypeId:cumulative.secondaryHandTypeId||null,topTwoHandTypeIds:[...(cumulative.topTwoHandTypeIds||[])],upgradedHandTypeIds:(snapshot?.activeBuild?.handTypeUpgrades||[]).map(item=>item.id)};
  }

  function create(whitelist){
    if(!root.AiPersonaValueBudget||!root.AiPersonaCandidateValidator)throw new Error('AI persona candidate builder dependencies are missing');
    const valueBudget=root.AiPersonaValueBudget.create(whitelist),validator=root.AiPersonaCandidateValidator.create(whitelist),tierById=new Map((whitelist.strengthTiers||[]).map(item=>[item.id,item])),frequencyById=new Map((whitelist.frequencyBands||[]).map(item=>[item.id,item]));
    function build({snapshot,directionId,handTypes=[],maxCandidates=24}={}){
      if(!snapshot||snapshot.runtimeNodeId==null)throw new Error('AI persona candidate builder requires a behavior snapshot');
      if(!Number.isInteger(maxCandidates)||maxCandidates<1)throw new Error('AI persona candidate maxCandidates must be a positive integer');
      const runtimeNodeId=snapshot.runtimeNodeId,policy=(whitelist.nodePolicies||[]).find(item=>item.runtimeNodeId===runtimeNodeId);
      if(!policy||!policy.directionIds.includes(directionId))throw new Error(`AI persona direction ${directionId} is not allowed at ${runtimeNodeId}`);
      const profile=createProfile(snapshot),handTypeById=new Map(handTypes.map(item=>[item.id,item])),confidence=snapshot.confidence?.level||'LOW',candidates=[];
      for(const part of whitelist.triggerParts||[]){
        if(!part.directions.includes(directionId))continue;
        for(const variant of part.variants||[]){
          const conditions=resolveConditions(variant.conditions,profile);if(!conditions)continue;
          const observedTriggerRate=variantRate(part,variant,conditions,snapshot);
          if(confidence!=='LOW'&&Number.isFinite(observedTriggerRate)&&observedTriggerRate<.025)continue;
          const frequency=frequencyById.get(variant.frequencyBandId);
          for(const effect of whitelist.mainEffectParts||[]){
            if(!effect.directions.includes(directionId))continue;
            const baseTierIds=frequency.allowedBaseTierIds.filter(id=>effect.allowedTierIds.includes(id));
            for(const baseStrengthTierId of baseTierIds){
              const baseTier=tierById.get(baseStrengthTierId),baseValue=baseTier.values[effect.runtimeType],basePhase=whitelist.assemblyRules.effectPhaseByType[effect.runtimeType];
              for(const growth of whitelist.growthParts||[]){
                if((growth.incompatibleTriggerTags||[]).some(tag=>(part.behaviorTags||[]).includes(tag)))continue;
                const resolvedGrowthConditions=growth.conditionSource==='CORE_TRIGGER'?clone(conditions):resolveConditions(growth.conditions,profile);if(!resolvedGrowthConditions)continue;
                const observedGrowthRate=growthRate(growth,resolvedGrowthConditions,observedTriggerRate,snapshot);
                for(const growthStrengthTierId of growth.allowedPerStackTierIds||[]){
                  const growthTier=tierById.get(growthStrengthTierId),growthEffectType=whitelist.assemblyRules.growthEffectTypeByMainEffect[effect.runtimeType],growthValue=growthTier.values[growthEffectType],growthPhase=whitelist.assemblyRules.effectPhaseByType[growthEffectType];
                  for(const growthCap of growth.allowedCapValues||[]){
                    const budgetMetrics=valueBudget.evaluate({runtimeNodeId,triggerFrequencyBandId:variant.frequencyBandId,mainEffectPartId:effect.id,baseStrengthTierId,growthPartId:growth.id,growthStrengthTierId,growthCap,observedTriggerRate,observedGrowthRate,confidence});if(!budgetMetrics.valid)continue;
                    const support=clone(variant.support||{}),mainEffects=[{type:effect.runtimeType,value:baseValue,phase:basePhase},{type:growthEffectType,valuePerStack:growthValue,runtimeCounter:'growthStacks',phase:growthPhase},...(support.onTriggerEffects||[]).map(item=>({...item,phase:item.phase||'POST_COMMIT'}))],growthRule={event:growth.event,conditions:resolvedGrowthConditions,effects:[clone(growth.runtimeEffect)]},runtimeTemplate={conditions:clone(conditions),effects:mainEffects,activationLimit:clone(whitelist.assemblyRules.activationLimit),growthRules:[growthRule,...clone(support.rules||[])],caps:{growthStacks:growthCap},runtimeDefaults:{growthStacks:0,activationCountThisBattle:0,...clone(support.runtimeDefaults||{})},runtimeScopes:{growthStacks:'RUN',activationCountThisBattle:'BATTLE',...clone(support.runtimeScopes||{})}},triggerText=triggerCopy(part,variant,conditions,handTypeById),mainText=interpolate(effect.copyTemplate,{value:format(baseValue),percentValue:format(Number(baseValue)*100)}),stackText=effectCopy(growthEffectType,growthValue),growthText=`${growth.copyTemplate}，最多 ${growthCap} 层；每层额外${stackText}`;
                    const candidate={schemaVersion:1,id:'',status:'LOCAL_LEGAL_CANDIDATE',runtimeNodeId,directionId,components:{triggerPartId:part.id,triggerVariantId:variant.id,mainEffectPartId:effect.id,baseStrengthTierId,growthPartId:growth.id,growthStrengthTierId,growthCap},behaviorTags:[...new Set([...(part.behaviorTags||[]),`EFFECT_${effect.mainAttributeType}`])].sort(),observations:{triggerRate:Number.isFinite(observedTriggerRate)?round(observedTriggerRate):null,growthRate:Number.isFinite(observedGrowthRate)?round(observedGrowthRate):null,confidence},budgetMetrics:clone(budgetMetrics),runtimeTemplate,affixPolicyRef:whitelist.affixPolicy.id,playerCopy:{trigger:triggerText,mainEffect:mainText,growth:growthText,summary:`${triggerText}时，${mainText}。${growthText}。`}};
                    candidate.mechanismFingerprint=validator.fingerprint(candidate);candidate.id=`AI_CANDIDATE_V1_${runtimeNodeId}_${hash(candidate.mechanismFingerprint)}`;
                    const observed=Number.isFinite(observedTriggerRate)?observedTriggerRate:frequency.estimatedTriggerRate,budgetFit=20-Math.abs(.82-budgetMetrics.matureBudgetUtilization)*20,triggerFit=15-Math.abs(observed-frequency.estimatedTriggerRate)*15;
                    candidate.rankScore=round(directionFit(directionId,part,growth,profile)+budgetFit+triggerFit+budgetMetrics.initialBudgetUtilization*8);
                    candidates.push(validator.assertValid(candidate));
                  }
                }
              }
            }
          }
        }
      }
      candidates.sort((a,b)=>b.rankScore-a.rankScore||a.id.localeCompare(b.id));
      const selected=[],selectedIds=new Set(),triggerCounts=new Map(),effectCounts=new Map(),growthCounts=new Map(),effectLimit=Math.ceil(maxCandidates/4)+1,growthLimit=Math.ceil(maxCandidates/6)+1;
      for(const candidate of candidates){const triggerId=candidate.components.triggerPartId,effectId=candidate.components.mainEffectPartId,growthId=candidate.components.growthPartId;if((triggerCounts.get(triggerId)||0)>=3||(effectCounts.get(effectId)||0)>=effectLimit||(growthCounts.get(growthId)||0)>=growthLimit)continue;selected.push(candidate);selectedIds.add(candidate.id);triggerCounts.set(triggerId,(triggerCounts.get(triggerId)||0)+1);effectCounts.set(effectId,(effectCounts.get(effectId)||0)+1);growthCounts.set(growthId,(growthCounts.get(growthId)||0)+1);if(selected.length>=maxCandidates)break}
      for(const candidate of candidates){if(selected.length>=maxCandidates)break;if(selectedIds.has(candidate.id))continue;selected.push(candidate);selectedIds.add(candidate.id)}
      return clone({schemaVersion:1,id:`AI_CANDIDATE_POOL_V1:${runtimeNodeId}:${directionId}`,runtimeNodeId,directionId,snapshotId:snapshot.id,candidateCount:selected.length,totalLegalCombinationCount:candidates.length,candidates:selected});
    }
    return Object.freeze({build,resolveConditions,conditionRate,combinedRate});
  }

  root.AiPersonaCandidateBuilder=Object.freeze({create});
})(globalThis);
