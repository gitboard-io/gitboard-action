import * as core from '@actions/core';

async function run() {
  try {
    const usernames = core
      .getInput('username')
      .split(',')
      .map((x) => x.trim());
    console.log('Reporting job status to GitBoard.io.');
    usernames.forEach((username) => {
      console.log(
        `View GitBoard.io dashboard: https://gitboard.io/${username}/dashboard`,
      );
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
