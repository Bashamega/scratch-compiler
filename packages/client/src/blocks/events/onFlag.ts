import { Sprite } from "../../render/sprite";

/**
 * Attaches a green flag event handler.
 * Green flag is a global event triggered when the game starts.
 */
export function onFlag(sprite: Sprite, callback: () => void) {
  if ((sprite as any).isReady) {
    callback();
  } else {
    window.addEventListener("scratch-engine-ready", () => {
      (sprite as any).isReady = true;
      callback();
    });
  }
}
