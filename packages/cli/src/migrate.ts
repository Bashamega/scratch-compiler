import type {
  ScratchCostume,
  ScratchProject,
  ScratchTarget,
} from "@scratch-compiler/types";
import { copyFile, mkdir, readdir, writeFile } from "fs/promises";
import { join } from "path";
import { fromBuffer, Entry, ZipFile } from "yauzl";
import { formatJsString } from "./format";
import { generateEventBlocksCode } from "./blocks";
import { sanitizeIdentifier } from "./ident";

/**
 * Migrates a Scratch project by copying static assets, extracting project.json,
 * generating main.js, and saving it into the output directory.
 */
export async function migrate(
  outputDirectory: string,
  data: Buffer,
): Promise<void> {
  const staticDir = join(__dirname, "..", "static");
  await copyDirectory(staticDir, outputDirectory);

  // Extract ONLY project.json
  const projectJsonBuffer = await extractProjectJson(data);

  // Parse the project JSON
  const projectJsonContent = parseProjectJson(projectJsonBuffer);

  // Generate and write main.js
  await writeMainJsFile(outputDirectory, projectJsonContent);
}

/** Extract and parse project.json buffer from zip data. */
function parseProjectJson(buffer: Buffer): ScratchProject {
  return JSON.parse(buffer.toString("utf-8"));
}

/** Generate and write main.js to the output directory. */
async function writeMainJsFile(
  outputDirectory: string,
  project: ScratchProject,
): Promise<void> {
  const mainJsPath = join(outputDirectory, "src", "main.js");
  const mainJsContent = generateMainJs(project);
  const formatted = await formatJsString(mainJsContent);
  await writeFile(mainJsPath, formatted, "utf-8");
}

/**
 * Generates a simple main.js that loads the project into the canvas using Stage and Sprite.
 * The generated JS is easy to read and understand for kids.
 * Now also includes event/code blocks for the stage itself.
 */
function generateMainJs(project: ScratchProject) {
  const stageTarget = findStageTarget(project);
  const stageCtorCode = generateStageCtorCode(stageTarget);
  const stageBlocksCode = generateStageEventBlocksCode(stageTarget);
  const stageVarsCode = generateStageVariablesCode(stageTarget);
  const stageListsCode = generateStageListsCode(stageTarget);
  const sprites = findSprites(project);
  const { spritesCode, spriteNameToVar } = generateSpritesCode(sprites);
  const monitorsCode = generateVisibleMonitorsCode(
    project,
    stageTarget,
    spriteNameToVar,
  );

  return composeMainJsSource(
    stageVarsCode,
    stageListsCode,
    stageCtorCode,
    stageBlocksCode,
    spritesCode,
    monitorsCode,
  );
}

/** Find the stage target in the project. */
function findStageTarget(project: ScratchProject): ScratchTarget | undefined {
  return project.targets?.find((t): t is ScratchTarget => t.isStage);
}

/** Find all sprite targets in the project. */
function findSprites(project: ScratchProject): ScratchTarget[] {
  return project.targets?.filter((t): t is ScratchTarget => !t.isStage) ?? [];
}

/** Generate the code string for the Stage constructor. */
function generateStageCtorCode(stageTarget?: ScratchTarget): string {
  if (!stageTarget) return "null";
  const costumesCode = generateCostumesArrayCode(stageTarget.costumes ?? []);

  // Add all fields as object properties, using JSON.stringify for string values, and default values as appropriate.
  const objFields: string[] = [];
  objFields.push(`name: ${JSON.stringify(stageTarget.name)}`);
  objFields.push(`costumes: [${costumesCode}]`);
  objFields.push(`currentCostume: ${stageTarget.currentCostume ?? 0}`);
  objFields.push(`isStage: true`);

  return `new Stage({ ${objFields.join(", ")} }, "sb3-container")`;
}

/**
 * Generate the code string for the stage's events/code blocks.
 * Uses generateEventBlocksCode, passing in the stage target and variable name "myStage".
 */
function generateStageEventBlocksCode(stageTarget?: ScratchTarget): string {
  if (!stageTarget) return "";
  return generateEventBlocksCode(stageTarget, "myStage");
}

/**
 * Generate the code string for all Sprites.
 * Handles duplicate variable names by appending a number suffix.
 */
