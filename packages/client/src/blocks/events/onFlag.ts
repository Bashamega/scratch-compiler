/**
 * Attaches a green flag event handler.
 * Green flag is a global event triggered when the game starts.
 */
export function onFlag(isReady: boolean, callback: () => void) {
  if (isReady) {
    callback();
  } else {
    window.addEventListener("scratch-engine-ready", callback, { once: true });
  }
}
