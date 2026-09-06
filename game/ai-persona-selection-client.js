+(function(root){
  'use strict';
  const DEFAULT_TIMEOUT_MS=6500;
  function create({endpoint='',timeoutMs=DEFAULT_TIMEOUT_MS,fetchImpl=root.fetch,abortController=root.AbortController}={}){
    const normalizedEndpoint=String(endpoint||'').trim();
    function isConfigured(){return /^https?:\/\//i.test(normalizedEndpoint)&&typeof fetchImpl==='function'}
    async function select(request){
      if(!isConfigured())return{ok:false,status:'DISABLED',response:null};
      const controller=typeof abortController==='function'?new abortController():null,timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
      try{
        const response=await fetchImpl(normalizedEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller?.signal});
        if(!response.ok)return{ok:false,status:`HTTP_${response.status}`,response:null};
        const body=await response.json();
        return{ok:true,status:'REMOTE_RESPONSE',response:body};
      }catch(error){return{ok:false,status:error?.name==='AbortError'?'TIMEOUT':'NETWORK_ERROR',response:null}}
      finally{if(timer)clearTimeout(timer)}
    }
    return Object.freeze({isConfigured,select});
  }
  root.AiPersonaSelectionClient=Object.freeze({create,DEFAULT_TIMEOUT_MS});
})(globalThis);
