import {
  genCollections,
  genExplorer,
  generateScores,
} from "../src/services/collection";

(async () => {
  const command = process.argv[2];

  if (command === "genexplorer") {
    console.log("Generating explorer...");
    const res = await genExplorer();
    console.log(res);
  }

  if (command === "gencollections") {
    console.log("Generating collections...");
    const res = await genCollections();
    console.log(res);
  }

  if (command === "help") {
    console.log("Available commands:");
    console.log("genexplorer - Generate explorer");
    console.log("gencollections - Generate collections list");
    console.log("gencollections - Generate scores list");
  }

  if (command === "genscores") {
    console.log("Generating scores...");
    await generateScores();
  }

  if (command === "exit") {
    process.exit();
  }
})();

// run yarn cli-dev gencollections
// run yarn cli-dev genscores
// run yarn cli-dev genexplorer
