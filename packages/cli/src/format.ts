import prettier from "prettier";

export async function formatJsString(code: string) {
  const formatted = await prettier.format(code, {
    parser: "babel",
  });

  return formatted;
}