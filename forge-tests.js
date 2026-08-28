const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');

function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map();
const documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const stored=new Map();
const context={console,setTimeout(){},clearTimeout,document:documentStub,window:{},localStorage:{getItem(key){return stored.get(key)||null},setItem(key,value){stored.set(key,value)}},Math,Date,Set,Map,JSON,Number,Array,Object,String};
context.window=context;
vm.createContext(context);
loadBalance(context,{includeSystemTestRun:true});
vm.runInContext(fs.readFileSync('game.js','utf8'),context);

assert.deepStrictEqual([1,6,11,16,20].map(roll=>context.forgeValue('chips',roll)),[20,35,55,80,80]);
assert.deepStrictEqual([1,6,11,16,20].map(roll=>context.forgeValue('mult',roll)),[2,4,7,10,10]);
assert.deepStrictEqual([1,6,11,16,20].map(roll=>context.forgeValue('xmult',roll)),[1.1,1.2,1.35,1.5,1.5]);

const forged=vm.runInContext("forgePersonaInstance(personaPool.find(p=>p.id==='restraint'),20,0,88)",context);
assert.strictEqual(forged.baseId,'restraint');
assert.strictEqual(forged.value,80);
assert.strictEqual(forged.perfectEcho,true);
assert.strictEqual(forged.roll,20);
assert.ok(forged.desc.includes('额外回响一次'));

context.testPersona=forged;
vm.runInContext("personaPool.push(testPersona);equippedPersonaIds=[testPersona.id];runController.startRun('RUN_TEMPLATE_SYSTEM_TEST');ensurePersonaRuntimeInitialized(true);currentEncounter=null",context);
const first=vm.runInContext("resolveScore([{r:'A',ri:14,s:suits[0],si:0,uid:'test-a',bonus:0}],true)",context);
assert.strictEqual(first.events.filter(event=>event.source===forged.name&&Number.isFinite(event.chipsDelta)).length,2);
const second=vm.runInContext("resolveScore([{r:'A',ri:14,s:suits[0],si:0,uid:'test-b',bonus:0}],false)",context);
assert.strictEqual(second.events.filter(event=>event.source===forged.name&&Number.isFinite(event.chipsDelta)).length,1);
assert.ok(context.runController.getPersonaRuntimeState().dynamicPersonaTemplatesById[`LEGACY_${forged.id}`]);

context.saveForgedPersonas();
const saved=JSON.parse(stored.get('persona-forged-instances'));
assert.ok(saved.some(persona=>persona.id===forged.id&&persona.roll===20));
console.log('forge-tests: D20 scaling, perfect echo and persistence passed');
