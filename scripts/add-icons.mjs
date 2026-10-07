// Add Phosphor (regular weight) icons to icon-data.json: node scripts/add-icons.mjs user-circle lock-key ...
import fs from "node:fs";
const file = "src/components/xerk/icon-data.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const pascal = (n) => n.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
for (const name of process.argv.slice(2)) {
  const src = fs.readFileSync(`node_modules/@phosphor-icons/react/dist/defs/${pascal(name)}.es.js`, "utf8");
  const block = src.split('"regular"')[1].split(/\n  \],/)[0];
  const paths = [...block.matchAll(/d: "([^"]+)"/g)].map((m) => [m[1]]);
  if (!paths.length) { console.error("no paths for", name); continue; }
  data.icons[name] = paths;
  console.log("added", name, paths.length);
}
fs.writeFileSync(file, JSON.stringify(data));
