import { access } from "fs/promises";
import { extname } from "path";

const DEFAULT_OUTPUT_DIRECTORY = "./out/";

export interface CliOptions {
  file: string;
  outputDirectory: string;
}

export async function resolveCliOptions(args: string[]): Promise<CliOptions> {
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  const positionalArgs: string[] = [];
  let fileOption: string | undefined;
  let outputOption: string | undefined;

  for (let i = 0; i < normalizedArgs.length; i++) {
    const arg = normalizedArgs[i];

    if (arg === "--file" || arg === "--output") {
      const value = normalizedArgs[++i];
      if (!value || value.startsWith("--")) {
        throw new Error(
          "Usage: scratch-compile [--file] <file.sb3> [--output] <output-directory>",
        );
      }

      if (arg === "--file") {
        fileOption = value;
      } else {
        outputOption = value;
      }
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positionalArgs.push(arg);
    }
  }

  const file = fileOption ?? positionalArgs[0];
  const providedOutputDirectory = outputOption ?? positionalArgs[1];

  if (!file) {
    throw new Error(
      "Usage: scratch-compile [--file] <file.sb3> [--output] <output-directory>",
    );
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
