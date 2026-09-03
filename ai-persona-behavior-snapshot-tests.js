const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Math,JSON,Map,Set,Array,Object,String,Number,Date};
context.globalThis=context;
vm.createContext(context);
const balance=loadBalance(context);
const analytics=context.GameBehaviorAnalytics,snapshotRuntime=context.AiPersonaBehaviorSnapshot,aggregate=analytics.createAggregate();

function card(rank,suit,rankIndex){return{r:rank,s:suit,ri:rankIndex}}
function result({type,typeId,score,cards,persona=[]}){
  return{
    type,typeId,total:score,scoringCards:cards,chips:100,mult:2,xmult:1,
    events:persona.map(item=>({phase:'人格牌',source:item.instanceId,detail:'+10 筹码'})),
    personaLogs:persona.map(item=>({triggered:true,disabled:false,instanceId:item.instanceId,templateId:item.templateId,chipsDelta:item.chipsDelta||0,multDelta:item.multDelta||0,xmultRateDelta:item.xmultRateDelta||0,finalMultiplierDelta:item.finalMultiplierDelta||0,coinsDelta:0})),
    breakdown:{base:{chips:90,mult:2,xmult:1},final:{chips:100,mult:2,xmult:1}}
  };
}
function startBattle(index){analytics.recordBattleStart(aggregate,{index,nodeId:`N${String(index+1).padStart(2,'0')}`,encounterId:'TEST',target:900+index*100,startScore:0,startingHands:4,startingDiscards:3})}
function endBattle(){analytics.recordBattleEnd(aggregate,{score:1000,remainingHands:2,remainingDiscards:2,win:true})}

startBattle(0);
analytics.recordPlay(aggregate,{cards:[card('10','♥',10),card('10','♦',10)],result:result({type:'对子',typeId:'pair',score:160,cards:[card('10','♥',10),card('10','♦',10)],persona:[{instanceId:'P1',templateId:'PER_001',chipsDelta:10}]}),battleIndex:0,nodeId:'N01'});
analytics.recordDiscard(aggregate,{count:2,battleIndex:0,nodeId:'N01'});
analytics.recordPlay(aggregate,{cards:[card('K','♣',13),card('K','♠',13)],result:result({type:'对子',typeId:'pair',score:210,cards:[card('K','♣',13),card('K','♠',13)],persona:[{instanceId:'P1',templateId:'PER_001',chipsDelta:10}]}),battleIndex:0,nodeId:'N01'});
endBattle();

startBattle(1);
analytics.recordPlay(aggregate,{cards:[card('2','♠',2),card('3','♥',3),card('4','♦',4),card('5','♣',5),card('6','♠',6)],result:result({type:'顺子',typeId:'straight',score:300,cards:[card('2','♠',2),card('3','♥',3),card('4','♦',4),card('5','♣',5),card('6','♠',6)],persona:[{instanceId:'P2',templateId:'PER_002',multDelta:1}]}),battleIndex:1,nodeId:'N02'});
endBattle();

startBattle(2);
analytics.recordPlay(aggregate,{cards:[card('Q','♥',12),card('Q','♦',12)],result:result({type:'对子',typeId:'pair',score:240,cards:[card('Q','♥',12),card('Q','♦',12)],persona:[]}),battleIndex:2,nodeId:'N03'});
endBattle();

startBattle(3);
analytics.recordPlay(aggregate,{cards:[card('2','♣',2),card('4','♣',4),card('6','♣',6),card('8','♣',8),card('10','♣',10)],result:result({type:'同花',typeId:'flush',score:500,cards:[card('2','♣',2),card('4','♣',4),card('6','♣',6),card('8','♣',8),card('10','♣',10)],persona:[]}),battleIndex:3,nodeId:'N05'});
endBattle();

aggregate.shopVisits=1;aggregate.refreshes=2;aggregate.earnedCoins=12;aggregate.spentCoins=10;aggregate.deckChanges=1;
aggregate.purchases.push(
  {nodeId:'N04',itemId:'SHOP_SERVICE_001',itemType:'SERVICE',effectType:'UPGRADE_CARD',targetId:'private-card-uid',price:2,outcome:'这段自由文本不得进入快照'},
  {nodeId:'N04',itemId:'SHOP_SERVICE_007',itemType:'SERVICE',effectType:'UPGRADE_SUIT',targetId:'♥',price:8,outcome:'红桃强化'}
);

