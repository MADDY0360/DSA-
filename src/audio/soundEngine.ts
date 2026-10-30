/**
 * Procedural Web Audio Synthesizer & Dynamic Background Groove for Campus Escape (VIT Edition)
 * Zero external MP3 dependencies — crisp SFX + adaptive chase/calm campus synth loop.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private musicEnabled: boolean = true;
  private bgmTimer: number | null = null;
  private beatStep: number = 0;
  private chaseMode: boolean = false;
  private timeFrozen: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAudio(): void {
    this.getContext();
    if (this.musicEnabled && !this.muted && this.bgmTimer === null) {
      this.startBackgroundLoop();
    }
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (mute) {
      this.stopBackgroundLoop();
    } else if (this.musicEnabled) {
      this.startBackgroundLoop();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundLoop();
    } else if (!this.muted) {
      this.startBackgroundLoop();
    }
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setChaseMode(chasing: boolean): void {
    if (this.chaseMode !== chasing) {
      this.chaseMode = chasing;
      if (this.bgmTimer !== null) {
        this.stopBackgroundLoop();
        if (!this.muted && this.musicEnabled) {
          this.startBackgroundLoop();
        }
      }
    }
  }

  public setTimeFrozen(frozen: boolean): void {
    if (this.timeFrozen !== frozen) {
      this.timeFrozen = frozen;
      if (this.bgmTimer !== null) {
        this.stopBackgroundLoop();
        if (!this.muted && this.musicEnabled) {
          this.startBackgroundLoop();
        }
      }
    }
  }

  private startBackgroundLoop(): void {
    if (typeof window === 'undefined' || this.bgmTimer !== null) return;
    const intervalMs = this.timeFrozen ? 420 : this.chaseMode ? 175 : 250;
    const chaseBass = [146.83, 146.83, 174.61, 164.81, 130.81, 130.81, 164.81, 146.83]; // D minor tension
    const calmNotes = [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66]; // C major campus breeze
    const frozenNotes = [523.25, 783.99, 659.25, 987.77, 587.33, 880.0, 659.25, 1046.5]; // Crystal stopwatch tick

    this.bgmTimer = window.setInterval(() => {
      if (this.muted || !this.musicEnabled) return;
      const ctx = this.getContext();
      if (!ctx || ctx.state !== 'running') return;

      const idx = this.beatStep % 8;
      this.beatStep++;

      if (this.timeFrozen) {
        this.playTone(frozenNotes[idx], 0.14, 'sine', 0.016, 0);
      } else if (this.chaseMode) {
        this.playTone(chaseBass[idx], 0.12, 'triangle', 0.024, 0);
        if (idx % 2 === 0) {
          this.playTone(chaseBass[idx] * 2, 0.06, 'sine', 0.015, 0);
        }
      } else {
        this.playTone(calmNotes[idx], 0.18, 'sine', 0.018, 0);
      }
    }, intervalMs);
  }

  private stopBackgroundLoop(): void {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.08,
    delaySec = 0
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playFootstep(stepCount: number): void {
    const freq = stepCount % 2 === 0 ? 135 : 162;
    this.playTone(freq, 0.045, 'triangle', 0.026, 0);
  }

  public playDash(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.14);
    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playCloseDodge(): void {
    this.playTone(783.99, 0.08, 'sine', 0.09, 0);
    this.playTone(1174.66, 0.16, 'triangle', 0.11, 0.06);
  }

  public playGuardWhistle(): void {
    this.playTone(2350, 0.08, 'sine', 0.06, 0);
    this.playTone(2600, 0.13, 'sine', 0.065, 0.1);
  }

  public playIdVerified(): void {
    // Relief chord when Maddy collects ID Card and calls off the Security Chase!
    this.playTone(523.25, 0.12, 'triangle', 0.1, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.1, 0.08);
    this.playTone(1046.5, 0.28, 'sine', 0.12, 0.16);
  }

  public playSplash(): void {
    this.playTone(320, 0.09, 'sine', 0.06, 0);
    this.playTone(210, 0.14, 'triangle', 0.06, 0.05);
  }

  public playShuttleHorn(): void {
    this.playTone(466.16, 0.08, 'square', 0.045, 0);
    this.playTone(587.33, 0.11, 'square', 0.05, 0.1);
  }

  public playTrainHorn(): void {
    this.playTone(311.13, 0.36, 'sawtooth', 0.042, 0);
    this.playTone(392.0, 0.36, 'sawtooth', 0.042, 0);
  }

  public playPickup(): void {
    this.playTone(587.33, 0.11, 'triangle', 0.1, 0);
    this.playTone(880, 0.18, 'triangle', 0.11, 0.08);
  }

  public playMissionComplete(): void {
    this.playTone(523.25, 0.12, 'triangle', 0.1, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.1, 0.09);
    this.playTone(783.99, 0.14, 'triangle', 0.1, 0.18);
    this.playTone(1046.5, 0.28, 'triangle', 0.12, 0.27);
  }

  public playUndo(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playStepPing(stepIndex: number): void {
    const scale = [392, 440, 493.88, 523.25, 587.33, 659.25, 783.99, 880];
    const freq = scale[stepIndex % scale.length];
    this.playTone(freq, 0.09, 'sine', 0.06, 0);
  }

  public playHazardBump(): void {
    this.playTone(140, 0.18, 'sawtooth', 0.11, 0);
    this.playTone(95, 0.24, 'triangle', 0.1, 0.04);
  }

  public playEnterBuilding(): void {
    this.playTone(440, 0.08, 'sine', 0.04, 0);
  }

  public playTimeFreeze(): void {
    // Shimmering crystalline chrono-stop chord when Maddy picks up a Key!
    this.playTone(987.77, 0.14, 'sine', 0.1, 0);
    this.playTone(783.99, 0.14, 'sine', 0.1, 0.07);
    this.playTone(659.25, 0.16, 'triangle', 0.11, 0.14);
    this.playTone(1318.51, 0.35, 'sine', 0.12, 0.21);
  }

  public playTimeTick(): void {
    this.playTone(1046.5, 0.06, 'sine', 0.065, 0);
  }

  public playTimeResume(): void {
    this.playTone(392.0, 0.1, 'triangle', 0.08, 0);
    this.playTone(523.25, 0.12, 'triangle', 0.09, 0.07);
    this.playTone(659.25, 0.18, 'triangle', 0.1, 0.14);
  }

  public playVictory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === notes.length - 1 ? 0.45 : 0.13, 'triangle', 0.11, idx * 0.1);
    });
  }
}

export const soundEngine = new SoundEngine();
