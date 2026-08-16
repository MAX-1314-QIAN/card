const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');
function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map(),documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const context={console,setTimeout(){},clearTimeout,document:documentStub,window:{},localStorage:{getItem(){return null},setItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};context.window=context;vm.createContext(context);loadBalance(context);vm.runInContext(fs.readFileSync('game.js','utf8'),context);

vm.runInContext(`behavior=createBehaviorAggregate();behavior.plays=[
  {battleIndex:0,type:'高牌',selectedCount:5,suits:['♥','♦','♣','♠','♥'],personaEffects:[]},
  {battleIndex:0,type:'对子',selectedCount:5,suits:['♥','♦','♣','♠','♥'],personaEffects:[]},
  {battleIndex:0,type:'三条',selectedCount:4,suits:['♥','♦','♣','♠'],personaEffects:[]}
];behavior.battles=[{index:0,startingHands:4,startingDiscards:3,remainingHands:2,remainingDiscards:2}]`,context);
const investment=context.analyzeBossObservation(0,1);assert.strictEqual(investment.targetRuleId,'narrow_table');assert.strictEqual(investment.trait,'高投入倾向');assert.ok(investment.evidence.includes('平均每手'));

vm.runInContext(`behavior.plays=[
  {battleIndex:1,type:'对子',selectedCount:2,suits:['♥','♠'],personaEffects:[]},
  {battleIndex:1,type:'对子',selectedCount:2,suits:['♦','♣'],personaEffects:[]},
  {battleIndex:1,type:'对子',selectedCount:2,suits:['♥','♣'],personaEffects:[]}
];behavior.battles=[{index:1,startingHands:4,startingDiscards:3,remainingHands:3,remainingDiscards:3}]`,context);
const repetition=context.analyzeBossObservation(1,2);assert.strictEqual(repetition.targetRuleId,'repeat_judgment');assert.strictEqual(repetition.stats.repeats,2);

vm.runInContext("battleIndex=2;currentBossObservation="+JSON.stringify(repetition),context);assert.strictEqual(context.createEncounter(repetition.targetRuleId).rule.id,'repeat_judgment');
console.log('boss-observation-tests: evidence extraction, behavioral counter-selection and forced encounter passed');
