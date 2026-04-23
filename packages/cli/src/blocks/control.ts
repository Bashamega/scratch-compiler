import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { readInputBlockId, resolveNumericValue } from "./utils";

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
    case "control_wait": {
      const duration = resolveNumericValue(block.inputs["DURATION"]) ?? 1;
      return `await new Promise(resolve => setTimeout(resolve, ${duration} * 1000));`;
    }
    case "control_forever": {
      const substackId = readInputBlockId(block.inputs, "SUBSTACK");
      const bodyCode = generateSequenceCode(target, substackId, spriteVar);

      // Only add the delay if the bodyCode doesn't already contain 'await new Promise(...setTimeout'
      const hasAwaitDelay = /\bawait\s+new\s+Promise\s*\(\s*resolve\s*=>\s*setTimeout\s*\(/.test(bodyCode);

      return `while (true) {
${bodyCode.split('\n').map(line => `  ${line}`).join('\n')}
${hasAwaitDelay ? '' : '  await new Promise(resolve => setTimeout(resolve, 0));\n'}}`;
    }
    default:
      return null;
  }
}
