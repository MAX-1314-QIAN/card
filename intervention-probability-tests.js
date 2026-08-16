const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map(),documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const context={console,setTimeout(){},clearTimeout,document:documentStub,window:{},localStorage:{getItem(){return null},setItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};context.window=context;vm.createContext(context);loadBalance(context);vm.runInContext(fs.readFileSync('game.js','utf8'),context);

function seededRandom(seed){let state=seed>>>0;return()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296}}
const expected=[.5,.4,.3],sampleSize=100000;
for(let battle=0;battle<expected.length;battle++){
  const random=seededRandom(20260815+battle),rule=context.BALANCE_V21.bossRules[battle][0];let rewards=0;
  for(let i=0;i<sampleSize;i++){const event=context.selectInterventionEvent(rule,battle,random);if(event.kind==='reward')rewards++;assert.notStrictEqual(event.effectType,rule.effectType)}
  const actual=rewards/sampleSize;assert.ok(Math.abs(actual-expected[battle])<.01,`第 ${battle+1} 战奖励概率 ${actual} 未接近 ${expected[battle]}`);
}
let calls=0;const orderedRandom=()=>[.1,.99][calls++%2];
assert.strictEqual(context.selectInterventionEvent(context.BALANCE_V21.bossRules[0][0],0,orderedRandom).kind,'reward');
assert.strictEqual(calls,2,'应先抽类别，再抽类别池中的具体事件');
console.log('intervention-probability-tests: all assertions passed');
