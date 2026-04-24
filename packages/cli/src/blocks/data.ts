import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { sanitizeIdentifier } from "../ident";
import { readFieldString, resolveNumericValue } from "./utils";
import { generateOperatorBlockCode } from "./operator";
import { generateSensingBlockCode } from "./sensing";

function getFieldTuple(
  fields: ScratchBlock["fields"],
  name: string,
): { label: string; id: string } | null {
  const tuple = fields[name];
  if (!Array.isArray(tuple) || tuple.length < 2) return null;
  const label = typeof tuple[0] === "string" ? tuple[0] : null;
  const id = typeof tuple[1] === "string" ? tuple[1] : null;
  if (!label || !id) return null;
  return { label, id };
}

function resolveVariableIdent(
  target: ScratchTarget,
  spriteVar: string,
  variable: { label: string; id: string },
): string {
  const isLocal = Object.prototype.hasOwnProperty.call(
    target.variables ?? {},
    variable.id,
  );
  return isLocal
    ? `${spriteVar}_${sanitizeIdentifier(variable.label)}`
    : sanitizeIdentifier(variable.label);
}

function resolveListIdent(
  target: ScratchTarget,
  spriteVar: string,
  list: { label: string; id: string },
): string {
  const isLocal = Object.prototype.hasOwnProperty.call(
    target.lists ?? {},
    list.id,
  );
  return isLocal
    ? `${spriteVar}_${sanitizeIdentifier(list.label)}`
    : sanitizeIdentifier(list.label);
}

function readPrimitiveInput(inputs: ScratchBlock["inputs"], name: string): unknown {
  const input = inputs?.[name];
  if (!Array.isArray(input)) return undefined;

  const value = input[1];
  // Primitive form is usually [type, "value"]
  if (Array.isArray(value) && value.length >= 2) {
    return value[1];
  }
  return value;
}

function resolveValueExpression(
  target: ScratchTarget,
  spriteVar: string,
  valueInput: unknown,
): string {
  // If this input is a block reference, evaluate it.
  if (typeof valueInput === "string") {
    const nested = target.blocks[valueInput];
    if (!nested) return "0";

    const [category] = nested.opcode.split("_");
    if (category === "data") {
      return generateDataBlockCode(target, nested, spriteVar) ?? "0";
    }
    if (category === "operator") {
      return generateOperatorBlockCode(target, nested, spriteVar) ?? "0";
    }
    if (category === "sensing") {
      return generateSensingBlockCode(target, nested, spriteVar) ?? "0";
    }

    return "0";
  }

  // Otherwise, try numeric, then string literal.
  const num = resolveNumericValue(valueInput);
  if (num !== null) return String(num);

  if (typeof valueInput === "string") return JSON.stringify(valueInput);
  if (Array.isArray(valueInput)) {
    const primitive = valueInput[valueInput.length - 1];
    if (typeof primitive === "string") return JSON.stringify(primitive);
  }

  return "0";
}

/**
 * Generates code for supported data blocks.
 *
 * Some blocks are statements (end with semicolons) and some are expressions.
 */
export function generateDataBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "data_setvariableto": {
      const variable = getFieldTuple(block.fields, "VARIABLE");
      if (!variable) return null;
      const ident = resolveVariableIdent(target, spriteVar, variable);
      const primitive = readPrimitiveInput(block.inputs, "VALUE");
      const valueExpr = resolveValueExpression(target, spriteVar, primitive);
      return `${ident} = ${valueExpr};`;
    }
    case "data_changevariableby": {
      const variable = getFieldTuple(block.fields, "VARIABLE");
      if (!variable) return null;
      const ident = resolveVariableIdent(target, spriteVar, variable);
      const primitive = readPrimitiveInput(block.inputs, "VALUE");
      const delta = resolveNumericValue(primitive) ?? 0;
      return `${ident} = (Number(${ident}) || 0) + ${delta};`;
    }
    case "data_showvariable": {
      const name = readFieldString(block.fields, "VARIABLE");
      if (!name) return null;
      return `myStage.showVariable(${JSON.stringify(name)});`;
    }
    case "data_hidevariable": {
      const name = readFieldString(block.fields, "VARIABLE");
      if (!name) return null;
      return `myStage.hideVariable(${JSON.stringify(name)});`;
    }
    case "data_variable": {
      const variable = getFieldTuple(block.fields, "VARIABLE");
      if (!variable) return null;
      const ident = resolveVariableIdent(target, spriteVar, variable);
      return ident;
    }
    case "data_addtolist": {
      const list = getFieldTuple(block.fields, "LIST");
      if (!list) return null;
      const ident = resolveListIdent(target, spriteVar, list);
      const item = readPrimitiveInput(block.inputs, "ITEM");
      const itemExpr = resolveValueExpression(target, spriteVar, item);
      return `${ident}.push(${itemExpr}); myStage.renderList(${JSON.stringify(list.label)}, ${ident});`;
    }
    case "data_deletealloflist": {
      const list = getFieldTuple(block.fields, "LIST");
      if (!list) return null;
      const ident = resolveListIdent(target, spriteVar, list);
      return `${ident}.length = 0; myStage.renderList(${JSON.stringify(list.label)}, ${ident});`;
    }
    case "data_insertatlist": {
      const list = getFieldTuple(block.fields, "LIST");
      if (!list) return null;
      const ident = resolveListIdent(target, spriteVar, list);
      const item = readPrimitiveInput(block.inputs, "ITEM");
      const itemExpr = resolveValueExpression(target, spriteVar, item);
      const indexPrimitive = readPrimitiveInput(block.inputs, "INDEX");
      const index = resolveNumericValue(indexPrimitive) ?? 1;
      return `${ident}.splice(Math.max(0, (${index}) - 1), 0, ${itemExpr}); myStage.renderList(${JSON.stringify(list.label)}, ${ident});`;
    }
    case "data_showlist": {
      const name = readFieldString(block.fields, "LIST");
      if (!name) return null;
      return `myStage.showList(${JSON.stringify(name)});`;
    }
    case "data_hidelist": {
      const name = readFieldString(block.fields, "LIST");
      if (!name) return null;
      return `myStage.hideList(${JSON.stringify(name)});`;
    }
    case "data_listcontents": {
      const list = getFieldTuple(block.fields, "LIST");
      if (!list) return null;
      const ident = resolveListIdent(target, spriteVar, list);
      return ident;
    }
    default:
      return null;
  }
}