function generateSpritesCode(sprites: ScratchTarget[]): {
  spritesCode: string;
  spriteNameToVar: Record<string, string>;
} {
  const nameCounter: Record<string, number> = {};
  const spriteNameToVar: Record<string, string> = {};

  const spritesCode = sprites
    .map((sprite) => {
      const costumesCode = generateCostumesArrayCode(sprite.costumes ?? []);
      // Add all sprite properties as object fields
      const objFields: string[] = [];
      objFields.push(`name: ${JSON.stringify(sprite.name)}`);
      objFields.push(`costumes: [${costumesCode}]`);
      objFields.push(`currentCostume: ${sprite.currentCostume ?? 0}`);
      objFields.push(`isStage: false`);
      objFields.push(`x: ${typeof sprite.x === "number" ? sprite.x : 0}`);
      objFields.push(`y: ${typeof sprite.y === "number" ? sprite.y : 0}`);
      objFields.push(
        `visible: ${typeof sprite.visible === "boolean" ? sprite.visible : true}`,
      );
      objFields.push(
        `direction: ${typeof sprite.direction === "number" ? sprite.direction : 90}`,
      );
      objFields.push(
        `size: ${typeof sprite.size === "number" ? sprite.size : 100}`,
      );

      // Sanitize sprite name and deduplicate variable
      let spriteVarBase = sanitizeIdentifier(sprite.name);
      let spriteVar = spriteVarBase;
      if (nameCounter[spriteVarBase] == null) {
        nameCounter[spriteVarBase] = 1;
      } else {
        nameCounter[spriteVarBase]++;
        spriteVar = `${spriteVarBase}${nameCounter[spriteVarBase]}`;
      }
      spriteNameToVar[sprite.name] = spriteVar;

      const localVarsCode = generateTargetLocalVariablesCode(sprite, spriteVar);
      const localListsCode = generateTargetLocalListsCode(sprite, spriteVar);
      const eventsCode = generateEventBlocksCode(sprite, spriteVar);

      return `
      const ${spriteVar} = new Sprite({ ${objFields.join(", ")} }); 
      ${spriteVar}.draw(myStage);
      ${localVarsCode}
      ${localListsCode}
      ${eventsCode}`;
    })
    .join("\n");

  return { spritesCode, spriteNameToVar };
}

function toJsLiteral(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null) return "null";
  return JSON.stringify(value);
}

function generateStageVariablesCode(stageTarget?: ScratchTarget): string {
  if (!stageTarget) return "";
  const entries = Object.values(stageTarget.variables ?? {});
  if (entries.length === 0) return "";

  const lines = entries.map((tuple) => {
    const name = Array.isArray(tuple) ? String(tuple[0] ?? "") : "";
    const value = Array.isArray(tuple) ? tuple[1] : undefined;
    const ident = sanitizeIdentifier(name);
    return `let ${ident} = ${toJsLiteral(value)};`;
  });

  return `// Global variables\n${lines.join("\n")}`;
}

function generateStageListsCode(stageTarget?: ScratchTarget): string {
  if (!stageTarget) return "";
  const entries = Object.values(stageTarget.lists ?? {});
  if (entries.length === 0) return "";

  const lines = entries.map((tuple) => {
    const name = Array.isArray(tuple) ? String(tuple[0] ?? "") : "";
    const value = Array.isArray(tuple) ? tuple[1] : undefined;
    const ident = sanitizeIdentifier(name);
    const initial =
      Array.isArray(value) ? JSON.stringify(value) : JSON.stringify([]);
    return `let ${ident} = ${initial};`;
  });

  return `// Global lists\n${lines.join("\n")}`;
}

function generateTargetLocalVariablesCode(
  target: ScratchTarget,
  spriteVar: string,
): string {
  const entries = Object.values(target.variables ?? {});
  if (entries.length === 0) return "";

  const lines = entries.map((tuple) => {
    const name = Array.isArray(tuple) ? String(tuple[0] ?? "") : "";
    const value = Array.isArray(tuple) ? tuple[1] : undefined;
    const ident = `${spriteVar}_${sanitizeIdentifier(name)}`;
    return `let ${ident} = ${toJsLiteral(value)};`;
  });

  return `// ${spriteVar} local variables\n${lines.join("\n")}`;
}

function generateTargetLocalListsCode(
  target: ScratchTarget,
  spriteVar: string,
): string {
  const entries = Object.values(target.lists ?? {});
  if (entries.length === 0) return "";

  const lines = entries.map((tuple) => {
    const name = Array.isArray(tuple) ? String(tuple[0] ?? "") : "";
    const value = Array.isArray(tuple) ? tuple[1] : undefined;
    const ident = `${spriteVar}_${sanitizeIdentifier(name)}`;
    const initial =
      Array.isArray(value) ? JSON.stringify(value) : JSON.stringify([]);
    return `let ${ident} = ${initial};`;
  });

  return `// ${spriteVar} local lists\n${lines.join("\n")}`;
}

