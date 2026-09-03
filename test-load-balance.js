const fs=require('fs');
const vm=require('vm');

const BALANCE_SCRIPT_FILES=[
  'balance/core-rules.js',
  'balance/feature-flags.js',
  'balance/poker-hands.js',
  'balance/base-personas.js',
  'balance/persona-templates.js',
  'balance/target/scoring-profile.js',
  'balance/target/prototype-personas.js',
  'balance/target/growth-profiles.js',
  'balance/target/shop-config.js',
  'balance/target/stage-nodes.js',
  'balance/target/stage-limit-rules.js',
  'balance/target/boss-rule-config.js',
  'balance/target/ai-persona-whitelist-v1.js',
  'balance/target/run-template.js',
  'balance/boss-profiles.js',
  'balance/interventions.js',
  'balance/encounters.js',
  'balance/stage-nodes.js',
  'balance/run-templates.js',
  'balance/validators/ai-persona-whitelist-validator.js',
  'balance/schema-validation.js',
  'balance/manifest.js',
  'balance-v2.1.js'
];

const GAME_SUPPORT_SCRIPT_FILES=[
  'game/ui-formatters.js',
  'game/persona-presentation.js',
  'game/build-inspection.js',
  'game/card-presentation.js',
  'game/behavior-analytics.js',
  'persona/ai/behavior-snapshot.js',
  'persona/ai/value-budget.js',
  'persona/ai/candidate-validator.js',
  'persona/ai/candidate-builder.js',
  'battle/score-runtime.js'
];

function injectSystemTestRun(context){
  const manifest=context.PERSONA_BALANCE_MANIFEST;
  manifest.testEnvironment=true;
  const sourceEncounters=context.PERSONA_BALANCE_MODULES?.encounters||[];
  for(const id of ['DEMO_ENCOUNTER_01','DEMO_ENCOUNTER_02','REFERENCE_ENCOUNTER_LATE'])if(!manifest.encounters.some(item=>item.id===id)){const source=sourceEncounters.find(item=>item.id===id);if(source)manifest.encounters.push({...source,testOnly:true})}
  manifest.stageNodes.push(
    {id:'TEST_BATTLE_01',type:'BATTLE',encounterId:'DEMO_ENCOUNTER_01',targetScore:280,estimatedMinutes:null,transitions:[{on:'BATTLE_WIN',to:'TEST_ROUTE_01'},{on:'BATTLE_LOSS',to:'TEST_REPORT'}]},
    {id:'TEST_ROUTE_01',type:'ROUTE',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'ROUTE_COMPLETED',to:'TEST_BATTLE_02'}]},
    {id:'TEST_BATTLE_02',type:'BATTLE',encounterId:'DEMO_ENCOUNTER_02',targetScore:420,estimatedMinutes:null,transitions:[{on:'BATTLE_WIN',to:'TEST_ROUTE_02'},{on:'BATTLE_LOSS',to:'TEST_REPORT'}]},
    {id:'TEST_ROUTE_02',type:'ROUTE',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'ROUTE_COMPLETED',to:'TEST_BATTLE_03'}]},
    {id:'TEST_BATTLE_03',type:'BATTLE',encounterId:'REFERENCE_ENCOUNTER_LATE',targetScore:620,estimatedMinutes:null,transitions:[{on:'BATTLE_WIN',to:'TEST_REPORT'},{on:'BATTLE_LOSS',to:'TEST_REPORT'}]},
    {id:'TEST_REPORT',type:'REPORT',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'REPORT_COMPLETED',to:'TEST_FORGE'}]},
    {id:'TEST_FORGE',type:'FORGE',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'FORGE_COMPLETED',to:'RUN_END'}]}
  );
  manifest.runTemplates.push({id:'RUN_TEMPLATE_SYSTEM_TEST',runTemplateId:'RUN_TEMPLATE_SYSTEM_TEST',startNodeId:'TEST_BATTLE_01',nodeIds:['TEST_BATTLE_01','TEST_ROUTE_01','TEST_BATTLE_02','TEST_ROUTE_02','TEST_BATTLE_03','TEST_REPORT','TEST_FORGE'],endCondition:{type:'NODE_COMPLETED',nodeId:'TEST_FORGE'},version:1,testOnly:true});
}

function injectPersonaSliceRun(context){
  const manifest=context.PERSONA_BALANCE_MANIFEST,modules=context.PERSONA_BALANCE_MODULES,template=(modules.runTemplates||[]).find(item=>item.id==='RUN_TEMPLATE_PERSONA_SLICE');if(!template)return;
  manifest.testEnvironment=true;for(const id of ['DEMO_ENCOUNTER_01','DEMO_ENCOUNTER_02'])if(!manifest.encounters.some(item=>item.id===id)){const source=(modules.encounters||[]).find(item=>item.id===id);if(source)manifest.encounters.push({...source,testOnly:true})}for(const nodeId of template.nodeIds){if(manifest.stageNodes.some(item=>item.id===nodeId))continue;const node=(modules.stageNodes||[]).find(item=>item.id===nodeId);if(node)manifest.stageNodes.push({...node,testOnly:true})}if(!manifest.runTemplates.some(item=>item.id===template.id))manifest.runTemplates.push({...template,testOnly:true});
}

function loadBalance(context,{includeSystemTestRun=false,includePersonaSliceRun=false}={}){
  for(const file of BALANCE_SCRIPT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  if(includeSystemTestRun)injectSystemTestRun(context);
  if(includePersonaSliceRun)injectPersonaSliceRun(context);
  for(const file of ['persona/persona-instance.js','persona/persona-condition-evaluator.js','persona/persona-effect-executor.js','persona/legacy-persona-adapter.js','persona/persona-feedback.js','persona/persona-runtime.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  vm.runInContext(fs.readFileSync('poker-engine.js','utf8'),context,{filename:'poker-engine.js'});
  vm.runInContext(fs.readFileSync('stage-limit-runtime.js','utf8'),context,{filename:'stage-limit-runtime.js'});
  vm.runInContext(fs.readFileSync('shop/shop-runtime.js','utf8'),context,{filename:'shop/shop-runtime.js'});
  vm.runInContext(fs.readFileSync('deck-sort-runtime.js','utf8'),context,{filename:'deck-sort-runtime.js'});
  vm.runInContext(fs.readFileSync('run-controller.js','utf8'),context,{filename:'run-controller.js'});
  for(const file of GAME_SUPPORT_SCRIPT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  return context.BALANCE_V21;
}

module.exports={BALANCE_SCRIPT_FILES,GAME_SUPPORT_SCRIPT_FILES,loadBalance};
