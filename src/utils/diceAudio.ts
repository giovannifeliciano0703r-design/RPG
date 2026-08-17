// Synthesized Web Audio API sound effects for realistic physical dice rolls
class DiceAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Clattering sound of dice rolling and tumbling on wood/felt
  public playDiceRoll(diceCount: number = 1) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const count = Math.min(Math.max(diceCount, 1), 8);
      const startTime = this.ctx.currentTime;

      // Shake & initial bounce bursts
      for (let i = 0; i < count * 3 + 3; i++) {
        const timeOffset = Math.random() * 0.45;
        const freq = 350 + Math.random() * 800;
        const decay = 0.03 + Math.random() * 0.04;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(freq, startTime + timeOffset);
        filter.Q.setValueAtTime(4.0, startTime + timeOffset);

        osc.type = Math.random() > 0.5 ? "triangle" : "square";
        osc.frequency.setValueAtTime(freq, startTime + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, startTime + timeOffset + decay);

        gain.gain.setValueAtTime(0.12 / Math.sqrt(count), startTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + timeOffset + decay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime + timeOffset);
        osc.stop(startTime + timeOffset + decay);
      }

      // Final settling thuds
      const finalTime = startTime + 0.48;
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();

      thudOsc.type = "sine";
      thudOsc.frequency.setValueAtTime(140, finalTime);
      thudOsc.frequency.exponentialRampToValueAtTime(40, finalTime + 0.08);

      thudGain.gain.setValueAtTime(0.2, finalTime);
      thudGain.gain.exponentialRampToValueAtTime(0.001, finalTime + 0.08);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);

      thudOsc.start(finalTime);
      thudOsc.stop(finalTime + 0.09);
    } catch (e) {
      // Audio might fail if user hasn't interacted, ignore silently
    }
  }

  // Critical 20 Triumph Fanfare Shimmer
  public playCritSuccess() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime + 0.5;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 Major Chord

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
    } catch (e) {
      // ignore
    }
  }

  // Critical 1 Fumble Ominous Tone
  public playFumble() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime + 0.5;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.5);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      // ignore
    }
  }
}

export const diceAudio = new DiceAudioEngine();