function generateVisibleMonitorsCode(
  project: ScratchProject,
  stageTarget: ScratchTarget | undefined,
  spriteNameToVar: Record<string, string>,
): string {
  const monitors = project.monitors ?? [];
  if (!Array.isArray(monitors) || monitors.length === 0) return "";

  const stageVarNames = new Set<string>();
  if (stageTarget?.variables) {
    for (const tuple of Object.values(stageTarget.variables)) {
      if (Array.isArray(tuple) && typeof tuple[0] === "string") {
        stageVarNames.add(tuple[0]);
      }
    }
  }
  const stageListNames = new Set<string>();
  if (stageTarget?.lists) {
    for (const tuple of Object.values(stageTarget.lists)) {
      if (Array.isArray(tuple) && typeof tuple[0] === "string") {
        stageListNames.add(tuple[0]);
      }
    }
  }

  const lines: string[] = [];
  for (const monitor of monitors) {
    if (!monitor || typeof monitor !== "object") continue;
    if ((monitor as any).visible !== true) continue;

    const opcode = (monitor as any).opcode;
    const params = (monitor as any).params ?? {};
    const spriteName = (monitor as any).spriteName ?? null;

    if (opcode === "data_variable") {
      const varName = params.VARIABLE;
      if (typeof varName !== "string") continue;

      const isGlobal = spriteName === null || stageVarNames.has(varName);
      const ident = isGlobal
        ? sanitizeIdentifier(varName)
        : `${spriteNameToVar[String(spriteName)] ?? "sprite"}_${sanitizeIdentifier(varName)}`;

      lines.push(`myStage.showVariable(${JSON.stringify(varName.replace(/_/g, " "))});`);
      lines.push(`myStage.renderVariable(${JSON.stringify(varName.replace(/_/g, " "))}, ${ident});`);
 
    }

    if (opcode === "data_listcontents") {
      const listName = params.LIST;
      if (typeof listName !== "string") continue;

      const isGlobal = spriteName === null || stageListNames.has(listName);
      const ident = isGlobal
        ? sanitizeIdentifier(listName)
        : `${spriteNameToVar[String(spriteName)] ?? "sprite"}_${sanitizeIdentifier(listName)}`;

      lines.push(`myStage.showList(${JSON.stringify(listName)});`);
      lines.push(`myStage.renderList(${JSON.stringify(listName)}, ${ident});`);
    }
  }

  if (lines.length === 0) return "";
  return `// Visible variable/list monitors\n${lines.join("\n")}`;
}

/** Generate the code string for a costumes array. */
function generateCostumesArrayCode(costumes: ScratchCostume[]): string {
  return costumes
    .map(
      (costume) =>
        `{
  name: ${JSON.stringify(costume.name)},
  assetId: ${JSON.stringify(costume.assetId)},
  md5ext: ${JSON.stringify(costume.md5ext)},
  dataFormat: ${JSON.stringify(costume.dataFormat)},
  rotationCenterX: ${typeof costume.rotationCenterX === "number" ? costume.rotationCenterX : 0},
  rotationCenterY: ${typeof costume.rotationCenterY === "number" ? costume.rotationCenterY : 0},
  bitmapResolution: ${typeof costume.bitmapResolution === "number" ? costume.bitmapResolution : 1},
}`,
    )
    .join(", ");
}

/** Compose the contents of main.js */
function composeMainJsSource(
  stageVarsCode: string,
  stageListsCode: string,
  stageCtorCode: string,
  stageBlocksCode: string,
  spritesCode: string,
  monitorsCode: string,
): string {
  return `
  import { Stage, Sprite } from "./engine.min.js";

  ${stageVarsCode}
  ${stageListsCode}
  
  // Make the stage
  const myStage = ${stageCtorCode};
  myStage.draw();

  // Stage blocks
  ${stageBlocksCode}

  // Make the sprites
  ${spritesCode}

  ${monitorsCode}
  `;
}

/** Extracts the project.json file from the provided Scratch .sb3 Buffer archive. */
async function extractProjectJson(data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fromBuffer(
      data,
      { lazyEntries: true },
      (err, zipfile: ZipFile | undefined) => {
        if (err || !zipfile) {
          return reject(err || new Error("Invalid zip buffer"));
        }

        let found = false;

        zipfile.readEntry();

        zipfile.on("entry", (entry: Entry) => {
          if (entry.fileName === "project.json") {
            found = true;

            zipfile.openReadStream(entry, (err, stream) => {
              if (err || !stream) {
                return reject(err || new Error("Stream error"));
              }

              const chunks: Buffer[] = [];

              stream.on("data", (chunk) => chunks.push(chunk));

              stream.on("end", () => {
                resolve(Buffer.concat(chunks));
                zipfile.close(); // stop reading further
              });

              stream.on("error", reject);
            });

            return;
          }

          zipfile.readEntry();
        });

        zipfile.on("end", () => {
          if (!found) {
            reject(new Error("project.json not found"));
          }
        });

        zipfile.on("error", reject);
      },
    );
  });
}

/** Recursively copies a directory and its contents. */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
    }
  }
}
