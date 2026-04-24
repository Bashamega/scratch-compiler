import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { readInputBlockId, readFieldString } from "./utils";

/**
 * Generates runtime calls for supported sensing blocks.
 */
export function generateSensingBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "sensing_touchingobject": {
      const menuBlockId = readInputBlockId(block.inputs, "TOUCHINGOBJECTMENU");
      if (!menuBlockId) return "false";

      const menuBlock = target.blocks[menuBlockId];
      if (!menuBlock || menuBlock.opcode !== "sensing_touchingobjectmenu") {
        return "false";
      }

      const touchingObject = readFieldString(
        menuBlock.fields,
        "TOUCHINGOBJECTMENU",
      );
      return `${spriteVar}.isTouching(${JSON.stringify(touchingObject)})`;
    }
    default:
      return null;
  }
}
