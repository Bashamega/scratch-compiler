import type { ScratchProject, ScratchTarget } from "@scratch-compiler/types";
import { copyFile, mkdir, readdir, writeFile } from "fs/promises";
import { join } from "path";
import { fromBuffer, Entry, ZipFile } from "yauzl";
import { minify } from "./minify";

/**
 * Copies all files and subdirectories from the 'static' directory to the provided output directory.
 *
 * @param outputDirectory Path to the output directory
 */
export async function migrate(
  outputDirectory: string,
  data: Buffer,
): Promise<void> {
  const staticDir = join(__dirname, "..", "static");
  await copyDirectory(staticDir, outputDirectory);

  // Extract ONLY project.json
  const projectJsonBuffer = await extractProjectJson(data);

  // Convert to string (JSON text)
  const projectJsonContent = JSON.parse(projectJsonBuffer.toString("utf-8"));

  const mainJsPath = join(outputDirectory, "src", "main.js");

  const mainJsContent = await generateMainJs(projectJsonContent);

  await writeFile(mainJsPath, mainJsContent, "utf-8");
}

/**
 * Generates main.js that imports Stage from the client bundle and renders the project.
 */
async function generateMainJs(project: ScratchProject) {
  const stageTarget = project.targets?.find(
    (t): t is ScratchTarget => t.isStage,
  );
  const sprites = project.targets?.filter((t) => !t.isStage) ?? [];

  const stageJson = JSON.stringify(stageTarget ?? null, null, 2);
  const spritesJson = JSON.stringify(sprites, null, 2);

  const content = `
import { Stage, Sprite } from "./engine.min.js";

const stageTarget = ${stageJson};
const spriteTargets = ${spritesJson};

if (!stageTarget) {
  console.error("No stage found in project");
} else {
  const canvas = document.getElementById("sb3-canvas");
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    console.error("Canvas #sb3-canvas not found");
  } else {
    const stage = new Stage(stageTarget, canvas);
    const sprites = spriteTargets.map(function(data) { return new Sprite(data); });

    // Wait for all sprite images to load
    var imagePromises = [];
    for (var i = 0; i < sprites.length; i++) {
      var sprite = sprites[i];
      for (var j = 0; j < sprite.images.length; j++) {
        (function(img) {
          imagePromises.push(
            new Promise(function(resolve) {
              if (img.complete) {
                resolve();
              } else {
                img.onload = function() { resolve(); };
                img.onerror = function() {
                  console.error("Failed to load image");
                  resolve();
                };
              }
            })
          );
        })(sprite.images[j]);
      }
    }

    Promise.all(imagePromises).then(function() {
      // All images loaded, start render loop
      function renderLoop() {
        // Clear canvas each frame
        stage.ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render stage
        stage.render();

        // Render sprites
        for (var k = 0; k < sprites.length; k++) {
          sprites[k].draw(stage.ctx);
        }

        requestAnimationFrame(renderLoop);
      }

      requestAnimationFrame(renderLoop);
    });
  }
}
  `;

  return await minify(content);
}

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
