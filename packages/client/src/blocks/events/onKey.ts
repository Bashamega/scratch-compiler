/**
 * Attaches a key press event handler for the given key.
 * When the specified key is pressed, the callback is executed.
 */
function mapScratchKeyToDomKey(scratchKey: string): string | null {
  // Map from Scratch "event_whenkeypressed" field values to DOM KeyboardEvent.key values
  const keyMap: Record<string, string> = {
    "space": " ",
    "left arrow": "ArrowLeft",
    "right arrow": "ArrowRight",
    "up arrow": "ArrowUp",
    "down arrow": "ArrowDown",
    "any": "any"
  };
  const normalized = scratchKey.trim().toLowerCase();
  return keyMap[normalized] ?? normalized;
}

export function onKey(key: string, callback: () => void | Promise<void>) {
  const normalizedScratchKey = key.trim().toLowerCase();
  const domKey = mapScratchKeyToDomKey(normalizedScratchKey);

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // "any" matches any key
    if (domKey === "any") {
      callback();
      return;
    }

    // Compare after mapping, using case-insensitive comparison for text keys
    if (
      (typeof domKey === "string" && e.key.toLowerCase() === domKey.toLowerCase()) ||
      // For single characters, allow (e.g.) "a" == "A"
      (domKey?.length === 1 && e.key.length === 1 && e.key.toLowerCase() === domKey.toLowerCase())
    ) {
      callback();
    }
  });
}
