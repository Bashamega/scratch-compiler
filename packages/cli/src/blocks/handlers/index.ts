import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { generateMotionBlockCode } from "../motion";
// Future imports for additional block categories could go here
// import { generateLooksBlockCode } from "../looks";
// import { generateControlBlockCode } from "../control";
// etc.

/**
 * Step through a chain of Scratch blocks, returning the generated code.
 */
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

/**
 * Dispatch block code generation based on the type of block.
 * For now, only motion blocks are handled, but this is extensible.
 */
export function generateBlockCode(
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  // Dispatch to different generators based on the opcode prefix
  const [category] = block.opcode.split("_");
  switch (category) {
    case "motion":
      return generateMotionBlockCode(block, spriteVar);
    // case "looks":
    //   return generateLooksBlockCode(block, spriteVar);
    // case "control":
    //   return generateControlBlockCode(block, spriteVar);
    default:
      return null;
  }
}

export function readFieldString(
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

export function unsupportedSequenceComment(blockId: string): string {
  return `// No supported blocks found after ${blockId}`;
}
