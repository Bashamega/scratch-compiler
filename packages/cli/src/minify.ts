import { transform } from "esbuild";

export async function minify(code: string): Promise<string> {
  const result = await transform(code, {
    minify: true,
    loader: "js",
    target: "es2020",
  });

  return result.code;
}