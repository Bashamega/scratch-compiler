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
    case "looks_switchcostumeto": {
      // Switch to the costume specified in inputs["COSTUME"]
      // inputs.COSTUME is [1, costumeName] or [3, blockId] in Scratch. We handle name for now.
      const costumeInput = block.inputs?.["COSTUME"];
      let costumeArg = null;
      if (Array.isArray(costumeInput)) {
        // [type, value]
        costumeArg = JSON.stringify(costumeInput[1]);
      } else {
        costumeArg = "undefined";
      }
      return `${spriteVar}.switchCostumeTo(${costumeArg});`;
    }
    default:
      return null;
  }
}
