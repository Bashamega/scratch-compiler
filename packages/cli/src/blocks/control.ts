import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { readInputBlockId } from "./utils";

/**
 * Generates runtime calls for supported control blocks.
 */
export function generateControlBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
  generateSequenceCode: (
    target: ScratchTarget,
    startBlockId: string | null,
    spriteVar: string,
  ) => string,
): string | null {
  switch (block.opcode) {
    case "control_forever": {
      const substackId = readInputBlockId(block.inputs, "SUBSTACK");
      const bodyCode = generateSequenceCode(target, substackId, spriteVar);
      // We use an async loop with a small delay to prevent blocking the UI/process
      return `while (true) {
${bodyCode.split("\n").map(line => `  ${line}`).join("\n")}
  await new Promise(resolve => setTimeout(resolve, 0));
}`;
    }
    default:
      return null;
  }
}