const personaState={
  runPersonaPool:['P1','P2','P3'],
  equippedPersonaInstanceIds:['P1','P3',null,null],
  personaInstancesById:{
    P1:{instanceId:'P1',templateId:'PER_001',shopMainStatUpgrade:{level:1,attributeType:'BASE_CHIPS'}},
    P2:{instanceId:'P2',templateId:'PER_002'},
    P3:{instanceId:'P3',templateId:'PER_003'}
  }
};
const runMetrics={personaTriggersByInstance:{P1:2,P2:1,P3:0},rawEvents:[{type:'SHOP_REFRESH',cost:0},{type:'SHOP_REFRESH',cost:1},{type:'PERSONA_ATTRIBUTE_UNLOCKED',instanceId:'P1',attributePosition:2,cost:5},{type:'PLAY',uid:'private-event-value'}]};
const shopGrowthState={suitLevelsBySuit:{'♥':2},suitChipBonusBySuit:{'♥':10},handTypeLevelsById:{pair:1}};
const handTypes=balance.target.scoringProfile.hands;
const snapshot=snapshotRuntime.create({runtimeNodeId:'N04',afterBattleNumber:3,aggregate,runMetrics,personaState,shopGrowthState,handTypes,shopConfig:balance.shop});

assert.strictEqual(snapshot.schemaVersion,1);
assert.strictEqual(snapshot.runtimeNodeId,'N04');
assert.strictEqual(snapshot.afterBattleNumber,3);
assert.strictEqual(snapshot.windows.cumulative.completedBattleCount,3,'第 4 场数据必须被截点排除');
assert.strictEqual(snapshot.windows.cumulative.playCount,4);
assert.strictEqual(snapshot.windows.cumulative.totalScore,910);
assert.strictEqual(snapshot.windows.cumulative.dominantHandTypeId,'pair');
assert.deepStrictEqual(Array.from(snapshot.windows.cumulative.topTwoHandTypeIds),['pair','straight']);
assert.strictEqual(snapshot.windows.cumulative.actions.discardFollowUpCount,1);
assert.strictEqual(snapshot.windows.cumulative.actions.discardFollowUpAverageScore,210);
assert.strictEqual(snapshot.windows.cumulative.maxSameHandTypeStreak,2);
assert.strictEqual(snapshot.windows.cumulative.dominantRankBandId,'low');
assert.strictEqual(snapshot.windows.cumulative.dataQuality.hasPerPlayCardGroups,true);
assert.strictEqual(snapshot.windows.cumulative.dataQuality.hasCompleteActionOrder,true);

assert.strictEqual(snapshot.shop.freeRefreshes,1);
assert.strictEqual(snapshot.shop.paidRefreshes,1);
assert.strictEqual(snapshot.shop.targetedUpgrades.find(item=>item.effectType==='UPGRADE_CARD').targetId,'CARD_TARGET','卡牌实例 ID 必须被聚合占位符替换');
assert.strictEqual(snapshot.activeBuild.suitUpgrades[0].id,'♥');
assert.strictEqual(snapshot.activeBuild.handTypeUpgrades[0].id,'pair');
assert.strictEqual(snapshot.activeBuild.personaMainUpgrades[0].instanceId,'P1');
assert.strictEqual(snapshot.personaUsage.find(item=>item.instanceId==='P3').triggerCount,0,'已装备但未触发的人格也必须进入快照');
assert.strictEqual(snapshot.personaUsage.find(item=>item.instanceId==='P3').equipped,true);
assert.strictEqual(snapshot.confidence.level,'LOW');
assert.strictEqual(snapshotRuntime.validate(snapshot).valid,true);

const serialized=JSON.stringify(snapshot);
for(const forbidden of ['private-card-uid','private-event-value','这段自由文本','"outcome"','"rawEvents"','"uid"'])assert.ok(!serialized.includes(forbidden),`行为快照不得泄漏 ${forbidden}`);
assert.deepStrictEqual(snapshotRuntime.create({runtimeNodeId:'N04',afterBattleNumber:3,aggregate,runMetrics,personaState,shopGrowthState,handTypes,shopConfig:balance.shop}),snapshot,'同一输入必须生成稳定快照');

const invalid=JSON.parse(serialized);invalid.shop.uid='forbidden';
assert.strictEqual(snapshotRuntime.validate(invalid).valid,false);

const source=fs.readFileSync('persona/ai/behavior-snapshot.js','utf8');
assert.ok(!/\b(document|querySelector|localStorage|fetch|runController)\b/.test(source),'行为快照模块不得读取 DOM、存档、网络或流程控制器');
const gameSource=fs.readFileSync('game.js','utf8');
assert.ok(gameSource.includes('setNodeRuntime({aiBehaviorSnapshot:snapshot})'),'人格生成节点必须把首次行为快照锁进节点存档');
assert.ok(gameSource.includes('!runtimeData.aiBehaviorSnapshot'),'读取已保存节点时不得重复生成行为快照');

console.log('ai-persona-behavior-snapshot-tests: cutoff windows, actions, build, persona usage, privacy and deterministic output passed');
