import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { readInputBlockId, readFieldString } from "./utils";
import { sanitizeIdentifier } from "../ident";
import { generateOperatorBlockCode } from "./operator";

function resolveQuestionExpression(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string {
  const input = block.inputs["QUESTION"];
  if (!Array.isArray(input)) return JSON.stringify("");

  const value = input[1];
  if (Array.isArray(value)) {
    if (value[0] === 12 && typeof value[1] === "string") {
      const name = value[1];
      const id = typeof value[2] === "string" ? value[2] : null;
      const isLocal =
        !target.isStage &&
        id != null &&
        Object.prototype.hasOwnProperty.call(target.variables ?? {}, id);
      return isLocal
        ? `${spriteVar}_${sanitizeIdentifier(name)}`
        : sanitizeIdentifier(name);
    }
    if (typeof value[1] === "string") return JSON.stringify(value[1]);
    if (typeof value[1] === "number" && Number.isFinite(value[1])) {
      return String(value[1]);
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== "string") return JSON.stringify("");

  const questionBlock = target.blocks[value];
  if (!questionBlock) return JSON.stringify("");
  if (questionBlock.opcode === "data_variable") {
    const field = questionBlock.fields["VARIABLE"];
    if (!Array.isArray(field) || typeof field[0] !== "string") {
      return JSON.stringify("");
    }
    const id = typeof field[1] === "string" ? field[1] : null;
    const isLocal =
      !target.isStage &&
      id != null &&
      Object.prototype.hasOwnProperty.call(target.variables ?? {}, id);
    return isLocal
      ? `${spriteVar}_${sanitizeIdentifier(field[0])}`
      : sanitizeIdentifier(field[0]);
  }
  if (questionBlock.opcode === "sensing_answer") return "myStage.answer";
  if (questionBlock.opcode.startsWith("operator_")) {
    return (
      generateOperatorBlockCode(target, questionBlock, spriteVar) ??
      JSON.stringify("")
    );
  }
  return JSON.stringify("");
}

/**
 * Generates runtime calls for supported sensing blocks.
 */
export function generateSensingBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "sensing_askandwait":
      return `await myStage.askAndWait(String(${resolveQuestionExpression(target, block, spriteVar)}));`;
    case "sensing_answer":
      return "myStage.answer";
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
