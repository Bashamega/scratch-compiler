import { access } from "fs/promises";
import { extname } from "path";

const DEFAULT_OUTPUT_DIRECTORY = "./out/";

export interface CliOptions {
  file: string;
  outputDirectory: string;
}

export async function resolveCliOptions(args: string[]): Promise<CliOptions> {
  const [file, providedOutputDirectory] = args;

  if (!file) {
    throw new Error("Usage: scratch-compile <file.sb3> [output-directory]");
  }

  if (extname(file).toLowerCase() !== ".sb3") {
    throw new Error("File format not supported. Only .sb3 files are supported.");
  }

  try {
    await access(file);
  } catch {
    throw new Error(`File not found: ${file}`);
  }

  if (providedOutputDirectory) {
    return {
      file,
      outputDirectory: providedOutputDirectory,
    };
  }

  console.log("No output directory provided, using the default");
  return {
    file,
    outputDirectory: DEFAULT_OUTPUT_DIRECTORY,
  };
}
