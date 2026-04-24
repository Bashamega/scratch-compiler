import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { generateMotionBlockCode } from "../motion";
import { generateControlBlockCode } from "../control";
import { generateLooksBlockCode } from "../looks";
import { generateSensingBlockCode } from "../sensing";
import { generateOperatorBlockCode } from "../operator";

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

    const blockCode = generateBlockCode(target, block, spriteVar);
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
 */
export function generateBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  const [category] = block.opcode.split("_");
  switch (category) {
    case "motion":
      return generateMotionBlockCode(block, spriteVar);
    case "looks":
      return generateLooksBlockCode(target, block, spriteVar);
    case "sensing":
      return generateSensingBlockCode(target, block, spriteVar);
    case "operator":
      return generateOperatorBlockCode(target, block, spriteVar);
    case "control":
      return generateControlBlockCode(
        target,
        block,
        spriteVar,
        generateSequenceCode,
      );
    default:
      return null;
  }
}

export { readFieldString } from "../utils";

export function unsupportedSequenceComment(blockId: string): string {
  return `// No supported blocks found after ${blockId}`;
}
