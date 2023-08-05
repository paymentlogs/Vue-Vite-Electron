const bytenode = require("bytenode");
const fs = require("fs").promises;
const v8 = require("v8");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const { version } = require("../../package.json");
const UglifyJS = require("uglify-js");

v8.setFlagsFromString("--no-lazy");

const srcPath = path.resolve(__dirname, "../backend");
const destPath = path.resolve(__dirname, "../../Built App/backend");
const buildRoot = path.resolve(__dirname, "../../Built App");

const run = async () => {
  if (!(await pathExists(buildRoot))) {
    console.log("[HANDLER]: CREATING 'BUILT' DIRECTORY");
    await fs.mkdir(buildRoot);
  }
  if (!(await pathExists(destPath))) {
    await fs.mkdir(destPath);
  }

  await handleDirs(srcPath);
  process.exit();
};

const pathExists = async (pathToCheck) => {
  try {
    await fs.access(pathToCheck);
    return true;
  } catch (e) {
    return false;
  }
};

const minify = (code) => {
  let result = UglifyJS.minify(code, {
    toplevel: true,
    mangle: true,
    compress: true,
    sourceMap: false,
  });
  return result.code;
};

const formatEntryPath = (entryPath) => {
  return {
    source: path.join(srcPath, `/${entryPath}`),
    build: path.join(destPath, `/${entryPath}`),
    split: entryPath.split("/"),
  };
};

const handleDirs = async (srcDest) => {
  console.log("[HANDLER]: Getting entries");
  let entries = await fs.readdir(srcDest, { withFileTypes: true });
  for (let entry of entries) {
    console.log(`[HANDLER]: Managing entry: ${entry.name}`);
    let sourcePath = path.join(srcDest, entry.name);
    let entryPath = sourcePath.split("\\");
    if (entryPath.length >= 11) {
      console.log(`[HANDLER]: Formatting entry paths for entry: ${entry.name}`);
      formattedEntryPath = entryPath.slice(11, entryPath.length).join("/");
    }
    let { source, build, split } = formatEntryPath(formattedEntryPath);
    if (entry.isDirectory()) {
      console.log(`[HANDLER]: Managing directory: ${entry.name}`);
      if (!(await pathExists(build))) {
        console.log(`[HANDLER]: Creating directory: ${entry.name}`);
        await fs.mkdir(build);
      }
      console.log(`[HANDLER]: Directory detected, working...`);
      await handleDirs(source);
    } else {
      if (entry.name.endsWith(".js")) {
        console.log(`[HANDLER]: Compiling file: ${entry.name}`);
        await obfuscateAndCompile(source, build, entry.name);
      } else {
        console.log(`[HANDLER]: Copying to build: ${entry.name}`);
        await fs.copyFile(source, build);
      }
    }
  }
};

const obfuscateAndCompile = async (fromPath, toPath, name) => {
  // Format the correct path for 'secured' transform
  // @DEV: Secured files are obfuscated source files compiled to bytenode
  let t = fromPath.split("\\");
  t.splice(t.length - 1, 1);
  let file = await fs.readFile(fromPath, "utf-8");
  let securedFilePath = `${t.join("/")}/${name.replace(".js", "")}.secured.js`;
  await fs.writeFile(securedFilePath, obfuscateFile(file));
  // HANDLE COMPILE
  await bytenode.compileFile(securedFilePath, toPath + "c");
  await fs.writeFile(toPath, getCodeForJsc(name.replace(".js", "")));
  // Delete / unlink 'secured' temp. file once it is compiled with bytenode
  await fs.unlink(securedFilePath);
};

// 2 diff functions
// 1 has a few more params for the backend script files than the frontend due to those params not being supported in frontend
const getCodeForJsc = (name) => {
  let code = `'use strict';\nconst bytenode = require('bytenode');\nconst fs = require('fs');\nconst v8 = require('v8');\nconst path = require('path');\n\nv8.setFlagsFromString('--no-lazy');\nif (!fs.existsSync(path.join(__dirname, './${name}.jsc')))\n{ bytenode.compileFile(path.join(__dirname, './${name}.src.js'), path.join(__dirname, './${name}.jsc')); }\n\nrequire(path.join(__dirname, './${name}.jsc'));`;
  let obfuscatedCode = obfuscateFile(code);
  return obfuscatedCode;
};

const obfuscateFile = (code) => {
  let minifiedCode = minify(code);
  let obfuscationResult = JavaScriptObfuscator.obfuscate(minifiedCode, {
    compact: true,
    target: "node",
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    stringArrayShuffle: true,
    stringArrayThreshold: 1,
    rotateStringArray: true,
    stringArray: true,
    splitStrings: true,
    disableConsoleOutput: true,
    deadCodeInjection: true,
    selfDefending: true,
    sourceMap: false,
    splitStringsChunkLength: 5,
    identifierNamesGenerator: "hexadecimal",
    log: false,
    transformObjectKeys: true,
    stringArrayIndexShift: true,
    stringArrayRotate: true,
  });
  let obfuscatedCode = obfuscationResult.getObfuscatedCode();
  return obfuscatedCode;
};

run();
