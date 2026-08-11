export type EqualizerPreset = 'flat' | 'bassboost' | 'lofi' | 'vocal' | 'spatial';

class EqualizerEngine {
  private activePreset: EqualizerPreset = 'flat';

  public getActivePreset(): EqualizerPreset {
    return this.activePreset;
  }

  public setPreset(preset: EqualizerPreset) {
    this.activePreset = preset;
    console.log('[Equalizer] Audio preset set to:', preset);
  }
}

export const equalizerEngine = new EqualizerEngine();
