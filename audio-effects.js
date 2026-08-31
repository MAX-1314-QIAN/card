(() => {
  let context=null,master=null,musicMaster=null,lastHover=0,musicMode='silent',musicTimer=null,musicStep=0;
  const getVolume=()=>Number(document.querySelector('#master-volume')?.value??80)/100;
  const musicEnabled=()=>document.querySelector('#music-enabled')?.checked!==false;
  const sfxEnabled=()=>document.querySelector('#sfx-enabled')?.checked!==false;
  function ensureAudio(){if(!context){context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();musicMaster=context.createGain();master.gain.value=sfxEnabled()?getVolume()*.22:0;musicMaster.gain.value=musicEnabled()?getVolume()*.18:0;master.connect(context.destination);musicMaster.connect(context.destination)}if(context.state==='suspended')context.resume();return context}
  function tone(freq,duration=.08,type='sine',delay=0,volume=.45){const ctx=ensureAudio(),osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+duration+.02)}
  function noise(duration=.12,volume=.18){const ctx=ensureAudio(),buffer=ctx.createBuffer(1,ctx.sampleRate*duration,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();filter.type='bandpass';filter.frequency.value=900;gain.gain.value=volume;src.buffer=buffer;src.connect(filter);filter.connect(gain);gain.connect(master);src.start()}
  function musicTone(freq,duration,type='sine',delay=0,volume=.18,cutoff=1400){
    const ctx=context;if(!ctx||!musicMaster)return;
    const osc=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),start=ctx.currentTime+delay;
    osc.type=type;osc.frequency.setValueAtTime(freq,start);filter.type='lowpass';filter.frequency.value=cutoff;
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),start+.035);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(filter);filter.connect(gain);gain.connect(musicMaster);osc.start(start);osc.stop(start+duration+.05);
  }
  function playMenuMusicStep(){
    const notes=[146.83,220,293.66,349.23,293.66,220,174.61,261.63],note=notes[musicStep%notes.length];
    musicTone(note,1.5,'sine',0,.12,1100);
    if(musicStep%4===0)musicTone(note/2,3.1,'triangle',0,.075,420);
    if(musicStep%8===6)musicTone(note*2,1.8,'sine',.18,.045,1800);
    musicStep++;
  }
  function playBattleMusicStep(){
    const bass=[73.42,73.42,87.31,65.41,73.42,98,87.31,65.41],note=bass[musicStep%bass.length];
    musicTone(note,.55,'triangle',0,.18,520);
    if(musicStep%2===0)musicTone(note*2,.32,'square',.04,.038,750);
    if(musicStep%4===3)musicTone([293.66,349.23,261.63,329.63][Math.floor(musicStep/4)%4],.72,'sine',.08,.07,1500);
    musicStep++;
  }
  function desiredMusicMode(){const screen=document.body.dataset.screen;if(screen==='battle')return'battle';if(screen==='settings'&&musicMode!=='silent')return musicMode;return'menu'}
  function startMusic(mode){
    if(musicTimer){clearInterval(musicTimer);musicTimer=null}
    musicMode=mode;musicStep=0;if(mode==='silent'||!context)return;
    const play=mode==='battle'?playBattleMusicStep:playMenuMusicStep,interval=mode==='battle'?340:760;
    play();musicTimer=setInterval(play,interval);
  }
  function syncMusic(force=false){if(!context)return;if(!musicEnabled()){if(musicMode!=='silent')startMusic('silent');return}const mode=desiredMusicMode();if(force||mode!==musicMode)startMusic(mode)}
  function musicStinger(result){
    if(!context||!musicEnabled())return;
    const notes=result==='victory'?[293.66,369.99,440,587.33]:[293.66,277.18,220,146.83];
    notes.forEach((freq,index)=>musicTone(freq,.7,'triangle',index*.12,.16,1300));
  }
  const sounds={
    hover:()=>tone(520,.035,'sine',0,.12),
    select:()=>{tone(440,.07,'triangle',0,.28);tone(660,.08,'sine',.025,.18)},
    button:()=>tone(300,.06,'triangle',0,.22),
    tick:()=>tone(510,.045,'sine',0,.12),
    play:()=>{tone(220,.12,'triangle',0,.35);tone(330,.14,'triangle',.05,.32);tone(495,.18,'sine',.1,.3)},
    score:()=>{tone(392,.1,'triangle',0,.24);tone(587,.13,'sine',.06,.22);tone(784,.18,'sine',.12,.18)},
    persona:()=>{tone(330,.12,'triangle',0,.22);tone(660,.2,'sine',.06,.2)},
    personaCharge:()=>{tone(185,.22,'sine',0,.12);tone(370,.24,'triangle',.04,.12)},
    personaTravel:()=>{tone(420,.32,'sine',0,.08);tone(630,.26,'sine',.07,.065);noise(.2,.035)},
    personaImpact:()=>{tone(740,.08,'triangle',0,.2);tone(1110,.16,'sine',.025,.13)},
    boss:()=>{noise(.2,.12);tone(95,.28,'sawtooth',0,.17);tone(142,.2,'triangle',.06,.12)},
    discard:()=>{noise(.16,.16);tone(180,.13,'sawtooth',0,.14)},
    buy:()=>{tone(740,.07,'sine',0,.25);tone(980,.12,'sine',.07,.2)},
    win:()=>[262,330,392,523].forEach((f,i)=>tone(f,.25,'triangle',i*.09,.3)),
    forge:()=>{tone(110,.5,'sine',0,.28);tone(440,.55,'sine',.12,.18);tone(660,.45,'sine',.25,.15)}
  };
  window.gameSfx=name=>{if(!sfxEnabled())return;try{sounds[name]?.()}catch{}};
  window.gameMusicStinger=result=>{try{musicStinger(result)}catch{}};
  window.applyAudioSettings=settings=>{const volume=Number(settings?.volume??getVolume()*100)/100;if(master)master.gain.value=settings?.sfx===false?0:volume*.22;if(musicMaster)musicMaster.gain.value=settings?.music===false?0:volume*.18;if(context)syncMusic(true)};
  document.addEventListener('pointerdown',()=>{ensureAudio();syncMusic(true)},{once:true});
  new MutationObserver(()=>syncMusic()).observe(document.body,{attributes:true,attributeFilter:['data-screen']});
  document.addEventListener('pointerover',event=>{if(!event.target.closest('button'))return;const now=performance.now();if(now-lastHover>90){window.gameSfx('hover');lastHover=now}});
  document.addEventListener('click',event=>{if(event.target.closest('.card'))window.gameSfx('select');else if(event.target.closest('button')&&!event.target.closest('#play-btn,#discard-btn,[data-buy]'))window.gameSfx('button')});
  document.querySelector('#play-btn')?.addEventListener('click',()=>window.gameSfx('play'));
  document.querySelector('#discard-btn')?.addEventListener('click',()=>window.gameSfx('discard'));
  document.querySelectorAll('[data-buy]').forEach(button=>button.addEventListener('click',()=>window.gameSfx('buy')));
  document.addEventListener('keydown',event=>{const battleVisible=!document.querySelector('#battle-screen')?.classList.contains('hidden');if(!battleVisible)return;if(event.code==='Space')window.gameSfx('play');if(event.key.toLowerCase()==='d')window.gameSfx('discard')});
  const watchDialog=(selector,sound)=>{const dialog=document.querySelector(selector);if(dialog)new MutationObserver(()=>{if(dialog.open)window.gameSfx(sound)}).observe(dialog,{attributes:true,attributeFilter:['open']})};
  watchDialog('#shop-dialog','win');watchDialog('#forge-dialog','forge');
  document.querySelector('#master-volume')?.addEventListener('input',()=>window.applyAudioSettings?.({volume:getVolume()*100,music:musicEnabled(),sfx:sfxEnabled()}));
})();
