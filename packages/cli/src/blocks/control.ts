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
${hasAwaitDelay ? '' : '  await new Promise(resolve => setTimeout(resolve, 200));\n'}}`;
    }
    case "control_if": {
      const conditionBlockId = readInputBlockId(block.inputs, "CONDITION");
      const substackId = readInputBlockId(block.inputs, "SUBSTACK");

      // For condition evaluation, generate code to evaluate the condition as a boolean expression or value
      // For simplicity, just call generateSequenceCode for condition and body
      const condExpr = conditionBlockId
        ? generateSequenceCode(target, conditionBlockId, spriteVar) || "false"
        : "false";
      const bodyCode = generateSequenceCode(target, substackId, spriteVar);

      // Attempt to take the last line of condExpr if possible (as a single expression/statement)
      // Fallback to false if condExpr is empty
      const condSource = (() => {
        if (!condExpr.trim()) return "false";
        const lines = condExpr.trim().split('\n');
        // Check if the single line (after trimming whitespace) is a comment (starts with //)
        if (lines.length === 1) {
          const line = lines[0].trim();
          if (line.startsWith("//")) {
            console.warn("NOT SUPPORTED: " + line)
            // The condition block only generated a comment (unsupported block), so treat condition as false
            return "false";
    
          }
          return line;
        }
        // If any line starts with //, treat as comment and return false
        if (lines.some(line => line.trim().startsWith("//"))) {
          return "false";
        }
        // Otherwise, wrap in (() => { ... })()
        return `(() => {\n${condExpr.split('\n').map(line => '  ' + line).join('\n')}\n})()`;
      })();

      return `if (${condSource}) {
${bodyCode.split('\n').map(line => `  ${line}`).join('\n')}
}`;
    }
    case "control_if_else": {
      const conditionBlockId = readInputBlockId(block.inputs, "CONDITION");
      const substackId = readInputBlockId(block.inputs, "SUBSTACK");
      const substack2Id = readInputBlockId(block.inputs, "SUBSTACK2");

      // Generate code for the condition
      const condExpr = conditionBlockId
        ? generateSequenceCode(target, conditionBlockId, spriteVar) || "false"
        : "false";
      const thenCode = generateSequenceCode(target, substackId, spriteVar);
      const elseCode = generateSequenceCode(target, substack2Id, spriteVar);

      // Attempt to take the last line of condExpr if possible (as a single expression/statement)
      const condSource = (() => {
        if (!condExpr.trim()) return "false";
        const lines = condExpr.trim().split('\n');
        if (lines.length === 1) {
          const line = lines[0].trim();
          if (line.startsWith("//")) {
            return "false";
          }
          return line;
        }
        if (lines.some(line => line.trim().startsWith("//"))) {
          return "false";
        }
        return `(() => {\n${condExpr.split('\n').map(line => '  ' + line).join('\n')}\n})()`;
      })();

      return `if (${condSource}) {
${thenCode.split('\n').map(line => `  ${line}`).join('\n')}
} else {
${elseCode.split('\n').map(line => `  ${line}`).join('\n')}
}`;
    }
    default:
      return null;
  }
}
