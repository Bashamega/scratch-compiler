import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { generateSensingBlockCode } from "./sensing";
import { readInputBlockId } from "./utils";

function generateBooleanExpressionFromBlockId(
  target: ScratchTarget,
  blockId: string,
  spriteVar: string,
): string {
  const operandBlock = target.blocks[blockId];
  if (!operandBlock) return "false";

  const [category] = operandBlock.opcode.split("_");
  switch (category) {
    case "operator": {
      const expr = generateOperatorBlockCode(target, operandBlock, spriteVar);
      return expr ?? "false";
    }
    case "sensing": {
      const expr = generateSensingBlockCode(target, operandBlock, spriteVar);
      return expr ?? "false";
    }
    default:
      return "false";
  }
}

/**
 * Generates code for supported operator blocks.
 *
 * Operator blocks are expressions (they should not emit trailing semicolons).
 */
export function generateOperatorBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "operator_not": {
      const operandBlockId = readInputBlockId(block.inputs, "OPERAND");
      const operandExpr = operandBlockId
        ? generateBooleanExpressionFromBlockId(target, operandBlockId, spriteVar)
        : "false";
      return `!(${operandExpr})`;
    }
    default:
      return null;
  }
}

