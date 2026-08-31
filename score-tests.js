const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map();
const documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const context={console,setTimeout(){},clearTimeout,document:documentStub,window:{},localStorage:{getItem(){return null},setItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};
context.window=context;
vm.createContext(context);
loadBalance(context,{includeSystemTestRun:true});
vm.runInContext(fs.readFileSync('game.js','utf8'),context);
vm.runInContext("runController.startRun('RUN_TEMPLATE_SYSTEM_TEST');currentEncounter=null;equippedPersonaIds=[];ensurePersonaRuntimeInitialized(true)",context);

const card=(r,s='♠')=>({r,ri:r==='A'?14:['J','Q','K'].includes(r)?{J:11,Q:12,K:13}[r]:Number(r),s,si:{'♠':0,'♥':1,'♦':2,'♣':3}[s],uid:`${r}${s}`,bonus:0});
const scoreCards=cards=>context.evaluate(cards).scoringCards.map(c=>`${c.r}${c.s}`);

assert.strictEqual(JSON.stringify(scoreCards([card('A'),card('9','♥'),card('4','♦')])),JSON.stringify(['A♠']));
assert.strictEqual(JSON.stringify(scoreCards([card('K'),card('K','♥'),card('8','♦'),card('3','♣')])),JSON.stringify(['K♠','K♥']));
assert.strictEqual(JSON.stringify(scoreCards([card('Q'),card('Q','♥'),card('7','♦'),card('7','♣'),card('2')])),JSON.stringify(['Q♠','Q♥','7♦','7♣']));
assert.strictEqual(scoreCards([card('10'),card('J','♥'),card('Q','♦'),card('K','♣'),card('A')]).length,5);
assert.strictEqual(scoreCards([card('9'),card('9','♥'),card('9','♦'),card('4','♣'),card('4')]).length,5);
const high=context.resolveScore([card('A'),card('9','♥'),card('4','♦')],false);
assert.strictEqual(high.chips,86);
const enhanced={...card('A'),bonus:5,shopModifiers:{bonusCoins:2,bonusMult:.5,bonusXmultRate:.03}};
const enhancedResult=context.resolveScore([enhanced,card('9'),card('4')],false);
assert.strictEqual(enhancedResult.chips,91);
assert.strictEqual(enhancedResult.mult,1.5);
assert.strictEqual(enhancedResult.xmult,1.03);
assert.strictEqual(enhancedResult.goldDelta,2);
assert.strictEqual(enhancedResult.total,141);
vm.runInContext("equippedPersonaIds=['collector'];ensurePersonaRuntimeInitialized(true);personaRuntime.processDiscard(4,{commit:true})",context);
context.resolveScore([card('8'),card('8','♥')],false);
assert.strictEqual(vm.runInContext("personaRuntime.getEquippedPersonas()[0].runtimeState.charged",context),true);
context.resolveScore([card('8'),card('8','♥')],true);
assert.strictEqual(vm.runInContext("personaRuntime.getEquippedPersonas()[0].runtimeState.charged",context),false);
console.log('score-tests: base hands, persona commit safety and four configured card upgrade attributes passed');
