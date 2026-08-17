(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  modules.stageNodes=[
    {id:'DEMO_BATTLE_01',type:'BATTLE',encounterId:'DEMO_ENCOUNTER_01',targetScore:280,estimatedMinutes:null,transitions:[{on:'BATTLE_WIN',to:'DEMO_ROUTE_01'},{on:'BATTLE_LOSS',to:'DEMO_REPORT'}]},
    {id:'DEMO_ROUTE_01',type:'ROUTE',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'ROUTE_COMPLETED',to:'DEMO_BATTLE_02'}]},
    {id:'DEMO_BATTLE_02',type:'BATTLE',encounterId:'DEMO_ENCOUNTER_02',targetScore:420,estimatedMinutes:null,transitions:[{on:'BATTLE_WIN',to:'DEMO_ROUTE_02'},{on:'BATTLE_LOSS',to:'DEMO_REPORT'}]},
    {id:'DEMO_ROUTE_02',type:'ROUTE',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'ROUTE_COMPLETED',to:'DEMO_BATTLE_03'}]},
    {id:'DEMO_BATTLE_03',type:'BATTLE',encounterId:'DEMO_ENCOUNTER_03',targetScore:620,estimatedMinutes:null,transitions:[{on:'BATTLE_WIN',to:'DEMO_REPORT'},{on:'BATTLE_LOSS',to:'DEMO_REPORT'}]},
    {id:'DEMO_REPORT',type:'REPORT',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'REPORT_COMPLETED',to:'DEMO_FORGE'}]},
    {id:'DEMO_FORGE',type:'FORGE',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'FORGE_COMPLETED',to:'RUN_END'}]},
    {id:'SLICE_BATTLE_01',type:'BATTLE',encounterId:'DEMO_ENCOUNTER_01',targetScore:280,estimatedMinutes:null,transitions:[{on:'BATTLE_WIN',to:'SLICE_PERSONA_GROWTH'},{on:'BATTLE_LOSS',to:'SLICE_PERSONA_GROWTH'}]},
    {id:'SLICE_PERSONA_GROWTH',type:'PERSONA_GROWTH',encounterId:null,targetScore:null,estimatedMinutes:null,growthProfileId:'SLICE_GROWTH_PROFILE_01',transitions:[{on:'PERSONA_GROWTH_COMPLETED',to:'SLICE_BATTLE_02'}]},
    {id:'SLICE_BATTLE_02',type:'BATTLE',encounterId:'DEMO_ENCOUNTER_02',targetScore:420,estimatedMinutes:null,transitions:[{on:'BATTLE_WIN',to:'SLICE_END'},{on:'BATTLE_LOSS',to:'SLICE_END'}]},
    {id:'SLICE_END',type:'END',encounterId:null,targetScore:null,estimatedMinutes:null,transitions:[{on:'SLICE_END_COMPLETED',to:'RUN_END'}]}
  ];
})(globalThis);
