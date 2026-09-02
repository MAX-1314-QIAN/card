const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

function createRulesContext(){
  const context={console,Date,JSON,Number,Array,Object,String,Boolean,Math,Map,Set};
  context.globalThis=context;
  vm.createContext(context);
  loadBalance(context);
  return context;
}

const rules=createRulesContext();
const manifest=rules.PERSONA_BALANCE_MANIFEST;
const pokerEngine=rules.PokerEngine;
const targetTemplate=manifest.runTemplates.find(item=>item.id==='RUN_TEMPLATE_TARGET');
const targetHandProfile=manifest.pokerHandProfiles.find(item=>item.id===targetTemplate.scoringProfileId);
const nodeById=new Map(manifest.stageNodes.map(node=>[node.id,node]));
const battleNodes=targetTemplate.nodeIds.map(id=>nodeById.get(id)).filter(node=>node?.type==='BATTLE');
const growthNodeByAfterBattle=new Map([
  ['N03',nodeById.get('N04')],['N07',nodeById.get('N08')],['N11',nodeById.get('N12')]
]);
const growthProfiles=new Map(manifest.personaTemplates.growthProfiles.map(item=>[item.id,item]));
const templateById=new Map(manifest.personaTemplates.templates.map(item=>[item.id,item]));
const fixedLoadoutIds=['observer','wanderer','pathfinder','restraint'];
const previewScoreCache=new Map();
function handScoreAnchor(hand){return hand?.targetSingleHandScore??(hand?.chips||0)*(hand?.mult||0)}

function seededRandom(seed){
  let value=seed>>>0;
  return function(){
    value=(value+0x6D2B79F5)|0;
    let mixed=Math.imul(value^(value>>>15),1|value);
    mixed=(mixed+Math.imul(mixed^(mixed>>>7),61|mixed))^mixed;
    return((mixed^(mixed>>>14))>>>0)/4294967296;
  };
}

function combinations(length,maxSize){
  const result=[];
  function visit(start,picked,size){
    if(picked.length===size){result.push([...picked]);return}
    for(let index=start;index<length;index++){picked.push(index);visit(index+1,picked,size);picked.pop()}
  }
  for(let size=1;size<=Math.min(maxSize,length);size++)visit(0,[],size);
  return result;
}

const handCombinationIndexes=combinations(targetTemplate.actionRules.startingHandSize,targetTemplate.actionRules.maxSelection);

function createRuntime(){
  const runtime=rules.PersonaRuntime.create({templates:manifest.personaTemplates.templates,slotCount:targetTemplate.actionRules.personaSlots,now:()=>1,idFactory:id=>`SIM_${id}`});
  runtime.initializeLoadout(fixedLoadoutIds.map((templateId,index)=>({templateId,instanceId:`SIM_BASE_${index}_${templateId}`,source:'SIMULATION_ASSUMPTION'})),{source:'SIMULATION_ASSUMPTION'});
  return runtime;
}

function runtimePreviewKey(state){
  const equipped=state.equippedPersonaInstanceIds.filter(Boolean).map(id=>{const instance=state.personaInstancesById[id];return`${instance.templateId}:${JSON.stringify(instance.runtimeState)}`}).join('|'),history=state.personaHistory||{};
  return`${equipped}|${history.previousHandType||''}|${history.sameHandTypeStreak||0}|${[...(history.usedHandTypes||[])].sort().join(',')}`;
}

function nakedSignature(naked,cards){return`${naked.typeId}|${naked.totalChips}|${naked.mult}|${cards.length}|${new Set(cards.map(card=>card.si)).size}|${naked.straight?1:0}|${naked.flush?1:0}|${naked.pair?1:0}`}

