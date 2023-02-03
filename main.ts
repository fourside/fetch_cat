import { Buffer } from "std/io/buffer";
import ProgressBar from "x/progress";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await main(Deno.args);
}

async function main(args: string[]): Promise<void> {
  if (args.length !== 1) {
    throw new Error("pass filename");
  }

  const filename = args[0];
  const urlList = new TextDecoder()
    .decode(Deno.readFileSync("list.txt"))
    .split("\n");

  let count = 0;
  const progressBar = createProgressBar(urlList.length);
  const dateFormatter = createDateFormatter();
  console.log(dateFormatter.format(new Date()), "start");
  for (const url of urlList) {
    try {
      await fetchAndWrite(url, filename);
      count++;
      progressBar.render(count);
      log(`[${filename}] count=${count}`, dateFormatter);
    } catch (error) {
      console.log(`error at url: ${url}, count: ${count}`);
      console.error("Error.name is ", error.name);
      console.error(error);
      Deno.exit(-1);
    }
  }
  console.log(dateFormatter.format(new Date()), "done");
}

async function fetchAndWrite(
  url: string,
  filename: string,
  retry = 0
): Promise<void> {
  try {
    const res = await fetch(url, { keepalive: true });
    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Buffer(arrayBuffer).bytes();
    await Deno.writeFile(filename, uint8Array, { append: true });
  } catch (error) {
    console.warn(`retry ${retry} times for ${url}`);
    // check error and retry by recursive call fetchAndWrite till 5 times
    if (retry > 5) {
      console.error("retry limit over");
      throw error;
    }
    await fetchAndWrite(url, filename, retry++);
  }
}

function log(
  text: string,
  formatter: Intl.DateTimeFormat,
  filename = "main.log"
): void {
  const line = `[${formatter.format(new Date())}] ${text}\n`;
  Deno.writeFileSync(filename, new TextEncoder().encode(line), {
    append: true,
  });
}

function createProgressBar(total: number): ProgressBar {
  return new ProgressBar({
    total,
    complete: "=",
    incomplete: "-",
    display: ":completed/:total :time [:bar] :percent",
  });
}

function createDateFormatter(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
