const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const {GAME_SUPPORT_SCRIPT_FILES}=require('./test-load-balance');

const context={console,Map,Set,Array,Object,String,Number,Math,JSON};
context.globalThis=context;
vm.createContext(context);
for(const file of GAME_SUPPORT_SCRIPT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});

assert.strictEqual(context.GameUiFormatters.escapeHtml('<人格 & "规则">'),'&lt;人格 &amp; &quot;规则&quot;&gt;');
assert.strictEqual(context.GameUiFormatters.formatNumber(1.23456),'1.2346');
assert.strictEqual(context.GamePersonaPresentation.valueText({effectType:'chips',value:15}),'+15 筹码');

const hand={id:'pair',name:'对子',description:'两张同点数牌',priority:2,displayOrder:2,chips:48,mult:2,icon:'Ⅱ'};
const handView=context.GameBuildInspection.handTypeView(hand,{handTypeLevelsById:{pair:2}});
assert.deepStrictEqual(Array.from([handView.level,handView.chips,handView.mult]),[2,58,2.4]);
assert.ok(context.GameBuildInspection.handRulesMarkup([hand],{handTypeLevelsById:{pair:2}}).includes('Lv.2'));

const behavior=context.GameBehaviorAnalytics.createAggregate();
context.GameBehaviorAnalytics.recordBattleStart(behavior,{index:0,target:100,startScore:0,startingHands:4,startingDiscards:3});
context.GameBehaviorAnalytics.recordDiscard(behavior,{count:2,battleIndex:0});
const report=context.GameBehaviorAnalytics.buildReport(behavior,{handTypeCount:11,maxSelection:5,currentScore:0});
assert.strictEqual(report.metricDefs.length,12);
assert.ok(Object.values(report.metrics).every(Number.isFinite));

const cardPresenter=context.GameCardPresentation.create({manifest:{cards:{}},escapeHtml:context.GameUiFormatters.escapeHtml});
assert.ok(cardPresenter.faceMarkup({r:'A',s:'♠'}).includes('ace-field'));

const scoreRuntime=context.BattleScoreRuntime.create({
  pokerEngine:{evaluate(cards){return{type:'高牌',typeId:'high_card',chips:5,mult:1,scoringCards:cards,straight:false,flush:false,pair:false}},faceChipValue(){return 2}},
  shopRuntime:{cardUpgradeAttributes(){return{bonusChips:0,bonusCoins:0,bonusMult:0,bonusXmultFactor:1}}},
  personaRuntime:{evaluateHand(context,{scoreLayers}){return{chipsDelta:0,multDelta:0,finalMultiplier:1,coinsDelta:0,logs:[],state:{personaHistory:{}},scoreBefore:scoreLayers.chips*scoreLayers.mult,scoreAfter:scoreLayers.chips*scoreLayers.mult}}},
  personaFeedback:{buildScoreBreakdown(input){return input}},
  minScore:1,
  maxSelection:5
});
const score=scoreRuntime.resolve({cards:[{r:'2',s:'♠',si:0}],handTypes:[{id:'high_card',priority:1,qualityId:'NORMAL'}],context:{handIndex:1,currentHandCardCount:1,remainingHands:4,remainingDiscards:3}});
assert.strictEqual(score.total,7);
assert.strictEqual(score.events.at(-1).source,'最终得分');

const forbidden=/\b(document|querySelector|localStorage|runController|fetch)\b/;
for(const file of GAME_SUPPORT_SCRIPT_FILES){
  const source=fs.readFileSync(file,'utf8');
  assert.ok(!forbidden.test(source),`${file} 不得越层访问 DOM、存档、流程控制器或网络`);
}

const html=fs.readFileSync('index.html','utf8'),gameSource=fs.readFileSync('game.js','utf8'),gameIndex=html.indexOf('src="game.js');
for(const file of GAME_SUPPORT_SCRIPT_FILES)assert.ok(html.indexOf(`src="${file}`)>=0&&html.indexOf(`src="${file}`)<gameIndex,`${file} 必须在 game.js 前加载`);
assert.ok(!gameSource.includes('personaRuntime.evaluateHand('),'计分领域逻辑不得回流 game.js');
assert.ok(!gameSource.includes("const metricDefs=[['focus'"),'行为指标公式不得回流 game.js');
assert.ok(!gameSource.includes("'10':[1,2,3,5,7,9,11,13,14,15]"),'牌面模板不得回流 game.js');

console.log('game-module-boundaries-tests: pure modules, score runtime and dependency direction passed');