function scoreCandidate(runtime,cards,{handsRemaining,discardsRemaining,commit=false,nakedResult=null,previewKey=null}={}){
  const naked=nakedResult||pokerEngine.nakedScore(cards,targetHandProfile.hands,targetTemplate.actionRules.maxSelection),cacheKey=!commit&&previewKey?`${previewKey}|${nakedSignature(naked,cards)}`:null,cached=cacheKey&&previewScoreCache.get(cacheKey);
  if(cached)return{...naked,total:cached.total,personaResult:cached.personaResult,context:null};
  const context={
    runTemplateId:targetTemplate.id,nodeId:null,encounterId:null,
    submittedCards:cards,scoringCards:naked.scoringCards,handType:naked.type,handTypeId:naked.typeId,
    uniqueSuitCount:new Set(cards.map(card=>card.si)).size,straight:naked.straight,flush:naked.flush,
    hasMatchedRankStructure:naked.pair,remainingHands:handsRemaining,remainingDiscards:discardsRemaining,
    disabledSlotIndexes:[]
  };
  const persona=runtime.evaluateHand(context,{commit,scoreLayers:{chips:naked.totalChips,mult:naked.mult,xmult:1}});
  const result={...naked,total:Math.max(1,persona.scoreAfter),personaResult:persona,context};
  if(cacheKey)previewScoreCache.set(cacheKey,{total:result.total,personaResult:{finalMultiplier:persona.finalMultiplier,scoreBefore:persona.scoreBefore,scoreAfter:persona.scoreAfter}});
  return result;
}

function hasEquippedTemplate(runtime,templateId){return runtime.getEquippedPersonas().some(instance=>instance.templateId===templateId)}

function chooseBestPlay(runtime,hand,policy,handsRemaining,discardsRemaining){
  const runtimeState=runtime.getState(),history=runtimeState.personaHistory,previewKey=runtimePreviewKey(runtimeState),archiveEquipped=hasEquippedTemplate(runtime,'TARGET_PROTO_GROWTH_ARCHIVE'),finalEchoEquipped=hasEquippedTemplate(runtime,'TARGET_PROTO_FINAL_ECHO');
  let best=null;
  for(const indexes of handCombinationIndexes){
    const cards=indexes.map(index=>hand[index]),naked=pokerEngine.nakedScore(cards,targetHandProfile.hands,targetTemplate.actionRules.maxSelection),result=scoreCandidate(runtime,cards,{handsRemaining,discardsRemaining,nakedResult:naked,previewKey});
    let utility=result.total;
    if(policy==='PERSONA_AWARE'){
      if(archiveEquipped&&!history.usedHandTypes.includes(result.typeId))utility*=1.08;
      if(finalEchoEquipped&&history.previousHandType===result.typeId)utility*=1.04;
    }
    if(!best||utility>best.utility||(utility===best.utility&&result.total>best.result.total))best={indexes,cards,result,utility};
  }
  return best;
}

function drawTo(hand,deck,size){while(hand.length<size&&deck.length)hand.push(deck.pop())}

function chooseDiscardIndexes(hand,bestIndexes){
  const protectedIndexes=new Set(bestIndexes),candidates=hand.map((card,index)=>({card,index})).filter(item=>!protectedIndexes.has(item.index)).sort((a,b)=>a.card.ri-b.card.ri||a.card.si-b.card.si);
  return candidates.slice(0,Math.min(5,candidates.length)).map(item=>item.index).sort((a,b)=>b-a);
}

function playBattle(runtime,node,random,policy,runIndex,handLog){
  runtime.resetBattle();
  const deck=pokerEngine.shuffle(pokerEngine.createStandardDeck({uidPrefix:`sim-${runIndex}-${node.id}`}),random),hand=[];
  const ruleset=targetTemplate.actionRules;
  let handsRemaining=ruleset.baseHands,discardsRemaining=ruleset.baseDiscards,score=0,handsUsed=0,discardsUsed=0;
  drawTo(hand,deck,ruleset.startingHandSize);
  while(handsRemaining>0&&score<node.targetScore){
    const best=chooseBestPlay(runtime,hand,policy,handsRemaining,discardsRemaining),neededPerHand=(node.targetScore-score)/Math.max(1,handsRemaining),discardThreshold=policy==='PERSONA_AWARE'?0.82:0.72,discardIndexes=chooseDiscardIndexes(hand,best.indexes);
    if(discardsRemaining>0&&discardIndexes.length>=2&&best.result.total<neededPerHand*discardThreshold){
      const discarded=discardIndexes.map(index=>hand[index]);
      runtime.processDiscard(discarded.length,{commit:true,context:{runTemplateId:targetTemplate.id,nodeId:node.id,remainingHands:handsRemaining,remainingDiscards:discardsRemaining-1,disabledSlotIndexes:[]}});
      for(const index of discardIndexes)hand.splice(index,1);
      discardsRemaining--;discardsUsed++;drawTo(hand,deck,ruleset.startingHandSize);continue;
    }
    const committed=scoreCandidate(runtime,best.cards,{handsRemaining,discardsRemaining,commit:true});
    score+=committed.total;handsRemaining--;handsUsed++;
    const state=runtime.getState(),equipped=runtime.getEquippedPersonas();
    handLog.push({nodeId:node.id,score:committed.total,nakedScore:committed.total===undefined?0:committed.total-(committed.personaResult.scoreAfter-committed.personaResult.scoreBefore),typeId:committed.typeId,type:committed.type,targetSingleHandScore:handScoreAnchor(targetHandProfile.hands.find(item=>item.id===committed.typeId)),cards:best.cards.map(card=>({...card})),personaIds:equipped.map(instance=>instance.templateId),finalMultiplier:committed.personaResult.finalMultiplier,historyUsedTypes:[...(state.personaHistory?.usedHandTypes||[])]});
    const played=new Set(best.indexes);for(let index=hand.length-1;index>=0;index--)if(played.has(index))hand.splice(index,1);
    if(score<node.targetScore)drawTo(hand,deck,ruleset.startingHandSize);
  }
  return{nodeId:node.id,targetScore:node.targetScore,score,win:score>=node.targetScore,handsUsed,discardsUsed,remainingHands:handsRemaining,remainingDiscards:discardsRemaining};
}

