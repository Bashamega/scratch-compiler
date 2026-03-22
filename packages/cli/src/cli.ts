#!/usr/bin/env node
import { extractSb3ToZip } from "./extract-sb3";
import { extractAssetsFromBuffer } from "./extract-assets";
import { resolveCliOptions } from "./options";
import { ensureEmptyOutputDirectory } from "./output-directory";
import { migrate } from "./migrate";

async function main() {
  const options = await resolveCliOptions(process.argv.slice(2));

  await ensureEmptyOutputDirectory(options.outputDirectory);

  console.log(`Compiling: ${options.file}`);
  const { buffer } = await extractSb3ToZip(options.file);
  await extractAssetsFromBuffer(buffer, options.outputDirectory);
  await migrate(options.outputDirectory, buffer)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
