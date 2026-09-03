const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {BALANCE_SCRIPT_FILES,loadBalance}=require('./test-load-balance');

const context={console,Map,Set,Array,Object,String,Number,Math,JSON};
context.globalThis=context;
vm.createContext(context);
loadBalance(context);

const manifest=context.PERSONA_BALANCE_MANIFEST;
const runtime=context.PERSONA_BALANCE_RUNTIME_CONFIG;
const validation=context.PERSONA_CONFIG_VALIDATOR.validate(manifest);
assert.strictEqual(validation.valid,true,validation.errors.join('\n'));
assert.strictEqual(manifest.configVersion,'phase-c.3-ai-persona-local-v1');
assert.strictEqual(manifest.rulesetId,'TARGET_RUN_V1');
assert.strictEqual(manifest.saveCompatibilityVersion,3);
assert.strictEqual(manifest.activeRunTemplateId,'RUN_TEMPLATE_TARGET');
assert.deepStrictEqual(Array.from(manifest.reservedRunTemplateIds),[]);
assert.ok(!manifest.runTemplates.some(item=>item.id==='RUN_TEMPLATE_CURRENT_DEMO'),'production manifest must not register the removed three-battle template');
assert.ok(!manifest.stageNodes.some(item=>/^(DEMO_BATTLE|DEMO_ROUTE|DEMO_REPORT|DEMO_FORGE)/.test(item.id)),'production manifest must not contain removed three-battle nodes');
assert.strictEqual(manifest.featureFlags.targetRunTemplateEnabled,undefined);

const template=manifest.runTemplates.find(item=>item.id===manifest.activeRunTemplateId);
assert.ok(template);
assert.strictEqual(template.runTemplateId,template.id);
assert.strictEqual(template.startNodeId,'N01');
assert.deepStrictEqual(Array.from(template.compatibilityNodeIds),['TARGET_PERSONA_SELECT']);
assert.strictEqual(template.endCondition.nodeId,'TARGET_PERSONA_CARRY_OUT');
assert.deepStrictEqual(Array.from(template.coreNodeIds),['N01','N02','N03','N04','N05','N06','N07','N08','N09','N10','N11','N12','N13','N14','N15','N16','N17']);

const battleNodes=template.nodeIds.map(id=>manifest.stageNodes.find(node=>node.id===id)).filter(node=>node.type==='BATTLE');
assert.deepStrictEqual(Array.from(battleNodes.map(node=>node.targetScore)),[950,1100,1250,1350,1500,1650,1750,1950,2150,2300,2500,2750,3200]);
assert.strictEqual(template.nodeIds.map(id=>manifest.stageNodes.find(node=>node.id===id)).filter(node=>node.type==='SHOP').length,1);
assert.ok(battleNodes.every(node=>node.encounterId&&Array.isArray(node.transitions)));
assert.strictEqual(new Set(manifest.stageNodes.map(node=>node.id)).size,manifest.stageNodes.length);
assert.strictEqual(new Set(manifest.encounters.map(item=>item.id)).size,manifest.encounters.length);
assert.strictEqual(new Set(manifest.basePersonas.templates.map(item=>item.id)).size,manifest.basePersonas.templates.length);
assert.ok(manifest.basePersonas.templates.every(item=>manifest.personaTemplates.templates.includes(item)),'正式基础人格必须直接汇入统一模板注册表');

assert.strictEqual(context.BALANCE_V21,runtime,'旧入口必须直接转发运行时兼容视图');
assert.deepStrictEqual(Array.from(runtime.battle.targets),[950,1100,1250,1350,1500,1650,1750,1950,2150,2300,2500,2750,3200]);
assert.strictEqual(runtime.meta.activeRunTemplateId,'RUN_TEMPLATE_TARGET');
assert.strictEqual(runtime.runTemplate,template);

function containsFunction(value,seen=new Set()){
  if(typeof value==='function')return true;
  if(!value||typeof value!=='object'||seen.has(value))return false;
  seen.add(value);
  return Object.values(value).some(child=>containsFunction(child,seen));
}
assert.strictEqual(containsFunction(manifest),false);
assert.strictEqual(containsFunction(runtime),false);

function invalidAfter(change){
  const clone=JSON.parse(JSON.stringify(manifest));
  change(clone);
  return context.PERSONA_CONFIG_VALIDATOR.validate(clone);
}
assert.strictEqual(invalidAfter(config=>{config.activeRunTemplateId='MISSING'}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.stageNodes[0].transitions[0].to='MISSING'}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.basePersonas.templates[0].effects[0].type='EXECUTE_CODE'}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.bossProfiles.rules[0].effectType='EXECUTE_CODE'}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.interventions.profiles[0].kindProbability.reward=.8}).valid,false);
assert.strictEqual(invalidAfter(config=>{config.stageNodes[0].id=config.stageNodes[1].id}).valid,false);

const adapterContext={console,Map,Set,Array,Object,String,Number,Math,JSON};adapterContext.globalThis=adapterContext;vm.createContext(adapterContext);
for(const file of BALANCE_SCRIPT_FILES.slice(0,-1))vm.runInContext(fs.readFileSync(file,'utf8'),adapterContext,{filename:file});
assert.strictEqual(adapterContext.BALANCE_V21,undefined);
vm.runInContext(fs.readFileSync('balance-v2.1.js','utf8'),adapterContext,{filename:'balance-v2.1.js'});
assert.strictEqual(adapterContext.BALANCE_V21,adapterContext.PERSONA_BALANCE_RUNTIME_CONFIG);
const adapterSource=fs.readFileSync('balance-v2.1.js','utf8');
for(const forbidden of ['280','420','620','straight_flush','opening_tax','observer'])assert.ok(!adapterSource.includes(forbidden),`旧入口不应保留配置数据：${forbidden}`);

const html=fs.readFileSync('index.html','utf8');
let previousIndex=-1;
for(const file of BALANCE_SCRIPT_FILES){const index=html.indexOf(`src="${file}`);assert.ok(index>previousIndex,`index.html 配置脚本加载顺序错误：${file}`);previousIndex=index}

const functionConfig=JSON.parse(JSON.stringify(manifest));functionConfig.featureFlags.invalidFunction=()=>{};
assert.strictEqual(context.PERSONA_CONFIG_VALIDATOR.validate(functionConfig).valid,false);

console.log('config-architecture-tests: manifest, run template, stage nodes, references, IDs, adapter and no-function validation passed');
