(function(root){
  'use strict';
  const SUITS=['♠','♥','♦','♣'];
  const RANK_BANDS=['low','middle','face','ace'];
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const finite=value=>Number.isFinite(Number(value))?Number(value):0;
  const round=(value,digits=4)=>Number(finite(value).toFixed(digits));
  const ratio=(value,total)=>total>0?round(finite(value)/total):0;
  const battleNumberOf=item=>Number.isInteger(item?.battleIndex)?item.battleIndex+1:null;
  const increment=(map,key,amount=1)=>map.set(key,(map.get(key)||0)+amount);

  function sortByCountThenId(rows){return rows.sort((a,b)=>b.count-a.count||String(a.id).localeCompare(String(b.id)))}

  function summarizeWindow({plays=[],discards=[],battles=[],handTypes=[]}={}){
    const handTypeById=new Map(handTypes.map(item=>[item.id,item])),handStats=new Map(),suitCounts=new Map(SUITS.map(suit=>[suit,0])),rankBandCounts=new Map(RANK_BANDS.map(id=>[id,0])),personaStats=new Map();
    let totalScore=0,maxScore=0,totalSelected=0,totalScoring=0,detailedPlayCount=0,baseChips=0,baseMult=0,baseXmult=0,finalChips=0,finalMult=0,finalXmult=0;
    for(const play of plays){
      const id=play.typeId||play.type||'UNKNOWN',config=handTypeById.get(id),entry=handStats.get(id)||{id,name:config?.name||play.type||id,count:0,scoreTotal:0,maxScore:0};
      entry.count++;entry.scoreTotal+=finite(play.score);entry.maxScore=Math.max(entry.maxScore,finite(play.score));handStats.set(id,entry);
      totalScore+=finite(play.score);maxScore=Math.max(maxScore,finite(play.score));totalSelected+=finite(play.selectedCount);totalScoring+=finite(play.scoringCount);
      const scoringCards=Array.isArray(play.scoringCards)?play.scoringCards:[];
      if(scoringCards.length)detailedPlayCount++;
      for(const card of scoringCards){if(suitCounts.has(card.suit))increment(suitCounts,card.suit);if(rankBandCounts.has(card.rankBand))increment(rankBandCounts,card.rankBand)}
      if(!scoringCards.length)for(const suit of play.scoringSuits||play.suits||[])if(suitCounts.has(suit))increment(suitCounts,suit);
      const base=play.scoreLayers?.base||{},final=play.scoreLayers?.final||{};
      baseChips+=finite(base.chips);baseMult+=finite(base.mult);baseXmult+=finite(base.xmult||1);finalChips+=finite(final.chips);finalMult+=finite(final.mult);finalXmult+=finite(final.xmult||1);
      for(const contribution of play.personaContributions||[]){
        if(!contribution.instanceId)continue;
        const persona=personaStats.get(contribution.instanceId)||{instanceId:contribution.instanceId,templateId:contribution.templateId||null,triggerCount:0,handsContributed:0,chipsDelta:0,multDelta:0,xmultRateDelta:0,finalMultiplierDelta:0,coinsDelta:0};
        persona.triggerCount++;persona.handsContributed++;persona.chipsDelta+=finite(contribution.chipsDelta);persona.multDelta+=finite(contribution.multDelta);persona.xmultRateDelta+=finite(contribution.xmultRateDelta);persona.finalMultiplierDelta+=finite(contribution.finalMultiplierDelta);persona.coinsDelta+=finite(contribution.coinsDelta);personaStats.set(contribution.instanceId,persona);
      }
    }

    const handTypeRows=sortByCountThenId([...handStats.values()].map(item=>({...item,scoreTotal:round(item.scoreTotal),averageScore:round(item.scoreTotal/item.count),playShare:ratio(item.count,plays.length),scoreShare:ratio(item.scoreTotal,totalScore)})));
    const totalSuitCards=[...suitCounts.values()].reduce((sum,value)=>sum+value,0),suitRows=sortByCountThenId([...suitCounts].map(([id,count])=>({id,count,share:ratio(count,totalSuitCards)})));
    const totalRankCards=[...rankBandCounts.values()].reduce((sum,value)=>sum+value,0),rankRows=sortByCountThenId([...rankBandCounts].map(([id,count])=>({id,count,share:ratio(count,totalRankCards)})));

    let repeatTransitions=0,maxSameTypeStreak=0,currentStreak=0,previousType=null,previousBattle=null;
    for(const play of [...plays].sort((a,b)=>(battleNumberOf(a)||0)-(battleNumberOf(b)||0)||finite(a.actionSequence)-finite(b.actionSequence))){
      const type=play.typeId||play.type||'UNKNOWN',battle=battleNumberOf(play);
      if(type===previousType&&battle===previousBattle){repeatTransitions++;currentStreak++}else currentStreak=1;
      maxSameTypeStreak=Math.max(maxSameTypeStreak,currentStreak);previousType=type;previousBattle=battle;
    }

    let discardFollowUpCount=0,discardFollowUpScore=0,sequencedActionCount=0;
    const actions=[...plays.map(item=>({...item,kind:'PLAY'})),...discards.map(item=>({...item,kind:'DISCARD'}))].filter(item=>Number.isInteger(item.actionSequence)).sort((a,b)=>(battleNumberOf(a)||0)-(battleNumberOf(b)||0)||a.actionSequence-b.actionSequence);
    sequencedActionCount=actions.length;
    let pendingDiscardBattle=null;
    for(const action of actions){
      const battle=battleNumberOf(action);
      if(action.kind==='DISCARD')pendingDiscardBattle=battle;
      else if(action.kind==='PLAY'){
        if(pendingDiscardBattle===battle){discardFollowUpCount++;discardFollowUpScore+=finite(action.score)}
        pendingDiscardBattle=null;
      }
    }

    const totalDiscarded=discards.reduce((sum,item)=>sum+finite(item.count),0),completedBattles=battles.filter(item=>item.endScore!==null&&item.endScore!==undefined),wins=completedBattles.filter(item=>item.win===true).length;
    return{
      battleCount:new Set([...plays,...discards].map(battleNumberOf).filter(Boolean)).size||completedBattles.length,
      completedBattleCount:completedBattles.length,
      winCount:wins,
      playCount:plays.length,
      totalScore:round(totalScore),
      averageScore:round(totalScore/Math.max(1,plays.length)),
      maxScore:round(maxScore),
      handTypes:handTypeRows,
      dominantHandTypeId:handTypeRows[0]?.id||null,
      secondaryHandTypeId:handTypeRows[1]?.id||null,
      topTwoHandTypeIds:handTypeRows.slice(0,2).map(item=>item.id),
      uniqueHandTypeCount:handTypeRows.length,
      repeatedHandTypeTransitions:repeatTransitions,
      maxSameHandTypeStreak:maxSameTypeStreak,
      suits:suitRows,
      dominantSuitId:suitRows[0]?.count?suitRows[0].id:null,
      rankBands:rankRows,
      dominantRankBandId:rankRows[0]?.count?rankRows[0].id:null,
      actions:{averageSubmittedCards:round(totalSelected/Math.max(1,plays.length)),averageScoringCards:round(totalScoring/Math.max(1,plays.length)),discardActions:discards.length,discardedCards:totalDiscarded,averageDiscardedCards:round(totalDiscarded/Math.max(1,discards.length)),maxDiscardedCards:discards.reduce((max,item)=>Math.max(max,finite(item.count)),0),discardFollowUpCount,discardFollowUpAverageScore:round(discardFollowUpScore/Math.max(1,discardFollowUpCount))},
      scoreLayers:{averageBaseChips:round(baseChips/Math.max(1,detailedPlayCount)),averageBaseMult:round(baseMult/Math.max(1,detailedPlayCount)),averageBaseXmult:round(baseXmult/Math.max(1,detailedPlayCount)),averageFinalChips:round(finalChips/Math.max(1,detailedPlayCount)),averageFinalMult:round(finalMult/Math.max(1,detailedPlayCount)),averageFinalXmult:round(finalXmult/Math.max(1,detailedPlayCount))},
      personas:[...personaStats.values()].sort((a,b)=>b.triggerCount-a.triggerCount||String(a.instanceId).localeCompare(String(b.instanceId))).map(item=>Object.fromEntries(Object.entries(item).map(([key,value])=>[key,typeof value==='number'?round(value):value]))),
      dataQuality:{detailedPlayCount,sequencedActionCount,hasPerPlayCardGroups:detailedPlayCount===plays.length&&plays.length>0,hasCompleteActionOrder:sequencedActionCount===plays.length+discards.length&&sequencedActionCount>0}
    };
  }

  function summarizeShop(aggregate,runMetrics,shopConfig){
    const itemById=new Map((shopConfig?.items||[]).map(item=>[item.id,item])),byEffect=new Map(),byTarget=new Map();
    for(const purchase of aggregate.purchases||[]){
      const effectType=purchase.effectType||itemById.get(purchase.itemId)?.effect?.type||'UNKNOWN',price=finite(purchase.price),effect=byEffect.get(effectType)||{id:effectType,count:0,coinsSpent:0};
      effect.count++;effect.coinsSpent+=price;byEffect.set(effectType,effect);
      if(purchase.targetId){const targetId=['UPGRADE_CARD','REMOVE_CARD'].includes(effectType)?'CARD_TARGET':purchase.targetId,key=`${effectType}:${targetId}`,target=byTarget.get(key)||{effectType,targetId,count:0,coinsSpent:0};target.count++;target.coinsSpent+=price;byTarget.set(key,target)}
    }
    const rawEvents=runMetrics?.rawEvents||[],refreshEvents=rawEvents.filter(item=>item.type==='SHOP_REFRESH'),affixEvents=rawEvents.filter(item=>item.type==='PERSONA_ATTRIBUTE_UNLOCKED');
    return{
      visits:finite(aggregate.shopVisits),
      refreshes:finite(aggregate.refreshes),
      freeRefreshes:refreshEvents.filter(item=>finite(item.cost)===0).length,
      paidRefreshes:refreshEvents.filter(item=>finite(item.cost)>0).length,
      refreshCoinsSpent:refreshEvents.reduce((sum,item)=>sum+finite(item.cost),0),
      earnedCoins:finite(aggregate.earnedCoins),
      spentCoins:finite(aggregate.spentCoins),
      purchaseCount:(aggregate.purchases||[]).length,
      deckChanges:finite(aggregate.deckChanges),
      purchasesByEffect:[...byEffect.values()].sort((a,b)=>b.count-a.count||String(a.id).localeCompare(String(b.id))).map(item=>({...item,coinsSpent:round(item.coinsSpent)})),
      targetedUpgrades:[...byTarget.values()].sort((a,b)=>b.count-a.count||String(a.targetId).localeCompare(String(b.targetId))).map(item=>({...item,coinsSpent:round(item.coinsSpent)})),
      personaAffixUnlocks:affixEvents.map(item=>({instanceId:item.instanceId,attributePosition:item.attributePosition,cost:finite(item.cost)}))
    };
  }

  function summarizeBuild(personaState={},shopGrowthState={}){
    const equippedIds=(personaState.equippedPersonaInstanceIds||[]).filter(Boolean),instances=personaState.personaInstancesById||{};
    return{
      suitUpgrades:Object.entries(shopGrowthState.suitLevelsBySuit||{}).filter(([,level])=>finite(level)>0).map(([id,level])=>({id,level:finite(level),chipsPerScoringCard:finite(shopGrowthState.suitChipBonusBySuit?.[id])})).sort((a,b)=>b.level-a.level||a.id.localeCompare(b.id)),
      handTypeUpgrades:Object.entries(shopGrowthState.handTypeLevelsById||{}).filter(([,level])=>finite(level)>0).map(([id,level])=>({id,level:finite(level)})).sort((a,b)=>b.level-a.level||a.id.localeCompare(b.id)),
      personaMainUpgrades:Object.values(instances).filter(item=>finite(item.shopMainStatUpgrade?.level)>0).map(item=>({instanceId:item.instanceId,attributeType:item.shopMainStatUpgrade.attributeType,level:finite(item.shopMainStatUpgrade.level)})).sort((a,b)=>b.level-a.level||String(a.instanceId).localeCompare(String(b.instanceId))),
      equippedPersonaInstanceIds:equippedIds,
      equippedSlotCount:equippedIds.length,
      runPersonaCount:(personaState.runPersonaPool||[]).length
    };
  }

  function create({runtimeNodeId,afterBattleNumber,aggregate={},runMetrics={},personaState={},shopGrowthState={},handTypes=[],shopConfig={},recentBattleWindow=3}={}){
    if(typeof runtimeNodeId!=='string'||!runtimeNodeId)throw new Error('AI behavior snapshot requires runtimeNodeId');
    if(!Number.isInteger(afterBattleNumber)||afterBattleNumber<1)throw new Error('AI behavior snapshot requires a positive afterBattleNumber');
    const includedPlays=(aggregate.plays||[]).filter(item=>{const battle=battleNumberOf(item);return battle!==null&&battle<=afterBattleNumber}),includedDiscards=(aggregate.discards||[]).filter(item=>{const battle=battleNumberOf(item);return battle!==null&&battle<=afterBattleNumber}),includedBattles=(aggregate.battles||[]).filter(item=>Number.isInteger(item.index)&&item.index+1<=afterBattleNumber),recentStart=Math.max(1,afterBattleNumber-recentBattleWindow+1),recentPlays=includedPlays.filter(item=>battleNumberOf(item)>=recentStart),recentDiscards=includedDiscards.filter(item=>battleNumberOf(item)>=recentStart),recentBattles=includedBattles.filter(item=>item.index+1>=recentStart);
    const cumulative=summarizeWindow({plays:includedPlays,discards:includedDiscards,battles:includedBattles,handTypes}),recent=summarizeWindow({plays:recentPlays,discards:recentDiscards,battles:recentBattles,handTypes}),shop=summarizeShop(aggregate,runMetrics,shopConfig),activeBuild=summarizeBuild(personaState,shopGrowthState),equippedSlots=new Map(activeBuild.equippedPersonaInstanceIds.map((id,index)=>[id,index]));
    const usageById=new Map(cumulative.personas.map(item=>[item.instanceId,item]));
    for(const instanceId of personaState.runPersonaPool||[]){
      if(usageById.has(instanceId))continue;
      const instance=personaState.personaInstancesById?.[instanceId];
      usageById.set(instanceId,{instanceId,templateId:instance?.templateId||null,triggerCount:finite(runMetrics?.personaTriggersByInstance?.[instanceId]),handsContributed:0,chipsDelta:0,multDelta:0,xmultRateDelta:0,finalMultiplierDelta:0,coinsDelta:0});
    }
    const personaUsage=[...usageById.values()].map(item=>({...item,equipped:equippedSlots.has(item.instanceId),equippedSlotIndex:equippedSlots.has(item.instanceId)?equippedSlots.get(item.instanceId):null})).sort((a,b)=>Number(b.equipped)-Number(a.equipped)||b.triggerCount-a.triggerCount||String(a.instanceId).localeCompare(String(b.instanceId)));
    const warnings=[];
    if(!cumulative.dataQuality.hasPerPlayCardGroups)warnings.push('PARTIAL_CARD_GROUP_DATA');
    if(!cumulative.dataQuality.hasCompleteActionOrder)warnings.push('PARTIAL_ACTION_ORDER_DATA');
    if(cumulative.completedBattleCount<afterBattleNumber)warnings.push('INCOMPLETE_BATTLE_WINDOW');
    const snapshot={
      schemaVersion:1,
      id:`AI_BEHAVIOR_SNAPSHOT_V1:${runtimeNodeId}:${afterBattleNumber}`,
      runtimeNodeId,
      afterBattleNumber,
      recentBattleWindow,
      privacy:{containsFullSave:false,containsRawCards:false,containsCardInstanceIds:false,containsFreeText:false},
      windows:{cumulative,recent},
      shop,
      activeBuild,
      personaUsage,
      confidence:{battleSampleSize:cumulative.completedBattleCount,handSampleSize:cumulative.playCount,level:cumulative.completedBattleCount>=9&&cumulative.playCount>=18?'HIGH':cumulative.completedBattleCount>=3&&cumulative.playCount>=6?'MEDIUM':'LOW',warnings}
    };
    return assertValid(snapshot);
  }

  function validate(snapshot){
    const errors=[],require=(condition,message)=>{if(!condition)errors.push(message)};
    require(snapshot?.schemaVersion===1,'行为快照 schemaVersion 必须为 1');
    require(typeof snapshot?.id==='string'&&snapshot.id.startsWith('AI_BEHAVIOR_SNAPSHOT_V1:'),'行为快照 ID 不合法');
    require(typeof snapshot?.runtimeNodeId==='string'&&snapshot.runtimeNodeId.length>0,'行为快照缺少节点 ID');
    require(Number.isInteger(snapshot?.afterBattleNumber)&&snapshot.afterBattleNumber>0,'行为快照关卡截点不合法');
    require(snapshot?.privacy?.containsFullSave===false&&snapshot?.privacy?.containsRawCards===false&&snapshot?.privacy?.containsCardInstanceIds===false&&snapshot?.privacy?.containsFreeText===false,'行为快照隐私边界不完整');
    for(const windowName of ['cumulative','recent']){
      const window=snapshot?.windows?.[windowName];
      require(window&&typeof window==='object',`行为快照缺少 ${windowName} 窗口`);
      for(const field of ['battleCount','completedBattleCount','playCount','totalScore','averageScore','maxScore'])require(Number.isFinite(window?.[field])&&window[field]>=0,`行为快照 ${windowName}.${field} 不合法`);
      require(Array.isArray(window?.handTypes)&&Array.isArray(window?.suits)&&Array.isArray(window?.rankBands)&&Array.isArray(window?.personas),`行为快照 ${windowName} 的统计数组不完整`);
    }
    require(['LOW','MEDIUM','HIGH'].includes(snapshot?.confidence?.level),'行为快照置信度不合法');
    const forbiddenKeys=new Set(['uid','outcome','rawEvents','dynamicPersonaTemplatesById','templateSnapshot','conditions','effects']);
    const visit=value=>{if(!value||typeof value!=='object')return;for(const [key,child] of Object.entries(value)){require(!forbiddenKeys.has(key),`行为快照泄漏禁止字段：${key}`);visit(child)}};
    visit(snapshot);
    return{valid:errors.length===0,errors};
  }

  function assertValid(snapshot){const result=validate(snapshot);if(!result.valid)throw new Error(`AI 行为快照校验失败：\n${result.errors.join('\n')}`);return clone(snapshot)}

  root.AiPersonaBehaviorSnapshot=Object.freeze({create,validate,assertValid,summarizeWindow});
})(globalThis);
