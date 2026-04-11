import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { generateSequenceCode, readFieldString, unsupportedSequenceComment } from "./handlers";

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
  const code: string[] = [];

  for (const [blockId, block] of Object.entries(target.blocks)) {
    if (!block.topLevel) continue;

    const handlerCode = generateTopLevelEventCode(target, blockId, block, spriteVar);
    if (handlerCode) {
      code.push(handlerCode);
    }
  }

  return code.join("\n");
}

function generateTopLevelEventCode(
  target: ScratchTarget,
  blockId: string,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  const sequenceCode = generateSequenceCode(target, block.next, spriteVar);

  switch (block.opcode) {
    case "event_whenkeypressed": {
      const keyOption = readFieldString(block.fields, "KEY_OPTION") ?? "space";
      return `${spriteVar}.on("keypress", ${JSON.stringify(keyOption)}, () => {
  // ${block.opcode} (${keyOption})
${sequenceCode || unsupportedSequenceComment(blockId)}
});`;
    }
    case "event_whenflagclicked":
    case "event_whenthisspriteclicked": {
      const eventName =
        block.opcode === "event_whenflagclicked" ? "flag" : "click";
      return `${spriteVar}.on("${eventName}", () => {
  // ${block.opcode}
${sequenceCode || unsupportedSequenceComment(blockId)}
});`;
    }
    default:
      return null;
  }
}