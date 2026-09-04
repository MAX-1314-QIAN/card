const assert=require('assert'),fs=require('fs'),vm=require('vm');
const context={console};context.globalThis=context;vm.createContext(context);
for(const file of ['balance/target/economy-config.js','balance/base-personas.js','balance/target/prototype-personas.js','persona/persona-feedback.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const feedback=context.PersonaFeedback,modules=context.PERSONA_BALANCE_MODULES,base=modules.basePersonas.templates,prototypes=modules.targetPrototypePersonas;
const growth=prototypes.find(item=>item.id==='TARGET_PROTO_GROWTH_ARCHIVE'),charge=base.find(item=>item.id==='collector'),chips=base.find(item=>item.id==='observer'),addMult=base.find(item=>item.id==='wanderer'),finalMult=base.find(item=>item.id==='purger');

const growthCard=feedback.cardView(growth,{activationCountThisBattle:0,growthStacks:2});
assert.strictEqual(growthCard.name,growth.name,'反馈名称必须来自正式 Persona Template');
assert(growthCard.trigger.includes('本局尚未记录的新牌型'),'成长人格必须使用玩家行动语言');
assert(growthCard.reward.includes(`+${growth.effects[0].value} 加法倍率`)&&growthCard.reward.includes(`每层 +${growth.effects[1].valuePerStack} 加法倍率`),'效果值必须来自正式 Persona Template');
assert(growthCard.status.includes('成长 2 / 4 层')&&growthCard.status.includes('当前总加成 +0.9 加法倍率'),'成长层数与当前总加成必须来自 runtimeState');
assert(feedback.cardView(charge,{charged:false}).status.includes('未蓄力'));
assert(feedback.cardView(charge,{charged:true}).status.some(line=>line.includes('已蓄力')),'蓄力显示必须跟随 runtimeState');

for(const template of [chips,addMult,finalMult]){const view=feedback.cardView(template,{activationCountThisBattle:0});assert.strictEqual(view.reward,template.mainEffect.effectText,'基础筹码、加法倍率和最终倍率都必须由统一主效果配置生成')}
const state={growthStacks:2},log={instanceId:'GROWTH_1',templateId:growth.id,name:growth.name,triggered:true,disabled:false,effectsApplied:growth.effects,runtimeStateBefore:{growthStacks:2},runtimeStateAfter:{growthStacks:3},chipsDelta:0,multDelta:.9,finalMultiplierDelta:0};
const environment={getTemplate:id=>id===growth.id?growth:null,getInstance:()=>({runtimeState:state}),history:{usedHandTypes:['HIGH_CARD']},handTypeId:'TWO_PAIR',handTypeName:'两对'};
const preview=feedback.feedbackFromLogs([log],{...environment,kind:'preview'}),commit=feedback.feedbackFromLogs([log],{...environment,kind:'commit'});
assert.strictEqual(preview[0].kind,'preview');assert(preview[0].effects.includes('成长 +1 层'));assert(preview[0].status.includes('成长 2 / 4 层'),'Preview只能展示提交前状态');
assert.strictEqual(commit[0].kind,'commit');assert(commit[0].status.includes('成长 3 / 4 层'),'Commit反馈必须展示提交后状态');assert.deepStrictEqual(state,{growthStacks:2},'反馈构建不得修改 Runtime 状态');
assert(!feedback.feedbackFromLogs([{...log,runtimeStateBefore:{growthStacks:4},runtimeStateAfter:{growthStacks:4}}],{...environment,kind:'commit'})[0].effects.includes('成长 +1 层'),'达到成长上限后不得预告不存在的成长');
assert.strictEqual(feedback.feedbackFromLogs([{...log,disabled:true}],{...environment,kind:'commit'}).length,0,'被 Boss 禁用的槽位不能显示已触发');

const chargedLog={instanceId:'CHARGE_1',templateId:charge.id,triggered:true,disabled:false,effectsApplied:charge.growthRules[0].effects,runtimeStateAfter:{charged:true}};
const chargeFeedback=feedback.discardFeedback([chargedLog],{getTemplate:()=>charge,getInstance:()=>({runtimeState:{charged:true}})});
assert(chargeFeedback[0].effects.includes('完成蓄力')&&chargeFeedback[0].status.some(line=>line.includes('已蓄力')),'弃牌触发必须同时显示效果和蓄力状态');

const breakdown=feedback.buildScoreBreakdown({baseLayers:{chips:100,mult:4,xmult:1},personaLogs:[{name:chips.name,triggered:true,chipsDelta:45,multDelta:0,finalMultiplierDelta:0},{name:addMult.name,triggered:true,chipsDelta:0,multDelta:2,finalMultiplierDelta:0},{name:finalMult.name,triggered:true,chipsDelta:0,multDelta:0,finalMultiplierDelta:.5}],otherEvents:[],finalLayers:{chips:145,mult:6,xmult:1.5},finalScore:1305});
assert.strictEqual(JSON.stringify(breakdown.final),JSON.stringify({chips:145,mult:6,xmult:1.5}));assert.strictEqual(breakdown.finalScore,1305);assert.strictEqual(Math.round(breakdown.final.chips*breakdown.final.mult*breakdown.final.xmult),breakdown.finalScore,'Score Breakdown中间层必须与正式最终分一致');

const gameSource=fs.readFileSync('game.js','utf8');
assert(gameSource.includes("kind:'preview'")&&gameSource.includes("kind:'commit'"),'Preview与Commit必须使用不同反馈类型');
const previewSource=gameSource.slice(gameSource.indexOf('function updatePreview'),gameSource.indexOf('async function animateScoreResolution'));
assert(!previewSource.includes('showPersonaTriggerFeedback('),'Preview路径不得播放正式人格触发反馈');
assert(/async function play\([^]*?showPersonaTriggerFeedback\(feedback\)/.test(gameSource),'正式出牌Commit必须播放人格触发反馈');
const hudSource=gameSource.slice(gameSource.indexOf('function showPersonaTriggerFeedback'),gameSource.indexOf('function renderScoreBreakdown'));
assert(hudSource.includes('lastPersonaCommitFeedback=[...entries]'),'正式Commit反馈数据必须继续保留');
assert(!hudSource.includes('innerHTML'),'正式Commit不得再创建中央人格反馈框');
assert(!gameSource.includes("showBattleFloat(event.source,'persona')"),'人格名称不得再以中央大字覆盖战斗区域');
const htmlSource=fs.readFileSync('index.html','utf8'),cssSource=fs.readFileSync('persona-feedback.css','utf8');
assert(!htmlSource.includes('id="persona-trigger-toast"')&&!cssSource.includes('.persona-trigger-toast')&&!gameSource.includes('人格共鸣 ×'),'人格共鸣HUD及其全部可视样式必须完全删除');
assert(!htmlSource.includes('id="persona-trigger-preview"')&&!cssSource.includes('.persona-trigger-preview'),'底部Persona Preview汇总框及其占位样式必须完全删除');
assert(gameSource.includes('lastPersonaPreviewFeedback=[...entries]'),'删除可视框后仍必须保留Preview反馈数据');
assert(gameSource.includes('<details><summary>查看本手得分详情'),'Score Breakdown必须默认收纳在可展开详情中');
console.log('persona-feedback-tests: template values, player copy, growth/charge state, preview/commit, Boss disable and score breakdown passed');
