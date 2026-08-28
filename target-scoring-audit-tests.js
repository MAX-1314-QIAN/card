const assert=require('assert');
const vm=require('vm');
const {loadBalance}=require('./test-load-balance');

const context={console,Map,Set,Array,Object,String,Number,Math,JSON,Date};
context.globalThis=context;
vm.createContext(context);
loadBalance(context);

const manifest=context.PERSONA_BALANCE_MANIFEST;
const current=manifest.pokerHandProfiles.find(item=>item.id==='POKER_HAND_PROFILE_CURRENT_DEMO');
const target=manifest.pokerHandProfiles.find(item=>item.id==='POKER_HAND_PROFILE_TARGET_V1');
const expected=[
  ['HAND_01','high_card','高牌',1,'NORMAL',55,1,1],
  ['HAND_02','pair','对子',2,'NORMAL',48,2,2],
  ['HAND_03','two_pair','两对',4,'NORMAL',52,2.5,3],
  ['HAND_04','three_kind','三条',3,'NORMAL',57,3,4],
  ['HAND_05','straight','顺子',5,'NORMAL',60,4,5],
  ['HAND_06','flush','同花',5,'RARE',65,4,6],
  ['HAND_07','full_house','葫芦',5,'RARE',74,5,7],
  ['HAND_08','four_kind','四条',4,'RARE',100,6,8],
  ['HAND_09','straight_flush','同花顺',5,'RARE',95,10,9],
  ['HAND_10','flush_house','同花葫芦',5,'RARE',70,12,10],
  ['HAND_11','royal_flush','皇家同花顺',4,'RARE',100,12,11]
];

assert.strictEqual(current.hands.find(item=>item.id==='high_card').chips,5,'冻结的旧三战计分不得改变');
assert.strictEqual(current.hands.length,9,'冻结的旧三战仍保留九种牌型');
assert.strictEqual(target.version,2);
assert.strictEqual(target.decisionStatus,'CONFIRMED');
assert.strictEqual(target.hands.length,11);
for(const [handId,id,name,scoringCardCount,qualityId,chips,mult,displayOrder] of expected){
  const hand=target.hands.find(item=>item.handId===handId);
  assert(hand,`missing ${handId}`);
  assert.deepStrictEqual(
    [hand.id,hand.name,hand.scoringCardCount,hand.qualityId,hand.chips,hand.mult,hand.displayOrder,hand.decisionStatus],
    [id,name,scoringCardCount,qualityId,chips,mult,displayOrder,'CONFIRMED'],
    `${handId} must match the latest confirmed table`
  );
}

const engine=context.PokerEngine;
const royal=engine.createStandardDeck().filter(card=>card.s==='♠'&&['10','J','Q','K','A'].includes(card.r));
const royalResult=engine.evaluate(royal,target.hands,5);
assert.strictEqual(royalResult.typeId,'royal_flush');
assert.deepStrictEqual(Array.from(royalResult.scoringCards.map(card=>card.ri)),[14,13,12,11]);
assert.strictEqual(engine.nakedScore(royal,target.hands,5).total,1692,'皇家同花顺应使用 100 基础筹码、四张牌面筹码和 12 倍率');

const straightFlush=engine.createStandardDeck().filter(card=>card.s==='♥'&&['5','6','7','8','9'].includes(card.r));
assert.strictEqual(engine.evaluate(straightFlush,target.hands,5).typeId,'straight_flush');

const flushHouse=[
  {r:'7',ri:7,s:'♣',si:3},{r:'7',ri:7,s:'♣',si:3},{r:'7',ri:7,s:'♣',si:3},
  {r:'9',ri:9,s:'♣',si:3},{r:'9',ri:9,s:'♣',si:3}
];
assert.strictEqual(engine.evaluate(flushHouse,target.hands,5).typeId,'flush_house','重复卡牌应可组成同花葫芦');

console.log('target-scoring-audit-tests: exact 11-hand table, legacy isolation, royal flush and flush house recognition passed');
