class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: Record<string, { gain: GainNode; stop: () => void }> = {};

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleSound(id: string, volume: number = 0.3): boolean {
    this.initCtx();
    if (!this.ctx) return false;

    if (this.activeNodes[id]) {
      this.stopSound(id);
      return false;
    } else {
      this.playSound(id, volume);
      return true;
    }
  }

  public setVolume(id: string, volume: number) {
    if (this.activeNodes[id]) {
      this.activeNodes[id].gain.gain.setTargetAtTime(volume, this.ctx?.currentTime || 0, 0.1);
    }
  }

  public isPlaying(id: string): boolean {
    return !!this.activeNodes[id];
  }

  private playSound(id: string, volume: number) {
    if (!this.ctx) return;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    gainNode.connect(this.ctx.destination);

    if (id === 'rain') {
      const bufferSize = this.ctx.sampleRate * 2;
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
        data[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      noiseSource.start();

      this.activeNodes[id] = {
        gain: gainNode,
        stop: () => {
          try { noiseSource.stop(); } catch {}
        },
      };
    } else if (id === 'fireplace') {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.98 ? 0.8 : 0.05);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      noiseSource.start();

      this.activeNodes[id] = {
        gain: gainNode,
        stop: () => {
          try { noiseSource.stop(); } catch {}
        },
      };
    } else if (id === 'waves') {
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);

      // LFO for wave swelling
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // wave cycle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noiseSource.connect(filter);
      filter.connect(gainNode);

      lfo.start();
      noiseSource.start();

      this.activeNodes[id] = {
        gain: gainNode,
        stop: () => {
          try {
            lfo.stop();
            noiseSource.stop();
          } catch {}
        },
      };
    }
  }

  public stopSound(id: string) {
    if (this.activeNodes[id]) {
      this.activeNodes[id].stop();
      delete this.activeNodes[id];
    }
  }

  public stopAll() {
    Object.keys(this.activeNodes).forEach((id) => this.stopSound(id));
  }
}

export const ambientAudioEngine = new AmbientAudioEngine();
