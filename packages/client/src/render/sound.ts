import type { ScratchTarget } from "@scratch-compiler/types";

export class SoundPlayer {
  private volume: number;

  constructor(private data: ScratchTarget) {
    this.volume =
      typeof data.volume === "number" ? Math.max(0, Math.min(100, data.volume)) : 100;
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.max(0, Math.min(100, volume));
    this.data.volume = this.volume;
  }

  play(name: string): Promise<void> {
    const sound = this.data.sounds?.find(
      (item) => item.name === name || item.assetId === name,
    );
    if (!sound) {
      console.warn(`[Sound] Sound "${name}" does not exist`);
      return Promise.resolve();
    }

    const audio = new Audio(`./assets/${sound.md5ext}`);
    audio.volume = this.volume / 100;

    return new Promise((resolve) => {
      const finish = () => resolve();
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      void audio.play().catch((error) => {
        console.warn("[Sound] Unable to play sound", error);
        finish();
      });
    });
  }
}
