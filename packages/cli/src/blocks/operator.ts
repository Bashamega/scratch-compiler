import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { generateSensingBlockCode } from "./sensing";
import { readInputBlockId } from "./utils";
import { sanitizeIdentifier } from "../ident";

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
    case "data":
      // Avoid a circular import between data/operator. Only support the data
      // expression blocks used in operator inputs.
      if (operandBlock.opcode === "data_variable") {
        const tuple = operandBlock.fields?.["VARIABLE"];
        if (Array.isArray(tuple) && typeof tuple[0] === "string") {
          const name = tuple[0];
          const id = typeof tuple[1] === "string" ? tuple[1] : null;
          return resolveVariableIdent(target, spriteVar, name, id);
        }
      }
      if (operandBlock.opcode === "data_listcontents") {
        const tuple = operandBlock.fields?.["LIST"];
        if (Array.isArray(tuple) && typeof tuple[0] === "string") {
          const name = tuple[0];
          const id = typeof tuple[1] === "string" ? tuple[1] : null;
          return resolveListIdent(target, spriteVar, name, id);
        }
      }
      return "false";
    case "sensing": {
      const expr = generateSensingBlockCode(target, operandBlock, spriteVar);
      return expr ?? "false";
    }
    default:
      return "false";
  }
}

function resolveVariableIdent(
  target: ScratchTarget,
  spriteVar: string,
  variableName: string,
  variableId: string | null,
): string {
  const isLocal =
    variableId != null &&
    Object.prototype.hasOwnProperty.call(target.variables ?? {}, variableId);
  return isLocal
    ? `${spriteVar}_${sanitizeIdentifier(variableName)}`
    : sanitizeIdentifier(variableName);
}

function resolveListIdent(
  target: ScratchTarget,
  spriteVar: string,
  listName: string,
  listId: string | null,
): string {
  const isLocal =
    listId != null &&
    Object.prototype.hasOwnProperty.call(target.lists ?? {}, listId);
  return isLocal
    ? `${spriteVar}_${sanitizeIdentifier(listName)}`
    : sanitizeIdentifier(listName);
}

function resolveOperandExpression(
  target: ScratchTarget,
  spriteVar: string,
  block: ScratchBlock,
  inputName: string,
): string {
  const input = blockInput(block, inputName);
  if (!input) return JSON.stringify("");

  if (typeof input === "string") {
    // Block reference.
    return generateBooleanExpressionFromBlockId(target, input, spriteVar);
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    return String(input);
  }

  // Primitive tuple shapes:
  // - [10, "text"]
  // - [4, "number-as-string"]
  // - [12, "varName", "varId"]
  // - [13, "listName", "listId"]
  if (Array.isArray(input) && input.length >= 2) {
    const tag = input[0];
    if (tag === 12 && typeof input[1] === "string") {
      const name = input[1];
      const id = typeof input[2] === "string" ? input[2] : null;
      return resolveVariableIdent(target, spriteVar, name, id);
    }
    if (tag === 13 && typeof input[1] === "string") {
      const name = input[1];
      const id = typeof input[2] === "string" ? input[2] : null;
      return resolveListIdent(target, spriteVar, name, id);
    }

    const primitive = input[1];
    if (typeof primitive === "number" && Number.isFinite(primitive)) {
      return String(primitive);
    }
    if (typeof primitive === "string") {
      // Keep as string literal; Scratch will coerce appropriately in helpers like scratchEquals.
      return JSON.stringify(primitive);
    }
  }

  return JSON.stringify("");
}

function blockInput(
  block: ScratchBlock,
  inputName: string,
): unknown | null {
  const input = block.inputs?.[inputName];
  if (!Array.isArray(input)) return null;
  return input[1] ?? null;
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
    case "operator_equals": {
      const op1 = resolveOperandExpression(target, spriteVar, block, "OPERAND1");
      const op2 = resolveOperandExpression(target, spriteVar, block, "OPERAND2");
      return `(${op1} == ${op2})`;
    }
    default:
      return null;
  }
}
