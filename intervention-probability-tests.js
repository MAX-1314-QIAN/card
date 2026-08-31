const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map(),documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const context={console,setTimeout(){},clearTimeout,document:documentStub,window:{},localStorage:{getItem(){return null},setItem(){}},Math,Date,Set,Map,JSON,Number,Array,Object,String};context.window=context;vm.createContext(context);loadBalance(context,{includeSystemTestRun:true});vm.runInContext(fs.readFileSync('game.js','utf8'),context);

assert.strictEqual(typeof context.selectInterventionEvent,'undefined','removed intervention events must not expose an executable selector');
assert.strictEqual(typeof context.analyzeBossObservation,'undefined','removed boss observation must not remain executable');
context.runController.startRun('RUN_TEMPLATE_SYSTEM_TEST');
const encounter=context.createEncounter();
assert.ok(!('rule' in encounter)&&!('event' in encounter),'new encounters must not sample legacy boss or intervention configuration');
console.log('intervention-probability-tests: removed intervention system remains non-executable');
