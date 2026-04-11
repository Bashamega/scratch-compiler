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
      event_whenthisspriteclicked: "click",
      event_whenkeypressed: "keypress"
    };

    if (block.opcode === "event_whenkeypressed") {
      // For key press events, Scratch block has a 'fields' property 'KEY_OPTION'
      const keyOption = block.fields?.KEY_OPTION?.[0] || "space";
      code.push(`${spriteVar}.on('keypress', '${keyOption}', () => {
        // ${block.opcode} (${keyOption})
      });`);
    } else {
      const eventName = events[block.opcode];
      if (eventName && eventName !== "keypress") {
        code.push(`${spriteVar}.on('${eventName}', () => {
          // ${block.opcode}
        });`);
      }
    }
  }

  return code.join("\n");
}
