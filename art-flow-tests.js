const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');
function element(){return{innerHTML:'',textContent:'',disabled:false,open:false,value:'all',style:{setProperty(){},removeProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},append(){},prepend(){},querySelector(){return element()},querySelectorAll(){return[]},addEventListener(){},getBoundingClientRect(){return{left:0,top:0,width:1,height:1}},showModal(){this.open=true},close(){this.open=false}}}
const elements=new Map(),documentStub={documentElement:element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return[]},createElement(){return element()},addEventListener(){}};
const stored=new Map();
stored.set('persona-forged-instances',JSON.stringify([{id:'legacy-forge',baseId:'collector',roll:17,value:80,effectType:'chips',name:'旧铸造人格',mode:'映照',effect:'+80',desc:'旧存档'}]));
const context={console,setTimeout(){},clearTimeout,document:documentStub,window:{},localStorage:{getItem(key){return stored.get(key)||null},setItem(key,value){stored.set(key,value)}},Math,Date,Set,Map,JSON,Number,Array,Object,String};context.window=context;vm.createContext(context);loadBalance(context);vm.runInContext(fs.readFileSync('game.js','utf8'),context);
const basePortraits=vm.runInContext('personaPool.slice(0,8).map(p=>p.portrait)',context);assert.deepStrictEqual(Array.from(basePortraits),new Array(8).fill(null).map((_,index)=>`assets/art/personas-v2/persona-${String(index+1).padStart(2,'0')}-original-v1.png`));
assert.strictEqual(vm.runInContext("personaPool.some(p=>p.id==='legacy-forge')",context),false,'legacy forge cache must not bypass formal carry-out collection');
vm.runInContext("currentPersonaReport=buildPersonaReport();forgeResults=[{roll:17,match:88,persona:forgePersonaInstance(personaPool.find(p=>p.id==='collector'),17,0,88)},{roll:13,match:74,persona:forgePersonaInstance(personaPool.find(p=>p.id==='resonance'),13,1,74)},{roll:20,match:81,persona:forgePersonaInstance(personaPool.find(p=>p.id==='purger'),20,2,81)}];choiceSelectedIndex=0;renderPersonaChoice()",context);
const choiceHtml=elements.get('#choice-cards').innerHTML;assert.ok(choiceHtml.includes('persona-05-original-v1.png'));assert.ok(choiceHtml.includes('persona-06-original-v1.png'));assert.ok(choiceHtml.includes('persona-08-original-v1.png'));assert.strictEqual((choiceHtml.match(/choice-portrait has-art/g)||[]).length,3);
vm.runInContext("acquiredPersona=forgeResults[0].persona;renderAcquireLoadout()",context);const loadoutHtml=elements.get('#acquire-loadout').innerHTML;assert.ok(loadoutHtml.includes('persona-01-original-v1.png'));assert.ok(loadoutHtml.includes('slot-portrait has-art'));
console.log('art-flow-tests: 8 portraits, carry-out-only collection boundary, choice and acquire rendering passed');
