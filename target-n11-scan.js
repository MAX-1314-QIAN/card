const {Worker,isMainThread,parentPort,workerData}=require('worker_threads');

const candidates=[2250,2200,2150,2100];
const runsPerPolicy=500;
const seed=20260815;
const currentBaselineHighest=1768;

function compact(target,result){
  const greedy=result.summaries.GREEDY_SCORE,aware=result.summaries.PERSONA_AWARE,gN11=greedy.nodeStats.N11,aN11=aware.nodeStats.N11,gN13=greedy.nodeStats.N13,aN13=aware.nodeStats.N13,highest=Math.max(greedy.maxSingleHandScoreObserved,aware.maxSingleHandScoreObserved);
  return{target,greedyN11ClearRate:gN11.clearRate,awareN11ClearRate:aN11.clearRate,greedyFullClearRate:greedy.fullClearRate,awareFullClearRate:aware.fullClearRate,greedyN13Entered:gN13.enteredRuns,awareN13Entered:aN13.enteredRuns,greedyN13ClearRate:gN13.clearRate,awareN13ClearRate:aN13.clearRate,highestSingleHandScore:highest,outlierStatus:result.outlierStatus,newHighScoreAnomaly:result.outlierStatus!=='NO_OBVIOUS_EXPLOSION'||highest>currentBaselineHighest*1.15};
}

if(isMainThread){
  Promise.all(candidates.map(target=>new Promise((resolve,reject)=>{
    const worker=new Worker(__filename,{workerData:{target}});
    worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code!==0)reject(new Error(`N11 ${target} worker exited with ${code}`))});
  }))).then(results=>{results.sort((a,b)=>b.target-a.target);console.log(JSON.stringify({seed,runsPerPolicy,formalN11Target:2150,temporaryOverridesOnly:true,results},null,2))}).catch(error=>{console.error(error);process.exitCode=1});
}else{
  const simulator=require('./target-balance-simulator'),result=simulator.runSimulation({runsPerPolicy,seed,targetOverrides:{N11:workerData.target}});
  parentPort.postMessage(compact(workerData.target,result));
}
