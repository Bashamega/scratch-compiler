import { mkdir, readdir, stat } from "fs/promises";

export async function ensureEmptyOutputDirectory(directory: string): Promise<void> {
  try {
    const stats = await stat(directory);
    if (!stats.isDirectory()) {
      throw new Error(`Output path exists and is not a directory: ${directory}`);
    }

    const contents = await readdir(directory);
    if (contents.length > 0) {
      throw new Error("Error checking output directory: Directory not empty");
    }
  } catch (err: unknown) {
    if (isMissingDirectoryError(err)) {
      await mkdir(directory, { recursive: true });
      return;
    }

    throw err;
  }
}

function isMissingDirectoryError(err: unknown): err is NodeJS.ErrnoException {
  return Boolean(err && typeof err === "object" && "code" in err && err.code === "ENOENT");
}
