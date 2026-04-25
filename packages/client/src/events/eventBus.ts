export type ScratchEventHandler = () => void | Promise<void>;

/**
 * Minimal event system for Scratch-style broadcasts.
 *
 * - Handlers are registered per broadcast name.
 * - Emitting a broadcast runs all handlers concurrently.
 * - `broadcastAndWait` resolves when all handlers finish (errors are logged).
 */
export class ScratchEventBus {
  private broadcastHandlers: Map<string, Set<ScratchEventHandler>> = new Map();

  onBroadcast(name: string, handler: ScratchEventHandler): () => void {
    const key = String(name);
    const set = this.broadcastHandlers.get(key) ?? new Set<ScratchEventHandler>();
    set.add(handler);
    this.broadcastHandlers.set(key, set);

    return () => {
      const current = this.broadcastHandlers.get(key);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.broadcastHandlers.delete(key);
      }
    };
  }

  broadcast(name: string): void {
    // Fire-and-forget by design; callers that need waiting should use broadcastAndWait.
    void this.broadcastAndWait(name);
  }

  async broadcastAndWait(name: string): Promise<void> {
    const key = String(name);
    const handlers = Array.from(this.broadcastHandlers.get(key) ?? []);
    if (handlers.length === 0) return;

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler();
        } catch (err) {
          console.error(`[ScratchEventBus] Broadcast handler failed (${key})`, err);
        }
      }),
    );
  }
}

