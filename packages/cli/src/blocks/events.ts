import { ScratchTarget } from "@scratch-compiler/types";

/**
 * Generates event handling code for a Scratch target.
 * Currently supports:
 * - Green flag clicked (event_whenflagclicked)
 * - Sprite clicked (event_whenthisspriteclicked)
 */
export function generateEventBlocksCode(
  target: ScratchTarget,
  spriteVar: string,
): string {
  const blocks = target.blocks;
  const code: string[] = [];

  for (const blockId in blocks) {
    const block = blocks[blockId];

    // Only handle top-level blocks for event handlers
    if (!block.topLevel) continue;

    const events: { [opcode: string]: string } = {
      event_whenflagclicked: "flag",
      event_whenthisspriteclicked: "click"
    };

    const eventName = events[block.opcode];
    if (eventName) {
      code.push(`${spriteVar}.on('${eventName}', () => {
        // ${block.opcode}
      });`);
    }
  }

  return code.join("\n");
}
