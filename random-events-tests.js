const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map(),routeButtons=[element(),element(),element()],eventButtons=[element(),element()];
const documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(selector){if(selector==='[data-route-node]')return routeButtons;if(selector==='[data-event-option]')return eventButtons;return[]},createElement(){return element()},addEventListener(){}};
const context={console,setTimeout(fn){fn()},clearTimeout,document:documentStub,window:{showRouteMap(){},showBattleFromRoute(){}},localStorage:{getItem(){return null},setItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};
context.window.gameSfx=()=>{};context.window.commitRunSave=()=>true;
vm.createContext(context);loadBalance(context,{includeSystemTestRun:true});vm.runInContext(fs.readFileSync('game.js','utf8'),context);

vm.runInContext("window.openBossReveal=()=>{};reset();runController.startRun('RUN_TEMPLATE_SYSTEM_TEST');runController.completeNode({type:'BATTLE_WIN'});currentRandomEvent={...routeEventPool.find(event=>event.id==='broken_clock'),options:routeEventPool.find(event=>event.id==='broken_clock').options.map(option=>({...option}))};extraHand=0;nextTargetModifier=1;resolveRandomEvent('wind')",context);
assert.strictEqual(vm.runInContext('battleIndex',context),1);
assert.strictEqual(vm.runInContext('hands',context),5);
assert.strictEqual(vm.runInContext('nextTargetModifier',context),1.1);
assert.strictEqual(vm.runInContext('battleTarget()',context),462);

vm.runInContext("currentRandomEvent={...routeEventPool.find(event=>event.id==='watching_eye'),options:routeEventPool.find(event=>event.id==='watching_eye').options.map(option=>({...option}))};coins=0",context);
assert.strictEqual(vm.runInContext("resolveRandomEvent('offer')",context),false);
assert.strictEqual(vm.runInContext('currentRandomEvent.resolved===true',context),false);

vm.runInContext('runDeck=createRunDeck();Math.random=()=>0;globalThis.strengthened=strengthenRandomRunCards(2,3)',context);
assert.strictEqual(vm.runInContext('strengthened.length',context),2);
assert.strictEqual(vm.runInContext('new Set(strengthened.map(card=>card.templateId)).size',context),2);
assert.strictEqual(vm.runInContext('strengthened.every(card=>card.bonus===3)',context),true);
console.log('random-events-tests: tradeoff, next-battle modifier, affordability and distinct engraving passed');
