/**
 * Attaches a key press event handler for the given key.
 * When the specified key is pressed, the callback is executed.
 */
export function onKey(key: string, callback: () => void) {
  // Normalize key to lower case for comparison
  const normalizedKey = key.toLowerCase();

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (
      e.key.toLowerCase() === normalizedKey ||
      // Allow "space" as alias for spacebar
      (normalizedKey === "space" && e.key === " ")
    ) {
      callback();
    }
  });
}