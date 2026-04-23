import type { ScratchBlock } from "@scratch-compiler/types";
import { readNumericInput } from "./utils";

/**
 * Generates runtime calls for supported motion blocks.
 */
export function generateMotionBlockCode(
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "motion_turnright": {
      const degrees = readNumericInput(block.inputs, "DEGREES", 15);
      return `${spriteVar}.turnRight(${degrees});`;
    }
    case "motion_turnleft": {
      const degrees = readNumericInput(block.inputs, "DEGREES", 15);
      return `${spriteVar}.turnLeft(${degrees});`;
    }
    case "motion_movesteps": {
      const steps = readNumericInput(block.inputs, "STEPS", 10);
      return `${spriteVar}.move(${steps});`;
    }
    case "motion_ifonedgebounce": {
      return `${spriteVar}.ifOnEdgeBounce();`;
    }
    default:
      return null;
  }
}
