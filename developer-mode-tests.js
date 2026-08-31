const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

const html=fs.readFileSync('index.html','utf8');
const shell=fs.readFileSync('shell.js','utf8');
const game=fs.readFileSync('game.js','utf8');
const css=fs.readFileSync('developer-mode.css','utf8');

for(const id of ['developer-mode-enabled','developer-tools','developer-tools-dialog','developer-next-stage','developer-add-coins'])assert.ok(html.includes(`id="${id}"`),`missing developer control: ${id}`);
assert.ok(shell.includes('developerMode:false')&&shell.includes('developerMode:document.querySelector'), 'developer mode must be disabled by default and persisted with settings');
assert.ok(shell.includes("classList.toggle('hidden',!values.developerMode)"),'battle developer button must follow the saved toggle');
assert.ok(game.includes('function developerAdvanceStage()')&&game.includes("type:'BATTLE_WIN'")&&game.includes('developerSkip:true'),'next-stage tool must advance through the run controller');
assert.ok(game.includes('function developerAddCoins()')&&game.includes('coins+=50'),'coin tool must add exactly 50 coins');
assert.ok(game.includes("if(!developerModeActive()||currentStageNode()?.type!=='BATTLE')return"),'developer actions must be gated to enabled battle mode');
assert.ok(css.includes('.developer-tools-dialog')&&css.includes('.developer-tool-trigger'),'developer controls must have isolated game-style presentation');

function element(){return{innerHTML:'',textContent:'',disabled:false,checked:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map(),documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const context={console,setTimeout(){},clearTimeout,document:documentStub,window:{showBattleFromRoute(){}},localStorage:{getItem(){return null},setItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};context.window=context;vm.createContext(context);loadBalance(context);vm.runInContext(game,context);context.runController.startRun(context.BALANCE_V21.meta.activeRunTemplateId);
vm.runInContext('developerModeEnabled=false;coins=0;developerAddCoins()',context);assert.strictEqual(vm.runInContext('coins',context),0,'disabled developer mode must reject coin changes');
vm.runInContext('developerModeEnabled=true;developerAddCoins()',context);assert.strictEqual(vm.runInContext('coins',context),50,'enabled developer mode must add exactly 50 coins');
vm.runInContext('developerAdvanceStage()',context);assert.strictEqual(context.runController.getState().currentNodeId,'N02','next-stage tool must advance from N01 to N02');assert.strictEqual(context.runController.serializeState().nodeRuntimeById.N01.completionResult.developerSkip,true,'developer advancement must be identified in run state');
console.log('developer-mode-tests: persisted toggle, gated battle entry, next-stage and +50 coin tools passed');
