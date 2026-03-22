import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { pipeline } from "stream/promises";
import { Entry, fromBuffer, ZipFile } from "yauzl";

export async function extractAssetsFromBuffer(
  buffer: Buffer,
  outputDirectory: string,
): Promise<void> {
  const assetsDirectory = join(outputDirectory, "assets");
  await mkdir(assetsDirectory, { recursive: true });

  const zipfile = await openZipFromBuffer(buffer);

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      zipfile.close();

      if (error) {
        reject(error);
        return;
      }

      resolve();
    };

    zipfile.once("error", (error) => {
      finish(error);
    });

    zipfile.once("end", () => {
      finish();
    });

    zipfile.on("entry", (entry) => {
      void handleEntry(zipfile, entry, assetsDirectory, finish);
    });

    zipfile.readEntry();
  });
}

async function handleEntry(
  zipfile: ZipFile,
  entry: Entry,
  assetsDirectory: string,
  finish: (error?: Error) => void,
): Promise<void> {
  if (shouldSkipEntry(entry.fileName)) {
    zipfile.readEntry();
    return;
  }

  try {
    await extractEntry(zipfile, entry, assetsDirectory);
    zipfile.readEntry();
  } catch (err: unknown) {
    finish(err instanceof Error ? err : new Error(String(err)));
  }
}

async function extractEntry(
  zipfile: ZipFile,
  entry: Entry,
  assetsDirectory: string,
): Promise<void> {
  const filePath = join(assetsDirectory, entry.fileName);
  await mkdir(dirname(filePath), { recursive: true });

  const readStream = await openEntryReadStream(zipfile, entry);
  await pipeline(readStream, createWriteStream(filePath));
}

function shouldSkipEntry(fileName: string): boolean {
  const lowerCasedFileName = fileName.toLowerCase();
  return lowerCasedFileName.endsWith(".json");
}

function openZipFromBuffer(buffer: Buffer): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(new Error(`Error opening zip: ${err?.message || "Unknown error"}`));
        return;
      }

      resolve(zipfile);
    });
  });
}

function openEntryReadStream(zipfile: ZipFile, entry: Entry) {
  return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    zipfile.openReadStream(entry, (err, readStream) => {
      if (err || !readStream) {
        reject(new Error(`Error extracting ${entry.fileName}: ${err?.message || "Unknown error"}`));
        return;
      }

      resolve(readStream);
    });
  });
}
