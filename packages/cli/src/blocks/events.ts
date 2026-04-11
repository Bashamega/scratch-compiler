import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { generateMotionBlockCode } from "./motion";

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
${indent(sequenceCode || unsupportedSequenceComment(blockId), 2)}
});`;
    }
    case "event_whenflagclicked":
    case "event_whenthisspriteclicked": {
      const eventName =
        block.opcode === "event_whenflagclicked" ? "flag" : "click";
      return `${spriteVar}.on("${eventName}", () => {
  // ${block.opcode}
${indent(sequenceCode || unsupportedSequenceComment(blockId), 2)}
});`;
    }
    default:
      return null;
  }
}

export function generateSequenceCode(
  target: ScratchTarget,
  startBlockId: string | null,
  spriteVar: string,
): string {
  const code: string[] = [];
  const visited = new Set<string>();
  let currentBlockId = startBlockId;

  while (currentBlockId) {
    if (visited.has(currentBlockId)) {
      code.push(
        `console.warn(${JSON.stringify(
          `[Compiler] Stopped circular script at block ${currentBlockId}.`,
        )});`,
      );
      break;
    }

    visited.add(currentBlockId);
    const block = target.blocks[currentBlockId];
    if (!block) {
      code.push(
        `console.warn(${JSON.stringify(
          `[Compiler] Missing block ${currentBlockId} in script.`,
        )});`,
      );
      break;
    }

    const blockCode = generateBlockCode(block, spriteVar);
    if (blockCode) {
      code.push(blockCode);
    } else {
      code.push(`// Unsupported block: ${block.opcode}`);
    }

    currentBlockId = block.next;
  }

  return code.join("\n");
}

export function generateBlockCode(
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  return generateMotionBlockCode(block, spriteVar);
}

function readFieldString(
  fields: ScratchBlock["fields"],
  fieldName: string,
): string | null {
  const field = fields[fieldName];
  if (!Array.isArray(field) || field.length === 0) {
    return null;
  }

  const value = field[0];
  return typeof value === "string" ? value : null;
}

function indent(value: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function unsupportedSequenceComment(blockId: string): string {
  return `// No supported blocks found after ${blockId}`;
}
