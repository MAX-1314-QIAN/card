const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');
function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{setProperty(){},removeProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
function createContext(){
  const elements=new Map(),routeButtons=[element(),element(),element()],documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(selector){if(selector==='[data-route-node]')return routeButtons;return[]},createElement(){return element()},addEventListener(){}};
  const context={console,setTimeout(fn){fn()},clearTimeout,document:documentStub,window:{showRouteMap(){context.routeShown=(context.routeShown||0)+1},showBattleFromRoute(){context.battleShown=(context.battleShown||0)+1}},localStorage:{getItem(){return null},setItem(){},removeItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};context.window.gameSfx=()=>{};context.window.commitRunSave=()=>true;context.window.clearRunSave=()=>{};context.window.goMainMenuFromRun=()=>{};vm.createContext(context);loadBalance(context,{includeSystemTestRun:true});vm.runInContext(fs.readFileSync('game.js','utf8'),context);return{context,elements};
}
function saveAndRestore(context,phase){const state=vm.runInContext('buildRunSaveState()',context);return vm.runInContext('restoreRunSaveState(globalThis.__save)',Object.assign(context,{__save:{version:2,phase,state}}))}

let setup=createContext(),context=setup.context,elements=setup.elements;
vm.runInContext("reset();runController.startRun('RUN_TEMPLATE_SYSTEM_TEST')",context);const encounterBefore=vm.runInContext('JSON.stringify(currentEncounter)',context);assert.strictEqual(saveAndRestore(context,'stage_intro'),true);assert.strictEqual(vm.runInContext('JSON.stringify(currentEncounter)',context),encounterBefore);assert.strictEqual(elements.get('#stage-intro-dialog').open,true);assert.strictEqual(saveAndRestore(context,'boss_reveal'),true,'legacy reveal phase must restore into the new stage intro');assert.strictEqual(elements.get('#stage-intro-dialog').open,true);

setup=createContext();context=setup.context;vm.runInContext("reset();runController.startRun('RUN_TEMPLATE_SYSTEM_TEST');runController.completeNode({type:'BATTLE_WIN'})",context);const routeBefore=vm.runInContext('JSON.stringify({currentRouteNodes,currentRandomEvent})',context);assert.strictEqual(saveAndRestore(context,'route'),true);assert.ok(context.routeShown>=2);assert.strictEqual(vm.runInContext('JSON.stringify({currentRouteNodes,currentRandomEvent})',context),routeBefore);

setup=createContext();context=setup.context;elements=setup.elements;vm.runInContext("reset();runController.startRun('RUN_TEMPLATE_SYSTEM_TEST');runController.completeNode({type:'BATTLE_LOSS'})",context);assert.strictEqual(saveAndRestore(context,'report'),true);assert.strictEqual(elements.get('#report-dialog').open,true);

setup=createContext();context=setup.context;elements=setup.elements;vm.runInContext("reset();runController.startRun('RUN_TEMPLATE_SYSTEM_TEST');runController.completeNode({type:'BATTLE_LOSS'});runController.completeNode({type:'REPORT_COMPLETED'})",context);assert.strictEqual(saveAndRestore(context,'forge'),true);assert.strictEqual(elements.get('#forge-dialog').open,true);
console.log('run-restore-tests: stage intro, legacy reveal, route, report and forge restore passed');
