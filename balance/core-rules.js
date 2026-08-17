(function(root){
  const modules=root.PERSONA_BALANCE_MODULES||(root.PERSONA_BALANCE_MODULES={});
  modules.coreRules={
    baseHands:4,
    baseDiscards:3,
    startingHandSize:8,
    maxSelection:5,
    narrowTableMaxSelection:4,
    personaSlots:4,
    minHands:1,
    minScore:1
  };
})(globalThis);
