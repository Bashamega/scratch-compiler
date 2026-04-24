const RESERVED = new Set([
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

/**
 * Turns an arbitrary Scratch name into a reasonably kid-friendly JS identifier.
 * Matches the camelCase style already used for sprite variable names.
 */
export function sanitizeIdentifier(name: string): string {
  const raw = (name ?? "").trim();
  if (!raw) return "_";

  const words = raw
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return "_";

  let camel = words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");

  if (/^[0-9]/.test(camel)) camel = `_${camel}`;
  if (RESERVED.has(camel)) camel = `_${camel}`;
  return camel;
}

