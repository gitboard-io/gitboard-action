import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    const usernames = core
      .getInput('username')
      .split(',')
      .map((x) => x.trim());
    const dashboardInput = core.getInput('dashboard');
    const dashboards = dashboardInput
      ? core
          .getInput('dashboard')
          .split(',')
          .map((x) => x.trim())
      : ['default'];
    console.log('Reporting job status to GitBoard.io.');
    console.log(`GitHub context: ${JSON.stringify(github.context)}`);
    usernames.forEach((username) => {
      dashboards.map(async (dashboard) => {
        console.log(
          `View GitBoard.io dashboard: https://gitboard.io/${username}/dashboard${
            dashboard !== 'default' ? `/${dashboard}` : ''
          }`,
        );
      });
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
