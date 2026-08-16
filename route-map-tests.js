const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map(),routeButtons=[element(),element(),element()];
const documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(selector){return selector==='[data-route-node]'?routeButtons:[]},createElement(){return element()},addEventListener(){}};
const context={console,setTimeout(fn){fn()},clearTimeout,document:documentStub,window:{showRouteMap(){context.routeShown=true},showBattleFromRoute(){context.battleShown=true}},localStorage:{getItem(){return null},setItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};context.window.gameSfx=()=>{};
vm.createContext(context);loadBalance(context);vm.runInContext(fs.readFileSync('game.js','utf8'),context);

vm.runInContext("window.openBossReveal=()=>{};reset();runController.startRun(BALANCE_V21.meta.activeRunTemplateId);runController.completeNode({type:'BATTLE_WIN'})",context);
assert.strictEqual(context.routeShown,true);
assert.ok(elements.get('#route-summary').textContent.includes('节点 1'));
assert.strictEqual(vm.runInContext('currentRouteNodes.length',context),3);

vm.runInContext('extraDiscard=0;chooseRouteNode("rest")',context);
assert.strictEqual(context.battleShown,true);
assert.strictEqual(vm.runInContext('battleIndex',context),1);
assert.strictEqual(vm.runInContext('discards',context),4);
assert.strictEqual(vm.runInContext('hand.length',context),8);
assert.strictEqual(vm.runInContext('deck.length',context),44);

vm.runInContext('runDeck=createRunDeck();Math.random=()=>0;const before=runDeck[0].bonus;const engraved=strengthenRandomRunCard();globalThis.engravedResult=[before,engraved.bonus,runDeck[0].bonus]',context);
assert.deepStrictEqual(Array.from(context.engravedResult),[0,3,3]);
console.log('route-map-tests: dynamic nodes, rest transition, fresh deck and engraving passed');
