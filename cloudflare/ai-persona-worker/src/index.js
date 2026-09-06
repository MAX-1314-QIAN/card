import{buildModelMessages,parseAllowedOrigins,parseModelSelection,requestSizeAllowed,validateSelectionRequest}from'./selection.js';

const MODEL_TIMEOUT_MS=5500;
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
function corsHeaders(origin,allowed){return allowed.has(origin)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{}}

export default{
  async fetch(incoming,env){
    const url=new URL(incoming.url),origin=incoming.headers.get('Origin')||'',allowed=parseAllowedOrigins(env.ALLOWED_ORIGINS),cors=corsHeaders(origin,allowed);
    if(url.pathname!=='/api/ai-persona/select')return json({error:'NOT_FOUND'},404);
    if(incoming.method==='OPTIONS')return allowed.has(origin)?new Response(null,{status:204,headers:cors}):json({error:'ORIGIN_REJECTED'},403);
    if(incoming.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405,cors);
    if(origin&&!allowed.has(origin))return json({error:'ORIGIN_REJECTED'},403);
    const contentLength=Number(incoming.headers.get('Content-Length'));if(!requestSizeAllowed(contentLength))return json({error:'BODY_TOO_LARGE'},413,cors);
    let request;try{const raw=await incoming.text();if(!requestSizeAllowed(new TextEncoder().encode(raw).byteLength))return json({error:'BODY_TOO_LARGE'},413,cors);request=validateSelectionRequest(JSON.parse(raw))}catch(error){return json({error:error.message||'INVALID_REQUEST'},400,cors)}
    if(!env.DEEPSEEK_API_KEY)return json({error:'SERVICE_NOT_CONFIGURED'},503,cors);
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),MODEL_TIMEOUT_MS);
    try{
      const upstream=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${env.DEEPSEEK_API_KEY}`},body:JSON.stringify({model:env.DEEPSEEK_MODEL||'deepseek-v4-flash',messages:buildModelMessages(request),response_format:{type:'json_object'},thinking:{type:'disabled'},temperature:0.2,max_tokens:120,stream:false}),signal:controller.signal});
      if(!upstream.ok)return json({error:'MODEL_UNAVAILABLE'},503,cors);
      const payload=await upstream.json(),selection=parseModelSelection(payload?.choices?.[0]?.message?.content,request);
      return json(selection,200,cors);
    }catch(error){return json({error:error?.name==='AbortError'?'MODEL_TIMEOUT':'MODEL_RESPONSE_REJECTED'},503,cors)}
    finally{clearTimeout(timeout)}
  }
};
