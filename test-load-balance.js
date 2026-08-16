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
  'balance/target/stage-nodes.js',
  'balance/target/run-template.js',
  'balance/boss-profiles.js',
  'balance/interventions.js',
  'balance/encounters.js',
  'balance/stage-nodes.js',
  'balance/run-templates.js',
  'balance/schema-validation.js',
  'balance/manifest.js',
  'balance-v2.1.js'
];

function loadBalance(context){
  for(const file of BALANCE_SCRIPT_FILES)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  for(const file of ['persona/persona-instance.js','persona/persona-condition-evaluator.js','persona/persona-effect-executor.js','persona/legacy-persona-adapter.js','persona/persona-feedback.js','persona/persona-runtime.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  vm.runInContext(fs.readFileSync('poker-engine.js','utf8'),context,{filename:'poker-engine.js'});
  vm.runInContext(fs.readFileSync('run-controller.js','utf8'),context,{filename:'run-controller.js'});
  return context.BALANCE_V21;
}

module.exports={BALANCE_SCRIPT_FILES,loadBalance};
