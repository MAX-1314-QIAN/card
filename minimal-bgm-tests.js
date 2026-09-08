const assert = require('assert'), fs = require('fs'), vm = require('vm');
const source = fs.readFileSync('audio-effects.js','utf8');
const html = fs.readFileSync('index.html','utf8');
assert(!/createOscillator|createBuffer\(|Math\.random|musicTone/.test(source), 'No procedural audio');
assert(html.includes('audio-effects.js?v=20260907-recorded-audio-v1'));
assert(html.includes('assets/audio/credits.html'));
for (const file of fs.readdirSync('assets/audio/sfx')) assert.equal(fs.readFileSync(`assets/audio/sfx/${file}`).subarray(0,4).toString(),'OggS',file);
for (const file of fs.readdirSync('assets/audio/music')) {
  const data=fs.readFileSync(`assets/audio/music/${file}`);
  assert(data.length>1000000,file);
  assert(data.subarray(0,3).toString()==='ID3'||data[0]===255,file);
}
let now=1000, nextId=0;
const listeners={}, windowListeners={}, observers=[], timers=new Map(), elements=[];
const controls={'#master-volume':{value:80},'#music-enabled':{checked:true},'#sfx-enabled':{checked:true},'#shop-dialog':{open:false},'#forge-dialog':{open:false}};
const document={hidden:false,body:{dataset:{screen:'menu'},append(a){elements.push(a)}},querySelector:s=>controls[s],addEventListener:(n,f)=>{(listeners[n]??=[]).push(f)}};
class Audio {
  constructor(src){assert(fs.existsSync(src),src);this.src=src;this.dataset={};this.paused=true;this.ended=false;this.currentTime=0;this.duration=240;this.plays=0;this.volume=0}
  addEventListener(){}
  play(){this.paused=false;this.plays++;return Promise.resolve()}
  pause(){this.paused=true}
}
const window={addEventListener:(n,f)=>windowListeners[n]=f};
vm.runInNewContext(source,{Audio,document,window,console,performance:{now:()=>now},MutationObserver:class{constructor(f){this.f=f}observe(target){observers.push({target,f:this.f})}},setInterval:f=>{timers.set(++nextId,f);return nextId},clearInterval:id=>timers.delete(id)});
const emit=(n,e={})=>(listeners[n]||[]).forEach(f=>f(e));
const tick=()=>{now+=50;for(const a of elements)if(!a.paused)a.currentTime+=.05;for(const f of timers.values())f()};
const advance=()=>{for(let i=0;i<30;i++)tick()};
const screen=name=>{document.body.dataset.screen=name;observers.filter(o=>o.target===document.body).forEach(o=>o.f())};
window.gameSfx('select');assert.equal(elements.length,0,'No autoplay');
emit('keydown',{repeat:false});advance();
const menu=elements.find(a=>a.src.endsWith('/darkest-child.mp3'));
assert(menu&&!menu.paused&&menu.volume>0,'Keyboard unlocks music');
const position=menu.currentTime, plays=menu.plays;
window.applyAudioSettings({volume:50});assert.equal(menu.currentTime,position);assert.equal(menu.plays,plays,'Volume does not restart track');
screen('battle');advance();
const battle=elements.find(a=>a.src.endsWith('/darkest-child-var-a.mp3'));
assert(menu.paused&&!battle.paused&&battle.volume>0,'Crossfade finishes with only new track playing');
screen('settings');advance();assert(!battle.paused&&menu.paused,'Settings keeps battle music');
window.applyAudioSettings({music:false});assert(battle.paused);assert.equal(timers.size,0);
window.gameSfx('select');assert(elements.some(a=>a.dataset.audioChannel==='sfx'&&!a.paused),'Independent SFX');
window.applyAudioSettings({sfx:false});assert(elements.every(a=>a.paused));
window.applyAudioSettings({music:true});advance();assert(!battle.paused);
document.hidden=true;emit('visibilitychange');assert(elements.every(a=>a.paused));assert.equal(timers.size,0);
const hiddenCount=elements.length;window.gameSfx('boss');assert.equal(elements.length,hiddenCount);
document.hidden=false;emit('visibilitychange');advance();assert(!battle.paused);
window.applyAudioSettings({volume:0});assert(elements.every(a=>a.paused));
window.applyAudioSettings({volume:80,sfx:true});
for(const name of ['hover','select','button','tick','play','discard','score','buy','persona','personaCharge','personaTravel','personaImpact','boss','forge','win','failure','dice']){
  now+=1000;window.gameSfx(name);for(const a of elements)if(a.dataset.audioCue)a.pause();
}
now+=1000;window.gameMusicStinger('victory');const result=elements.find(a=>a.dataset.audioCue==='win'&&!a.paused);assert(result);
window.gameSfx('win');assert.equal(elements.filter(a=>a.dataset.audioCue==='win'&&!a.paused).length,1,'One settlement cue');
window.applyAudioSettings({music:false,sfx:true});now+=1000;window.gameMusicStinger('failure');assert(elements.some(a=>a.dataset.audioCue==='failure'&&!a.paused),'SFX-only loss feedback');
for(let i=0;i<100;i++){now+=200;window.gameSfx(['select','tick','play','persona'][i%4])}
assert(elements.filter(a=>a.dataset.audioCue&&!a.paused).length<=10,'Bounded polyphony');
window.applyAudioSettings({sfx:false});window.applyAudioSettings({sfx:true});
const original=Audio.prototype.play;Audio.prototype.play=()=>{throw Error('decode failure')};now+=1000;
assert.doesNotThrow(()=>window.gameSfx('boss'));Audio.prototype.play=original;
windowListeners.pagehide();assert(elements.every(a=>a.paused));
const game=fs.readFileSync('game.js','utf8');
assert(/async function play\(\)\{\s*if\(inputLocked\)return;inputLocked=true;window.gameSfx\?\.\('play'\)/.test(game));
assert(/async function discard\(\)\{\s*if\(inputLocked\)return;inputLocked=true;window.gameSfx\?\.\('discard'\)/.test(game));
console.log('Recorded audio: assets, gesture, crossfade, settings, visibility, settlement, polyphony and failure tests passed');
