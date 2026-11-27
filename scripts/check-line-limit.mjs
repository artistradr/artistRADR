// Fails if any tracked source file is longer than the project limit.
// ESLint only checks .js/.jsx here, so this also covers TypeScript and CSS.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const MAX = 350;
const files = execFileSync("git", ["ls-files", "-z", "*.js", "*.jsx", "*.ts", "*.tsx", "*.mjs", "*.cjs", "*.css"], { encoding: "utf8" })
  .split("\0")
  .filter((f) => f && existsSync(f));

const tooLong = files
  .map((file) => {
    const text = readFileSync(file, "utf8");
    return { file, lines: text.split("\n").length - (text.endsWith("\n") ? 1 : 0) };
  })
  .filter(({ lines }) => lines > MAX)
  .sort((a, b) => b.lines - a.lines);

for (const { file, lines } of tooLong) console.log(`${lines}\t${file}`);
console.log(tooLong.length ? `\n${tooLong.length} file(s) over ${MAX} lines.` : `All files are within ${MAX} lines.`);
process.exit(tooLong.length ? 1 : 0);
