import type {
  ScratchCostume,
  ScratchProject,
  ScratchTarget,
} from "@scratch-compiler/types";
import { copyFile, mkdir, readdir, writeFile } from "fs/promises";
import { join } from "path";
import { fromBuffer, Entry, ZipFile } from "yauzl";
import { formatJsString } from "./format";

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
 */
function generateMainJs(project: ScratchProject) {
  const stageTarget = findStageTarget(project);
  const stageCtorCode = generateStageCtorCode(stageTarget);
  const sprites = findSprites(project);
  const spritesCtorCode = generateSpritesCtorCode(sprites);

  return composeMainJsSource(stageCtorCode, spritesCtorCode);
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
  objFields.push(`isStage: true`);
  // Add any other relevant properties here for Stage

  return `new Stage({ ${objFields.join(", ")} }, canvas)`;
}

/** Generate the code string for all Sprite constructors. */
function generateSpritesCtorCode(sprites: ScratchTarget[]): string {
  return sprites
    .map((sprite) => {
      const costumesCode = generateCostumesArrayCode(sprite.costumes ?? []);
      // Add all sprite properties as object fields
      const objFields: string[] = [];
      objFields.push(`name: ${JSON.stringify(sprite.name)}`);
      objFields.push(`costumes: [${costumesCode}]`);
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
      // You could add more optional fields as needed here

      return `const ${sprite.name} = new Sprite({ ${objFields.join(", ")} }); 
      ${sprite.name}.draw(ctx, width, height);`;
    })
    .join("\n");
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
  rotationCenterX: ${typeof costume.rotationCenterX === "number" ? costume.rotationCenterX : "undefined"},
  rotationCenterY: ${typeof costume.rotationCenterY === "number" ? costume.rotationCenterY : "undefined"},
  bitmapResolution: ${typeof costume.bitmapResolution === "number" ? costume.bitmapResolution : "undefined"},
}`,
    )
    .join(", ");
}

/** Compose the contents of main.js */
function composeMainJsSource(
  stageCtorCode: string,
  spritesCtorCode: string,
): string {
  return `
  import { Stage, Sprite } from "./engine.min.js";
  
  // Get the drawing canvas
  const canvas = document.getElementById("sb3-canvas");
  
  // Check if the canvas exists before continuing
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas with id 'sb3-canvas' was not found!");
  }
  
  // Make the stage
  const myStage = ${stageCtorCode};
  myStage.draw();
  // Cache frequently used references
  const ctx = myStage.ctx;
  const width = myStage.logicalWidth;
  const height = myStage.logicalHeight;
  
  // Make the sprites
  ${spritesCtorCode}
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
