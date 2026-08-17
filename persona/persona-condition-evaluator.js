(function(root){
  'use strict';
  function evaluate(condition,context,runtimeState){
    switch(condition.type){
      case'SUBMITTED_CARD_COUNT_AT_LEAST':return(context.submittedCards?.length||0)>=condition.value;
      case'SUBMITTED_CARD_COUNT_EXACT':return(context.submittedCards?.length||0)===condition.value;
      case'HAND_TYPE_IS':return context.handType===condition.value||context.handTypeId===condition.value;
      case'HAND_TYPE_IN':return condition.values.includes(context.handType)||condition.values.includes(context.handTypeId);
      case'SAME_HAND_TYPE_STREAK_AT_LEAST':return(context.sameHandTypeStreak||0)>=condition.value;
      case'DISCARDED_CARD_COUNT_AT_LEAST':return(context.discardsUsedThisAction||0)>=condition.value;
      case'PERSONA_RUNTIME_FLAG':return runtimeState?.[condition.key]===(condition.value??true);
      case'UNIQUE_HAND_TYPE_FIRST_TIME_THIS_RUN':return!(context.runHistory?.usedHandTypes||[]).includes(context.handTypeId||context.handType);
      case'HAND_HAS_STRAIGHT':return!!context.straight;
      case'MIN_UNIQUE_SUITS':return(context.uniqueSuitCount||0)>=condition.value;
      case'HAS_MATCHED_RANK_STRUCTURE':return!!context.hasMatchedRankStructure;
      case'HAND_HAS_FLUSH':return!!context.flush;
      default:return false;
    }
  }
  function evaluateAll(conditions,context,runtimeState){return(conditions||[]).every(condition=>evaluate(condition,context,runtimeState))}
  function evaluateDetailed(conditions,context,runtimeState){return(conditions||[]).map(condition=>({condition:JSON.parse(JSON.stringify(condition)),passed:evaluate(condition,context,runtimeState)}))}
  root.PersonaConditionEvaluator={evaluate,evaluateAll,evaluateDetailed};
})(globalThis);
