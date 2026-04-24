import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { readInputMenuString } from "./utils";

/**
 * Generates runtime calls for supported looks blocks.
 */
export function generateLooksBlockCode(
  target: ScratchTarget,
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
      const costumeName = readInputMenuString(
        target,
        block.inputs,
        "COSTUME",
        "COSTUME",
      );
      const costumeArg =
        costumeName === null ? "undefined" : JSON.stringify(costumeName);

      return `${spriteVar}.switchCostumeTo(${costumeArg});`;
    }
    case "looks_switchbackdropto": {
      const backdropName = readInputMenuString(
        target,
        block.inputs,
        "BACKDROP",
        "BACKDROP",
      );
      const backdropArg =
        backdropName === null ? "undefined" : JSON.stringify(backdropName);

      return `myStage.change(${backdropArg});`;
    }
    default:
      return null;
  }
}
