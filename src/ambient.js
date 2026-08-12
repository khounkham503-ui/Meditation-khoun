/* ==========================================================================
   AMBIENT SOUND MIXER SYNTHESIZER (Web Audio API)
   ========================================================================== */

class AmbientSoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    
    // Channels
    this.rainGain = null;
    this.oceanGain = null;
    this.windGain = null;
    this.bellGain = null;
    this.masterGain = null;

    // Nodes
    this.rainSource = null;
    this.oceanSource = null;
    this.windSource = null;

    this.volumes = {
      rain: 0,
      ocean: 0,
      wind: 0,
      bell: 0
    };
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Rain Gain
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.rainGain.connect(this.masterGain);

      // Ocean Gain
      this.oceanGain = this.ctx.createGain();
      this.oceanGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.oceanGain.connect(this.masterGain);

      // Wind Gain
      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.windGain.connect(this.masterGain);

      // Bell Gain
      this.bellGain = this.ctx.createGain();
      this.bellGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.bellGain.connect(this.masterGain);

      // Start procedural noise generators
      this.setupRainSynth();
      this.setupOceanSynth();
      this.setupWindSynth();

      this.initialized = true;
    } catch (e) {
      console.error('Failed to initialize AmbientSoundEngine', e);
    }
  }

  ensureContextRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Rain Synthesizer (Pink noise filtered)
  setupRainSynth() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.rainGain);
    whiteNoise.start(0);
    this.rainSource = whiteNoise;
  }

  // 2. Ocean Waves Synthesizer (Lowpass noise with LFO volume modulation)
  setupOceanSynth() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    // LFO to create swelling wave rhythm
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // Wave period ~8s
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.oceanGain);

    noise.start(0);
    lfo.start(0);
    this.oceanSource = noise;
  }

  // 3. Wind Synthesizer (Bandpass filtered noise with subtle modulation)
  setupWindSynth() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // LFO for howling wind pitch variations
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.windGain);

    noise.start(0);
    lfo.start(0);
    this.windSource = noise;
  }

  // Set individual channel volume (0.0 to 1.0)
  setVolume(channel, val) {
    this.init();
    this.ensureContextRunning();

    const level = Math.max(0, Math.min(1, parseFloat(val)));
    this.volumes[channel] = level;

    const now = this.ctx.currentTime;
    if (channel === 'rain' && this.rainGain) {
      this.rainGain.gain.linearRampToValueAtTime(level * 0.8, now + 0.1);
    } else if (channel === 'ocean' && this.oceanGain) {
      this.oceanGain.gain.linearRampToValueAtTime(level * 0.9, now + 0.1);
    } else if (channel === 'wind' && this.windGain) {
      this.windGain.gain.linearRampToValueAtTime(level * 0.7, now + 0.1);
    } else if (channel === 'bell' && this.bellGain) {
      this.bellGain.gain.linearRampToValueAtTime(level * 1.0, now + 0.1);
    }
  }

  // Play a gentle singing bowl bell chime
  playBell() {
    this.init();
    this.ensureContextRunning();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, now); // 432 Hz Healing frequency

    // Envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.5 * (this.volumes.bell || 0.8), now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc.connect(gain);
    gain.connect(this.bellGain);

    osc.start(now);
    osc.stop(now + 4.6);
  }
}

export const ambientEngine = new AmbientSoundEngine();
