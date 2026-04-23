import type { ScratchBlock } from "@scratch-compiler/types";

/**
 * Generates runtime calls for supported looks blocks.
 */
export function generateLooksBlockCode(
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "looks_nextcostume": {
      return `${spriteVar}.nextCostume();`;
    }
    default:
      return null;
  }
}
