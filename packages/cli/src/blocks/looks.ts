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
    case "looks_hide": {
      return `${spriteVar}.hide();`;
    }
    case "looks_show": {
      return `${spriteVar}.show();`;
    }
    default:
      return null;
  }
}
