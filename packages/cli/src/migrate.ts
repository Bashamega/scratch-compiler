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
  const targetJson = JSON.stringify(stageTarget ?? null, null, 2);
  const content = `import { Stage } from "./stage.min.js";

const stageTarget = ${targetJson};

if (!stageTarget) {
  console.error("No stage found in project");
} else {
  const canvas = document.getElementById("sb3-canvas");
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    console.error("Canvas #sb3-canvas not found");
  } else {
    const stage = new Stage(stageTarget, canvas);
    stage.render();
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
