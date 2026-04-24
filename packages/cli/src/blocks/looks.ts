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
    case "looks_switchbackdropto": {
      // Switch the stage backdrop to the specified name in inputs["BACKDROP"]
      // inputs.BACKDROP is [1, backdropName] or [3, blockId]. Handle name for now.
      const backdropInput = block.inputs?.["BACKDROP"];
      let backdropArg = null;
      if (Array.isArray(backdropInput)) {
        // [type, value]
        backdropArg = JSON.stringify(backdropInput[1]);
      } else {
        backdropArg = "undefined";
      }
      return `myStage.change(${backdropArg});`;
    }
    default:
      return null;
  }
}
