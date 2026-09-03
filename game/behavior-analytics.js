(function(root){
  'use strict';

  function createAggregate(){
    return{schemaVersion:2,actionSequence:0,handTypes:{},scores:[],plays:[],discards:[],discardActions:0,discardedCards:0,maxDiscard:0,suitCounts:{'♥':0,'♦':0,'♣':0,'♠':0},rankBands:{low:0,middle:0,face:0,ace:0},personaTriggers:{},battles:[],availableHands:0,availableDiscards:0,spentCoins:0,earnedCoins:0,purchases:[],deckChanges:0,shopVisits:0,refreshes:0};
  }

  function rankBand(card){
    return card.r==='A'?'ace':['J','Q','K'].includes(card.r)?'face':card.ri<=6?'low':'middle';
  }

  function nextActionSequence(aggregate){
    if(!Number.isInteger(aggregate.actionSequence)){
      aggregate.actionSequence=Math.max(-1,...(aggregate.plays||[]).map(item=>Number.isInteger(item.actionSequence)?item.actionSequence:-1),...(aggregate.discards||[]).map(item=>Number.isInteger(item.actionSequence)?item.actionSequence:-1))+1;
    }
    return aggregate.actionSequence++;
  }

  function recordBattleStart(aggregate,{index,nodeId=null,encounterId=null,target,startScore,startingHands,startingDiscards}){
    aggregate.availableHands+=startingHands;
    aggregate.availableDiscards+=startingDiscards;
    aggregate.battles.push({index,nodeId,encounterId,target,startScore,startingHands,startingDiscards,endScore:null,remainingHands:null,remainingDiscards:null,win:null});
    return aggregate;
  }

  function recordPlay(aggregate,{cards,result,battleIndex,nodeId=null,encounterId=null}){
    aggregate.handTypes[result.type]=(aggregate.handTypes[result.type]||0)+1;
    aggregate.scores.push(result.total);
    result.scoringCards.forEach(card=>{aggregate.suitCounts[card.s]++;aggregate.rankBands[rankBand(card)]++});
    result.events.filter(event=>event.phase==='人格牌'&&!event.detail.includes('禁用')).forEach(event=>aggregate.personaTriggers[event.source]=(aggregate.personaTriggers[event.source]||0)+1);
    const scoringCards=(result.scoringCards||[]).map(card=>({rank:String(card.r),rankIndex:Number(card.ri),suit:card.s,rankBand:rankBand(card)}));
    const personaContributions=(result.personaLogs||[]).filter(log=>log.triggered&&!log.disabled).map(log=>({instanceId:log.instanceId,templateId:log.templateId,chipsDelta:Number(log.chipsDelta||0),multDelta:Number(log.multDelta||0),xmultRateDelta:Number(log.xmultRateDelta||0),finalMultiplierDelta:Number(log.finalMultiplierDelta||0),coinsDelta:Number(log.coinsDelta||0)}));
    aggregate.plays.push({actionSequence:nextActionSequence(aggregate),battleIndex,nodeId,encounterId,type:result.type,typeId:result.typeId||null,selectedCount:cards.length,scoringCount:result.scoringCards.length,score:result.total,selectedSuits:cards.map(card=>card.s),scoringCards,scoreLayers:{base:{...(result.breakdown?.base||{})},final:{chips:Number(result.chips||0),mult:Number(result.mult||0),xmult:Number(result.xmult||1)}},personaContributions,suits:cards.map(card=>card.s),personaEffects:result.events.filter(event=>event.phase==='人格牌').map(event=>event.source)});
    return aggregate;
  }

  function recordDiscard(aggregate,{count,battleIndex,nodeId=null,encounterId=null}){
    aggregate.discardActions++;
    aggregate.discardedCards+=count;
    aggregate.maxDiscard=Math.max(aggregate.maxDiscard,count);
    (aggregate.discards||(aggregate.discards=[])).push({actionSequence:nextActionSequence(aggregate),battleIndex,nodeId,encounterId,count});
    return aggregate;
  }

  function recordBattleEnd(aggregate,{score,remainingHands,remainingDiscards,win}){
    const battle=[...aggregate.battles].reverse().find(item=>item.endScore===null);
    if(battle){battle.endScore=score;battle.remainingHands=remainingHands;battle.remainingDiscards=remainingDiscards;battle.win=win;}
    return aggregate;
  }

  function percent(value){
    return Math.max(0,Math.min(100,Math.round(value||0)));
  }

  function buildReport(aggregate,{handTypeCount=1,maxSelection=5,currentScore=0}={}){
    const behavior=aggregate||createAggregate(),totalPlays=behavior.plays.length,typeEntries=Object.entries(behavior.handTypes).sort((a,b)=>b[1]-a[1]),dominantType=typeEntries[0]?.[0]||'高牌',uniqueTypes=typeEntries.length,totalScoring=Object.values(behavior.suitCounts).reduce((a,b)=>a+b,0),dominantSuit=Object.entries(behavior.suitCounts).sort((a,b)=>b[1]-a[1])[0],totalRanks=Object.values(behavior.rankBands).reduce((a,b)=>a+b,0),dominantRank=Object.entries(behavior.rankBands).sort((a,b)=>b[1]-a[1])[0],mean=behavior.scores.reduce((a,b)=>a+b,0)/Math.max(1,behavior.scores.length),deviation=behavior.scores.reduce((sum,value)=>sum+Math.abs(value-mean),0)/Math.max(1,behavior.scores.length),repeats=behavior.plays.filter((play,index)=>index&&play.type===behavior.plays[index-1].type).length,lastBattle=behavior.battles[behavior.battles.length-1],lastBattleScores=behavior.plays.filter(play=>play.battleIndex===lastBattle?.index),lastScore=lastBattleScores.at(-1)?.score||0;
    const remaining=behavior.battles.reduce((sum,battle)=>sum+(battle.remainingHands||0)+(battle.remainingDiscards||0),0),available=behavior.availableHands+behavior.availableDiscards,earned=Math.max(1,behavior.earnedCoins),overkill=behavior.battles.filter(battle=>battle.endScore!==null).map(battle=>Math.max(0,(battle.endScore-battle.target)/Math.max(1,battle.target))),avgSelected=behavior.plays.reduce((sum,play)=>sum+play.selectedCount,0)/Math.max(1,totalPlays);
    const metrics={focus:percent((typeEntries[0]?.[1]||0)/Math.max(1,totalPlays)*100),diversity:percent(uniqueTypes/Math.max(1,Math.min(handTypeCount,totalPlays))*100),discard:percent(behavior.discardActions/Math.max(1,behavior.availableDiscards)*100),reserve:percent(remaining/Math.max(1,available)*100),finale:percent(lastScore/Math.max(1,lastBattle?.endScore||currentScore)*100),volatility:percent(deviation/Math.max(1,mean)*100),suit:percent((dominantSuit?.[1]||0)/Math.max(1,totalScoring)*100),rank:percent((dominantRank?.[1]||0)/Math.max(1,totalRanks)*100),spending:percent(behavior.spentCoins/earned*100),refresh:percent(behavior.refreshes/Math.max(1,behavior.shopVisits)*50),adaptation:percent((totalPlays>1?(totalPlays-1-repeats)/(totalPlays-1):0)*100),overkill:percent((overkill.reduce((a,b)=>a+b,0)/Math.max(1,overkill.length))*100)};
    const metricDefs=[['focus','牌型集中度'],['diversity','牌型多样度'],['discard','弃牌使用率'],['reserve','资源保留率'],['finale','终局贡献率'],['volatility','得分波动'],['suit','花色偏好'],['rank','点数偏好'],['spending','消费率'],['refresh','刷新倾向'],['adaptation','策略适应度'],['overkill','过量得分率']],top=[...metricDefs].sort((a,b)=>metrics[b[0]]-metrics[a[0]]),topKeys=new Set(top.slice(0,3).map(item=>item[0]));
    let title='均衡的镜厅行者',tags=['均衡','观察','适应'];
    if(topKeys.has('focus')){title=`专注的${dominantType}构筑者`;tags=['专注',dominantType,'构筑'];}
    else if(topKeys.has('reserve')){title='克制的资源守望者';tags=['克制','保留','判断'];}
    else if(topKeys.has('volatility')){title='高波动的机会追逐者';tags=['波动','投入','机会'];}
    else if(topKeys.has('adaptation')){title='灵活的牌型漫游者';tags=['灵活','多样','适应'];}
    else if(topKeys.has('spending')){title='积极的牌库塑形者';tags=['投资','构筑','行动'];}
    const suitName=dominantSuit?.[0]||'无',rankNames={low:'低点牌',middle:'中点牌',face:'人头牌',ace:'尖牌'},evidence=[`共完成 ${totalPlays} 次出牌，最常使用“${dominantType}” ${typeEntries[0]?.[1]||0} 次，使用过 ${uniqueTypes} 种牌型。`,`共弃牌 ${behavior.discardActions} 次、${behavior.discardedCards} 张；单次最多弃 ${behavior.maxDiscard} 张。`,`计分牌中 ${suitName} 占比 ${metrics.suit}%，最常贡献的点数分组为${rankNames[dominantRank?.[0]]||'未知'}。`,`本局获得 ${behavior.earnedCoins} 金币、消费 ${behavior.spentCoins} 金币，完成 ${behavior.deckChanges} 次牌库修改。`,`人格牌共触发 ${Object.values(behavior.personaTriggers).reduce((a,b)=>a+b,0)} 次。`],forgeBias={reflect:dominantType,deviate:metrics.diversity<50?'多样化牌型':'资源管理',fracture:metrics.volatility>=45?'高波动爆发':'高投入回报',risk:percent((metrics.volatility+metrics.discard+avgSelected/maxSelection*100)/3)};
    return{title,tags,copy:`你的本局画像来自 ${totalPlays} 次有效出牌和 ${behavior.discardActions} 次弃牌。最明显的玩法倾向是${tags.join('、')}。`,metrics,metricDefs,evidence,forgeBias,dominantType};
  }

  root.GameBehaviorAnalytics=Object.freeze({createAggregate,rankBand,recordBattleStart,recordPlay,recordDiscard,recordBattleEnd,percent,buildReport});
})(globalThis);
