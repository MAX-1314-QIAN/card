const MAX_BODY_BYTES=64*1024;
const MAX_CANDIDATES=16;
const FORBIDDEN_KEYS=new Set(['rawEvents','runState','save','cards','cardInstanceIds','freeText','apiKey']);

function plainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)}
function containsForbiddenKey(value){
  if(Array.isArray(value))return value.some(containsForbiddenKey);
  if(!plainObject(value))return false;
  return Object.entries(value).some(([key,child])=>FORBIDDEN_KEYS.has(key)||containsForbiddenKey(child));
}
export function parseAllowedOrigins(value=''){
  return new Set(String(value).split(',').map(item=>item.trim()).filter(Boolean));
}
export function validateSelectionRequest(body){
  if(!plainObject(body)||body.schemaVersion!==1)throw new Error('INVALID_SCHEMA');
  if(JSON.stringify(Object.keys(body).sort())!==JSON.stringify(['behaviorSnapshot','candidateIds','candidates','directionId','requestId','runtimeNodeId','schemaVersion']))throw new Error('INVALID_REQUEST_FIELDS');
  if(typeof body.requestId!=='string'||!/^AI_PERSONA_SELECTION_V1:N(?:04|08|12):/.test(body.requestId)||body.requestId.length>180)throw new Error('INVALID_REQUEST_ID');
  if(!['N04','N08','N12'].includes(body.runtimeNodeId)||!body.requestId.includes(`:${body.runtimeNodeId}:`))throw new Error('INVALID_NODE');
  if(!['AI_DIRECTION_BRIDGE','AI_DIRECTION_BREAK','AI_DIRECTION_FOLLOW'].includes(body.directionId))throw new Error('INVALID_DIRECTION');
  if(!Array.isArray(body.candidateIds)||body.candidateIds.length<1||body.candidateIds.length>MAX_CANDIDATES||new Set(body.candidateIds).size!==body.candidateIds.length||body.candidateIds.some(id=>typeof id!=='string'||id.length>160))throw new Error('INVALID_CANDIDATE_IDS');
  if(!Array.isArray(body.candidates)||body.candidates.length!==body.candidateIds.length)throw new Error('INVALID_CANDIDATES');
  if(body.candidates.some((candidate,index)=>!plainObject(candidate)||JSON.stringify(Object.keys(candidate).sort())!==JSON.stringify(['behaviorTags','budget','id','playerCopy'])||candidate.id!==body.candidateIds[index]||!plainObject(candidate.playerCopy)||['trigger','mainEffect','growth','summary'].some(key=>typeof candidate.playerCopy[key]!=='string'||candidate.playerCopy[key].length<1||candidate.playerCopy[key].length>300)))throw new Error('INVALID_CANDIDATE');
  if(!plainObject(body.behaviorSnapshot)||body.behaviorSnapshot.privacy?.containsFullSave!==false||body.behaviorSnapshot.privacy?.containsRawCards!==false||body.behaviorSnapshot.privacy?.containsCardInstanceIds!==false||body.behaviorSnapshot.privacy?.containsFreeText!==false||containsForbiddenKey(body.behaviorSnapshot))throw new Error('PRIVACY_REJECTED');
  return body;
}
export function buildModelMessages(request){
  const directionCopy={AI_DIRECTION_BRIDGE:'桥接：优先补足现有打法可自然转向的组合能力',AI_DIRECTION_BREAK:'破局：优先提供与当前惯用打法不同、但当前牌组仍可触发的能力',AI_DIRECTION_FOLLOW:'顺势：优先强化已经被数据充分证明的核心打法'}[request.directionId];
  const compact={requestId:request.requestId,node:request.runtimeNodeId,direction:directionCopy,behaviorSnapshot:request.behaviorSnapshot,candidates:request.candidates};
  return[
    {role:'system',content:'你是《人格牌》的受限选择器。你不能创造规则、数值、文案或候选，只能从 candidateIds 中选择一个最符合 direction 与玩家行为的数据项。避免仅按数组顺序选择。只输出 JSON，且只能包含 requestId 与 selectedCandidateId 两个字段。'},
    {role:'user',content:JSON.stringify(compact)}
  ];
}
export function parseModelSelection(content,request){
  if(typeof content!=='string')throw new Error('INVALID_MODEL_CONTENT');
  let parsed;try{parsed=JSON.parse(content)}catch{throw new Error('INVALID_MODEL_JSON')}
  if(!plainObject(parsed)||JSON.stringify(Object.keys(parsed).sort())!==JSON.stringify(['requestId','selectedCandidateId'])||parsed.requestId!==request.requestId||!request.candidateIds.includes(parsed.selectedCandidateId))throw new Error('INVALID_MODEL_SELECTION');
  return{requestId:request.requestId,selectedCandidateId:parsed.selectedCandidateId};
}
export function requestSizeAllowed(contentLength){return !Number.isFinite(contentLength)||contentLength<=MAX_BODY_BYTES}
