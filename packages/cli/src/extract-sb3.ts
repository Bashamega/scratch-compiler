import { promises as fs } from "fs";
import path from "path";

/**
 * Reads a Scratch .sb3 file and returns its contents as a Buffer along with
 * a ZIP filename. (.sb3 files are ZIP archives internally.)
 *
 * @param filePath Path to the .sb3 file
 * @returns An object containing the ZIP-equivalent filename and file contents as Buffer
 * @throws If the file does not have a .sb3 extension or does not exist
 */
export async function extractSb3ToZip(filePath: string): Promise<{
  zipName: string;
  buffer: Buffer;
}> {
  console.log("Extracting .sb3 content");

  // Check if the file can be accessed (exists and is readable)
  await fs.access(filePath);

  // Load the entire file into memory as a Buffer
  const buffer = await fs.readFile(filePath);

  // Generate the output ZIP filename corresponding to the input .sb3 file
  // (No file is actually written to disk with this name, only returned)
  const zipName = path.basename(filePath, ".sb3") + ".zip";
  console.log("Extracting content done");

  return {
    zipName,
    buffer,
  };
}
