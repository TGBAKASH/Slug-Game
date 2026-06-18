// Web Audio API Synthesizer for premium retro-cyberpunk laboratory sound effects.
// Pure JS/TS without any dependency, asset file downloads, or broken URL links.

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private humOsc: OscillatorNode | null = null;
  private humLfo: OscillatorNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Initialized lazily on first user interaction to bypass browser autoplay policies.
  }

  private init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.startHum();
    } catch (e) {
      console.warn("Failed to initialize Web Audio context", e);
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.4, this.ctx.currentTime, 0.05);
    }
  }

  public getMute(): boolean {
    return this.isMuted;
  }

  public playHover() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // continuous laboratory reactor hum
  public startHum() {
    this.resume();
    if (!this.ctx || !this.masterGain || this.humOsc) return;

    try {
      const ctx = this.ctx;
      
      // Low oscillator hum
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(55, ctx.currentTime); // A1 note

      // Lowpass filter to make it warmer
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(120, ctx.currentTime);

      // Volume gain node for the hum
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.12, ctx.currentTime);

      // LFO to create a pulsing "reactor breathing" effect
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.5, ctx.currentTime); // 0.5Hz, slow breath

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(humGain.gain); // modulate volume

      osc.connect(filter);
      filter.connect(humGain);
      humGain.connect(this.masterGain);

      lfo.start();
      osc.start();

      this.humOsc = osc;
      this.humLfo = lfo;
    } catch (e) {
      console.warn("Hum initialization failed", e);
    }
  }

  public stopHum() {
    if (this.humOsc) {
      try {
        this.humOsc.stop();
        this.humOsc.disconnect();
      } catch (e) {}
      this.humOsc = null;
    }
    if (this.humLfo) {
      try {
        this.humLfo.stop();
        this.humLfo.disconnect();
      } catch (e) {}
      this.humLfo = null;
    }
  }

  // compress air slug launch blaster sound
  public playLaunch() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Pitch sweep
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.28);

    // Filter sweep for laser blast feel
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.28);

    // Burst noise for pneumatic release
    const noise = this.createNoiseBufferNode();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(600, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);

    if (noise) {
      noise.connect(noiseFilter);
      noiseFilter.connect(gain);
      noise.start(now);
    }

    gain.connect(this.masterGain);
    osc.start(now);

    osc.stop(now + 0.3);
    if (noise) {
      noise.stop(now + 0.3);
    }
  }

  // impact sounds tailored to the slug elements
  public playImpact(element: number) {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();

    switch (element) {
      case 1: // FIRE: Explosive crackly burst
        const oscF = ctx.createOscillator();
        oscF.type = "sawtooth";
        oscF.frequency.setValueAtTime(120, now);
        oscF.frequency.linearRampToValueAtTime(300, now + 0.15);
        oscF.frequency.exponentialRampToValueAtTime(40, now + 0.4);

        const filterF = ctx.createBiquadFilter();
        filterF.type = "bandpass";
        filterF.frequency.setValueAtTime(400, now);
        filterF.Q.setValueAtTime(3.0, now);

        const noiseF = this.createNoiseBufferNode();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.45);

        oscF.connect(filterF);
        filterF.connect(gain);
        if (noiseF) {
          noiseF.connect(gain);
          noiseF.start(now);
          noiseF.stop(now + 0.45);
        }
        oscF.start(now);
        oscF.stop(now + 0.45);
        break;

      case 2: // WATER: Bioluminescent freeze/tinkle
        const oscW1 = ctx.createOscillator();
        const oscW2 = ctx.createOscillator();
        oscW1.type = "sine";
        oscW2.type = "sine";
        
        oscW1.frequency.setValueAtTime(900, now);
        oscW1.frequency.exponentialRampToValueAtTime(450, now + 0.35);

        oscW2.frequency.setValueAtTime(1200, now);
        oscW2.frequency.exponentialRampToValueAtTime(600, now + 0.35);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        oscW1.connect(gain);
        oscW2.connect(gain);

        oscW1.start(now);
        oscW2.start(now);
        oscW1.stop(now + 0.45);
        oscW2.stop(now + 0.45);
        break;

      case 3: // EARTH: Heavy seismic block thud
        const oscE = ctx.createOscillator();
        oscE.type = "triangle";
        oscE.frequency.setValueAtTime(90, now);
        oscE.frequency.linearRampToValueAtTime(45, now + 0.25);

        const filterE = ctx.createBiquadFilter();
        filterE.type = "lowpass";
        filterE.frequency.setValueAtTime(150, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

        oscE.connect(filterE);
        filterE.connect(gain);

        const noiseE = this.createNoiseBufferNode();
        if (noiseE) {
          const lpfNoise = ctx.createBiquadFilter();
          lpfNoise.type = "lowpass";
          lpfNoise.frequency.setValueAtTime(100, now);
          noiseE.connect(lpfNoise);
          lpfNoise.connect(gain);
          noiseE.start(now);
          noiseE.stop(now + 0.35);
        }

        oscE.start(now);
        oscE.stop(now + 0.4);
        break;

      case 4: // AIR: Rapid whipping vortex wind
        const oscA = ctx.createOscillator();
        oscA.type = "sine";
        oscA.frequency.setValueAtTime(250, now);
        oscA.frequency.exponentialRampToValueAtTime(1500, now + 0.25);

        const lfoA = ctx.createOscillator();
        lfoA.type = "sine";
        lfoA.frequency.setValueAtTime(30, now); // Vibrato
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(200, now);

        lfoA.connect(lfoGain);
        lfoGain.connect(oscA.frequency);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        oscA.connect(gain);
        lfoA.start(now);
        oscA.start(now);
        lfoA.stop(now + 0.3);
        oscA.stop(now + 0.35);
        break;

      case 5: // SHADOW: Unstable corrupt pitch glitch
      default:
        const oscS = ctx.createOscillator();
        oscS.type = "square";
        oscS.frequency.setValueAtTime(180, now);
        oscS.frequency.setValueAtTime(80, now + 0.08);
        oscS.frequency.setValueAtTime(350, now + 0.16);
        oscS.frequency.setValueAtTime(60, now + 0.24);

        const filterS = ctx.createBiquadFilter();
        filterS.type = "peaking";
        filterS.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setValueAtTime(0.18, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        oscS.connect(filterS);
        filterS.connect(gain);

        oscS.start(now);
        oscS.stop(now + 0.4);
        break;
    }

    gain.connect(this.masterGain);
  }

  // bubbler sounds inside mutation laboratory
  public playBubble() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    
    // Bubble pop pitch rise
    const startF = 350 + Math.random() * 400;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(startF * 2.5, now + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // alarm alerts when corruption spikes
  public playWarning() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.12);
    osc.frequency.setValueAtTime(440, now + 0.24);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  // Level up arpeggio sting
  public playLevelUp() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  // chests hatch opening chime
  public playChestOpen() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    
    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.4); // D6

    osc2.frequency.setValueAtTime(739.99, now); // F#5
    osc2.frequency.exponentialRampToValueAtTime(1479.98, now + 0.4); // F#6

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // victory sound
  public playVictory() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const progression = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 587.33, d: 0.12 }, // D5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.24 }, // G5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.45 }, // G5 (sustained)
    ];

    let runningTime = now;
    progression.forEach((note) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.f, runningTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, runningTime);
      gain.gain.linearRampToValueAtTime(0.2, runningTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, runningTime + note.d);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(runningTime);
      osc.stop(runningTime + note.d + 0.05);

      runningTime += note.d * 0.8;
    });
  }

  // defeat sound
  public playDefeat() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const progression = [
      { f: 392.00, d: 0.2 }, // G4
      { f: 349.23, d: 0.2 }, // F4
      { f: 311.13, d: 0.2 }, // Eb4
      { f: 246.94, d: 0.6 }, // B3 (dissonant fade)
    ];

    let runningTime = now;
    progression.forEach((note) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(note.f, runningTime);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, runningTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, runningTime);
      gain.gain.linearRampToValueAtTime(0.18, runningTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, runningTime + note.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(runningTime);
      osc.stop(runningTime + note.d + 0.05);

      runningTime += note.d * 0.85;
    });
  }

  // white noise buffer generator for sweeps/air-pressure sounds
  private createNoiseBufferNode(): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    try {
      const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      return noise;
    } catch (e) {
      return null;
    }
  }

  // --- CINEMATIC MINT SEQUENCE SOUNDS ---

  public playCanisterDrop() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playReactorHumActivate() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(40, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.5);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  public playEnergyCharging() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 1.0);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 1.0);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.1);
  }

  public playBassHit() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playEerieAmbient() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(220, now);
    osc2.frequency.setValueAtTime(223, now); // slightly detuned
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.5);
    gain.gain.linearRampToValueAtTime(0, now + 2.0);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.1);
    osc2.stop(now + 2.1);
  }

  public playRarityStinger(tier: 'free' | 'basic' | 'premium') {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = tier === 'premium' ? "square" : (tier === 'basic' ? "sawtooth" : "triangle");
    
    // Different pitches based on rarity
    const f1 = tier === 'premium' ? 880 : (tier === 'basic' ? 660 : 440);
    const f2 = tier === 'premium' ? 1760 : (tier === 'basic' ? 880 : 554.37);

    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f2, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.15;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.8);
  }
}

export const soundManager = new SoundManager();
