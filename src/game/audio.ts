/**
 * Procedural Web Audio Sound Synthesizer
 * 100% code-generated audio with zero external file dependencies
 */
import { WeaponType } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private windSource: AudioNode | null = null;
  private heartbeatInterval: number | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.ambientGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbientWind();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  // --- Ambient Forest Wind & Rustling Leaves ---
  private startAmbientWind() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Pink-brown noise
        lastOut = output[i];
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, this.ctx.currentTime);

      // Low frequency oscillator to modulate wind intensity
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);

      whiteNoise.start();
      lfo.start();
      this.windSource = whiteNoise;
    } catch {
      // Ignore background wind error
    }
  }

  // --- Gunshot Synthesis ---
  public playGunshot(type: WeaponType) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Shotgun / RPG / Explosives have deeper bass punch
    if (type === 'rpg') {
      this.playRPGLaunch();
      return;
    }

    if (type === 'sawed_off' || type === 'shotgun' || type === 'spas12') {
      this.playShotgunBlast();
      return;
    }

    if (type === 'flamethrower') {
      this.playPlasmaHiss();
      return;
    }

    // Default & Rifle/Pistol/SMG/Sniper synthesis
    const isHeavy = type === 'sniper' || type === 'dual_pistols' || type === 'rifle_ak' || type === 'lmg';
    const isSMG = type === 'smg' || type === 'p90' || type === 'akimbo_mac' || type === 'minigun';

    // 1. Transient Click / Hammer strike
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(isHeavy ? 450 : 800, t);
    click.frequency.exponentialRampToValueAtTime(120, t + 0.04);
    clickGain.gain.setValueAtTime(0.9, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    click.connect(clickGain);
    clickGain.connect(this.sfxGain);
    click.start(t);
    click.stop(t + 0.05);

    // 2. Gunpowder explosion burst (Filtered White Noise)
    const duration = isHeavy ? 0.38 : isSMG ? 0.16 : 0.22;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isHeavy ? 900 : 1800, t);
    noiseFilter.Q.setValueAtTime(1.2, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isHeavy ? 1.0 : 0.75, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);

    // 3. Low-end Sub Bass Punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(isHeavy ? 160 : 210, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + (isHeavy ? 0.25 : 0.14));
    subGain.gain.setValueAtTime(isHeavy ? 1.0 : 0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + (isHeavy ? 0.25 : 0.14));
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.3);
  }

  private playShotgunBlast() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Heavy booming low punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.35);
    subGain.gain.setValueAtTime(1.2, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.36);

    // Violent spread noise
    const duration = 0.42;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  private playRPGLaunch() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Rocket Ignition whoosh
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.45);
    oscGain.gain.setValueAtTime(0.9, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.52);

    // Jet thrust hiss
    const dur = 0.5;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(300, t + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  public playExplosion() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Mega Sub Bass impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(20, t + 0.9);
    subGain.gain.setValueAtTime(1.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.95);

    // Rumble and shrapnel crackle
    const dur = 1.2;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  private playPlasmaHiss() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // --- Reloading & Mechanical Sound ---
  public playReload() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // 1. Magazine eject clink
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(1200, t);
    osc1.frequency.exponentialRampToValueAtTime(600, t + 0.08);
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.09);

    // 2. Mag insert snap (delayed)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(450, t + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(850, t + 0.48);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.5, t + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.52);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.4);
    osc2.stop(t + 0.53);

    // 3. Bolt / Slide racking snap
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(300, t + 0.85);
    osc3.frequency.exponentialRampToValueAtTime(1100, t + 0.95);
    gain3.gain.setValueAtTime(0, t);
    gain3.gain.setValueAtTime(0.6, t + 0.85);
    gain3.gain.exponentialRampToValueAtTime(0.01, t + 1.05);
    osc3.connect(gain3);
    gain3.connect(this.sfxGain);
    osc3.start(t + 0.85);
    osc3.stop(t + 1.06);
  }

  public playEmptyClip() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.04);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // --- Zombie Vocalizations & Growls ---
  public playZombieGrowl(pitchMultiplier = 1.0, isLoud = false) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const masterGain = this.ctx.createGain();

    // FM Snarl: carrier base 70-130Hz modulated by 12-25Hz vibrato
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(85 * pitchMultiplier, t);
    carrier.frequency.linearRampToValueAtTime(65 * pitchMultiplier, t + 0.7);

    modulator.type = 'sawtooth';
    modulator.frequency.setValueAtTime(16, t);
    modGain.gain.setValueAtTime(45, t);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450 * pitchMultiplier, t);
    filter.Q.setValueAtTime(3.0, t);

    masterGain.gain.setValueAtTime(0.01, t);
    masterGain.gain.linearRampToValueAtTime(isLoud ? 0.7 : 0.35, t + 0.15);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    carrier.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.sfxGain);

    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + 0.8);
    carrier.stop(t + 0.8);
  }

  public playZombieAggro() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Screeching high-register scream
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.55);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.65, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.Q.setValueAtTime(2.5, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  public playZombieHit(isHeadshot = false) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Fleshy impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHeadshot ? 500 : 220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    gain.gain.setValueAtTime(isHeadshot ? 0.9 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);

    if (isHeadshot) {
      // Skull crunch crisp snap
      const crunch = this.ctx.createOscillator();
      const crunchGain = this.ctx.createGain();
      crunch.type = 'square';
      crunch.frequency.setValueAtTime(1400, t);
      crunch.frequency.exponentialRampToValueAtTime(300, t + 0.08);
      crunchGain.gain.setValueAtTime(0.5, t);
      crunchGain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
      crunch.connect(crunchGain);
      crunchGain.connect(this.sfxGain);
      crunch.start(t);
      crunch.stop(t + 0.1);
    }
  }

  public playZombieDeath() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.45);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.52);
  }

  // --- Player Hurt & Heartbeat ---
  public playPlayerHurt() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Heavy blunt trauma impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    gain.gain.setValueAtTime(1.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public updateHeartbeat(health: number) {
    if (health <= 35 && health > 0) {
      if (!this.heartbeatInterval) {
        this.heartbeatInterval = window.setInterval(() => {
          this.triggerLubDub();
        }, 850);
      }
    } else {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
  }

  private triggerLubDub() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // "Lub"
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(75, t);
    osc1.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    gain1.gain.setValueAtTime(0.8, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.15);

    // "Dub" (delayed by 180ms)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.frequency.setValueAtTime(65, t + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(30, t + 0.32);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.9, t + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.34);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.18);
    osc2.stop(t + 0.35);
  }

  // --- Footsteps ---
  public playFootstep() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const dur = 0.08;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  // --- Wave Music & Chimes ---
  public playWaveStart() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Ominous war horn
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(146.83, t + 0.8); // D3
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.5);
  }

  public playWaveClear() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    // Ascending victory triad
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.35, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.65);
    });
  }

  public playPickup() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const sound = new SoundEngine();
