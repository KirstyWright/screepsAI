import clear from "rollup-plugin-clear";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import screeps from "rollup-plugin-screeps";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);

// rollup-plugin-screeps wraps the source map module by monkey-patching
// map.toString(), which rollup 4 no longer honours -> the uploaded "main.js.map"
// module is raw JSON and Screeps throws "Unexpected token" on require().
// Wrap it as a CommonJS module before the screeps plugin renames/uploads it.
function wrapSourceMapModule() {
  return {
    name: "wrap-screeps-sourcemap",
    writeBundle(options) {
      if (!options.sourcemap) return;
      for (const file of [`${options.file}.map`, `${options.file}.map.js`]) {
        if (!fs.existsSync(file)) continue;
        const content = fs.readFileSync(file, "utf8");
        if (content && !content.startsWith("module.exports")) {
          fs.writeFileSync(file, `module.exports = ${content};`);
        }
      }
    }
  };
}

let cfg;
const dest = process.env.DEST;
if (!dest) {
  console.log("No destination specified - code will be compiled but not uploaded");
} else if ((cfg = require("./screeps.json")[dest]) == null) {
  throw new Error("Invalid upload destination");
}

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    sourcemap: true
  },

  plugins: [
    clear({ targets: ["dist"] }),
    resolve({ rootDir: "src" }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    wrapSourceMapModule(),
    screeps({ config: cfg, dryRun: cfg == null })
  ]
};
