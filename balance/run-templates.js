(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  modules.runTemplates=[
    {
      id:'RUN_TEMPLATE_PERSONA_SLICE',
      runTemplateId:'RUN_TEMPLATE_PERSONA_SLICE',
      startNodeId:'SLICE_BATTLE_01',
      nodeIds:['SLICE_BATTLE_01','SLICE_PERSONA_GROWTH','SLICE_BATTLE_02','SLICE_END'],
      endCondition:{type:'NODE_COMPLETED',nodeId:'SLICE_END'},
      version:1,
      developmentOnly:true
    }
  ];
})(globalThis);
