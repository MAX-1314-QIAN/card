(() => {
  'use strict';
  // All sound comes from licensed recordings. No synthesizer or generated fallback.
  const cues = {
    hover: { files: ['card-slide-1'], gain: .13, cooldown: 150 },
    select: { files: ['card-slide-1', 'card-slide-2', 'card-slide-3'], gain: .48, cooldown: 55 },
    button: { files: ['click_001'], gain: .32, cooldown: 90 },
    tick: { files: ['chip-lay-1', 'chip-lay-2'], gain: .32, cooldown: 65 },
    play: { files: ['card-place-1', 'card-place-2'], gain: .72, cooldown: 180 },
    discard: { files: ['card-shove-1'], gain: .55, cooldown: 180 },
    score: { files: ['chips-stack-1'], gain: .64, cooldown: 180 },
    buy: { files: ['chips-handle-1'], gain: .65, cooldown: 180 },
    persona: { files: ['glass_001'], gain: .4, cooldown: 160 },
    personaCharge: { files: ['glass_002'], gain: .28, cooldown: 160 },
    personaTravel: { files: ['card-fan-1'], gain: .3, cooldown: 140 },
    personaImpact: { files: ['chips-collide-1'], gain: .48, cooldown: 100 },
    boss: { files: ['bong_001'], gain: .5, cooldown: 600 },
    forge: { files: ['open_001'], gain: .48, cooldown: 300 },
    win: { files: ['confirmation_002'], gain: .52, cooldown: 700 },
    failure: { files: ['error_004'], gain: .4, cooldown: 700 },
    dice: { files: ['dice-throw-1'], gain: .65, cooldown: 250 }
  };
  const tracks = { menu: 'darkest-child.mp3', battle: 'darkest-child-var-a.mp3' };
  const pools = new Map(), lastPlayed = new Map(), variants = new Map(), music = new Map();
  let unlocked = false, musicMode = 'menu', mixerTimer = null, duckUntil = 0, settlementCueUntil = 0;
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : .8));
  let settings = {
    volume: clamp(Number(document.querySelector('#master-volume')?.value ?? 80) / 100),
    music: document.querySelector('#music-enabled')?.checked !== false,
    sfx: document.querySelector('#sfx-enabled')?.checked !== false
  };
  function media(src, channel) {
    const audio = new Audio(src);
    audio.preload = channel === 'music' ? 'none' : 'auto';
    audio.hidden = true;
    audio.dataset.audioChannel = channel;
    audio.volume = 0;
    document.body.append(audio);
    audio.addEventListener('error', () => console.warn('音频素材无法播放：', src), { once: true });
    return audio;
  }
  function safePlay(audio) {
    try { audio.play()?.catch(() => {}); } catch { /* Missing clips cannot interrupt gameplay. */ }
  }
  function desiredMusicMode() {
    const screen = document.body.dataset.screen;
    if (screen === 'settings') return musicMode;
    if (screen === 'battle' && !document.querySelector('#shop-dialog')?.open &&
        !document.querySelector('#forge-dialog')?.open) return 'battle';
    return 'menu';
  }
  function stopEffects() {
    for (const pool of pools.values()) for (const audio of pool) audio.pause();
  }
  function stopMusic() {
    if (mixerTimer !== null) clearInterval(mixerTimer);
    mixerTimer = null;
    for (const entry of music.values()) { entry.audio.pause(); entry.audio.volume = 0; entry.level = 0; }
  }
  function mixMusic() {
    const duck = performance.now() < duckUntil ? .42 : 1;
    for (const [mode, entry] of music) {
      const target = mode === musicMode ? 1 : 0;
      entry.level += Math.sign(target - entry.level) * Math.min(.045, Math.abs(target - entry.level));
      // Soften the recording's start/end; keep the complete composed track.
      const remaining = entry.audio.duration - entry.audio.currentTime;
      const edge = Math.min(1, entry.audio.currentTime / .8, Number.isFinite(remaining) ? Math.max(0, remaining / 1.2) : 1);
      entry.audio.volume = clamp(settings.volume * .38 * entry.level * duck * edge);
      if (!target && entry.level === 0) entry.audio.pause();
    }
  }
  function syncMusic() {
    musicMode = desiredMusicMode();
    if (!unlocked || !settings.music || settings.volume === 0 || document.hidden) { stopMusic(); return; }
    if (!music.has(musicMode)) {
      const audio = media(`assets/audio/music/${tracks[musicMode]}`, 'music');
      audio.loop = true;
      music.set(musicMode, { audio, level: 0 });
    }
    const entry = music.get(musicMode);
    // Settings changes and repeated gestures must never rewind the song.
    if (entry.audio.paused) safePlay(entry.audio);
    if (mixerTimer === null) mixerTimer = setInterval(mixMusic, 50);
  }
  function playCue(name, channel = 'sfx') {
    const cue = cues[name], now = performance.now();
    if (!unlocked || document.hidden || !cue || !settings[channel] || settings.volume === 0) return;
    if (channel === 'sfx' && now < settlementCueUntil && (name === 'win' || name === 'discard')) return;
    if (now - (lastPlayed.get(name) ?? -Infinity) < cue.cooldown) return;
    const active = [...pools.values()].flat().filter(audio => !audio.paused && !audio.ended);
    if (active.length >= 10) return;
    lastPlayed.set(name, now);
    const index = variants.get(name) || 0;
    variants.set(name, index + 1);
    const file = cue.files[index % cue.files.length], key = `${channel}:${file}`;
    if (!pools.has(key)) pools.set(key, []);
    const pool = pools.get(key);
    let audio = pool.find(item => item.paused || item.ended);
    if (!audio && pool.length < 3) { audio = media(`assets/audio/sfx/${file}.ogg`, channel); pool.push(audio); }
    if (!audio) return;
    audio.currentTime = 0;
    audio.dataset.audioCue = name;
    audio.dataset.audioGain = String(cue.gain);
    audio.volume = clamp(settings.volume * cue.gain);
    safePlay(audio);
    if (['score', 'boss', 'win', 'forge', 'failure'].includes(name)) duckUntil = now + 1100;
  }
  function musicStinger(result) {
    playCue(result === 'victory' ? 'win' : 'failure', 'music');
    // Settlement also submits win/discard in the same turn: keep one result cue.
    if (!settings.music) playCue(result === 'victory' ? 'win' : 'failure');
    settlementCueUntil = performance.now() + 250;
  }
  function unlock() { unlocked = true; syncMusic(); }
  window.gameSfx = name => playCue(name);
  window.gameMusicStinger = musicStinger;
  window.applyAudioSettings = values => {
    settings = {
      volume: values?.volume === undefined ? settings.volume : clamp(Number(values.volume) / 100),
      music: values?.music ?? settings.music,
      sfx: values?.sfx ?? settings.sfx
    };
    for (const pool of pools.values()) for (const audio of pool) {
      const enabled = settings[audio.dataset.audioChannel];
      audio.volume = enabled ? clamp(settings.volume * Number(audio.dataset.audioGain || 0)) : 0;
      if (!enabled || !settings.volume) audio.pause();
    }
    syncMusic();
    if (mixerTimer !== null) mixMusic();
  };
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('keydown', event => { if (!event.repeat) unlock(); }, { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopMusic(); stopEffects(); } else syncMusic();
  });
  window.addEventListener('pagehide', () => { stopMusic(); stopEffects(); });
  window.addEventListener('pageshow', () => syncMusic());
  new MutationObserver(syncMusic).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  document.addEventListener('pointerover', event => {
    const button = event.target.closest('button');
    if (button && !button.disabled && !button.contains(event.relatedTarget)) playCue('hover');
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.disabled) return;
    if (event.target.closest('#cards .card')) playCue('select');
    else if (button && !button.matches('#play-btn,#discard-btn,[data-buy]')) playCue('button');
  });
  for (const [selector, cue] of [['#shop-dialog', 'buy'], ['#forge-dialog', 'forge']]) {
    const dialog = document.querySelector(selector);
    if (dialog) new MutationObserver(() => { if (dialog.open) playCue(cue); syncMusic(); })
      .observe(dialog, { attributes: true, attributeFilter: ['open'] });
  }
})();
