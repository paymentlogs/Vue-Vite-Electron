const bytenode = require("bytenode");
const fs = require("fs").promises;
const v8 = require("v8");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
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

const handleDirs = async (currentPath) => {
  console.log("[HANDLER]: Getting entries");
  let entries = await fs.readdir(currentPath, { withFileTypes: true });
  for (let entry of entries) {
    console.log(`[HANDLER]: Managing entry: ${entry.name}`);
    let sourcePath = path.join(currentPath, entry.name);
    let relativePath = path.relative(srcPath, sourcePath);
    let buildPath = path.join(destPath, relativePath);
    if (entry.isDirectory()) {
      console.log(`[HANDLER]: Managing directory: ${entry.name}`);
      if (!(await pathExists(buildPath))) {
        console.log(`[HANDLER]: Creating directory: ${entry.name}`);
        await fs.mkdir(buildPath);
      }
      console.log(`[HANDLER]: Directory detected, working...`);
      await handleDirs(sourcePath);
    } else {
      if (entry.name.endsWith(".js")) {
        console.log(`[HANDLER]: Compiling file: ${entry.name}`);
        await obfuscateAndCompile(sourcePath, buildPath, entry.name);
      } else {
        console.log(`[HANDLER]: Copying to build: ${entry.name}`);
        await fs.copyFile(sourcePath, buildPath);
      }
    }
  }
};

const obfuscateAndCompile = async (fromPath, toPath, name) => {
  const directoryPath = path.dirname(fromPath);
  const fileContent = await fs.readFile(fromPath, "utf-8");
  const securedFilePath = path.join(
    directoryPath,
    `${name.replace(".js", "")}.secured.js`
  );

  await fs.writeFile(securedFilePath, obfuscateFile(fileContent));
  await bytenode.compileFile(securedFilePath, toPath + "c");
  await fs.writeFile(toPath, getCodeForJsc(name.replace(".js", "")));
  await fs.unlink(securedFilePath);
};

const getCodeForJsc = (name) => {
  const code = `
    'use strict';
    const bytenode = require('bytenode');
    const fs = require('fs');
    const v8 = require('v8');
    const path = require('path');

    v8.setFlagsFromString('--no-lazy');
    if (!fs.existsSync(path.join(__dirname, './${name}.jsc'))) {
      bytenode.compileFile(path.join(__dirname, './${name}.src.js'), path.join(__dirname, './${name}.jsc'));
    }

    require(path.join(__dirname, './${name}.jsc'));
  `;

  return obfuscateFile(code);
};

const obfuscateFile = (code) => {
  const minifiedCode = minify(code);
  const obfuscationOptions = {
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
  };

  const obfuscationResult = JavaScriptObfuscator.obfuscate(
    minifiedCode,
    obfuscationOptions
  );
  return obfuscationResult.getObfuscatedCode();
};

run();
