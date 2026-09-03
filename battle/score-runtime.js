(function(root){
  'use strict';

  function create({pokerEngine,shopRuntime,personaRuntime,stageLimitRuntime=null,personaFeedback,minScore=1,maxSelection=5}={}){
    if(!pokerEngine||!shopRuntime||!personaRuntime||!personaFeedback)throw new Error('BattleScoreRuntime requires poker, shop, persona and feedback runtimes');

    function resolve({cards,consume=false,handTypes,growthState={},stageLimitInstance=null,stageLimitView=null,context={}}={}){
      const evaluation=pokerEngine.evaluate(cards,handTypes,maxSelection),growth={suitChipBonusBySuit:{},handTypeLevelsById:{},...growthState},handLevel=Number(growth.handTypeLevelsById?.[evaluation.typeId]||0),handChipBonus=Math.round(evaluation.chips*.1)*handLevel,handMultBonus=Number((evaluation.mult*.1*handLevel).toFixed(4)),baseHandChips=evaluation.chips+handChipBonus,baseHandMult=evaluation.mult+handMultBonus,events=[{phase:'牌型',source:evaluation.type,detail:`${evaluation.chips} 筹码 ×${evaluation.mult}`,chipsDelta:evaluation.chips,multDelta:evaluation.mult}],uniqueSuits=new Set(cards.map(card=>card.si)).size;
      if(handLevel)events.push({phase:'牌型强化',source:`${evaluation.type} Lv.${handLevel}`,detail:`基础筹码 +${handChipBonus}，基础倍率 +${handMultBonus}`,chipsDelta:handChipBonus,multDelta:handMultBonus});
      let chips=baseHandChips,mult=baseHandMult,xmult=1,cardXmultTotal=1,cardBonusChips=0,cardBonusMult=0,faceRuleApplied=false,cardGoldDelta=0,personaGoldDelta=0,pendingPersonaCommit=null,committedResult=null,stageLimitEvent=null;
      for(const card of evaluation.scoringCards){
        const attributes=shopRuntime.cardUpgradeAttributes(card),baseFace=pokerEngine.faceChipValue(card),face=stageLimitRuntime?.adjustFaceChips(stageLimitInstance,card,baseFace)??baseFace,suitBonus=Number(growth.suitChipBonusBySuit?.[card.s]||0),bonus=attributes.bonusChips+suitBonus,cardMult=attributes.bonusMult,cardXmult=attributes.bonusXmultFactor,cardGold=attributes.bonusCoins,details=[];
        chips+=face+bonus;mult+=cardMult;xmult*=cardXmult;cardXmultTotal*=cardXmult;cardBonusChips+=bonus;cardBonusMult+=cardMult;cardGoldDelta+=cardGold;if(face!==baseFace)faceRuleApplied=true;
        details.push(`+${face}${face!==baseFace?'（规则调整）':''}${attributes.bonusChips?`，单卡强化 +${attributes.bonusChips}`:''}${suitBonus?`，花色强化 +${suitBonus}`:''} 筹码`);if(cardMult)details.push(`基础倍率 +${cardMult}`);if(cardXmult!==1)details.push(`独立倍率 ×${Number(cardXmult.toFixed(4))}`);if(cardGold)details.push(`金币 +${cardGold}`);
        events.push({phase:'计分牌',source:`${card.r}${card.s}`,cardUid:card.uid,detail:details.join('，'),chipsDelta:face+bonus,multDelta:cardMult,xmultFactor:cardXmult,coinsDelta:cardGold});
      }
      const handConfig=handTypes.find(item=>item.id===evaluation.typeId),runtimeContext={runTemplateId:context.runTemplateId,nodeId:context.nodeId,encounterId:context.encounterId,handIndex:context.handIndex,submittedCards:cards,scoringCards:evaluation.scoringCards,scoringCardCount:evaluation.scoringCards.length,currentHandCardCount:context.currentHandCardCount,handType:evaluation.type,handTypeId:evaluation.typeId,handPriority:handConfig?.priority||0,handQualityId:handConfig?.qualityId||'NORMAL',previousHandType:context.previousHandType,uniqueSuitCount:uniqueSuits,straight:evaluation.straight,flush:evaluation.flush,hasMatchedRankStructure:evaluation.pair,remainingHands:context.remainingHands,remainingDiscards:context.remainingDiscards,disabledSlotIndexes:context.disabledSlotIndexes||[]},runtimeScoreLayers={chips,mult,xmult},runtimeResult=personaRuntime.evaluateHand(runtimeContext,{commit:false,scoreLayers:runtimeScoreLayers}),previewHistory=runtimeResult.state.personaHistory;
      pendingPersonaCommit={runtimeContext,runtimeScoreLayers};
      chips+=runtimeResult.chipsDelta;mult+=runtimeResult.multDelta;xmult*=runtimeResult.finalMultiplier;personaGoldDelta+=runtimeResult.coinsDelta||0;
      const beforeLimit={chips,mult,xmult},limitAdjusted=stageLimitRuntime?.adjustScore(stageLimitInstance,{handIndex:context.handIndex,submittedCount:cards.length,handTypeId:evaluation.typeId,handQualityId:handConfig?.qualityId||'NORMAL',previousHandTypeId:context.previousHandTypeId,baseHandChips,baseHandMult,chips,mult,cardXmult:cardXmultTotal,personaXmult:runtimeResult.finalMultiplier,bonusChips:cardBonusChips+runtimeResult.chipsDelta,bonusMult:cardBonusMult+runtimeResult.multDelta,personaChips:runtimeResult.chipsDelta,personaMult:runtimeResult.multDelta,personaTriggerCount:runtimeResult.logs.filter(item=>item.triggered).length})||beforeLimit;
      if(limitAdjusted.applied){chips=limitAdjusted.chips;mult=limitAdjusted.mult;xmult=limitAdjusted.xmult;stageLimitEvent={phase:'关卡限制',source:stageLimitView?.name||'本场规则',detail:stageLimitView?.description||'规则生效',chipsDelta:chips-beforeLimit.chips,multDelta:mult-beforeLimit.mult,xmultFactor:beforeLimit.xmult?xmult/beforeLimit.xmult:1};}
      for(const log of runtimeResult.logs){
        if(!log.triggered)continue;
        for(const effect of log.effects||[]){
          const echo=effect.repeatIndex?'（完美回响）':'',attributeLabel=effect.attributeSource==='SUB'?`第${effect.attributePosition}属性`:'主属性',common={phase:'人格牌',source:effect.attributeSource==='SUB'?`${log.name} · ${attributeLabel}`:log.name,attributeLabel,effectType:effect.type,targetCardUid:effect.targetCardUid||effect.cardUid||null};
          if(effect.type==='ADD_CHIPS')events.push({...common,detail:`+${effect.value} 筹码${echo}`,chipsDelta:effect.value});
          else if(effect.type==='ADD_MULT')events.push({...common,detail:`+${effect.value} 倍率${echo}`,multDelta:effect.value});
          else if(effect.type==='ADD_XMULT_RATE')events.push({...common,detail:`独立倍率 +${Number((effect.value*100).toFixed(4))}%${echo}`,xmultFactor:1+effect.value});
          else if(effect.type==='ADD_COINS')events.push({...common,detail:`+${effect.value} 金币${echo}`,coinsDelta:effect.value});
          else if(effect.type==='MULTIPLY_FINAL')events.push({...common,detail:`最终倍率 ×${effect.value}${echo}`,xmultFactor:effect.value});
          else if(['MODIFY_CARD','ADD_CARD_CHIPS','UPGRADE_CARD'].includes(effect.type))events.push({...common,detail:effect.detail||effect.effectText||`目标卡牌获得强化${echo}`});
        }
      }
      if(faceRuleApplied&&!stageLimitEvent)stageLimitEvent={phase:'关卡限制',source:stageLimitView?.name||'本场规则',detail:stageLimitView?.description||'规则生效'};
      if(stageLimitEvent)events.push(stageLimitEvent);
      const total=Math.max(minScore,Math.round(chips*mult*xmult));
      if(consume&&pendingPersonaCommit){
        committedResult=personaRuntime.evaluateHand(pendingPersonaCommit.runtimeContext,{commit:true,scoreLayers:pendingPersonaCommit.runtimeScoreLayers});
        for(const log of committedResult.logs.filter(item=>item.triggered))events.push({phase:'人格调试',source:log.name,detail:`人格层得分 ${committedResult.scoreBefore} → ${committedResult.scoreAfter}；状态 ${JSON.stringify(log.runtimeBefore)} → ${JSON.stringify(log.runtimeAfter)}`});
      }
      events.push({phase:'汇总',source:'最终得分',detail:`${chips} × ${mult}${xmult!==1?` × ${xmult}`:''} = ${total}`});
      const personaLogs=committedResult?.logs||runtimeResult.logs,breakdown=personaFeedback.buildScoreBreakdown({baseLayers:runtimeScoreLayers,personaLogs,otherEvents:stageLimitEvent?[stageLimitEvent]:[],finalLayers:{chips,mult,xmult},finalScore:total});
      return{...evaluation,chips,mult,xmult,goldDelta:cardGoldDelta+personaGoldDelta,cardGoldDelta,personaGoldDelta,total,events,personaLogs,previewHistory,breakdown};
    }

    return Object.freeze({resolve});
  }

  root.BattleScoreRuntime=Object.freeze({create});
})(globalThis);
