const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const context={console,setTimeout,clearTimeout,JSON,AbortController};context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync('game/ai-persona-selection-client.js','utf8'),context);

(async()=>{
  const disabled=context.AiPersonaSelectionClient.create();
  assert.strictEqual(disabled.isConfigured(),false);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(await disabled.select({requestId:'R1'}))),{ok:false,status:'DISABLED',response:null});

  let sent=null;
  const remote=context.AiPersonaSelectionClient.create({endpoint:'https://example.test/api/ai-persona/select',fetchImpl:async(url,options)=>{sent={url,options};return{ok:true,json:async()=>({requestId:'R1',selectedCandidateId:'C2'})}}});
  const result=await remote.select({requestId:'R1',candidateIds:['C1','C2']});
  assert.strictEqual(result.ok,true);assert.strictEqual(result.response.selectedCandidateId,'C2');assert.strictEqual(sent.url,'https://example.test/api/ai-persona/select');assert.strictEqual(sent.options.method,'POST');assert.ok(!sent.options.body.includes('DEEPSEEK'));

  const failed=context.AiPersonaSelectionClient.create({endpoint:'https://example.test/api/ai-persona/select',fetchImpl:async()=>({ok:false,status:503})});
  assert.strictEqual((await failed.select({requestId:'R2'})).status,'HTTP_503');

  const timedOut=context.AiPersonaSelectionClient.create({endpoint:'https://example.test/api/ai-persona/select',timeoutMs:5,fetchImpl:async(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{const error=new Error('aborted');error.name='AbortError';reject(error)}))});
  assert.strictEqual((await timedOut.select({requestId:'R3'})).status,'TIMEOUT');

  const source=fs.readFileSync('game/ai-persona-api-config.js','utf8');
  assert.ok(!/sk-[A-Za-z0-9]/.test(source),'public client config must not contain an API key');
  console.log('ai-persona-selection-client-tests: disabled mode, remote selection, failure fallback and key boundary passed');
})().catch(error=>{console.error(error);process.exitCode=1});
