const ytStartTimes = {
  '8MXGh1_eCgY': 1008,
  'rsSh0uP9hfI': 10,
  'tHGVGkAPLIY': 44
};

class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;

    // Nodes and state for each sound
    this.sounds = {
      binaural: { gainNode: null, oscL: null, oscR: null, active: false, vol: 0.2 },
      rain: { gainNode: null, source: null, filter: null, active: false, vol: 0 },
      ocean: { gainNode: null, source: null, filter: null, lfo: null, active: false, vol: 0 },
      wind: { gainNode: null, source: null, filter: null, lfo: null, active: false, vol: 0 }
    };

    // YouTube Player State
    this.ytPlayer = null;
    this.ytPlayerReady = false;
    this.ytVolume = 85;
    this.currentVideoId = null;
    this.pendingPlayVideoId = null;
  }

  // Initialize Audio Context (must be triggered by user interaction)
  init() {
    if (this.ctx) return;

    // Support standard and legacy web audio
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Create master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 1.0;
    this.masterGain.connect(this.ctx.destination);

    // Setup all nodes in an idle but ready state
    this.setupBinaural();
    this.setupRain();
    this.setupOcean();
    this.setupWind();
  }

  // Generate White Noise Buffer
  createWhiteNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Generate Pink Noise Buffer (for warm natural sounds)
  createPinkNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // volume compensation
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // SETUP: Binaural Beats (100Hz and 106Hz to create 6Hz Theta Waves)
  setupBinaural() {
    const s = this.sounds.binaural;
    s.gainNode = this.ctx.createGain();
    s.gainNode.gain.value = s.vol;
    s.gainNode.connect(this.masterGain);

    // Left channel
    s.oscL = this.ctx.createOscillator();
    s.oscL.type = 'sine';
    s.oscL.frequency.value = 100; // 100 Hz
    const pannerL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (pannerL) {
      pannerL.pan.value = -1;
      s.oscL.connect(pannerL);
      pannerL.connect(s.gainNode);
    } else {
      s.oscL.connect(s.gainNode);
    }

    // Right channel
    s.oscR = this.ctx.createOscillator();
    s.oscR.type = 'sine';
    s.oscR.frequency.value = 106; // 106 Hz
    const pannerR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (pannerR) {
      pannerR.pan.value = 1;
      s.oscR.connect(pannerR);
      pannerR.connect(s.gainNode);
    } else {
      s.oscR.connect(s.gainNode);
    }

    s.oscL.start(0);
    s.oscR.start(0);
    s.active = true;
  }

  // SETUP: Rain Shower (White noise + bandpass filter)
  setupRain() {
    const s = this.sounds.rain;
    s.gainNode = this.ctx.createGain();
    s.gainNode.gain.value = s.vol;
    s.gainNode.connect(this.masterGain);

    s.source = this.ctx.createBufferSource();
    s.source.buffer = this.createWhiteNoiseBuffer();
    s.source.loop = true;

    s.filter = this.ctx.createBiquadFilter();
    s.filter.type = 'bandpass';
    s.filter.frequency.value = 1000;
    s.filter.Q.value = 1.0;

    s.source.connect(s.filter);
    s.filter.connect(s.gainNode);
    s.source.start(0);
    s.active = true;
  }

  // SETUP: Ocean Waves (Pink noise + lowpass filter modulated by slow LFO)
  setupOcean() {
    const s = this.sounds.ocean;
    s.gainNode = this.ctx.createGain();
    s.gainNode.gain.value = s.vol;
    s.gainNode.connect(this.masterGain);

    s.source = this.ctx.createBufferSource();
    s.source.buffer = this.createPinkNoiseBuffer();
    s.source.loop = true;

    s.filter = this.ctx.createBiquadFilter();
    s.filter.type = 'lowpass';
    s.filter.frequency.value = 400;
    s.filter.Q.value = 2.0;

    // Create a very slow LFO to modulate wave swelling (0.08 Hz = ~12.5s cycle)
    s.lfo = this.ctx.createOscillator();
    s.lfo.frequency.value = 0.08;
    
    // Scale LFO amplitude
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 250; // Sweeps from 150Hz to 650Hz

    s.lfo.connect(lfoGain);
    lfoGain.connect(s.filter.frequency);

    s.source.connect(s.filter);
    s.filter.connect(s.gainNode);
    
    s.lfo.start(0);
    s.source.start(0);
    s.active = true;
  }

  // SETUP: Forest Wind (Pink noise + sweeping resonance bandpass)
  setupWind() {
    const s = this.sounds.wind;
    s.gainNode = this.ctx.createGain();
    s.gainNode.gain.value = s.vol;
    s.gainNode.connect(this.masterGain);

    s.source = this.ctx.createBufferSource();
    s.source.buffer = this.createPinkNoiseBuffer();
    s.source.loop = true;

    s.filter = this.ctx.createBiquadFilter();
    s.filter.type = 'bandpass';
    s.filter.frequency.value = 500;
    s.filter.Q.value = 7.0; // High Q gives a whistling quality

    // Wind LFO: slow, randomized-feeling sweep (0.15 Hz = ~6.6s cycle)
    s.lfo = this.ctx.createOscillator();
    s.lfo.frequency.value = 0.15;
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200; // Sweeps from 300Hz to 700Hz

    s.lfo.connect(lfoGain);
    lfoGain.connect(s.filter.frequency);

    s.source.connect(s.filter);
    s.filter.connect(s.gainNode);
    
    s.lfo.start(0);
    s.source.start(0);
    s.active = true;
  }

  // Play Singing Bowl Chime (synthesized metal bowl sound)
  playSingingBowl() {
    if (!this.ctx) return;
    
    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const baseFreq = 168; // F3 note, very grounding
    
    // Inharmonic partials characteristic of Tibetan singing bowl
    const frequencies = [
      baseFreq,
      baseFreq * 1.52, // fifth partial
      baseFreq * 2.21,
      baseFreq * 2.85,
      baseFreq * 3.65,
      baseFreq * 4.40
    ];
    
    // Amplitude mapping for overtones
    const gains = [0.4, 0.25, 0.15, 0.08, 0.04, 0.02];
    
    // Outer gain envelope for the entire bell chime
    const bowlGain = this.ctx.createGain();
    bowlGain.gain.setValueAtTime(0, now);
    bowlGain.gain.linearRampToValueAtTime(0.7, now + 0.08); // fast attack
    bowlGain.gain.exponentialRampToValueAtTime(0.001, now + 12.0); // slow decay
    bowlGain.connect(this.masterGain);

    // Create oscillators for each overtone
    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const partialGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Detune slightly over time to simulate natural vibrato of metal
      osc.detune.setValueAtTime(0, now);
      osc.detune.linearRampToValueAtTime((idx % 2 === 0 ? 3 : -3), now + 3);
      osc.detune.linearRampToValueAtTime(0, now + 8);

      partialGain.gain.setValueAtTime(gains[idx], now);
      // High partials decay faster
      const partialDecay = 12.0 / (idx * 0.4 + 1);
      partialGain.gain.exponentialRampToValueAtTime(0.001, now + partialDecay);

      osc.connect(partialGain);
      partialGain.connect(bowlGain);

      osc.start(now);
      osc.stop(now + 12);
    });
  }

  // Adjust volume for a specific sound (smooth transition)
  setVolume(name, val) {
    const s = this.sounds[name];
    if (!s) return;
    
    s.vol = parseFloat(val);
    
    if (this.ctx && s.gainNode) {
      const now = this.ctx.currentTime;
      // Smooth volume ramp to avoid pops
      s.gainNode.gain.setValueAtTime(s.gainNode.gain.value, now);
      s.gainNode.gain.linearRampToValueAtTime(s.vol, now + 0.1);
    }
  }

  // Toggle master mute
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 1.0, now + 0.2);
    }
    // Update YouTube player volume
    if (this.ytPlayer && this.ytPlayerReady) {
      this.ytPlayer.setVolume(this.isMuted ? 0 : this.ytVolume);
    }
    return this.isMuted;
  }

  // Ensure AudioContext is active
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Initialize YouTube Iframe Player
  initYTPlayer() {
    if (this.ytPlayer) return;
    this.ytPlayer = new window.YT.Player('yt-player', {
      height: '100%',
      width: '100%',
      videoId: 'H8dzsli7MW4', // default init video
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event) => {
          this.ytPlayerReady = true;
          event.target.setVolume(this.isMuted ? 0 : this.ytVolume);
          if (this.pendingPlayVideoId) {
            this.playYT(this.pendingPlayVideoId);
          }
        },
        onStateChange: (event) => {
          // If video finishes naturally, stop gracefully
          if (event.data === window.YT.PlayerState.ENDED) {
            this.stopYT();
          }
        }
      }
    });
  }

  playYT(videoId) {
    this.currentVideoId = videoId;
    if (this.ytPlayer && this.ytPlayerReady) {
      this.pendingPlayVideoId = null;
      let activeVideoId = null;
      try {
        if (this.ytPlayer.getVideoData && this.ytPlayer.getVideoData()) {
          activeVideoId = this.ytPlayer.getVideoData().video_id;
        }
      } catch (err) {
        console.warn('Failed to get active video ID from YT player', err);
      }
      
      const startSecs = ytStartTimes[videoId] || 0;
      if (activeVideoId !== videoId) {
        this.ytPlayer.loadVideoById({
          videoId: videoId,
          startSeconds: startSecs
        });
      } else {
        this.ytPlayer.playVideo();
      }
      this.ytPlayer.setVolume(this.isMuted ? 0 : this.ytVolume);
    } else {
      this.pendingPlayVideoId = videoId;
    }
  }

  pauseYT() {
    this.pendingPlayVideoId = null;
    if (this.ytPlayer && this.ytPlayerReady) {
      this.ytPlayer.pauseVideo();
    }
  }

  stopYT() {
    this.pendingPlayVideoId = null;
    if (this.ytPlayer && this.ytPlayerReady) {
      this.ytPlayer.stopVideo();
    }
  }

  setYTVolume(volume) {
    this.ytVolume = parseInt(volume);
    if (this.ytPlayer && this.ytPlayerReady) {
      this.ytPlayer.setVolume(this.isMuted ? 0 : this.ytVolume);
    }
  }
}

export const audioManager = new AudioManager();

// Global callback for YouTube API
window.onYouTubeIframeAPIReady = () => {
  audioManager.initYTPlayer();
};

// Fallback check if YT is already loaded
if (window.YT && window.YT.Player) {
  audioManager.initYTPlayer();
}

// Inject YouTube Iframe API script dynamically after registering the callbacks
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
if (firstScriptTag) {
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
} else {
  document.head.appendChild(tag);
}

