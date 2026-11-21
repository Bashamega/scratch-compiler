import type { ScratchSound, ScratchTarget } from "@scratch-compiler/types";

export class SoundPlayer {
  private volume: number;
  private active = new Map<ScratchSound, { audio: HTMLAudioElement; finish: () => void }>();

  constructor(private data: ScratchTarget) {
    this.volume =
      typeof data.volume === "number" ? Math.max(0, Math.min(100, data.volume)) : 100;
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.max(0, Math.min(100, volume));
    this.data.volume = this.volume;
    for (const { audio } of this.active.values()) {
      audio.volume = this.volume / 100;
    }
  }

  play(name: string): Promise<void> {
    const sound = this.data.sounds?.find(
      (item) => item.name === name || item.assetId === name,
    );
    if (!sound) {
      console.warn(`[Sound] Sound "${name}" does not exist`);
      return Promise.resolve();
    }

    const prior = this.active.get(sound);
    if (prior) {
      prior.audio.pause();
      prior.finish();
    }

    const audio = new Audio(`./assets/${sound.md5ext}`);
    audio.volume = this.volume / 100;

    return new Promise((resolve) => {
      const finish = () => {
        if (this.active.get(sound)?.audio !== audio) return;
        this.active.delete(sound);
        audio.removeEventListener("ended", finish);
        audio.removeEventListener("error", finish);
        resolve();
      };
      this.active.set(sound, { audio, finish });
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", finish);
      void audio.play().catch((error) => {
        if (this.active.get(sound)?.audio !== audio) return;
        console.warn("[Sound] Unable to play sound", error);
        finish();
      });
    });
  }
}
