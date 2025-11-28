// src/cli.js
import { decryptTheMoment } from "./engine.js";

function printUsage() {
  console.log("Usage:");
  console.log("  node src/cli.js <Sign> \"ENCODED TEXT\"");
  console.log("Example:");
  console.log("  node src/cli.js Aquarius \"PSPVE IKPYC FH XJTFOW\"");
}

async function main() {
  const [, , signArg, ...rest] = process.argv;
  if (!signArg) {
    printUsage();
    process.exit(1);
  }

  const encoded = rest.join(" ") || "PSPVE IKPYC FH XJTFOW";

  try {
    const result = decryptTheMoment(signArg, encoded);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
