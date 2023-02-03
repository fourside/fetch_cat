import { decode } from "std/encoding/base64";
import { dirname, join } from "std/path/posix";

if (import.meta.main) {
  await main(Deno.args);
}

async function main(args: string[]): Promise<void> {
  if (args.length !== 1) {
    throw new Error("pass source text");
  }

  const source = args[0];
  const base64Text = source.match(/(?<=base64,)(.+)$/);
  if (base64Text === null) {
    console.error("not found base64 text in source");
    return;
  }
  const decodedSource = new TextDecoder().decode(decode(base64Text[0]));
  const sourceFileRegexResult = decodedSource.match(/^http.+$/m);
  if (sourceFileRegexResult === null) {
    console.error("not found source file url in decoded source");
    return;
  }
  const sourceFileUrl = new URL(sourceFileRegexResult[0]);
  const baseUrl = dirname(`${sourceFileUrl.origin}${sourceFileUrl.pathname}`);
  const res = await fetch(sourceFileUrl);
  if (!res.ok) {
    console.error("status is not ok", res, sourceFileUrl.href);
    return;
  }
  const body = await res.arrayBuffer();
  const fileList = new TextDecoder()
    .decode(body)
    .split("\n")
    .filter((it) => it.startsWith("file"))
    .map((it) => join(baseUrl, it))
    .join("\n");
  Deno.writeFileSync("list.txt", new TextEncoder().encode(fileList));
  console.log(new Date(), "Done to dump list.txt.");
}
