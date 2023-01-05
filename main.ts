import * as core from "@actions/core";

async function run() {
  try {
    console.log("Reporting job status to gitboard.io")
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()