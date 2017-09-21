#!/usr/bin/env node

const fs = require("fs");
const spawn = require("child_process").spawn;
const chalk = require("chalk");
const path = require("path");
const glob = require("glob");

let replacementOption = process.argv[2];
if (replacementOption !== '--empty' && replacementOption !== '--return-this') {
  console.error(chalk.red('You must choose the replacement strategy by passing either `--empty` or `--return-this`'));
  process.exit(-1);
}

let cwd = process.cwd();
let pkgPath = path.join(cwd, "package.json");

try {
  let pkg = JSON.parse(fs.readFileSync(pkgPath));
  if (!isEmberApp(pkg)) {
    notAnEmberApp("I couldn't find ember-cli in the dependencies of " + pkgPath);
  }

  let binPath = path.join(path.dirname(require.resolve("jscodeshift")), "bin", "jscodeshift.sh");
  let transformPath = path.join(__dirname + "..", "index.js");
  let env = Object.assign({
    EMBER_K_CODEMOD: true,
    RETURN_THIS: replacementOption === '--return-this'
  }, process.env);

  let transform = spawn(binPath, ["-t", transformPath, "app", "addon", "tests", "packages", "blueprints", "src", "test-support", "lib"], {
    stdio: "inherit",
    env: env
  });

  // Generate EMBER_K_REPORT.md when jscodeshift is done running.
  transform.on("exit", buildReport);
} catch (e) {
  if (e.code === "ENOENT") {
    notAnEmberApp("I couldn't find a package.json at " + pkgPath);
  } else {
    console.error(chalk.red(e.stack));
    process.exit(-1);
  }
}

function isEmberApp(pkg) {
  return contains("ember-cli", pkg.devDependencies) || contains("ember-cli", pkg.dependencies);
}

function contains(key, object) {
  if (!object) { return false; }
  return key in object;
}

function notAnEmberApp(msg) {
  console.error(chalk.red("It doesn't look like you're inside an Ember app. " + msg));
  process.exit(-1);
}

// Each worker process in jscodeshift will write to a file with its pid used to
// make the path unique. This post-transform step aggregates all of those files
// into a single Markdown report.
function buildReport() {
  let report = [];

  // Find all of the temporary logs from the worker processes, which contain a
  // serialized JSON array on each line.
  glob("ember-k-codemod.tmp.*", (err, logs) => {
    // If no worker found an unexpected value, nothing to report.
    if (!logs) {
      return;
    }

    // For each worker, split its log by line and eval each line
    // as JSON.
    logs.forEach(log => {
      let logText = fs.readFileSync(log);
      logText
        .toString()
        .split("\n")
        .forEach(line => {
          if (line) {
            try {
              report.push(JSON.parse(line));
            } catch (e) {
              console.log("Error parsing " + line);
            }
          }
        });

      // Delete the temporary log file
      fs.unlink(log);
    });

    // If there's anything to report, convert the JSON tuple into human-formatted
    // markdown and write it to EMBER_K_REPORT.md.
    if (report.length) {
      report = report.map(line => {
        let type = line[0];
        if (type === 1) {
          return runtimeErrorWarning(line);
        } else {
          return unknownGlobalWarning(line);
        }
      });

      fs.writeFileSync("EMBER_K_REPORT.md", "## Module Report\n" + report.join("\n"));
      console.log(chalk.yellow("\nDone! Some files could not be upgraded automatically. See " + chalk.blue("EMBER_K_REPORT.md") + "."));
    } else {
      console.log(chalk.green("\nDone! All uses of the Ember.K have been updated."));
    }
  });
}

function runtimeErrorWarning(line) {
  let [_, path, source, err] = line;

  return `### Runtime Error

**Path**: \`${path}\`

**Error**:

\`\`\`
${err}
\`\`\`

**Source**:

\`\`\`js
${source}
\`\`\`
`;
}

function unknownGlobalWarning(line) {
  let [_, global, lineNumber, path, context] = line;
  return `### Unknown Global

**Global**: \`Ember.${global}\`

**Location**: \`${path}\` at line ${lineNumber}

\`\`\`js
${context}
\`\`\`
`;
}