function average(values){return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0}

function trialGrowthUtility(snapshot,candidateId,slotIndex,sampleHands,policy){
  const trial=rules.PersonaRuntime.create({templates:manifest.personaTemplates.templates,slotCount:targetTemplate.actionRules.personaSlots});
  trial.restore(snapshot);
  if(slotIndex>=0)trial.replacePersona(slotIndex,candidateId);
  let utility=average(sampleHands.map(cards=>scoreCandidate(trial,cards,{handsRemaining:4,discardsRemaining:3}).total));
  const template=trial.getTemplate(snapshot.personaInstancesById[candidateId].templateId);
  if(policy==='PERSONA_AWARE'&&slotIndex>=0){
    if((template.effects||[]).some(effect=>effect.valuePerStack))utility*=1.25;
    if((template.effects||[]).some(effect=>effect.type==='MULTIPLY_FINAL'))utility*=1.20;
    if((template.effects||[]).some(effect=>effect.type==='ADD_CHIPS'))utility*=1.05;
  }
  return utility;
}

function applyGrowth(runtime,growthNode,policy,handLog){
  const profile=growthProfiles.get(growthNode.growthProfileId),candidate=runtime.createInstance(profile.templateId,{source:profile.source,generatedAtNodeId:growthNode.id,generatedAtBattleIndexCompat:battleNodes.findIndex(node=>node.id===growthNode.id)}),snapshot=runtime.getState();
  const fallbackCards=[pokerEngine.createStandardDeck().slice(0,2),pokerEngine.createStandardDeck().slice(8,11),pokerEngine.createStandardDeck().slice(20,25)],sampleHands=handLog.slice(-12).map(item=>item.cards),samples=sampleHands.length?sampleHands:fallbackCards;
  const choices=[-1,0,1,2,3].map(slotIndex=>({slotIndex,utility:trialGrowthUtility(snapshot,candidate.instanceId,slotIndex,samples,policy)})).sort((a,b)=>b.utility-a.utility),keep=choices.find(item=>item.slotIndex===-1),best=choices[0],shouldEquip=best.slotIndex>=0&&best.utility>keep.utility*1.01;
  if(shouldEquip)runtime.replacePersona(best.slotIndex,candidate.instanceId);
  return{nodeId:growthNode.id,templateId:profile.templateId,name:templateById.get(profile.templateId).name,equipped:shouldEquip,replacedSlot:shouldEquip?best.slotIndex:null,utilityBefore:keep.utility,utilityAfter:shouldEquip?best.utility:keep.utility,estimatedImmediateChangePct:keep.utility?((shouldEquip?best.utility:keep.utility)/keep.utility-1)*100:0};
}

