const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {loadBalance}=require('./test-load-balance');
const context={console,Date,JSON,Number,Array,Object,String,Math,Map,Set};context.globalThis=context;vm.createContext(context);loadBalance(context);
const controller=context.runController,entered=[],restored=[],completed=[];let finished=0;
for(const type of ['BATTLE','ROUTE','REPORT','FORGE'])controller.registerNodeHandler(type,{enter:({node})=>entered.push(node.id),restore:({node})=>restored.push(node.id),complete:({node})=>completed.push(node.id)});
controller.setFinishHandler(()=>finished++);

let result=controller.startRun('RUN_TEMPLATE_CURRENT_DEMO');assert.strictEqual(result.node.id,'DEMO_BATTLE_01');assert.strictEqual(controller.getState().currentNodeId,'DEMO_BATTLE_01');assert.strictEqual(controller.getState().battleIndexCompat,0);
result=controller.enterNode('DEMO_BATTLE_01');assert.strictEqual(result.duplicate,true);assert.strictEqual(entered.filter(id=>id==='DEMO_BATTLE_01').length,1);
assert.strictEqual(controller.completeNode({type:'BATTLE_WIN',nodeId:'STALE_NODE'}).reason,'STALE_NODE_RESULT');assert.strictEqual(controller.getState().currentNodeId,'DEMO_BATTLE_01');
assert.strictEqual(controller.resolveTransition(controller.getCurrentNode(),{type:'BATTLE_WIN'}).to,'DEMO_ROUTE_01');
const winning=[['BATTLE_WIN','DEMO_ROUTE_01'],['ROUTE_COMPLETED','DEMO_BATTLE_02'],['BATTLE_WIN','DEMO_ROUTE_02'],['ROUTE_COMPLETED','DEMO_BATTLE_03'],['BATTLE_WIN','DEMO_REPORT'],['REPORT_COMPLETED','DEMO_FORGE']];
for(const [type,next] of winning){result=controller.completeNode({type});assert.strictEqual(controller.getState().currentNodeId,next)}
let rewardCount=0;assert.strictEqual(controller.runOnce('forge_reward',()=>rewardCount++).executed,true);assert.strictEqual(controller.runOnce('forge_reward',()=>rewardCount++).executed,false);assert.strictEqual(rewardCount,1);
result=controller.completeNode({type:'FORGE_COMPLETED'});assert.strictEqual(result.finished,true);assert.strictEqual(controller.getState().nodeStatus,'RUN_COMPLETED');assert.strictEqual(finished,1);assert.strictEqual(controller.completeNode({type:'FORGE_COMPLETED'}).duplicate,true);assert.strictEqual(finished,1);

function runFailure(battleNumber){controller.startRun('RUN_TEMPLATE_CURRENT_DEMO');if(battleNumber>1){controller.completeNode({type:'BATTLE_WIN'});controller.completeNode({type:'ROUTE_COMPLETED'})}if(battleNumber>2){controller.completeNode({type:'BATTLE_WIN'});controller.completeNode({type:'ROUTE_COMPLETED'})}assert.strictEqual(controller.getState().currentNodeId,`DEMO_BATTLE_0${battleNumber}`);controller.completeNode({type:'BATTLE_LOSS'});assert.strictEqual(controller.getState().currentNodeId,'DEMO_REPORT');controller.completeNode({type:'REPORT_COMPLETED'});assert.strictEqual(controller.getState().currentNodeId,'DEMO_FORGE');controller.completeNode({type:'FORGE_COMPLETED'});assert.strictEqual(controller.getState().nodeStatus,'RUN_COMPLETED')}
runFailure(1);runFailure(2);runFailure(3);

controller.startRun('RUN_TEMPLATE_CURRENT_DEMO');controller.setNodeRuntime({randomValue:0.314159});const saved=controller.serializeState(),enterCount=entered.length;controller.restoreRun(saved,{phase:'boss_reveal'});assert.strictEqual(restored.at(-1),'DEMO_BATTLE_01');assert.strictEqual(entered.length,enterCount,'restore must not call first-enter handler');assert.strictEqual(controller.getCurrentRuntime().data.randomValue,0.314159,'restore must preserve generated random data');
result=controller.startRun('RUN_TEMPLATE_TARGET');assert.strictEqual(result.node.id,'TARGET_PERSONA_SELECT');const legalIds=new Set(context.PERSONA_BALANCE_MANIFEST.stageNodes.map(node=>node.id));assert.ok(context.PERSONA_BALANCE_MANIFEST.runTemplates[0].nodeIds.every(id=>legalIds.has(id)));
console.log('run-controller-tests: APIs, success run, three failure runs, idempotency, restore randomness and legal references passed');
