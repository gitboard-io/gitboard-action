import * as core from "@actions/core";

async function run() {
  try {
    const username = core.getInput('username');
    console.log('Reporting job status to gitboard.io.')
    console.log(`View gitboard.io dashboard: https://gitboard.io/${username}/dashboard`)
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()