function simulateRun({policy,seed,runIndex=0,targetOverrides={}}={}){
  const random=seededRandom(seed),runtime=createRuntime(),battles=[],handLog=[],growthDecisions=[];
  for(const node of battleNodes){
    const effectiveNode=Number.isFinite(targetOverrides[node.id])?{...node,targetScore:targetOverrides[node.id]}:node,battle=playBattle(runtime,effectiveNode,random,policy,runIndex,handLog);battles.push(battle);
    if(!battle.win)break;
    const growthNode=growthNodeByAfterBattle.get(node.id);
    if(growthNode)growthDecisions.push(applyGrowth(runtime,growthNode,policy,handLog));
  }
  const singleScores=handLog.map(item=>item.score);
  return{policy,seed,battles,handLog,growthDecisions,cleared:battles.length===battleNodes.length&&battles.at(-1).win,runTotalScore:battles.reduce((sum,item)=>sum+item.score,0),maxSingleHandScore:singleScores.length?Math.max(...singleScores):0};
}

function percentile(values,p){
  if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b),index=(sorted.length-1)*p,lower=Math.floor(index),upper=Math.ceil(index),weight=index-lower;
  return sorted[lower]*(1-weight)+sorted[upper]*weight;
}

function summarizePolicy(policy,runs){
  const nodeStats=Object.fromEntries(battleNodes.map(node=>{
    const entered=runs.flatMap(run=>run.battles.filter(item=>item.nodeId===node.id)),scores=entered.map(item=>item.score),margins=entered.map(item=>item.score-item.targetScore);
    return[node.id,{enteredRuns:entered.length,clearRate:entered.length?entered.filter(item=>item.win).length/entered.length:0,targetScore:entered[0]?.targetScore??node.targetScore,medianBattleScore:percentile(scores,.5),p25:percentile(scores,.25),p75:percentile(scores,.75),p90:percentile(scores,.9),medianHandsUsed:percentile(entered.map(item=>item.handsUsed),.5),medianDiscardsUsed:percentile(entered.map(item=>item.discardsUsed),.5),medianScoreMargin:percentile(margins,.5)}];
  }));
  const failCounts={};for(const run of runs)if(!run.cleared){const node=run.battles.at(-1)?.nodeId||'未进入';failCounts[node]=(failCounts[node]||0)+1}
  return{policy,runCount:runs.length,fullClearRate:runs.filter(run=>run.cleared).length/runs.length,averageBattlesReached:average(runs.map(run=>run.battles.length)),mostCommonFailNode:Object.entries(failCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'无',medianRunTotalScore:percentile(runs.map(run=>run.runTotalScore),.5),medianMaxSingleHandScore:percentile(runs.map(run=>run.maxSingleHandScore),.5),maxSingleHandScoreObserved:Math.max(...runs.map(run=>run.maxSingleHandScore)),nodeStats};
}

const growthSegments={N04:{before:['N01','N02','N03'],after:['N05','N06','N07']},N08:{before:['N05','N06','N07'],after:['N09','N10','N11']},N12:{before:['N09','N10','N11'],after:['N13','N14','N15']}};
function summarizeGrowth(runs){
  const result={};
  for(const [nodeId,segment] of Object.entries(growthSegments)){
    const eligible=runs.filter(run=>run.growthDecisions.some(item=>item.nodeId===nodeId)&&run.handLog.some(item=>segment.after.includes(item.nodeId))),before=eligible.flatMap(run=>run.handLog.filter(item=>segment.before.includes(item.nodeId)).map(item=>item.score)),after=eligible.flatMap(run=>run.handLog.filter(item=>segment.after.includes(item.nodeId)).map(item=>item.score)),decisions=eligible.map(run=>run.growthDecisions.find(item=>item.nodeId===nodeId));
    const beforeMean=average(before),afterMean=average(after),beforeMedian=percentile(before,.5),afterMedian=percentile(after,.5);
    result[nodeId]={eligibleRuns:eligible.length,beforeMean,afterMean,meanChangePct:beforeMean?(afterMean/beforeMean-1)*100:0,beforeMedian,afterMedian,medianChangePct:beforeMedian?(afterMedian/beforeMedian-1)*100:0,equipRate:decisions.length?decisions.filter(item=>item.equipped).length/decisions.length:0,replacedSlots:Object.fromEntries([0,1,2,3].map(slot=>[slot,decisions.filter(item=>item.replacedSlot===slot).length]))};
  }
  return result;
}

function summarizeHands(runs){
  const allHands=runs.flatMap(run=>run.handLog),byType={};
  for(const handType of targetHandProfile.hands){
    const hands=allHands.filter(item=>item.typeId===handType.id),nakedScores=hands.map(item=>pokerEngine.nakedScore(item.cards,targetHandProfile.hands,targetTemplate.actionRules.maxSelection).total),mean=average(nakedScores),targetSingleHandScore=handScoreAnchor(handType),deviation=hands.length?(mean/targetSingleHandScore-1)*100:null,abs=deviation===null?null:Math.abs(deviation),status=deviation===null?'NO_SAMPLE':abs<=15?'KEEP':abs<=30?'REVIEW':'STRONG_REVIEW';
    byType[handType.id]={name:handType.name,scoredCount:hands.length,simulatedMeanNakedScore:mean,targetSingleHandScore,deviationPct:deviation,status};
  }
  return byType;
}

function pressureLabel(value){return value<.75?'明显偏松':value<=.95?'基本合理':value<=1.10?'偏紧':'明显过难'}

function runSimulation({runsPerPolicy=1000,seed=20260815,targetOverrides={}}={}){
  const policies=['GREEDY_SCORE','PERSONA_AWARE'],policyRuns={};
  for(const [policyIndex,policy] of policies.entries()){
    policyRuns[policy]=[];
    for(let runIndex=0;runIndex<runsPerPolicy;runIndex++)policyRuns[policy].push(simulateRun({policy,seed:seed+policyIndex*1000003+runIndex*7919,runIndex,targetOverrides}));
  }
  const summaries=Object.fromEntries(policies.map(policy=>[policy,summarizePolicy(policy,policyRuns[policy])])),allRuns=policies.flatMap(policy=>policyRuns[policy]),allHands=allRuns.flatMap(run=>run.handLog),highest=allHands.reduce((best,item)=>!best||item.score>best.score?item:best,null),highestAnchor=highest?.targetSingleHandScore||1,outlierStatus=highest&&highest.score/highestAnchor>3?'HIGH_SCORE_OUTLIER':'NO_OBVIOUS_EXPLOSION';
  for(const summary of Object.values(summaries))for(const stat of Object.values(summary.nodeStats)){stat.pressureMedian=stat.medianBattleScore?stat.targetScore/stat.medianBattleScore:Infinity;stat.pressureLabel=pressureLabel(stat.pressureMedian)}
  return{meta:{seed,runsPerPolicy,totalRuns:runsPerPolicy*2,targetOverrides:{...targetOverrides},simulationAssumption:{fixedLoadoutIds:[...fixedLoadoutIds],fixedLoadoutNames:fixedLoadoutIds.map(id=>templateById.get(id).name),boss:false,route:false,shop:false,storage:false,targetDurationMinutes:targetTemplate.targetDurationMinutes,estimatedMinutes:targetTemplate.nodeIds.map(id=>nodeById.get(id)).filter(Boolean).reduce((sum,node)=>sum+(node.estimatedMinutes||0),0),formalPokerEngine:true,formalPersonaRuntime:true,targetScoringProfileId:targetHandProfile.id}},summaries,growth:Object.fromEntries(policies.map(policy=>[policy,summarizeGrowth(policyRuns[policy])])),handTypes:summarizeHands(allRuns),highestHand:highest?{score:highest.score,nodeId:highest.nodeId,handType:highest.type,personaIds:highest.personaIds,personaNames:highest.personaIds.map(id=>templateById.get(id)?.name||id),finalMultiplier:highest.finalMultiplier,targetAnchor:highestAnchor,anchorMultiple:highest.score/highestAnchor}:null,outlierStatus};
}

function verifyGrowthImpact(){
  const runtime=createRuntime(),cards=pokerEngine.createStandardDeck().filter(card=>['2','5','9'].includes(card.r)).slice(0,3),before=scoreCandidate(runtime,cards,{handsRemaining:4,discardsRemaining:3}).total,candidate=runtime.createInstance('TARGET_PROTO_CHIP_ANCHOR',{source:'TEST'});runtime.replacePersona(0,candidate.instanceId);const after=scoreCandidate(runtime,cards,{handsRemaining:4,discardsRemaining:3}).total;return{before,after,changed:after!==before};
}

module.exports={rules,manifest,pokerEngine,targetHandProfile,targetTemplate,battleNodes,seededRandom,scoreCandidate,simulateRun,runSimulation,verifyGrowthImpact,percentile};
