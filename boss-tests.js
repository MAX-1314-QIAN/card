const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');
function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map(),documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const context={console,setTimeout(){},clearTimeout,document:documentStub,window:{},localStorage:{getItem(){return null},setItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};context.window=context;vm.createContext(context);loadBalance(context,{includeSystemTestRun:true});vm.runInContext(fs.readFileSync('game.js','utf8'),context);
context.runController.startRun(context.BALANCE_V21.meta.activeRunTemplateId);
const encounter=context.createEncounter();
assert.deepStrictEqual(Object.keys(encounter).sort(),['maxSelection','startingDiscards','startingHandSize','startingHands']);
assert.ok(!('rule' in encounter)&&!('event' in encounter),'battle setup must not contain boss rules or intervention events');
assert.strictEqual(context.battleTarget(),950,'stage target must use the configured score directly');
vm.runInContext("currentEncounter={rule:{effectType:'HANDS_AND_TARGET',targetMultiplier:.1},event:{effectType:'SUIT_SILENCE',silencedSuit:'♥',targetFactor:.1,maxSelection:1},maxSelection:5}",context);
assert.strictEqual(context.battleTarget(),950,'legacy saved boss fields must not modify the stage target');
console.log('boss-tests: removed boss-rule runtime cannot affect formal battles');
